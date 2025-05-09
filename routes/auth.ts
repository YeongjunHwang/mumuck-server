// ✅ api/routes/auth.ts
import express from 'express';
import qs from 'qs';
import { handleGoogleCallback } from '../controllers/userController';

const router = express.Router();

// ✅ Google 로그인 시작 라우트
router.get('/auth/google', (req, res) => {
  const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
  const REDIRECT_URI = 'https://mumuck-server.onrender.com/api/auth/google/callback';

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

export default router;