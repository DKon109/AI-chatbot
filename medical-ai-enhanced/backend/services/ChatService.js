const { randomUUID } = require('crypto');
const pool = require('../config/database');
const SymptomAnalysisService = require('./SymptomAnalysisService');

class ChatService {
  // Get chat history for a user
  static async getChatHistory(userId, limit = 50, offset = 0) {
    const result = await pool.query(
      `SELECT id, sender, message, created_at 
       FROM chat_messages 
       WHERE user_id = $1 
       ORDER BY created_at DESC 
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    return result.rows.reverse(); // Return in chronological order
  }

  // Save message to database
  static async saveMessage(userId, sender, message) {
    const result = await pool.query(
      `INSERT INTO chat_messages (id, user_id, sender, message, created_at) 
       VALUES ($1, $2, $3, $4, NOW()) 
       RETURNING *`,
      [randomUUID(), userId, sender, message]
    );

    return result.rows[0];
  }

  // Generate AI response based on user message using advanced symptom analysis
  static async generateAIResponse(userMessage) {
    console.log('ChatService.generateAIResponse called with:', userMessage);
    
    try {
      // Use the advanced symptom analysis service
      console.log('Calling SymptomAnalysisService.analyzeSymptoms...');
      const analysis = await SymptomAnalysisService.analyzeSymptoms(userMessage);
      console.log('Analysis result:', analysis);
      
      // Format the response based on analysis results
      let response = analysis.recommendation.message;
      
      // Add additional context if we have symptom analysis
      if (analysis.symptoms_found && analysis.symptoms_found.length > 0) {
        response += `\n\n**Detected Symptoms:** ${analysis.symptoms_found.join(', ')}`;
      }
      
      // Add possible diseases if available
      if (analysis.possible_diseases && analysis.possible_diseases.length > 0) {
        const topDiseases = analysis.possible_diseases.slice(0, 3).map(d => d.disease).join(', ');
        response += `\n\n**Possible Conditions:** ${topDiseases}`;
      }
      
      // Add confidence level
      response += `\n\n**Analysis Confidence:** ${Math.round(analysis.confidence * 100)}%`;
      
      // Add emergency call option if critical
      if (analysis.emergency || analysis.severity === 'critical') {
        response += `\n\n🚨 **Emergency Services Available:**\n• Call 911 for immediate medical assistance\n• Use the emergency call feature in this app\n• Go to the nearest emergency room`;
      }
      
      console.log('Final response:', response);
      return response;
      
    } catch (error) {
      console.error('Error in advanced symptom analysis:', error);
      
      // Fallback to basic analysis
      return this.fallbackAIResponse(userMessage);
    }
  }

  // Fallback AI response for when advanced analysis fails
  static fallbackAIResponse(userMessage) {
    const lowerMessage = userMessage.toLowerCase();
    
    // Emergency keywords
    const emergencyKeywords = [
      'chest pain', 'heart attack', 'stroke', 'difficulty breathing', 'can\'t breathe',
      'severe pain', 'unconscious', 'coma', 'bleeding', 'severe headache',
      'high fever', 'emergency', 'ambulance', 'urgent'
    ];
    
    // Check for emergency conditions
    const isEmergency = emergencyKeywords.some(keyword => lowerMessage.includes(keyword));
    
    if (isEmergency) {
      return '🚨 **EMERGENCY ALERT** 🚨\n\nYour symptoms indicate a potentially serious condition that requires **immediate medical attention**.\n\n**IMMEDIATE ACTIONS:**\n• Call emergency services (911/ambulance) immediately\n• Go to the nearest emergency room\n• Do not delay seeking medical help\n\n**Do not wait** - your health and safety are the top priority.';
    }
    
    // Basic symptom responses
    const symptomResponses = {
      pain: {
        keywords: ['pain', 'ache', 'hurt', 'sore', 'tender'],
        response: "I understand you're experiencing pain. Pain can have many causes. I recommend:\n\n• Rest the affected area\n• Apply ice for acute pain or heat for chronic pain\n• Take over-the-counter pain relief if appropriate\n• Monitor the pain level and duration\n\nIf pain is severe, persistent, or worsening, please seek immediate medical attention."
      },
      fever: {
        keywords: ['fever', 'temperature', 'hot', 'burning up', 'chills'],
        response: "Fever is often a sign that your body is fighting an infection. Here's what you can do:\n\n• Stay hydrated - drink plenty of fluids\n• Rest and get adequate sleep\n• Monitor your temperature regularly\n• Use fever-reducing medications as directed\n• Keep cool with light clothing\n\nSeek medical attention if:\n• Temperature exceeds 38.5°C (101.3°F)\n• Fever lasts more than 3 days\n• You have difficulty breathing or severe headache"
      },
      respiratory: {
        keywords: ['cough', 'coughing', 'breath', 'breathing', 'chest', 'throat'],
        response: "Respiratory symptoms can indicate various conditions. I recommend:\n\n• Stay hydrated with warm fluids\n• Use a humidifier to moisten the air\n• Avoid irritants like smoke or strong odors\n• Rest your voice if you have throat irritation\n• Practice deep breathing exercises\n\nSeek immediate medical attention if you experience:\n• Difficulty breathing or shortness of breath\n• Chest pain\n• High fever with respiratory symptoms"
      }
    };

    // Check for specific symptoms
    for (const [symptomType, data] of Object.entries(symptomResponses)) {
      if (data.keywords.some(keyword => lowerMessage.includes(keyword))) {
        return data.response;
      }
    }

    // General response
    return "Thank you for sharing your health concerns with me. While I can provide general health information, it's important to remember that I'm an AI assistant and cannot replace professional medical advice.\n\nFor your specific situation, I recommend:\n• Documenting your symptoms and their timeline\n• Consulting with a healthcare professional\n• Following up on any concerning or persistent symptoms\n\nIs there anything specific about your symptoms you'd like to discuss further?";
  }

  // Process chat message and generate response
  static async processMessage(userId, userMessage) {
    // Save user message
    const userMessageRecord = await this.saveMessage(userId, 'user', userMessage);
    
    // Generate AI response using advanced analysis
    const aiResponse = await this.generateAIResponse(userMessage);
    
    // Save AI response
    const aiMessageRecord = await this.saveMessage(userId, 'ai', aiResponse);
    
    return {
      userMessage: userMessageRecord,
      aiMessage: aiMessageRecord
    };
  }

  // Analyze food image and provide dietary recommendations
  static async analyzeFoodImage(userId, imageFile, description) {
    // For now, we'll simulate AI food analysis
    // In a real implementation, this would integrate with an AI vision service
    
    const userMessage = description ? 
      `📷 Food Image Analysis Request: ${description}` : 
      '📷 Food Image Analysis Request';
    
    // Save user message with image reference
    const userMessageRecord = await this.saveMessage(userId, 'user', userMessage);
    
    // Simulate AI food analysis based on common food types
    const aiResponse = this.generateFoodAnalysisResponse(description);
    
    // Save AI response
    const aiMessageRecord = await this.saveMessage(userId, 'ai', aiResponse);
    
    return {
      userMessage: userMessageRecord,
      aiMessage: aiMessageRecord
    };
  }

  // Generate food analysis response
  static generateFoodAnalysisResponse(description) {
    const lowerDesc = (description || '').toLowerCase();
    
    // Food analysis responses based on common food types
    const foodAnalysisResponses = {
      // Healthy foods
      healthy: {
        keywords: ['salad', 'vegetables', 'fruits', 'lean', 'grilled', 'steamed', 'whole grain'],
        response: "🍎 **Great Choice!** This appears to be a healthy meal option.\n\n**Nutritional Benefits:**\n• Rich in vitamins and minerals\n• Good source of fiber\n• Low in processed ingredients\n• Supports overall health\n\n**Recommendations:**\n• Continue incorporating these foods into your diet\n• Aim for variety in colors and types\n• Consider portion sizes appropriate for your needs\n\nThis is an excellent choice for maintaining good health!"
      },
      
      // Processed foods
      processed: {
        keywords: ['fried', 'fast food', 'processed', 'packaged', 'canned'],
        response: "⚠️ **Moderate Consumption Recommended**\n\n**Considerations:**\n• This appears to be a processed food item\n• May contain higher levels of sodium, preservatives, or unhealthy fats\n• Limited nutritional value compared to whole foods\n\n**Suggestions:**\n• Enjoy occasionally rather than regularly\n• Balance with fresh fruits and vegetables\n• Check nutrition labels for sodium and fat content\n• Consider healthier alternatives when possible\n\nRemember: moderation is key for processed foods!"
      },
      
      // High sugar foods
      sugary: {
        keywords: ['sweet', 'dessert', 'cake', 'candy', 'sugar', 'chocolate'],
        response: "🍰 **Sweet Treat Alert!**\n\n**Nutritional Notes:**\n• High in sugar content\n• May cause blood sugar spikes\n• Limited nutritional benefits\n\n**Healthier Alternatives:**\n• Fresh fruits for natural sweetness\n• Dark chocolate (70%+ cocoa) in small amounts\n• Homemade treats with reduced sugar\n• Greek yogurt with berries\n\n**Recommendation:** Enjoy in moderation and consider timing - avoid consuming close to bedtime."
      },
      
      // Protein-rich foods
      protein: {
        keywords: ['meat', 'chicken', 'fish', 'eggs', 'beans', 'protein'],
        response: "🥩 **Protein-Rich Meal!**\n\n**Benefits:**\n• Essential for muscle health and repair\n• Helps maintain satiety\n• Supports immune function\n• Important for overall body function\n\n**Considerations:**\n• Choose lean protein sources when possible\n• Balance with vegetables and whole grains\n• Consider cooking methods (grilled vs fried)\n• Watch portion sizes\n\n**Great choice for supporting your body's protein needs!**"
      }
    };

    // Check for specific food types
    for (const [foodType, data] of Object.entries(foodAnalysisResponses)) {
      if (data.keywords.some(keyword => lowerDesc.includes(keyword))) {
        return data.response;
      }
    }

    // General food analysis response
    return `🍽️ **Food Analysis Complete!**\n\nI've analyzed your food image. Here are some general dietary recommendations:\n\n**General Guidelines:**\n• Aim for balanced meals with protein, vegetables, and whole grains\n• Stay hydrated throughout the day\n• Practice portion control\n• Include a variety of colors in your meals\n\n**Remember:**\n• Individual dietary needs vary based on health conditions\n• Consult with a healthcare provider for personalized nutrition advice\n• Consider any food allergies or intolerances\n\nWould you like specific recommendations based on your health goals or conditions?`;
  }
}

module.exports = ChatService;
