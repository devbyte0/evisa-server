// controllers/visaController.js
const Visa = require('../models/Visa');
const { deleteFromCloudinary } = require('../config/cloudinary');

// @desc    Verify visa by number
// @route   POST /api/visa/verify
// @access  Public
const verifyVisa = async (req, res) => {
  try {
    const { visaNumber, captchaInput } = req.body;

    // Simple captcha validation (in production, implement proper captcha)
    if (!captchaInput || captchaInput.length < 4) {
      return res.status(400).json({
        success: false,
        message: 'Valid captcha is required'
      });
    }

    // Validate visa number
    if (!visaNumber) {
      return res.status(400).json({
        success: false,
        message: 'Visa number is required'
      });
    }

    // Find visa by visa number only (no passport number required)
    const visa = await Visa.findOne({ 
      visaNumber: visaNumber.toUpperCase()
    });

    if (!visa) {
      return res.status(404).json({
        success: false,
        message: 'Viza nu a fost găsită. Verificați numărul și încercați din nou.'
      });
    }

    // Format dates for response: dd/MM/yyyy
    const formatDate = (date) => {
      if (!date) return '';
      const d = new Date(date);
      if (Number.isNaN(d.getTime())) return '';
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${day}/${month}/${year}`;
    };

    // Return visa details in the format expected by frontend
    res.json({
      success: true,
      NumeSolicitant: visa.lastName,
      PrenumeSolicitant: visa.firstName,
      DataNastereSolicitant: formatDate(visa.dateOfBirth),
      DenumireCetatenie: visa.nationality,
      NumarPasaport: visa.passportNumber,
      ValabilitateStop: formatDate(visa.expiryDate),
      DenumireStatus: visa.status === 'Valid' ? 'Validă' : visa.status,
      CodTipViza: visa.visaType,
      DenumireScopVizita: visa.purposeOfVisit,
      UriFotografie: visa.photo?.url || null
    });
  } catch (error) {
    console.error('Verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Eroare server. Vă rugăm încercați din nou mai târziu.'
    });
  }
};

// @desc    Get all visas (with optional filters)
// @route   GET /api/visa/all
// @access  Public
const getAllVisas = async (req, res) => {
  try {
    const { status, nationality, visaType } = req.query;
    
    // Build filter
    const filter = {};
    if (status) filter.status = status;
    if (nationality) filter.nationality = nationality;
    if (visaType) filter.visaType = visaType;

    const visas = await Visa.find(filter)
      .select('-__v')
      .sort('-createdAt')
      .limit(100);

    res.json({
      success: true,
      count: visas.length,
      data: visas
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get single visa by ID
// @route   GET /api/visa/:id
// @access  Public
const getVisaById = async (req, res) => {
  try {
    const visa = await Visa.findById(req.params.id).select('-__v');
    
    if (!visa) {
      return res.status(404).json({
        success: false,
        message: 'Visa not found'
      });
    }

    res.json({
      success: true,
      data: visa
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Helper: normalize date strings to proper Date objects
const parseDMYDate = (value) => {
  if (!value) return undefined;

  if (value instanceof Date) return value;

  if (typeof value === 'string') {
    const match = value.match(/^(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{4})$/);
    if (match) {
      const day = parseInt(match[1], 10);
      const month = parseInt(match[2], 10) - 1;
      const year = parseInt(match[3], 10);
      return new Date(year, month, day);
    }
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
};

// @desc    Create new visa (for testing/admin)
// @route   POST /api/visa/create
// @access  Public (should be protected in production)
const createVisa = async (req, res) => {
  try {
    const visaData = { ...req.body };

    // Normalize date fields so they are always stored correctly
    if (visaData.dateOfBirth) {
      visaData.dateOfBirth = parseDMYDate(visaData.dateOfBirth);
    }
    if (visaData.issueDate) {
      visaData.issueDate = parseDMYDate(visaData.issueDate);
    }
    if (visaData.expiryDate) {
      visaData.expiryDate = parseDMYDate(visaData.expiryDate);
    }

    const visa = await Visa.create(visaData);
    
    res.status(201).json({
      success: true,
      data: visa
    });
  } catch (error) {
    console.error(error);
    
    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Visa with this number already exists'
      });
    }
    
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};

// @desc    Update visa by ID
// @route   PUT /api/visa/:id
// @access  Public
const updateVisa = async (req, res) => {
  try {
    const visa = await Visa.findById(req.params.id);
    
    if (!visa) {
      return res.status(404).json({
        success: false,
        message: 'Visa not found'
      });
    }

    // Prepare update data
    const updateData = { ...req.body, updatedAt: Date.now() };

    // Normalize date fields if present on update
    if (updateData.dateOfBirth) {
      updateData.dateOfBirth = parseDMYDate(updateData.dateOfBirth);
    }
    if (updateData.issueDate) {
      updateData.issueDate = parseDMYDate(updateData.issueDate);
    }
    if (updateData.expiryDate) {
      updateData.expiryDate = parseDMYDate(updateData.expiryDate);
    }

    const updatedVisa = await Visa.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      data: updatedVisa
    });
  } catch (error) {
    console.error(error);
    
    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Visa with this number already exists'
      });
    }
    
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};

// @desc    Delete visa by ID
// @route   DELETE /api/visa/:id
// @access  Public
const deleteVisa = async (req, res) => {
  try {
    const visa = await Visa.findById(req.params.id);
    
    if (!visa) {
      return res.status(404).json({
        success: false,
        message: 'Visa not found'
      });
    }

    // Delete photo from Cloudinary if exists
    if (visa.photo && visa.photo.publicId) {
      try {
        await deleteFromCloudinary(visa.photo.publicId);
      } catch (cloudinaryError) {
        console.error('Error deleting photo from Cloudinary:', cloudinaryError);
        // Continue with visa deletion even if photo deletion fails
      }
    }

    await visa.deleteOne();

    res.json({
      success: true,
      message: 'Visa deleted successfully'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Upload captcha image (for testing)
// @route   POST /api/visa/upload-captcha
// @access  Public
const uploadCaptchaImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    res.json({
      success: true,
      data: {
        publicId: req.file.filename,
        url: req.file.path
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

module.exports = {
  verifyVisa,
  getAllVisas,
  getVisaById,
  createVisa,
  updateVisa,
  deleteVisa,
  uploadCaptchaImage
};