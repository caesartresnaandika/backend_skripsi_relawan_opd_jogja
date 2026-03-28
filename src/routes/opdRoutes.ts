//opdRoutes.ts
import { Router } from 'express';
import { getAllOpd, getOpdById, createOpd, createBulkOpd, updateOpd, toggleOpdStatus } from '../controllers/opdController';
import verifyToken, { authorizeRole } from '../middleware/authMiddleware';

const router = Router();

// Karena ini fitur Super Admin, idealnya semua route ini dilindungi token
// Kita pasang verifyToken DAN authorizeRole 'super_admin' di semua endpoint ini

// URL: GET http://localhost:3000/api/opd
router.get('/', verifyToken, authorizeRole('super_admin'), getAllOpd);

// URL: GET http://localhost:3000/api/opd/:id
router.get('/:id', verifyToken, authorizeRole('super_admin'), getOpdById);

// URL: POST http://localhost:3000/api/opd/bulk
router.post('/bulk', verifyToken, authorizeRole('super_admin'), createBulkOpd);

// URL: POST http://localhost:3000/api/opd
router.post('/', verifyToken, authorizeRole('super_admin'), createOpd);

// URL: PUT http://localhost:3000/api/opd/:id
router.put('/:id', verifyToken, authorizeRole('super_admin'), updateOpd);

// URL: PATCH http://localhost:3000/api/opd/:id/status
router.patch('/:id/status', verifyToken, authorizeRole('super_admin'), toggleOpdStatus);

export default router;