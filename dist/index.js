"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
//index.ts
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
// Import Routes
const authRoutes_1 = __importDefault(require("./src/routes/authRoutes"));
const relawanRoutes_1 = __importDefault(require("./src/routes/relawanRoutes"));
const opdRoutes_1 = __importDefault(require("./src/routes/opdRoutes"));
const relawanAdminRoutes_1 = __importDefault(require("./src/routes/relawanAdminRoutes"));
const skRoutes_1 = __importDefault(require("./src/routes/skRoutes"));
const dashboardRoutes_1 = __importDefault(require("./src/routes/dashboardRoutes"));
const logRoutes_1 = __importDefault(require("./src/routes/logRoutes"));
const opdAdminRoutes_1 = __importDefault(require("./src/routes/opdAdminRoutes"));
const debugRoutes_1 = __importDefault(require("./src/routes/debugRoutes"));
const saranRoutes_1 = __importDefault(require("./src/routes/saranRoutes"));
const kaderRoutes_1 = __importDefault(require("./src/routes/kaderRoutes"));
const profileRoutes_1 = __importDefault(require("./src/routes/profileRoutes"));
const statistikRoutes_1 = __importDefault(require("./src/routes/statistikRoutes"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// === DAFTAR ROUTES (API MAP) ===
app.use('/api/auth', authRoutes_1.default);
app.use('/api/relawan', relawanRoutes_1.default);
app.use('/api/opd', opdRoutes_1.default);
app.use('/api/admin/relawan', relawanAdminRoutes_1.default);
app.use('/api/admin/sk', skRoutes_1.default);
app.use('/api/admin/dashboard', dashboardRoutes_1.default);
app.use('/api/admin/logs', logRoutes_1.default);
app.use('/api/opd-admin', opdAdminRoutes_1.default);
app.use('/api/saran', saranRoutes_1.default);
app.use('/api/kader', kaderRoutes_1.default);
app.use('/api/debug', debugRoutes_1.default);
app.use('/api/profile', profileRoutes_1.default);
app.use('/api/statistik', statistikRoutes_1.default);
// Test Root
app.get('/', (req, res) => {
    res.send('Server Backend Skripsi (TypeScript) Berjalan! 🚀');
});
// Jalankan Server (Hanya untuk lokal)
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`Server berjalan di http://localhost:${PORT}`);
    });
}
// Export app untuk Vercel Serverless
exports.default = app;
// Handle unhandled rejections
process.on('unhandledRejection', (reason) => {
    console.error('Unhandled Rejection:', reason);
});
