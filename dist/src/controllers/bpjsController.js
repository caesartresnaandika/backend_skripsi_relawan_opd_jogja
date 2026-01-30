"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMyTagihan = void 0;
const db_1 = __importDefault(require("../../config/db"));
// LIHAT TAGIHAN SAYA (Khusus Relawan Login)
const getMyTagihan = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        // Ambil ID dari Token JWT
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!userId) {
            res.status(403).json({ message: 'User ID tidak valid' });
            return;
        }
        const result = yield db_1.default.query(`SELECT t.*, u.nama_lengkap 
       FROM tagihan_bpjs t
       JOIN relawan r ON t.relawan_id = r.relawan_id
       JOIN users u ON r.user_id = u.user_id
       WHERE u.user_id = $1`, [userId]);
        res.json({
            user_id: userId,
            total_tagihan: result.rowCount,
            data: result.rows
        });
    }
    catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});
exports.getMyTagihan = getMyTagihan;
