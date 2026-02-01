const multer = require('multer');
const cloudinary = require('cloudinary').v2;

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});


const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

const uploadMultiple = upload.array('attachments', 20);

/**
 * Upload files to Cloudinary
 * @param {Array} files - Array of file objects from multer
 * @param {String} folder - Cloudinary folder name
 * @returns {Promise<Array>} Array of uploaded file metadata
 */
const uploadToCloudinary = async (files, folder = 'ors-reports') => {
  if (!files || files.length === 0) {
    return [];
  }

  const uploadPromises = files.map((file) => {
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: folder,
          resource_type: 'auto',
          public_id: `${Date.now()}-${file.originalname.split('.')[0]}`,
        },
        (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve({
              url: result.secure_url,
              public_id: result.public_id,
              originalName: file.originalname,
              mimeType: file.mimetype,
              size: file.size,
            });
          }
        }
      );
      stream.end(file.buffer);
    });
  });

  return Promise.all(uploadPromises);
};

module.exports = { uploadMultiple, uploadToCloudinary };
