// backend/src/index.ts

import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Import Routes
import authRoutes from './src/routes/authRoutes';
import relawanRoutes from './src/routes/relawanRoutes';
import opdRoutes from './src/routes/opdRoutes';
import relawanAdminRoutes from './src/routes/relawanAdminRoutes';
import skRoutes from './src/routes/skRoutes';
import dashboardRoutes from './src/routes/dashboardRoutes';
import logRoutes from './src/routes/logRoutes';
import opdAdminRoutes from './src/routes/opdAdminRoutes';
import debugRoutes from './src/routes/debugRoutes';
import saranRoutes from './src/routes/saranRoutes';
import kaderRoutes from './src/routes/kaderRoutes';
import profileRoutes from './src/routes/profileRoutes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// ==========================================
// ✅ HEALTH CHECK (Railway butuh ini!)
// ==========================================
app.get('/health', (req: Request, res: Response) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        message: 'Backend is running!'
    });
});

app.get('/api/health', (req: Request, res: Response) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        message: 'Backend API is running!'
    });
});

// ==========================================
// ✅ ROUTE MOUNTING
// ==========================================

// 1. AUTH ROUTES - TANPA MIDDLEWARE (PUBLIK)
app.use('/api/auth', authRoutes);

// 2. ROUTE LAIN - DENGAN MIDDLEWARE
app.use('/api/relawan', relawanRoutes);
app.use('/api/opd', opdRoutes);
app.use('/api/admin/relawan', relawanAdminRoutes);
app.use('/api/admin/sk', skRoutes);
app.use('/api/admin/dashboard', dashboardRoutes);
app.use('/api/admin/logs', logRoutes);
app.use('/api/opd-admin', opdAdminRoutes);
app.use('/api/saran', saranRoutes);
app.use('/api/kader', kaderRoutes);
app.use('/api/debug', debugRoutes);
app.use('/api/profile', profileRoutes);

// Test Root
app.get('/', (req: Request, res: Response) => {
    res.json({ 
        message: 'Server Backend Skripsi (TypeScript) Berjalan! 🚀',
        timestamp: new Date().toISOString()
    });
});

// Jalankan Server
app.listen(PORT, () => {
    console.log(`✅ Server berjalan di http://localhost:${PORT}`);
    console.log(`✅ Health check: http://localhost:${PORT}/health`);
});

// Handle unhandled rejections
process.on('unhandledRejection', (reason) => {
    console.error('❌ Unhandled Rejection:', reason);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
    console.log('⚠️ SIGTERM received. Shutting down gracefully...');
    process.exit(0);
});