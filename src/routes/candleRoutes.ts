import express from 'express';
import { getCandle } from '../controllers/candleController';
import { defaultGet, updateCandleDB, updatePositionDB } from '../controllers/dbController';

const router = express.Router();

router.route('/').get(defaultGet);
router.route('/candles').get(updateCandleDB).get(updatePositionDB).get(getCandle);

export const candleRoutes = router;