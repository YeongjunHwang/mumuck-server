import express, { Request, Response, NextFunction } from 'express';
import qs from 'qs';
import { handleGoogleCallback } from '../../controllers/userController';
import jwt from 'jsonwebtoken';

const router = express.Router();

// ✅ Google 로그인 시작 라우트
router.get('/auth/google', (req: Request, res: Response) => {
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
router.get('/auth/google/callback', async (req: Request, res: Response) => {
  const code = req.query.code as string;
  if (!code) return res.status(400).send('Missing code');

  try {
    const token = await handleGoogleCallback(code);

    const isProd = process.env.NODE_ENV === 'production';
    const clientRedirectUri = isProd
      ? 'https://www.mumuck.com/oauth/callback'
      : 'http://localhost:3000/oauth/callback';

      res.send(`토큰: ${token}`);
  } catch (err: any) {
    console.error('OAuth Error:', err.response?.data || err.message);
    res.status(500).send('OAuth 처리 중 오류 발생');
  }
});

// ✅ JWT 검증 미들웨어
const verifyToken = (req: Request & { user?: any }, res: Response, next: NextFunction) => {
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
router.get('/me', verifyToken, (req: Request & { user?: any }, res: Response) => {
  res.json(req.user);
});

export default router;
