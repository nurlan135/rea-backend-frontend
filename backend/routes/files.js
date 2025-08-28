const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const sharp = require('sharp');
const router = express.Router();
const db = require('../database');
const { authenticateTokenToken } = require('../middleware/auth');
const { validateRequired, validateEmail, sanitizeInput } = require('../middleware/validation');
const Joi = require('joi');
const crypto = require('crypto');

// File storage configuration
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + crypto.randomBytes(6).toString('hex');
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
    files: 20
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|xls|xlsx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Yalnız şəkil və sənəd faylları qəbul edilir'));
    }
  }
});

// Chunked upload handler for large files
router.post('/upload/chunk', authenticateTokenToken, async (req, res) => {
  try {
    const { chunk, chunkIndex, totalChunks, fileName, fileId } = req.body;
    
    if (!chunk || chunkIndex === undefined || !totalChunks || !fileName || !fileId) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Chunk məlumatları natamam',
          code: 'INVALID_CHUNK_DATA'
        }
      });
    }

    const chunkDir = path.join(__dirname, '../uploads/chunks', fileId);
    await fs.mkdir(chunkDir, { recursive: true });

    const chunkPath = path.join(chunkDir, `chunk-${chunkIndex}`);
    const buffer = Buffer.from(chunk, 'base64');
    await fs.writeFile(chunkPath, buffer);

    // Check if all chunks are uploaded
    const chunkFiles = await fs.readdir(chunkDir);
    
    if (chunkFiles.length === parseInt(totalChunks)) {
      // Combine all chunks
      const finalPath = path.join(__dirname, '../uploads', fileName);
      const writeStream = require('fs').createWriteStream(finalPath);

      for (let i = 0; i < totalChunks; i++) {
        const chunkData = await fs.readFile(path.join(chunkDir, `chunk-${i}`));
        writeStream.write(chunkData);
      }

      writeStream.end();

      // Clean up chunks
      await fs.rmdir(chunkDir, { recursive: true });

      // Save to database
      const fileRecord = await db('files').insert({
        id: crypto.randomUUID(),
        original_name: fileName,
        file_name: fileName,
        file_path: finalPath,
        file_size: (await fs.stat(finalPath)).size,
        mime_type: req.body.mimeType || 'application/octet-stream',
        uploaded_by: req.user.id,
        created_at: new Date()
      }).returning('*');

      return res.json({
        success: true,
        data: {
          file: fileRecord[0],
          message: 'Fayl uğurla yükləndi'
        }
      });
    }

    res.json({
      success: true,
      data: {
        chunksReceived: chunkFiles.length,
        totalChunks: parseInt(totalChunks),
        message: `Chunk ${parseInt(chunkIndex) + 1}/${totalChunks} qəbul edildi`
      }
    });

  } catch (error) {
    console.error('Chunk upload error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Chunk yükləmə xətası',
        code: 'CHUNK_UPLOAD_ERROR'
      }
    });
  }
});

