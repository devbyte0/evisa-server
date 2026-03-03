// config/cloudinary.js

const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// ============================
// Cloudinary Config
// ============================
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_CLOUD_NAME.trim(),
  api_key: process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_KEY.trim(),
  api_secret: process.env.CLOUDINARY_API_SECRET && process.env.CLOUDINARY_API_SECRET.trim(),
  secure: true,
  timeout: 60000 // avoid hanging requests
});

// ============================
// STORAGE CONFIGS
// ============================

const visaPhotoStorage = new CloudinaryStorage({
  cloudinary,
  params: async () => ({
    folder: 'visa-photos',
    transformation: [{ width: 500, height: 500, crop: 'limit' }]
  })
});

const documentStorage = new CloudinaryStorage({
  cloudinary,
  params: async () => ({
    folder: 'visa-documents',
    resource_type: 'auto'
  })
});

const captchaStorage = new CloudinaryStorage({
  cloudinary,
  params: async () => ({
    folder: 'captcha-images'
  })
});

// ============================
// FILE FILTERS
// ============================

const imageFilter = (req, file, cb) => {
  if (!file.mimetype.startsWith('image/')) {
    return cb(new Error('Only image files allowed'), false);
  }
  cb(null, true);
};

const documentFilter = (req, file, cb) => {
  cb(null, true);
};

// ============================
// MULTER INSTANCES
// ============================

const uploadVisaPhoto = multer({
  storage: visaPhotoStorage,
  fileFilter: imageFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5 MB
  }
});

const uploadDocument = multer({
  storage: documentStorage,
  fileFilter: documentFilter
});

const uploadCaptcha = multer({
  storage: captchaStorage,
  fileFilter: imageFilter
});

// ============================
// HELPERS
// ============================

const deleteFromCloudinary = async (publicId) => {
  return await cloudinary.uploader.destroy(publicId);
};

module.exports = {
  cloudinary,
  uploadVisaPhoto,
  uploadDocument,
  uploadCaptcha,
  deleteFromCloudinary
};