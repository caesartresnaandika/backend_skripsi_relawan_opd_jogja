import { Router } from 'express';
import { getAllRelawan, getRelawanById, updateRelawan, deleteRelawan } from '../controllers/relawanController';
import verifyToken from '../middleware/authMiddleware';

const router = Router();

// Semua endpoint butuh Token (Login dulu)
router.get('/', verifyToken, getAllRelawan);       // GET Semua
router.get('/:id', verifyToken, getRelawanById);   // GET Detail
router.put('/:id', verifyToken, updateRelawan);    // UPDATE
router.delete('/:id', verifyToken, deleteRelawan); // DELETE

export default router;