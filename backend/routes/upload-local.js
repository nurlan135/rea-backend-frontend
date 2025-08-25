const express = require('express');
const multer = require('multer');
const localStorageService = require('../lib/local-storage-service');

const router = express.Router();

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max file size
  },
  fileFilter: (req, file, cb) => {
    // Check file type based on endpoint
    if (req.originalUrl.includes('/property-image')) {
      // Allow images only
      if (file.mimetype.startsWith('image/')) {
        cb(null, true);
      } else {
        cb(new Error('Only image files are allowed for property images'));
      }
    } else if (req.originalUrl.includes('/property-document')) {
      // Allow PDFs and documents
      if (file.mimetype === 'application/pdf' || 
          file.mimetype.startsWith('application/vnd.openxmlformats') ||
          file.mimetype.startsWith('application/msword')) {
        cb(null, true);
      } else {
        cb(new Error('Only PDF and document files are allowed'));
      }
    } else {
      cb(null, true);
    }
  }
});

// Property image upload (single)
router.post('/property-image/:propertyId', upload.single('image'), async (req, res) => {
  try {
    const { propertyId } = req.params;
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: { code: 'NO_FILE', message: 'No image file provided' }
      });
    }

    console.log(`📸 Uploading property image locally for ${propertyId}:`, req.file.originalname);

    const result = await localStorageService.savePropertyImage(
      propertyId,
      req.file.buffer,
      req.file.originalname
    );

    if (result.success) {
      res.json({
        success: true,
        data: {
          url: result.url,
          fileName: req.file.originalname,
          size: result.size,
          path: result.path
        }
      });
    } else {
      res.status(500).json({
        success: false,
        error: { code: 'UPLOAD_FAILED', message: result.error }
      });
    }
  } catch (error) {
    console.error('Property image upload error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'UPLOAD_ERROR', message: 'Failed to upload property image' }
    });
  }
});

// Property images upload (multiple)
router.post('/property-images/:propertyId', upload.array('images', 10), async (req, res) => {
  try {
    const { propertyId } = req.params;
    
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        error: { code: 'NO_FILES', message: 'No image files provided' }
      });
    }

    console.log(`📸 Uploading ${req.files.length} property images locally for ${propertyId}`);

    const uploadPromises = req.files.map(file => 
      localStorageService.savePropertyImage(propertyId, file.buffer, file.originalname)
    );

    const results = await Promise.all(uploadPromises);
    
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);

    res.json({
      success: true,
      data: {
        uploaded: successful.length,
        failed: failed.length,
        images: successful.map(r => ({
          url: r.url,
          path: r.path
        })),
        errors: failed.map(r => r.error)
      }
    });

  } catch (error) {
    console.error('Multiple property images upload error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'UPLOAD_ERROR', message: 'Failed to upload property images' }
    });
  }
});

// Property document upload
router.post('/property-document/:propertyId', upload.single('document'), async (req, res) => {
  try {
    const { propertyId } = req.params;
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: { code: 'NO_FILE', message: 'No document file provided' }
      });
    }

    console.log(`📄 Uploading property document locally for ${propertyId}:`, req.file.originalname);

    const result = await localStorageService.savePropertyDocument(
      propertyId,
      req.file.buffer,
      req.file.originalname
    );

    if (result.success) {
      res.json({
        success: true,
        data: {
          url: result.url,
          fileName: req.file.originalname,
          size: result.size,
          path: result.path
        }
      });
    } else {
      res.status(500).json({
        success: false,
        error: { code: 'UPLOAD_FAILED', message: result.error }
      });
    }
  } catch (error) {
    console.error('Property document upload error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'UPLOAD_ERROR', message: 'Failed to upload property document' }
    });
  }
});

// Get property images
router.get('/property-images/:propertyId', async (req, res) => {
  try {
    const { propertyId } = req.params;
    
    console.log(`📋 Getting property images locally for ${propertyId}`);
    
    const images = await localStorageService.listPropertyImages(propertyId);
    
    res.json({
      success: true,
      data: {
        propertyId,
        images,
        count: images.length
      }
    });

  } catch (error) {
    console.error('Get property images error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'GET_IMAGES_ERROR', message: 'Failed to get property images' }
    });
  }
});

// Delete file
router.delete('/:filePath', async (req, res) => {
  try {
    const filePath = req.params.filePath;
    
    console.log(`🗑️ Deleting local file: ${filePath}`);
    
    const result = await localStorageService.deleteFile(filePath);
    
    if (result.success) {
      res.json({
        success: true,
        message: 'File deleted successfully'
      });
    } else {
      res.status(500).json({
        success: false,
        error: { code: 'DELETE_FAILED', message: result.error }
      });
    }

  } catch (error) {
    console.error('Delete file error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'DELETE_ERROR', message: 'Failed to delete file' }
    });
  }
});

// Get storage statistics
router.get('/stats', async (req, res) => {
  try {
    console.log('📊 Getting local storage statistics');
    
    const stats = await localStorageService.getStats();
    
    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Get storage stats error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'STATS_ERROR', message: 'Failed to get storage statistics' }
    });
  }
});

// Test local storage health
router.get('/health', async (req, res) => {
  try {
    const result = await localStorageService.healthCheck();
    
    if (result.success) {
      res.json({
        success: true,
        message: result.message,
        data: {
          baseDir: result.baseDir,
          type: 'local-storage'
        }
      });
    } else {
      res.status(500).json({
        success: false,
        error: { code: 'STORAGE_UNHEALTHY', message: result.error }
      });
    }

  } catch (error) {
    console.error('Local storage health check error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'HEALTH_CHECK_ERROR', message: 'Health check failed' }
    });
  }
});

module.exports = router;