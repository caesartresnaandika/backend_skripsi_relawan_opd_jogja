import express from 'express';
import { getAllKemantren, getKelurahanByKemantren, getAllKelurahan } from '../controllers/wilayahController';

const router = express.Router();

// Endpoint untuk Dropdown wilayah
router.get('/kemantren', getAllKemantren);
router.get('/kelurahan', getAllKelurahan);
router.get('/kelurahan/:idKemantren', getKelurahanByKemantren);

export default router;
