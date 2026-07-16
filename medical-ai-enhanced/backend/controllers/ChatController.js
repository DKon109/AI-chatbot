const { body, validationResult } = require('express-validator');
const ChatService = require('../services/ChatService');

class ChatController {
  // Message validation rules
  static getMessageValidation() {
    return [
      body('message')
        .notEmpty()
        .trim()
        .isLength({ min: 1, max: 1000 })
        .withMessage('Message must be between 1 and 1000 characters')
    ];
  }

  // Handle validation errors
  static handleValidationErrors(req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }
    next();
  }

  // Get chat history
  static async getChatHistory(req, res, next) {
    try {
      const { limit = 50, offset = 0 } = req.query;
      const userId = req.userId;

      const messages = await ChatService.getChatHistory(
        userId, 
        parseInt(limit), 
        parseInt(offset)
      );

      res.json({
        success: true,
        data: {
          messages,
          pagination: {
            limit: parseInt(limit),
            offset: parseInt(offset),
            total: messages.length
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Send message
  static async sendMessage(req, res, next) {
    try {
      const { message } = req.body;
      const userId = req.userId;

      const result = await ChatService.processMessage(userId, message);

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  // Analyze food image
  static async analyzeFoodImage(req, res, next) {
    try {
      const userId = req.userId;
      const imageFile = req.file;
      const description = req.body.description || '';

      if (!imageFile) {
        return res.status(400).json({
          success: false,
          error: 'No image file provided'
        });
      }

      const result = await ChatService.analyzeFoodImage(userId, imageFile, description);

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  // Clear chat history
  static async clearChatHistory(req, res, next) {
    try {
      const pool = require('../config/database');
      const userId = req.userId;

      await pool.query(
        'DELETE FROM chat_messages WHERE user_id = $1',
        [userId]
      );

      res.json({
        success: true,
        message: 'Chat history cleared successfully'
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = ChatController;
