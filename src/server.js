import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import bodyParser from 'body-parser';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { setupDatabase } from './setup-db.js';
import webhookRoutes from './routes/webhooks.js';
import apiRoutes from './routes/api.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again later'
});
app.use('/api/', limiter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/webhooks', webhookRoutes);
app.use('/api', apiRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'AI-Powered CI/CD Security Scanner',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      webhooks: '/api/webhooks/:tool',
      reports: '/api/reports/:projectId/:commit',
      dashboard: '/dashboard'
    }
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
async function startServer() {
  try {
    // Setup database
    console.log('🚀 Starting server...');
    await setupDatabase();
    console.log('✅ Database connected');

    // Start server
    app.listen(PORT, () => {
      console.log(`\n🦊 AI-Powered CI/CD Security Scanner`);
      console.log(`📊 Server running on port ${PORT}`);
      console.log(`🔗 Health check: http://localhost:${PORT}/health`);
      console.log(`🌐 API documentation: http://localhost:${PORT}/`);
      console.log(`\n📋 Features:`);
      console.log(`   - Webhook integration for scanners`);
      console.log(`   - AI-powered security analysis`);
      console.log(`   - Unified dashboard and reports`);
      console.log(`   - PDF report generation\n`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
