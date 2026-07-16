const BaseAgent = require('./BaseAgent');

class ConversationAgent extends BaseAgent {
    constructor() {
        super('ConversationAgent');
        this.conversationPatterns = this.initializeConversationPatterns();
    }

    initializeConversationPatterns() {
        return {
            greetings: {
                patterns: [
                    /^(hi|hello|hey|good morning|good afternoon|good evening)$/i,
                    /^(how are you|how's it going|how do you do)$/i,
                    /^(what's up|what's new|howdy)$/i
                ],
                responses: [
                    "Hello! I'm your AI health assistant. I can help you with symptom analysis, medical questions, and health guidance. What would you like to do today?",
                    "Hi there! I'm here to help with your health questions and concerns. I can analyze symptoms, provide medical guidance, and assist with health management. How can I help you?",
                    "Hello! I'm your personal health AI. I can help with symptom checking, medical analysis, and health recommendations. What health concerns do you have?",
                    "Hi! I'm your comprehensive health assistant. I can analyze symptoms, provide dietary advice, suggest exercises, and help with medication questions. What would you like to know?"
                ]
            },
            thanks: {
                patterns: [
                    /^(thank you|thanks|thx|appreciate it)$/i,
                    /^(that's helpful|very helpful|great help)$/i
                ],
                responses: [
                    "You're very welcome! I'm always here to help with your health questions. 😊",
                    "My pleasure! Feel free to ask me anything about your health anytime.",
                    "Happy to help! Remember, I'm here 24/7 for your health needs.",
                    "You're welcome! Don't hesitate to reach out if you have more questions."
                ]
            },
            casual: {
                patterns: [
                    /^(how's your day|how are you doing|are you okay)$/i,
                    /^(tell me about yourself|who are you|what are you)$/i,
                    /^(nice to meet you|pleasure to meet you)$/i
                ],
                responses: [
                    "I'm doing great, thank you for asking! I'm here and ready to help with your health needs. How are you feeling today?",
                    "I'm your AI health assistant specializing in symptom analysis, medical guidance, and health management. I'm excited to help you with your health journey!",
                    "I'm here to help with your health needs. What symptoms or medical concerns would you like to discuss?"
                ]
            },
            medical_intent: {
                patterns: [
                    /^(i have|i feel|i'm experiencing|symptoms|pain|ache|hurt|sick|ill|fever|cough|headache|nausea|dizzy|tired|fatigue)$/i,
                    /^(medication|medicine|pill|dose|prescription)$/i,
                    /^(exercise|workout|fitness|gym|running|walking)$/i,
                    /^(food|meal|diet|nutrition|eat|eating)$/i
                ],
                responses: [
                    "I understand you have health concerns. Let me analyze your symptoms and provide appropriate guidance.",
                    "I can help with that! Let me process your request and provide personalized recommendations.",
                    "I'm here to help with your health needs. Let me provide you with the best guidance possible."
                ]
            }
        };
    }

    async process(request) {
        const { userId, message, context = {} } = request;
        
        this.log('info', 'Processing conversation request', { userId, message: message.substring(0, 50) });

        try {
            const conversationType = this.detectConversationType(message);
            const response = this.generateNaturalResponse(message, conversationType, context);
            
            this.log('info', 'Conversation processed successfully', { 
                conversationType, 
                responseLength: response.length 
            });

            return {
                success: true,
                conversationType: conversationType,
                response: response,
                isNaturalConversation: true,
                agent: this.name,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            this.log('error', `Conversation processing failed`, error.message);
            return {
                success: false,
                error: error.message,
                agent: this.name,
                timestamp: new Date().toISOString()
            };
        }
    }

    detectConversationType(message) {
        const lowerMessage = message.toLowerCase().trim();
        
        for (const [type, data] of Object.entries(this.conversationPatterns)) {
            for (const pattern of data.patterns) {
                if (pattern.test(lowerMessage)) {
                    return type;
                }
            }
        }
        
        // Check if it contains medical keywords
        const medicalKeywords = ['pain', 'ache', 'hurt', 'sick', 'ill', 'fever', 'cough', 'headache', 'nausea', 'dizzy', 'tired', 'fatigue', 'symptom'];
        const hasMedicalKeywords = medicalKeywords.some(keyword => lowerMessage.includes(keyword));
        
        return hasMedicalKeywords ? 'medical_intent' : 'general';
    }

    generateNaturalResponse(message, conversationType, context) {
        const patterns = this.conversationPatterns[conversationType];
        
        if (patterns && patterns.responses) {
            // Add some randomness to responses
            const randomIndex = Math.floor(Math.random() * patterns.responses.length);
            return patterns.responses[randomIndex];
        }
        
        // Default responses for general conversation
        const defaultResponses = [
            "I'm here to help with your health and wellness needs! What would you like to know?",
            "That's interesting! I'm your health AI assistant. How can I help you today?",
            "I'm always happy to chat! Is there anything about your health I can help you with?",
            "Great to hear from you! I'm here to support your health journey. What's on your mind?"
        ];
        
        const randomIndex = Math.floor(Math.random() * defaultResponses.length);
        return defaultResponses[randomIndex];
    }

    // Add personality and context awareness
    addPersonality(response, context) {
        const personalityTraits = {
            empathetic: "I understand how important your health is to you.",
            encouraging: "Remember, taking care of your health is a great investment in yourself!",
            professional: "As your health AI, I'm here to provide accurate and helpful guidance.",
            friendly: "I'm always here to chat and help! 😊"
        };
        
        // Add personality based on context
        if (context.emotionalState === 'concerned') {
            return `${personalityTraits.empathetic} ${response}`;
        } else if (context.emotionalState === 'motivated') {
            return `${response} ${personalityTraits.encouraging}`;
        }
        
        return response;
    }
}

module.exports = ConversationAgent;
