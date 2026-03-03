const express = require('express');
const router = express.Router();
const {
  uploadVisaPhoto,
  uploadDocument,
  uploadCaptcha
} = require('../config/cloudinary');

// Wrap multer uploads so errors are returned as JSON instead of crashing the server
const handleMulterUpload = (uploadFn, fieldName) => (req, res) => {
  uploadFn.single(fieldName)(req, res, (err) => {
    if (err) {
      console.error('Upload error:', err);
      return res.status(400).json({
        success: false,
        message: err.message || 'Upload failed'
      });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    return res.json({
      success: true,
      data: {
        publicId: req.file.filename,
        url: req.file.path
      }
    });
  });
};

router.post('/visa-photo', handleMulterUpload(uploadVisaPhoto, 'photo'));
router.post('/document', handleMulterUpload(uploadDocument, 'document'));
router.post('/captcha', handleMulterUpload(uploadCaptcha, 'captcha'));

module.exports = router;