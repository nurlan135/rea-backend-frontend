const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

class LocalStorageService {
  constructor() {
    this.baseDir = process.env.UPLOAD_BASE_DIR || '/app/uploads';
    this.folders = {
      properties: path.join(this.baseDir, 'properties'),
      documents: path.join(this.baseDir, 'documents'),
      avatars: path.join(this.baseDir, 'avatars')
    };

    // Initialize folders
    this.initializeFolders();
  }

  async initializeFolders() {
    try {
      await fs.mkdir(this.baseDir, { recursive: true });
      
      for (const [key, folderPath] of Object.entries(this.folders)) {
        await fs.mkdir(folderPath, { recursive: true });
        console.log(`✅ Created local folder: ${folderPath}`);
      }
    } catch (error) {
      console.error('Local storage folder initialization error:', error);
    }
  }

  /**
   * Save file to local storage
   * @param {Buffer} fileBuffer - File data
   * @param {string} fileName - Original filename
   * @param {string} category - Category (properties/documents/avatars)
   * @param {string} propertyId - Property ID (optional)
   */
  async saveFile(fileBuffer, fileName, category = 'properties', propertyId = null) {
    try {
      // Generate unique filename
      const timestamp = Date.now();
      const fileExtension = path.extname(fileName);
      const baseName = path.basename(fileName, fileExtension);
      const hash = crypto.randomBytes(8).toString('hex');
      
      let relativePath;
      if (propertyId) {
        relativePath = path.join(category, propertyId, `${timestamp}-${hash}${fileExtension}`);
      } else {
        relativePath = path.join(category, `${timestamp}-${baseName}-${hash}${fileExtension}`);
      }
      
      const fullPath = path.join(this.baseDir, relativePath);
      const directory = path.dirname(fullPath);
      
      // Create directory if not exists
      await fs.mkdir(directory, { recursive: true });
      
      // Save file
      await fs.writeFile(fullPath, fileBuffer);
      
      // Generate public URL
      const publicUrl = `/uploads/${relativePath.replace(/\\/g, '/')}`;
      
      console.log(`💾 Saved file locally: ${publicUrl}`);
      
      return {
        success: true,
        url: publicUrl,
        path: relativePath,
        size: fileBuffer.length
      };
      
    } catch (error) {
      console.error('Local storage save error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Save property image
   * @param {string} propertyId - Property ID
   * @param {Buffer} imageBuffer - Image data
   * @param {string} fileName - Original filename
   */
  async savePropertyImage(propertyId, imageBuffer, fileName) {
    return await this.saveFile(imageBuffer, fileName, 'properties', propertyId);
  }

  /**
   * Save property document
   * @param {string} propertyId - Property ID  
   * @param {Buffer} docBuffer - Document data
   * @param {string} fileName - Original filename
   */
  async savePropertyDocument(propertyId, docBuffer, fileName) {
    return await this.saveFile(docBuffer, fileName, 'documents', propertyId);
  }

  /**
   * Delete file
   * @param {string} relativePath - Relative file path
   */
  async deleteFile(relativePath) {
    try {
      const fullPath = path.join(this.baseDir, relativePath);
      await fs.unlink(fullPath);
      
      console.log(`🗑️ Deleted file: ${relativePath}`);
      
      return { success: true };
    } catch (error) {
      console.error('Local storage delete error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * List property images
   * @param {string} propertyId - Property ID
   */
  async listPropertyImages(propertyId) {
    try {
      const propertyDir = path.join(this.folders.properties, propertyId);
      
      try {
        const files = await fs.readdir(propertyDir);
        const images = [];
        
        for (const file of files) {
          const filePath = path.join(propertyDir, file);
          const stats = await fs.stat(filePath);
          
          if (stats.isFile() && /\.(jpg|jpeg|png|webp|gif)$/i.test(file)) {
            const relativePath = path.join('properties', propertyId, file);
            images.push({
              name: file,
              url: `/uploads/${relativePath.replace(/\\/g, '/')}`,
              size: stats.size,
              lastModified: stats.mtime
            });
          }
        }
        
        return images;
      } catch (error) {
        // Directory doesn't exist - return empty array
        return [];
      }
      
    } catch (error) {
      console.error('Local storage list error:', error);
      return [];
    }
  }

  /**
   * Get storage statistics
   */
  async getStats() {
    try {
      const stats = {};
      
      for (const [category, folderPath] of Object.entries(this.folders)) {
        let count = 0;
        let totalSize = 0;
        
        try {
          const files = await this.getFilesRecursive(folderPath);
          count = files.length;
          
          for (const file of files) {
            const stat = await fs.stat(file);
            totalSize += stat.size;
          }
        } catch (error) {
          // Folder doesn't exist yet
        }
        
        stats[category] = { count, totalSize };
      }
      
      return stats;
    } catch (error) {
      console.error('Local storage stats error:', error);
      return {};
    }
  }

  /**
   * Get all files recursively
   * @param {string} dir - Directory path
   */
  async getFilesRecursive(dir) {
    try {
      const files = [];
      const items = await fs.readdir(dir);
      
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = await fs.stat(fullPath);
        
        if (stat.isDirectory()) {
          const subFiles = await this.getFilesRecursive(fullPath);
          files.push(...subFiles);
        } else {
          files.push(fullPath);
        }
      }
      
      return files;
    } catch (error) {
      return [];
    }
  }

  /**
   * Health check
   */
  async healthCheck() {
    try {
      // Check if base directory is writable
      const testFile = path.join(this.baseDir, 'health-check.tmp');
      await fs.writeFile(testFile, 'test');
      await fs.unlink(testFile);
      
      return {
        success: true,
        message: 'Local storage healthy',
        baseDir: this.baseDir
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}

// Singleton instance
const localStorageService = new LocalStorageService();

module.exports = localStorageService;