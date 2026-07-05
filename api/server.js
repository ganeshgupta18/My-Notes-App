import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import { protect } from './middleware/auth.js';
import {
  registerUser,
  authUser,
  forgotPassword,
  resetPassword,
} from './controllers/authController.js';
import {
  getNotes,
  createNote,
  updateNote,
  deleteNote,
  clearTrash,
  getNotifications,
  markNotificationsRead,
} from './controllers/noteController.js';
import {
  updateProfile,
  deleteProfile,
} from './controllers/profileController.js';

// Load variables
dotenv.config();

const app = express();

// Increase JSON limit to support uploading Base64 profile images
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(cors());

// Ensure database is connected before handling any request (critical for serverless environments)
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    console.error('Database connection error in middleware:', error.message);
    res.status(500).json({ success: false, message: 'Database connection failed' });
  }
});

// Basic health check
app.get('/api/health', (req, res) => {
  return res.json({ status: 'healthy', message: 'NNotes backend is active' });
});

// --- Auth Endpoints ---
app.post('/api/auth/register', registerUser);
app.post('/api/auth/login', authUser);
app.post('/api/auth/forgotpassword', forgotPassword);
app.post('/api/auth/resetpassword/:resettoken', resetPassword);

// --- Notes Endpoints ---
app.get('/api/notes', protect, getNotes);
app.post('/api/notes', protect, createNote);
app.delete('/api/notes/trash/clear', protect, clearTrash); // Placed before :id wildcard
app.put('/api/notes/:id', protect, updateNote);
app.delete('/api/notes/:id', protect, deleteNote);

// --- Notifications Endpoints ---
app.get('/api/notifications', protect, getNotifications);
app.put('/api/notifications/read', protect, markNotificationsRead);

// --- Profile Endpoints ---
app.put('/api/profile', protect, updateProfile);
app.delete('/api/profile', protect, deleteProfile);

// Listen locally if we aren't executing in Vercel
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Express server running locally on http://localhost:${PORT}`);
  });
}

export default app;

