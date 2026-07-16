# Medical AI Enhanced - Advanced Healthcare Chatbot

A modern, full-stack medical AI assistant application built with React TypeScript frontend and Node.js Express backend, featuring intelligent health consultations and comprehensive patient management.

## 🚀 Features

### For Patients
- **AI-Powered Health Consultations**: Get intelligent responses to health questions and symptom descriptions
- **Real-time Chat Interface**: Modern, responsive chat interface with typing indicators
- **Symptom Analysis**: Advanced keyword detection for common health conditions
- **Chat History**: Persistent conversation history with timestamps
- **Secure Authentication**: JWT-based authentication with role-based access

### For Doctors
- **Patient Management**: Complete CRUD operations for patient records
- **Medical Records**: Store comprehensive patient information including:
  - Personal details (name, age, gender, contact)
  - Medical diagnosis and symptoms
  - Allergies and current medications
  - Treatment history
- **Diet Recommendations**: Access to comprehensive dietary guidelines for various conditions
- **Search & Filter**: Advanced search capabilities across patient records
- **Responsive Dashboard**: Modern, intuitive interface for efficient workflow

## 🛠️ Technology Stack

### Backend
- **Node.js** with Express.js framework
- **TypeScript** for type safety
- **PostgreSQL** database with connection pooling
- **JWT** authentication with bcrypt password hashing
- **Express Rate Limiting** for API protection
- **Helmet** for security headers
- **Morgan** for request logging
- **Express Validator** for input validation
- **UUID** for unique identifiers

### Frontend
- **React 18** with TypeScript
- **React Router** for navigation
- **Axios** for API communication
- **Lucide React** for modern icons
- **Responsive Design** with modern CSS-in-JS

### Security Features
- **JWT Token Authentication** with expiration
- **Password Hashing** with bcrypt (12 rounds)
- **Rate Limiting** (100 requests per 15 minutes)
- **CORS Protection** with configurable origins
- **Input Validation** and sanitization
- **SQL Injection Protection** with parameterized queries
- **XSS Protection** with Helmet middleware

## 📁 Project Structure

```
medical-ai-enhanced/
├── backend/
│   ├── config/
│   │   └── database.js          # Database configuration
│   ├── controllers/
│   │   ├── AuthController.js    # Authentication logic
│   │   └── ChatController.js    # Chat functionality
│   ├── middleware/
│   │   ├── auth.js              # JWT authentication
│   │   ├── errorHandler.js      # Error handling
│   │   └── notFound.js          # 404 handler
│   ├── routes/
│   │   ├── auth.js              # Auth endpoints
│   │   ├── chat.js              # Chat endpoints
│   │   ├── patients.js          # Patient management
│   │   └── health.js            # Health check
│   ├── services/
│   │   ├── AuthService.js       # Auth business logic
│   │   └── ChatService.js       # Chat business logic
│   ├── database/
│   │   └── schema.sql           # Database schema
│   ├── server.js                # Main server file
│   ├── package.json             # Backend dependencies
│   └── env.example              # Environment variables template
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── HomePage.tsx      # Landing page
    │   │   ├── AuthModal.tsx     # Authentication modal
    │   │   ├── PatientDashboard.tsx # Patient interface
    │   │   ├── DoctorDashboard.tsx # Doctor interface
    │   │   ├── ProtectedRoute.tsx # Route protection
    │   │   └── LoadingSpinner.tsx # Loading component
    │   ├── contexts/
    │   │   └── AuthContext.tsx   # Authentication context
    │   ├── services/
    │   │   └── api.ts           # API service layer
    │   ├── types/
    │   │   └── index.ts         # TypeScript interfaces
    │   ├── App.tsx              # Main app component
    │   └── index.tsx            # App entry point
    └── package.json             # Frontend dependencies
```

## 🚀 Quick Start

