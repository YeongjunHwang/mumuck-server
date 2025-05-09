// ✅ api/routes/auth.ts
import express from 'express';
import qs from 'qs';
import { handleGoogleCallback } from '../../controllers/userController';
import jwt from 'jsonwebtoken';

const router = express.Router();

// ✅ Google 로그인 시작 라우트
router.get('/auth/google', (req, res) => {
  const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
  const isProd = process.env.NODE_ENV === 'production';

  const REDIRECT_URI = isProd
    ? 'https://www.mumuck.com/oauth/callback'
    : 'http://localhost:3000/oauth/callback';

  if (!GOOGLE_CLIENT_ID) {
    console.error('❌ GOOGLE_CLIENT_ID is missing');
    return res.status(500).send('Google Client ID가 설정되지 않았습니다.');
  }

  const url =
    'https://accounts.google.com/o/oauth2/v2/auth?' +
    qs.stringify({
      response_type: 'code',
      client_id: GOOGLE_CLIENT_ID,
      redirect_uri: REDIRECT_URI,
      scope: 'openid email profile',
      access_type: 'online',
    });

  console.log('✅ Redirecting to:', url);
  res.redirect(url);
});

// ✅ Google 로그인 콜백 라우트
router.get('/auth/google/callback', handleGoogleCallback);

// ✅ JWT 검증 미들웨어
const verifyToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).send('No token provided');

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).send('Invalid token');
  }
};

// ✅ 유저 정보 반환 라우트
router.get('/me', verifyToken, (req: any, res) => {
  res.json(req.user);
});

export default router;