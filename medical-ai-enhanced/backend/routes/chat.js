const express = require('express');
const multer = require('multer');
const { authenticateToken, requirePatient } = require('../middleware/auth');
const ChatController = require('../controllers/ChatController');

// Configure multer for image uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

const router = express.Router();

// All chat routes require authentication
router.use(authenticateToken);

// Get chat history
router.get('/history', ChatController.getChatHistory);

// Send message (patients only)
router.post('/message',
  requirePatient,
  ChatController.getMessageValidation(),
  ChatController.handleValidationErrors,
  ChatController.sendMessage
);

// Analyze food image (patients only)
router.post('/analyze-food',
  requirePatient,
  upload.single('image'),
  ChatController.analyzeFoodImage
);

// Clear chat history
router.delete('/history', ChatController.clearChatHistory);

module.exports = router;
