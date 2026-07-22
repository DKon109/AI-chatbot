const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
const { spawn } = require('child_process');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/auth');
const chatRoutes = require('./routes/chat');
const patientRoutes = require('./routes/patients');
const healthRoutes = require('./routes/health');
const aiRoutes = require('./routes/ai');
const doctorAiRoutes = require('./routes/doctor-ai');
const pharmacyRoutes = require('./routes/pharmacy');
const hospitalRoutes = require('./routes/hospital');
const dietRoutes = require('./routes/diet');

// Import middleware
const errorHandler = require('./middleware/errorHandler');
const notFound = require('./middleware/notFound');

const app = express();
const PORT = process.env.PORT || 5001;

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  // Render polls this endpoint frequently. Counting platform health checks can
  // incorrectly mark a healthy Free instance as failed with HTTP 429.
  skip: (req) => req.path === '/api/status'
});
app.use(limiter);

// CORS configuration. Same-origin production requests need no special entry;
// comma-separated URLs are supported for preview/custom domains.
const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:3000')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use((req, res, next) => {
  cors({
    origin(origin, callback) {
      // Vite marks production assets as crossorigin. Always allow requests
      // from this service's own host, including Render and custom domains.
      const isSameHost = origin && (() => {
        try {
          return new URL(origin).host === req.get('host');
        } catch {
          return false;
        }
      })();

      if (!origin || isSameHost || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error('Origin is not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })(req, res, next);
});

// Logging
app.use(morgan('combined'));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/health', healthRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/doctor', doctorAiRoutes);
app.use('/api/pharmacy', pharmacyRoutes);
app.use('/api/hospital', hospitalRoutes);
app.use('/api/diet', dietRoutes);

// Health check endpoint
app.get('/api/status', (req, res) => {
  res.json({
    status: 'success',
    message: 'Medical AI Backend is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// In production the Express service also serves the compiled React app. This
// keeps the portfolio deployment to one public service and one database.
if (process.env.NODE_ENV === 'production') {
  const frontendBuild = path.join(__dirname, 'public');
  app.use(express.static(frontendBuild));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/')) {
      return next();
    }
    return res.sendFile(path.join(frontendBuild, 'index.html'));
  });
}

// 404 handler
app.use(notFound);

// Error handling middleware
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Medical AI Backend running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/status`);
  console.log(`🔐 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);

  // Bind the public port before running idempotent database setup. This keeps
  // the landing page and health check available during free-tier cold starts.
  if (process.env.NODE_ENV === 'production' && process.env.RUN_DB_SETUP_ON_START !== 'false') {
    const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
    const setup = spawn(npmCommand, ['run', 'db:setup'], {
      env: process.env,
      stdio: 'inherit',
    });

    setup.on('error', (error) => {
      console.error('Database setup could not start:', error.message);
    });

    setup.on('exit', (code) => {
      if (code === 0) {
        console.log('✅ Background database setup completed');
      } else {
        console.error(`❌ Background database setup exited with code ${code}`);
      }
    });
  }
});

module.exports = app;
