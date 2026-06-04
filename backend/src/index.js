console.error("ERROR: This Express backend is deactivated. The backend has been migrated to Next.js API Routes in frontend/src/app/api/.");
process.exit(1);

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Import routes
import authRoutes from './routes/auth.js';
import movieRoutes from './routes/movies.js';
import libraryRoutes from './routes/library.js';
import searchRoutes from './routes/search.js';

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Security middleware
app.use(helmet());

// CORS configuration
const allowedOrigins = [
  "https://one-stop-zvu1.vercel.app",
  "http://localhost:3000"
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true
  })
);

// Request logging
app.use(morgan('dev'));

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    service: 'One Stop API'
  });
});

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/movies', movieRoutes);
app.use('/api/library', libraryRoutes);
app.use('/api/search', searchRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// MongoDB connection
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/onestop');
    console.log(`✓ MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('✗ MongoDB connection error:', error.message);
    // Don't exit in development - allows testing without DB
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  }
};

// Start server
const startServer = async () => {
  await connectDB();
  
  app.listen(PORT, () => {
    console.log(`
╔═══════════════════════════════════════════╗
║       🎬 One Stop API Server              ║
║       Running on port ${PORT}                  ║
║       Environment: ${process.env.NODE_ENV || 'development'}          ║
╚═══════════════════════════════════════════╝
    `);
  });
};

startServer();

export default app;