// Standard file upload
router.post('/upload', authenticateTokenToken, upload.array('files', 20), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Fayl seçilməyib',
          code: 'NO_FILES'
        }
      });
    }

    const { property_id, category = 'general' } = req.body;
    const uploadedFiles = [];

    for (const file of req.files) {
      let optimizedPath = file.path;
      let thumbnailPath = null;

      // Image optimization
      if (file.mimetype.startsWith('image/')) {
        const optimizedDir = path.join(path.dirname(file.path), 'optimized');
        const thumbnailDir = path.join(path.dirname(file.path), 'thumbnails');
        
        await fs.mkdir(optimizedDir, { recursive: true });
        await fs.mkdir(thumbnailDir, { recursive: true });

        const fileName = path.basename(file.path, path.extname(file.path));
        optimizedPath = path.join(optimizedDir, `${fileName}.webp`);
        thumbnailPath = path.join(thumbnailDir, `${fileName}_thumb.webp`);

        // Create optimized version
        await sharp(file.path)
          .webp({ quality: 85 })
          .resize(1920, 1080, { fit: 'inside', withoutEnlargement: true })
          .toFile(optimizedPath);

        // Create thumbnail
        await sharp(file.path)
          .webp({ quality: 75 })
          .resize(300, 200, { fit: 'cover' })
          .toFile(thumbnailPath);

        // Remove original if optimization successful
        await fs.unlink(file.path);
      }

      const fileRecord = await db('files').insert({
        id: crypto.randomUUID(),
        original_name: file.originalname,
        file_name: path.basename(optimizedPath),
        file_path: optimizedPath,
        thumbnail_path: thumbnailPath,
        file_size: file.size,
        mime_type: file.mimetype,
        category,
        property_id: property_id || null,
        uploaded_by: req.user.id,
        created_at: new Date()
      }).returning('*');

      uploadedFiles.push(fileRecord[0]);
    }

    res.json({
      success: true,
      data: {
        files: uploadedFiles,
        message: `${uploadedFiles.length} fayl uğurla yükləndi`
      }
    });

  } catch (error) {
    console.error('File upload error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Fayl yükləmə xətası',
        code: 'FILE_UPLOAD_ERROR'
      }
    });
  }
});

// Get files with pagination and filtering
router.get('/', authenticateTokenToken, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      category,
      property_id,
      mime_type,
      search,
      sort_by = 'created_at',
      sort_order = 'desc'
    } = req.query;

    const offset = (page - 1) * limit;
    let query = db('files')
      .select(
        'files.*',
        'users.first_name',
        'users.last_name',
        'properties.title as property_title'
      )
      .leftJoin('users', 'files.uploaded_by', 'users.id')
      .leftJoin('properties', 'files.property_id', 'properties.id')
      .where('files.deleted_at', null);

    // Apply filters
    if (category) {
      query = query.where('files.category', category);
    }

    if (property_id) {
      query = query.where('files.property_id', property_id);
    }

    if (mime_type) {
      query = query.where('files.mime_type', 'like', `${mime_type}%`);
    }

    if (search) {
      query = query.where(function() {
        this.where('files.original_name', 'ilike', `%${search}%`)
            .orWhere('files.file_name', 'ilike', `%${search}%`);
      });
    }

    // Apply sorting
    query = query.orderBy(`files.${sort_by}`, sort_order);

    const totalQuery = query.clone();
    const total = await totalQuery.count('* as count').first();
    const files = await query.limit(limit).offset(offset);

    res.json({
      success: true,
      data: {
        files,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total.count / limit),
          totalFiles: parseInt(total.count),
          limit: parseInt(limit)
        }
      }
    });

  } catch (error) {
    console.error('Get files error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Fayllar alınarkən xəta baş verdi',
        code: 'GET_FILES_ERROR'
      }
    });
  }
});

// Get single file
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const file = await db('files')
      .select(
        'files.*',
        'users.first_name',
        'users.last_name',
        'properties.title as property_title'
      )
      .leftJoin('users', 'files.uploaded_by', 'users.id')
      .leftJoin('properties', 'files.property_id', 'properties.id')
      .where('files.id', req.params.id)
      .where('files.deleted_at', null)
      .first();

    if (!file) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Fayl tapılmadı',
          code: 'FILE_NOT_FOUND'
        }
      });
    }

    res.json({
      success: true,
      data: { file }
    });

  } catch (error) {
    console.error('Get file error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Fayl məlumatları alınarkən xəta baş verdi',
        code: 'GET_FILE_ERROR'
      }
    });
  }
});

// Download file
router.get('/:id/download', authenticateToken, async (req, res) => {
  try {
    const file = await db('files')
      .where('id', req.params.id)
      .where('deleted_at', null)
      .first();

    if (!file) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Fayl tapılmadı',
          code: 'FILE_NOT_FOUND'
        }
      });
    }

    // Check if file exists on disk
    try {
      await fs.access(file.file_path);
    } catch {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Fayl disk üzərində tapılmadı',
          code: 'FILE_NOT_FOUND_ON_DISK'
        }
      });
    }

    // Update download count
    await db('files')
      .where('id', file.id)
      .increment('download_count', 1);

    res.download(file.file_path, file.original_name);

  } catch (error) {
    console.error('Download file error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Fayl yüklənərkən xəta baş verdi',
        code: 'DOWNLOAD_ERROR'
      }
    });
  }
});

