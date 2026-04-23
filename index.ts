//index.ts
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
import statistikRoutes from './src/routes/statistikRoutes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Jika frontend lupa menaruh '/api' di URL (misal: /auth/login), 
// middleware ini akan otomatis mengarahkannya ke /api/auth/login
app.use((req, res, next) => {
    if (!req.url.startsWith('/api') && req.url !== '/') {
        req.url = '/api' + req.url;
    }
    next();
});

// === DAFTAR ROUTES (API MAP) ===
app.use('/api/auth', authRoutes);
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
app.use('/api/statistik', statistikRoutes);

// Test Root
app.get('/', (req: Request, res: Response) => {
    res.send('Server Backend Skripsi (TypeScript) Berjalan! 🚀');
});

// Jalankan Server (Hanya untuk lokal)
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`Server berjalan di http://localhost:${PORT}`);
    });
}

// Export app untuk Vercel Serverless
export default app;

// Handle unhandled rejections
process.on('unhandledRejection', (reason) => {
    console.error('Unhandled Rejection:', reason);
});