"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const relawanController_1 = require("../controllers/relawanController");
const authMiddleware_1 = __importDefault(require("../middleware/authMiddleware"));
const router = (0, express_1.Router)();
// Semua endpoint butuh Token (Login dulu)
router.get('/', authMiddleware_1.default, relawanController_1.getAllRelawan); // GET Semua
router.get('/:id', authMiddleware_1.default, relawanController_1.getRelawanById); // GET Detail
router.put('/:id', authMiddleware_1.default, relawanController_1.updateRelawan); // UPDATE
router.delete('/:id', authMiddleware_1.default, relawanController_1.deleteRelawan); // DELETE
exports.default = router;
