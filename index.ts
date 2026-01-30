import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Import Routes
import authRoutes from './src/routes/authRoutes';
import relawanRoutes from './src/routes/relawanRoutes';
import bpjsRoutes from './src/routes/bpjsRoutes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// === DAFTAR ROUTES (API MAP) ===
app.use('/api/auth', authRoutes);       // http://localhost:3000/api/auth
app.use('/api/relawan', relawanRoutes); // http://localhost:3000/api/relawan
app.use('/api/bpjs', bpjsRoutes);       // http://localhost:3000/api/bpjs

// Test Root
app.get('/', (req: Request, res: Response) => {
    res.send('Server Backend Skripsi (TypeScript) Berjalan! 🚀');
});

// Jalankan Server
app.listen(PORT, () => {
    console.log(`Server berjalan di http://localhost:${PORT}`);
});