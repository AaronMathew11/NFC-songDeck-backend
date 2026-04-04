const multer = require('multer');
const busboy = require('busboy');
const path = require('path');
const fs = require('fs').promises;
const { Storage } = require('@google-cloud/storage');
const admin = require('firebase-admin');
const Resource = require('../models/Resource');

// Initialize Google Cloud Storage using Firebase Admin
const gcs = new Storage();

// Function to get the correct bucket
const getBucket = async () => {
  const possibleBuckets = [
    'nfc-worship-app.appspot.com',
    'nfc-worship-app.firebasestorage.app', 
    `${admin.app().options.projectId}.appspot.com`
  ];
  
  for (const bucketName of possibleBuckets) {
    try {
      const bucket = gcs.bucket(bucketName);
      const [exists] = await bucket.exists();
      if (exists) {
        console.log(`Found existing bucket: ${bucketName}`);
        return bucket;
      }
    } catch (error) {
      console.log(`Bucket ${bucketName} not accessible:`, error.message);
    }
  }
  
  // If no bucket exists, try to create the default one
  console.log('No bucket found, creating default bucket...');
  const defaultBucket = gcs.bucket('nfc-worship-app.appspot.com');
  try {
    await defaultBucket.create();
    console.log('Created default bucket successfully');
    return defaultBucket;
  } catch (error) {
    console.error('Failed to create bucket:', error);
    throw error;
  }
};

// For backward compatibility, initialize a default bucket reference
const bucket = gcs.bucket('nfc-worship-app.appspot.com');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads');
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error, null);
    }
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + extension);
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  // Define allowed file types
  const allowedTypes = {
    'image/jpeg': true,
    'image/png': true,
    'image/gif': true,
    'image/webp': true,
    'application/pdf': true,
    'application/msword': true,
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': true,
    'application/vnd.ms-excel': true,
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': true,
    'application/vnd.ms-powerpoint': true,
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': true,
    'text/plain': true,
    'audio/mpeg': true,
    'audio/wav': true,
    'audio/ogg': true,
    'video/mp4': true,
    'video/webm': true,
    'video/ogg': true
  };

  if (allowedTypes[file.mimetype]) {
    cb(null, true);
  } else {
    cb(new Error('File type not allowed. Supported types: images, PDFs, documents, audio, and video files.'), false);
  }
};

// Configure multer with more lenient settings
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
    files: 5, // Maximum 5 files at once
    fieldSize: 1024 * 1024, // 1MB field size
    fields: 10 // Maximum 10 fields
  },
  fileFilter: fileFilter
});

// Helper function to determine file category
const getFileCategory = (mimeType) => {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  if (mimeType.includes('pdf') || 
      mimeType.includes('document') || 
      mimeType.includes('spreadsheet') || 
      mimeType.includes('presentation') ||
      mimeType === 'text/plain') return 'document';
  return 'other';
};

// Upload single file using busboy for better Firebase Functions compatibility
exports.uploadSingle = async (req, res) => {
  console.log('Upload single called, Content-Type:', req.headers['content-type']);
  
  try {
    // Handle raw multipart buffer from Firebase Functions
    const bb = busboy({ 
      headers: req.headers,
      limits: {
        fileSize: 50 * 1024 * 1024, // 50MB limit
        files: 1
      }
    });

    let fileInfo = null;
    let fileBuffer = null;
    let description = '';
    let category = '';

    bb.on('file', (name, file, info) => {
      console.log('File received:', info);
      const { filename, encoding, mimeType } = info;
      
      if (!filename) {
        file.resume();
        return;
      }

      // Check file type
      const allowedTypes = {
        'image/jpeg': true,
        'image/png': true,
        'image/gif': true,
        'image/webp': true,
        'application/pdf': true,
        'application/msword': true,
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document': true,
        'application/vnd.ms-excel': true,
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': true,
        'application/vnd.ms-powerpoint': true,
        'application/vnd.openxmlformats-officedocument.presentationml.presentation': true,
        'text/plain': true,
        'audio/mpeg': true,
        'audio/wav': true,
        'audio/ogg': true,
        'video/mp4': true,
        'video/webm': true,
        'video/ogg': true
      };

      if (!allowedTypes[mimeType]) {
        file.resume();
        return res.status(400).json({ error: 'File type not allowed' });
      }

      fileInfo = {
        originalName: filename,
        mimeType: mimeType,
        filename: Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(filename)
      };

      const chunks = [];
      file.on('data', (data) => {
        chunks.push(data);
      });

      file.on('end', () => {
        fileBuffer = Buffer.concat(chunks);
        fileInfo.size = fileBuffer.length;
        console.log('File data collected, size:', fileInfo.size);
      });
    });

    bb.on('field', (name, val) => {
      console.log('Field:', name, val);
      if (name === 'description') {
        description = val;
      } else if (name === 'category') {
        category = val;
      }
    });

    bb.on('finish', async () => {
      console.log('Busboy finished parsing');
      
      if (!fileInfo || !fileBuffer) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      try {
        console.log('Getting correct storage bucket...');
        
        // Get the correct bucket dynamically
        const targetBucket = await getBucket();
        console.log('Using bucket:', targetBucket.name);
        
        // Upload file to Firebase Storage
        const file = targetBucket.file(`uploads/${fileInfo.filename}`);
        const stream = file.createWriteStream({
          metadata: {
            contentType: fileInfo.mimeType,
            metadata: {
              originalName: fileInfo.originalName,
              uploadedBy: req.user.id
            }
          }
        });

        await new Promise((resolve, reject) => {
          stream.on('error', (error) => {
            console.error('Stream error:', error);
            reject(error);
          });
          stream.on('finish', () => {
            console.log('Upload stream finished successfully');
            resolve();
          });
          stream.end(fileBuffer);
        });

        // Make file publicly readable
        console.log('Making file public...');
        await file.makePublic();
        console.log('File made public successfully');

        // Save file metadata to database
        const resource = new Resource({
          filename: fileInfo.filename,
          originalName: fileInfo.originalName,
          mimeType: fileInfo.mimeType,
          size: fileInfo.size,
          uploadedBy: req.user.id,
          uploadedByName: req.user.name || req.user.email,
          uploadPath: `uploads/${fileInfo.filename}`, // Storage path instead of local path
          description: description || '',
          category: getFileCategory(fileInfo.mimeType),
          tags: [],
          isPublic: true
        });

        await resource.save();

        res.json({
          message: 'File uploaded successfully',
          resource: {
            id: resource._id,
            filename: resource.filename,
            originalName: resource.originalName,
            size: resource.size,
            category: resource.category,
            description: resource.description,
            uploadedAt: resource.createdAt
          }
        });
      } catch (error) {
        console.error('Error saving file:', error);
        res.status(500).json({ error: 'Failed to save file: ' + error.message });
      }
    });

    bb.on('error', (err) => {
      console.error('Busboy error:', err);
      res.status(400).json({ error: 'Upload parsing error: ' + err.message });
    });

    // Feed the request body to busboy
    if (req.body && Buffer.isBuffer(req.body)) {
      bb.write(req.body);
      bb.end();
    } else {
      req.pipe(bb);
    }

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Upload failed: ' + error.message });
  }
};

