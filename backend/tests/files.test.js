const request = require('supertest');
const app = require('../index');
const { setupTestDatabase, teardownTestDatabase, clearTestData, getTestDb } = require('./setup');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs').promises;

describe('Files Routes', () => {
  let db;
  let userToken, adminToken;
  let userId, adminId;

  beforeAll(async () => {
    db = await setupTestDatabase();
    
    // Create uploads directory for tests
    const uploadsDir = path.join(__dirname, '../uploads');
    try {
      await fs.mkdir(uploadsDir, { recursive: true });
      await fs.mkdir(path.join(uploadsDir, 'optimized'), { recursive: true });
      await fs.mkdir(path.join(uploadsDir, 'thumbnails'), { recursive: true });
    } catch (error) {
      // Directory exists, continue
    }
  });

  afterAll(async () => {
    // Clean up test files
    try {
      const uploadsDir = path.join(__dirname, '../uploads');
      await fs.rmdir(uploadsDir, { recursive: true });
    } catch (error) {
      // Ignore cleanup errors
    }
    
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    await clearTestData();
    
    // Create test users
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    userId = '550e8400-e29b-41d4-a716-446655440001';
    adminId = '550e8400-e29b-41d4-a716-446655440002';

    await db('users').insert([
      {
        id: userId,
        email: 'user@example.com',
        password: hashedPassword,
        first_name: 'Test',
        last_name: 'User',
        role: 'agent',
        is_active: true
      },
      {
        id: adminId,
        email: 'admin@example.com',
        password: hashedPassword,
        first_name: 'Admin',
        last_name: 'User',
        role: 'admin',
        is_active: true
      }
    ]);

    // Generate auth tokens
    userToken = jwt.sign(
      { id: userId, email: 'user@example.com', role: 'agent' },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '24h' }
    );

    adminToken = jwt.sign(
      { id: adminId, email: 'admin@example.com', role: 'admin' },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '24h' }
    );
  });

  describe('POST /api/files/upload', () => {
    // Create a test image file
    const createTestFile = () => {
      const buffer = Buffer.from('test file content');
      return {
        buffer,
        originalname: 'test.txt',
        mimetype: 'text/plain',
        size: buffer.length
      };
    };

    it('should upload file successfully', async () => {
      const response = await request(app)
        .post('/api/files/upload')
        .set('Authorization', `Bearer ${userToken}`)
        .attach('files', Buffer.from('test content'), 'test.txt');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.files).toHaveLength(1);
      expect(response.body.data.files[0]).toHaveProperty('id');
      expect(response.body.data.files[0].original_name).toBe('test.txt');
      expect(response.body.data.files[0].uploaded_by).toBe(userId);
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .post('/api/files/upload')
        .attach('files', Buffer.from('test content'), 'test.txt');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NO_TOKEN');
    });

    it('should fail without files', async () => {
      const response = await request(app)
        .post('/api/files/upload')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NO_FILES');
    });

    it('should associate file with property', async () => {
      // Create a test property first
      const propertyId = '550e8400-e29b-41d4-a716-446655440010';
      await db('properties').insert({
        id: propertyId,
        title: 'Test Property',
        description: 'Test Description',
        category: 'sale',
        property_category: 'residential',
        listing_type: 'agency_owned',
        sell_price_azn: 150000,
        area_m2: 100,
        room_count: 3,
        floor: 5,
        total_floors: 10,
        address: 'Test Address',
        district_id: 1,
        agent_id: userId,
        approval_status: 'pending',
        created_at: new Date()
      });

      const response = await request(app)
        .post('/api/files/upload')
        .set('Authorization', `Bearer ${userToken}`)
        .field('property_id', propertyId)
        .field('category', 'images')
        .attach('files', Buffer.from('test image'), 'test.jpg');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.files[0].property_id).toBe(propertyId);
      expect(response.body.data.files[0].category).toBe('images');
    });

    it('should handle multiple file uploads', async () => {
      const response = await request(app)
        .post('/api/files/upload')
        .set('Authorization', `Bearer ${userToken}`)
        .attach('files', Buffer.from('file 1'), 'test1.txt')
        .attach('files', Buffer.from('file 2'), 'test2.txt');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.files).toHaveLength(2);
    });
  });

  describe('GET /api/files', () => {
    beforeEach(async () => {
      // Create test files
      await db('files').insert([
        {
          id: '550e8400-e29b-41d4-a716-446655440020',
          original_name: 'test1.txt',
          file_name: 'test1.txt',
          file_path: '/uploads/test1.txt',
          file_size: 1000,
          mime_type: 'text/plain',
          category: 'documents',
          uploaded_by: userId,
          created_at: new Date()
        },
        {
          id: '550e8400-e29b-41d4-a716-446655440021',
          original_name: 'test2.jpg',
          file_name: 'test2.jpg',
          file_path: '/uploads/test2.jpg',
          file_size: 2000,
          mime_type: 'image/jpeg',
          category: 'images',
          uploaded_by: userId,
          created_at: new Date(Date.now() - 60000)
        }
      ]);
    });

    it('should get files with pagination', async () => {
      const response = await request(app)
        .get('/api/files')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.files).toHaveLength(2);
      expect(response.body.data.pagination).toHaveProperty('totalPages');
      expect(response.body.data.pagination.totalFiles).toBe(2);
    });

    it('should filter files by category', async () => {
      const response = await request(app)
        .get('/api/files?category=images')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.files).toHaveLength(1);
      expect(response.body.data.files[0].category).toBe('images');
    });

    it('should filter files by mime type', async () => {
      const response = await request(app)
        .get('/api/files?mime_type=image')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.files).toHaveLength(1);
      expect(response.body.data.files[0].mime_type).toBe('image/jpeg');
    });

    it('should search files by name', async () => {
      const response = await request(app)
        .get('/api/files?search=test1')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.files).toHaveLength(1);
      expect(response.body.data.files[0].original_name).toBe('test1.txt');
    });

    it('should sort files by different criteria', async () => {
      const response = await request(app)
        .get('/api/files?sort_by=file_size&sort_order=desc')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.files[0].file_size).toBe(2000);
      expect(response.body.data.files[1].file_size).toBe(1000);
    });

    it('should paginate results', async () => {
      const response = await request(app)
        .get('/api/files?page=1&limit=1')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.files).toHaveLength(1);
      expect(response.body.data.pagination.currentPage).toBe(1);
      expect(response.body.data.pagination.totalPages).toBe(2);
    });
  });

  describe('GET /api/files/:id', () => {
    let fileId;

    beforeEach(async () => {
      fileId = '550e8400-e29b-41d4-a716-446655440030';
      await db('files').insert({
        id: fileId,
        original_name: 'test.txt',
        file_name: 'test.txt',
        file_path: '/uploads/test.txt',
        file_size: 1000,
        mime_type: 'text/plain',
        category: 'documents',
        uploaded_by: userId,
        created_at: new Date()
      });
    });

    it('should get file by ID', async () => {
      const response = await request(app)
        .get(`/api/files/${fileId}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.file.id).toBe(fileId);
      expect(response.body.data.file.original_name).toBe('test.txt');
    });

    it('should return 404 for non-existent file', async () => {
      const nonExistentId = '550e8400-e29b-41d4-a716-446655440999';
      const response = await request(app)
        .get(`/api/files/${nonExistentId}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('FILE_NOT_FOUND');
    });
  });

  describe('PUT /api/files/:id', () => {
    let fileId;

    beforeEach(async () => {
      fileId = '550e8400-e29b-41d4-a716-446655440040';
      await db('files').insert({
        id: fileId,
        original_name: 'test.txt',
        file_name: 'test.txt',
        file_path: '/uploads/test.txt',
        file_size: 1000,
        mime_type: 'text/plain',
        category: 'documents',
        uploaded_by: userId,
        created_at: new Date()
      });
    });

    it('should update file metadata', async () => {
      const updateData = {
        category: 'contracts',
        description: 'Updated description',
        tags: ['important', 'legal']
      };

      const response = await request(app)
        .put(`/api/files/${fileId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.file.category).toBe('contracts');
      expect(response.body.data.file.description).toBe('Updated description');
      expect(response.body.data.file.tags).toEqual(['important', 'legal']);
    });

    it('should fail for non-existent file', async () => {
      const nonExistentId = '550e8400-e29b-41d4-a716-446655440999';
      const response = await request(app)
        .put(`/api/files/${nonExistentId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ category: 'updated' });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('FILE_NOT_FOUND');
    });

    it('should validate update data', async () => {
      const response = await request(app)
        .put(`/api/files/${fileId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ property_id: 'invalid-uuid' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('DELETE /api/files/:id', () => {
    let fileId;

    beforeEach(async () => {
      fileId = '550e8400-e29b-41d4-a716-446655440050';
      await db('files').insert({
        id: fileId,
        original_name: 'test.txt',
        file_name: 'test.txt',
        file_path: '/uploads/test.txt',
        file_size: 1000,
        mime_type: 'text/plain',
        category: 'documents',
        uploaded_by: userId,
        created_at: new Date()
      });
    });

    it('should soft delete file', async () => {
      const response = await request(app)
        .delete(`/api/files/${fileId}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Verify soft delete
      const file = await db('files').where('id', fileId).first();
      expect(file.deleted_at).not.toBeNull();
      expect(file.deleted_by).toBe(userId);
    });

    it('should fail for non-existent file', async () => {
      const nonExistentId = '550e8400-e29b-41d4-a716-446655440999';
      const response = await request(app)
        .delete(`/api/files/${nonExistentId}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('FILE_NOT_FOUND');
    });
  });

  describe('POST /api/files/batch', () => {
    let fileIds;

    beforeEach(async () => {
      fileIds = [
        '550e8400-e29b-41d4-a716-446655440060',
        '550e8400-e29b-41d4-a716-446655440061'
      ];

      await db('files').insert([
        {
          id: fileIds[0],
          original_name: 'batch1.txt',
          file_name: 'batch1.txt',
          file_path: '/uploads/batch1.txt',
          file_size: 1000,
          mime_type: 'text/plain',
          category: 'documents',
          uploaded_by: userId,
          created_at: new Date()
        },
        {
          id: fileIds[1],
          original_name: 'batch2.txt',
          file_name: 'batch2.txt',
          file_path: '/uploads/batch2.txt',
          file_size: 1500,
          mime_type: 'text/plain',
          category: 'documents',
          uploaded_by: userId,
          created_at: new Date()
        }
      ]);
    });

    it('should delete multiple files', async () => {
      const response = await request(app)
        .post('/api/files/batch')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          action: 'delete',
          file_ids: fileIds
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Verify files were soft deleted
      const files = await db('files').whereIn('id', fileIds);
      files.forEach(file => {
        expect(file.deleted_at).not.toBeNull();
        expect(file.deleted_by).toBe(userId);
      });
    });

    it('should move multiple files', async () => {
      const response = await request(app)
        .post('/api/files/batch')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          action: 'move',
          file_ids: fileIds,
          target_category: 'contracts'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Verify files were moved
      const files = await db('files').whereIn('id', fileIds);
      files.forEach(file => {
        expect(file.category).toBe('contracts');
      });
    });

    it('should validate batch parameters', async () => {
      const response = await request(app)
        .post('/api/files/batch')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          action: 'invalid_action',
          file_ids: fileIds
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('UNKNOWN_BATCH_ACTION');
    });

    it('should require file_ids array', async () => {
      const response = await request(app)
        .post('/api/files/batch')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          action: 'delete'
          // missing file_ids
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_BATCH_PARAMS');
    });
  });

  describe('POST /api/files/upload/chunk', () => {
    it('should handle chunked file upload', async () => {
      const fileId = 'test-file-id';
      const fileName = 'large-file.txt';
      const fileContent = 'This is chunk content';
      const chunkData = Buffer.from(fileContent).toString('base64');

      const response = await request(app)
        .post('/api/files/upload/chunk')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          chunk: chunkData,
          chunkIndex: 0,
          totalChunks: 1,
          fileName: fileName,
          fileId: fileId,
          mimeType: 'text/plain'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      
      if (response.body.data.file) {
        // Single chunk upload completed
        expect(response.body.data.file.original_name).toBe(fileName);
      } else {
        // Chunk received, waiting for more
        expect(response.body.data.chunksReceived).toBe(1);
        expect(response.body.data.totalChunks).toBe(1);
      }
    });

    it('should validate chunk data', async () => {
      const response = await request(app)
        .post('/api/files/upload/chunk')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          // missing required fields
          chunk: 'data'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_CHUNK_DATA');
    });
  });

  describe('File Access Control', () => {
    let fileId;

    beforeEach(async () => {
      fileId = '550e8400-e29b-41d4-a716-446655440070';
      await db('files').insert({
        id: fileId,
        original_name: 'private.txt',
        file_name: 'private.txt',
        file_path: '/uploads/private.txt',
        file_size: 1000,
        mime_type: 'text/plain',
        category: 'documents',
        uploaded_by: userId,
        created_at: new Date()
      });
    });

    it('should allow admin to access any file', async () => {
      const response = await request(app)
        .get(`/api/files/${fileId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should handle file download increment', async () => {
      // Create actual file for download test
      const testFilePath = path.join(__dirname, '../uploads/downloadtest.txt');
      await fs.writeFile(testFilePath, 'test content');

      // Update file record with actual path
      await db('files').where('id', fileId).update({
        file_path: testFilePath
      });

      const response = await request(app)
        .get(`/api/files/${fileId}/download`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);

      // Verify download count was incremented
      const file = await db('files').where('id', fileId).first();
      expect(file.download_count).toBe(1);

      // Clean up
      await fs.unlink(testFilePath).catch(() => {});
    });
  });
});