### Prerequisites
- **Node.js** (v16 or higher) - [Download here](https://nodejs.org/)
- **PostgreSQL** (v12 or higher) - [Download here](https://www.postgresql.org/download/)
- **Python** (v3.8 or higher) - [Download here](https://www.python.org/downloads/)
- **Git** - [Download here](https://git-scm.com/)

### 🎯 Automated Setup (Recommended)

We provide automated setup scripts to make installation easy:

#### For macOS/Linux:
```bash
# Make the script executable and run it
chmod +x setup-database.sh
./setup-database.sh
```

#### For Windows:
```batch
# Run the batch file
setup-database.bat
```

The setup script will:
- ✅ Check if PostgreSQL is installed
- ✅ Create the database automatically
- ✅ Set up all database tables
- ✅ Create your `.env` file with proper configuration
- ✅ Test the database connection

### Manual Setup (Alternative)

If you prefer manual setup or the automated script doesn't work:

#### 1. Database Setup
```bash
# Create database
createdb medical_ai_enhanced

# Run schema files
psql medical_ai_enhanced < backend/database/schema.sql
psql medical_ai_enhanced < backend/database/ai_agents_schema.sql
psql medical_ai_enhanced < backend/database/doctor_ai_schema.sql
```

#### 2. Backend Setup
```bash
cd backend

# Install dependencies
npm install

# Set up environment variables
cp env.example .env
# Edit .env with your database credentials

# Install Python dependencies
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install pandas numpy scikit-learn matplotlib seaborn joblib

# Start the backend server
npm start
```
Server will run on `http://localhost:5001`

#### 3. Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Start the development server
npm start
```
Frontend will run on `http://localhost:3000`

### 📖 Detailed Setup Guide

For a comprehensive setup guide with troubleshooting, see [SETUP.md](SETUP.md).

## 🔧 Configuration

### Environment Variables

**Backend (.env):**
```env
PORT=5001
NODE_ENV=development
DB_HOST=localhost
DB_PORT=5432
DB_NAME=medical_ai_enhanced
DB_USER=postgres
DB_PASSWORD=your_password
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:3000
```

**Frontend (.env):**
```env
REACT_APP_API_URL=http://localhost:5001/api
```

## 🎯 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile

### Chat
- `GET /api/chat/history` - Get chat history
- `POST /api/chat/message` - Send message
- `DELETE /api/chat/history` - Clear chat history

### Patient Management (Doctor only)
- `GET /api/patients` - Get all patients
- `GET /api/patients/:id` - Get specific patient
- `POST /api/patients` - Add new patient
- `PUT /api/patients/:id` - Update patient
- `DELETE /api/patients/:id` - Delete patient

### Health Check
- `GET /api/health` - System health status
- `GET /api/status` - API status

## 🧠 AI Features

### Enhanced Symptom Detection
The AI system includes sophisticated keyword matching for:
- **Pain-related symptoms** (headache, pain, ache, sore)
- **Fever symptoms** (fever, temperature, hot, chills)
- **Respiratory symptoms** (cough, breathing, chest, throat)
- **Digestive symptoms** (stomach, nausea, diarrhea)
- **General health concerns**

### Intelligent Responses
- Context-aware responses based on symptom keywords
- Professional medical advice with appropriate disclaimers
- Structured recommendations with actionable steps
- Safety warnings for serious conditions

## 🔒 Security

- **Authentication**: JWT tokens with configurable expiration
- **Authorization**: Role-based access control (patient/doctor)
- **Input Validation**: Comprehensive validation for all inputs
- **Rate Limiting**: Protection against abuse
- **SQL Injection**: Parameterized queries prevent SQL injection
- **XSS Protection**: Helmet middleware provides security headers
- **CORS**: Configurable cross-origin resource sharing

## 📊 Database Schema

### Users Table
- `id` (UUID, Primary Key)
- `email` (VARCHAR, Unique)
- `password` (VARCHAR, Hashed)
- `user_type` (ENUM: 'patient', 'doctor')
- `name` (VARCHAR)
- `is_active` (BOOLEAN)
- `created_at`, `updated_at` (TIMESTAMP)

### Patients Table
- `id` (UUID, Primary Key)
- `doctor_id` (UUID, Foreign Key)
- `name`, `age`, `gender` (Patient Info)
- `phone`, `address` (Contact Info)
- `diagnosis`, `symptoms` (Medical Info)
- `allergies`, `current_medications` (Medical History)
- `created_at`, `updated_at` (TIMESTAMP)

### Chat Messages Table
- `id` (UUID, Primary Key)
- `user_id` (UUID, Foreign Key)
- `sender` (ENUM: 'user', 'ai')
- `message` (TEXT)
- `created_at` (TIMESTAMP)

### Diet Recommendations Table
- `id` (UUID, Primary Key)
- `diagnosis` (VARCHAR)
- `recommended_foods` (TEXT[])
- `avoid_foods` (TEXT[])
- `additional_notes` (TEXT)
- `created_at`, `updated_at` (TIMESTAMP)

## 🎨 UI/UX Features

### Modern Design
- **Responsive Layout**: Works on desktop, tablet, and mobile
- **Modern Color Scheme**: Professional medical theme
- **Smooth Animations**: Hover effects and transitions
- **Intuitive Navigation**: Clear user flows and navigation

### User Experience
- **Real-time Feedback**: Typing indicators and loading states
- **Error Handling**: User-friendly error messages
- **Form Validation**: Real-time input validation
- **Accessibility**: Keyboard navigation and screen reader support

## 🚀 Deployment

### Production Considerations
1. **Environment Variables**: Set production values
2. **Database**: Use production PostgreSQL instance
3. **Security**: Generate strong JWT secrets
4. **HTTPS**: Enable SSL/TLS certificates
5. **Monitoring**: Add logging and monitoring
6. **Scaling**: Consider load balancing for high traffic

### Docker Support (Optional)
```dockerfile
# Backend Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5001
CMD ["npm", "start"]
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Review the API endpoints

## 🔮 Future Enhancements

- **Real AI Integration**: Connect to OpenAI GPT or similar
- **Medical Image Analysis**: Upload and analyze medical images
- **Appointment Scheduling**: Integrated calendar system
- **Prescription Management**: Digital prescription system
- **Telemedicine**: Video consultation features
- **Mobile App**: React Native mobile application
- **Analytics Dashboard**: Usage statistics and insights
- **Multi-language Support**: Internationalization
- **Advanced Search**: Elasticsearch integration
- **Real-time Notifications**: WebSocket support

---

**Built with ❤️ for better healthcare accessibility**