// Upload multiple files
exports.uploadMultiple = async (req, res) => {
  const uploadMultiple = upload.array('files', 5);
  
  uploadMultiple(req, res, async (err) => {
    if (err) {
      console.error('Upload error:', err);
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ error: 'One or more files too large. Maximum size is 50MB per file.' });
        }
        return res.status(400).json({ error: `Upload error: ${err.message}` });
      }
      return res.status(400).json({ error: err.message });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    try {
      const resources = [];
      const failedFiles = [];

      for (const file of req.files) {
        try {
          const resource = new Resource({
            filename: file.filename,
            originalName: file.originalname,
            mimeType: file.mimetype,
            size: file.size,
            uploadedBy: req.user.id,
            uploadedByName: req.user.name || req.user.email,
            uploadPath: file.path,
            description: req.body.description || '',
            category: req.body.category || getFileCategory(file.mimetype),
            tags: req.body.tags ? req.body.tags.split(',').map(tag => tag.trim()) : [],
            isPublic: req.body.isPublic !== 'false'
          });

          await resource.save();
          resources.push({
            id: resource._id,
            filename: resource.filename,
            originalName: resource.originalName,
            size: resource.size,
            category: resource.category,
            description: resource.description,
            uploadedAt: resource.createdAt
          });
        } catch (saveError) {
          console.error('Error saving file metadata for', file.originalname, ':', saveError);
          failedFiles.push(file.originalname);
          
          // Delete the file if database save fails
          try {
            await fs.unlink(file.path);
          } catch (deleteError) {
            console.error('Error deleting file after database failure:', deleteError);
          }
        }
      }

      if (resources.length === 0) {
        return res.status(500).json({ error: 'Failed to save any files' });
      }

      const response = {
        message: `${resources.length} file(s) uploaded successfully`,
        resources
      };

      if (failedFiles.length > 0) {
        response.warnings = `Failed to upload: ${failedFiles.join(', ')}`;
      }

      res.json(response);
    } catch (error) {
      console.error('Error in multiple file upload:', error);
      res.status(500).json({ error: 'Failed to process uploads' });
    }
  });
};

// Get upload status/info
exports.getUploadInfo = async (req, res) => {
  try {
    res.json({
      maxFileSize: '50MB',
      maxFiles: 5,
      allowedTypes: [
        'Images (JPEG, PNG, GIF, WebP)',
        'Documents (PDF, Word, Excel, PowerPoint, Text)',
        'Audio (MP3, WAV, OGG)',
        'Video (MP4, WebM, OGG)'
      ]
    });
  } catch (error) {
    console.error('Error getting upload info:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Test upload endpoint to debug multipart issues
exports.testUpload = (req, res) => {
  console.log('Test upload endpoint called');
  console.log('Content-Type:', req.headers['content-type']);
  console.log('Content-Length:', req.headers['content-length']);
  console.log('Raw body type:', typeof req.body);
  console.log('Raw body length:', req.body ? req.body.length : 'undefined');
  
  if (req.body && Buffer.isBuffer(req.body)) {
    console.log('Received buffer, length:', req.body.length);
    console.log('Buffer preview:', req.body.subarray(0, 200).toString('utf8'));
    res.json({ 
      message: 'Test upload received as buffer',
      contentType: req.headers['content-type'],
      contentLength: req.headers['content-length'],
      bodyType: 'buffer',
      bodyLength: req.body.length,
      preview: req.body.subarray(0, 200).toString('utf8')
    });
  } else {
    let body = Buffer.alloc(0);
    req.on('data', chunk => {
      body = Buffer.concat([body, chunk]);
      console.log('Received chunk, total length:', body.length);
    });
    
    req.on('end', () => {
      console.log('Request ended, total body length:', body.length);
      console.log('Body preview:', body.subarray(0, 200).toString('utf8'));
      res.json({ 
        message: 'Test upload received as stream',
        contentType: req.headers['content-type'],
        contentLength: req.headers['content-length'],
        bodyType: 'stream',
        bodyLength: body.length,
        preview: body.subarray(0, 200).toString('utf8')
      });
    });
    
    req.on('error', (err) => {
      console.error('Request error:', err);
      res.status(500).json({ error: 'Request error: ' + err.message });
    });
  }
};