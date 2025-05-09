import express from 'express';
import { handleGoogleCallback } from '../controllers/userController';

const router = express.Router();

// Google 로그인 콜백 라우트
router.get('/google/callback', handleGoogleCallback);

export default router;
