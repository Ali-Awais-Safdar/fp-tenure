import { Router } from 'express';
import { getTenureReport } from '../controllers/reportController';

const router = Router();

router.get('/reports/tenure', getTenureReport); // ?scope=org|dept&departments=Eng,Sales&idStart=EMP0010&idEnd=EMP0020&asOf=2025-09-15

export default router;
