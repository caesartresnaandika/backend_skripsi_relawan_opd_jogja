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

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// === DAFTAR ROUTES (API MAP) ===
app.use('/api/auth', authRoutes);       // http://localhost:3000/api/auth
app.use('/api/relawan', relawanRoutes); // http://localhost:3000/api/relawan      // http://localhost:3000/api/bpjs
app.use('/api/opd', opdRoutes);         // http://localhost:3000/api/opd
app.use('/api/admin/relawan', relawanAdminRoutes); // http://localhost:3000/api/admin/relawan
app.use('/api/admin/sk', skRoutes);     // http://localhost:3000/api/admin/sk
app.use('/api/admin/dashboard', dashboardRoutes); // http://localhost:3000/api/admin/dashboard
app.use('/api/admin/logs', logRoutes);  // http://localhost:3000/api/admin/logs
app.use('/api/opd-admin', opdAdminRoutes); // http://localhost:3000/api/opd-admin
app.use('/api/saran', saranRoutes);         // http://localhost:3000/api/saran
app.use('/api/kader', kaderRoutes); // http://localhost:3000/api/kader
app.use('/api/debug', debugRoutes); // http://localhost:3000/api/debug
app.use('/api/profile', profileRoutes); //untuk handler profile

// Test Root
app.get('/', (req: Request, res: Response) => {
    res.send('Server Backend Skripsi (TypeScript) Berjalan! 🚀');
});

// Jalankan Server
app.listen(PORT, () => {
    console.log(`Server berjalan di http://localhost:${PORT}`);
});

app.use('/api/auth', authRoutes);  // ✅ Tidak ada verifyToken di sini

// Handle unhandled rejections
process.on('unhandledRejection', (reason) => {
    console.error('Unhandled Rejection:', reason);
});