// Batch operations
router.post('/batch', authenticateToken, async (req, res) => {
  try {
    const { action, file_ids } = req.body;

    if (!action || !file_ids || !Array.isArray(file_ids)) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Batch əməliyyat parametrləri natamam',
          code: 'INVALID_BATCH_PARAMS'
        }
      });
    }

    let result = {};

    switch (action) {
      case 'delete':
        await db('files')
          .whereIn('id', file_ids)
          .update({
            deleted_at: new Date(),
            deleted_by: req.user.id
          });
        result = { message: `${file_ids.length} fayl silindi` };
        break;

      case 'move':
        const { target_category, target_property_id } = req.body;
        const updateData = {};
        if (target_category) updateData.category = target_category;
        if (target_property_id) updateData.property_id = target_property_id;

        await db('files')
          .whereIn('id', file_ids)
          .update(updateData);
        result = { message: `${file_ids.length} fayl köçürüldü` };
        break;

      case 'download':
        // Create ZIP archive for multiple files
        const archiver = require('archiver');
        const files = await db('files').whereIn('id', file_ids).where('deleted_at', null);
        
        res.setHeader('Content-Type', 'application/zip');
        res.setHeader('Content-Disposition', 'attachment; filename="files.zip"');

        const archive = archiver('zip', { zlib: { level: 9 } });
        archive.pipe(res);

        for (const file of files) {
          try {
            await fs.access(file.file_path);
            archive.file(file.file_path, { name: file.original_name });
          } catch (err) {
            console.log(`File not found: ${file.file_path}`);
          }
        }

        archive.finalize();
        return; // Don't send JSON response

      default:
        return res.status(400).json({
          success: false,
          error: {
            message: 'Bilinməyən batch əməliyyatı',
            code: 'UNKNOWN_BATCH_ACTION'
          }
        });
    }

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Batch operation error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Batch əməliyyat xətası',
        code: 'BATCH_OPERATION_ERROR'
      }
    });
  }
});

// Update file metadata
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const schema = Joi.object({
      category: Joi.string().optional(),
      property_id: Joi.string().uuid().allow(null).optional(),
      description: Joi.string().optional(),
      tags: Joi.array().items(Joi.string()).optional()
    });

    const { error, value } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: {
          message: error.details[0].message,
          code: 'VALIDATION_ERROR'
        }
      });
    }

    const file = await db('files')
      .where('id', req.params.id)
      .where('deleted_at', null)
      .first();

    if (!file) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Fayl tapılmadı',
          code: 'FILE_NOT_FOUND'
        }
      });
    }

    const updatedFile = await db('files')
      .where('id', req.params.id)
      .update({
        ...value,
        updated_at: new Date(),
        updated_by: req.user.id
      })
      .returning('*');

    res.json({
      success: true,
      data: {
        file: updatedFile[0],
        message: 'Fayl məlumatları yeniləndi'
      }
    });

  } catch (error) {
    console.error('Update file error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Fayl yenilənərkən xəta baş verdi',
        code: 'UPDATE_FILE_ERROR'
      }
    });
  }
});

// Soft delete file
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const file = await db('files')
      .where('id', req.params.id)
      .where('deleted_at', null)
      .first();

    if (!file) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Fayl tapılmadı',
          code: 'FILE_NOT_FOUND'
        }
      });
    }

    await db('files')
      .where('id', req.params.id)
      .update({
        deleted_at: new Date(),
        deleted_by: req.user.id
      });

    res.json({
      success: true,
      data: {
        message: 'Fayl silindi'
      }
    });

  } catch (error) {
    console.error('Delete file error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Fayl silinərkən xəta baş verdi',
        code: 'DELETE_FILE_ERROR'
      }
    });
  }
});

module.exports = router;