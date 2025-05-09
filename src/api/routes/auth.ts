import express from 'express';
import qs from 'qs';

const router = express.Router();

router.get('/auth/google', (req, res) => {
  const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
  const REDIRECT_URI = 'https://mumuck-server.onrender.com/api/auth/google/callback';

  const url =
    'https://accounts.google.com/o/oauth2/v2/auth?' +
    qs.stringify({
      response_type: 'code',
      client_id: GOOGLE_CLIENT_ID,
      redirect_uri: REDIRECT_URI,
      scope: 'openid email profile',
      access_type: 'online',
    });

  res.redirect(url);
});

export default router;
