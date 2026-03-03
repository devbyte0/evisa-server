// routes/visaRoutes.js
const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const {
  verifyVisa,
  getAllVisas,
  getVisaById,
  createVisa,
  updateVisa,
  deleteVisa,
  uploadCaptchaImage
} = require('../controllers/visaController');
const {
  uploadCaptcha
} = require('../config/cloudinary');

// Rate limiting for verification endpoint
const verifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 requests per windowMs
  message: {
    success: false,
    message: 'Too many verification attempts, please try again after 15 minutes'
  }
});

// Public routes
router.post('/verify', verifyLimiter, verifyVisa);
router.get('/all', getAllVisas);
router.get('/:id', getVisaById);
router.put('/:id', updateVisa);
router.delete('/:id', deleteVisa);

// Create new visa (expects JSON body; photo data should already be uploaded via /api/upload/visa-photo)
router.post('/create', createVisa);

// Upload captcha (for testing)
router.post('/upload-captcha', uploadCaptcha.single('captcha'), uploadCaptchaImage);

module.exports = router;