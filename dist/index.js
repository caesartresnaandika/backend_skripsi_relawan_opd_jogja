"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
// Import Routes
const authRoutes_1 = __importDefault(require("./src/routes/authRoutes"));
const relawanRoutes_1 = __importDefault(require("./src/routes/relawanRoutes"));
const bpjsRoutes_1 = __importDefault(require("./src/routes/bpjsRoutes"));
const opdRoutes_1 = __importDefault(require("./src/routes/opdRoutes"));
const relawanAdminRoutes_1 = __importDefault(require("./src/routes/relawanAdminRoutes"));
const skRoutes_1 = __importDefault(require("./src/routes/skRoutes"));
const dashboardRoutes_1 = __importDefault(require("./src/routes/dashboardRoutes"));
const logRoutes_1 = __importDefault(require("./src/routes/logRoutes"));
const opdAdminRoutes_1 = __importDefault(require("./src/routes/opdAdminRoutes"));
const debugRoutes_1 = __importDefault(require("./src/routes/debugRoutes"));
const saranRoutes_1 = __importDefault(require("./src/routes/saranRoutes"));
const kaderRoutes_1 = __importDefault(require("./src/routes/kaderRoutes"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// === DAFTAR ROUTES (API MAP) ===
app.use('/api/auth', authRoutes_1.default); // http://localhost:3000/api/auth
app.use('/api/relawan', relawanRoutes_1.default); // http://localhost:3000/api/relawan
app.use('/api/bpjs', bpjsRoutes_1.default); // http://localhost:3000/api/bpjs
app.use('/api/opd', opdRoutes_1.default); // http://localhost:3000/api/opd
app.use('/api/admin/relawan', relawanAdminRoutes_1.default); // http://localhost:3000/api/admin/relawan
app.use('/api/admin/sk', skRoutes_1.default); // http://localhost:3000/api/admin/sk
app.use('/api/admin/dashboard', dashboardRoutes_1.default); // http://localhost:3000/api/admin/dashboard
app.use('/api/admin/logs', logRoutes_1.default); // http://localhost:3000/api/admin/logs
app.use('/api/opd-admin', opdAdminRoutes_1.default); // http://localhost:3000/api/opd-admin
app.use('/api/saran', saranRoutes_1.default); // http://localhost:3000/api/saran
app.use('/api/kader', kaderRoutes_1.default); // http://localhost:3000/api/kader
app.use('/api/debug', debugRoutes_1.default); // http://localhost:3000/api/debug
// Test Root
app.get('/', (req, res) => {
    res.send('Server Backend Skripsi (TypeScript) Berjalan! 🚀');
});
// Jalankan Server
app.listen(PORT, () => {
    console.log(`Server berjalan di http://localhost:${PORT}`);
});
// Handle unhandled rejections
process.on('unhandledRejection', (reason) => {
    console.error('Unhandled Rejection:', reason);
});
