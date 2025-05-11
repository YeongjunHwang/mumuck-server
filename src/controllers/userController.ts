// ✅ controllers/userController.ts
import axios from 'axios';
import qs from 'qs';
import { pool } from '../db';
import { signToken } from '../utils/jwt';

export const handleGoogleCallback = async (code: string): Promise<string> => {
  const {
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    REDIRECT_URI,
  } = process.env;

  // 1. code로 access_token 요청
  const tokenRes = await axios.post(
    'https://oauth2.googleapis.com/token',
    qs.stringify({
      code,
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      redirect_uri: REDIRECT_URI,
      grant_type: 'authorization_code',
    }),
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
  );

  const accessToken = tokenRes.data.access_token;

  // 2. 사용자 정보 요청
  const userInfoRes = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  const { sub, name } = userInfoRes.data;

  // 3. 사용자 저장 또는 조회
  const existing = await pool.query(
    'SELECT * FROM users WHERE provider = $1 AND provider_id = $2',
    ['google', sub]
  );

  let user;
  if (existing.rows.length === 0) {
    const insertRes = await pool.query(
      'INSERT INTO users (provider, provider_id, nickname, role, created_at, updated_at) VALUES ($1, $2, $3, $4, NOW(), NOW()) RETURNING *',
      ['google', sub, name, 'user']
    );
    user = insertRes.rows[0];
  } else {
    user = existing.rows[0];
  }

  // 4. JWT 발급
  const token = signToken({
    id: user.id,
    nickname: user.nickname,
    provider: user.provider,
    provider_id: user.provider_id,
    email: user.email,
  });

  return token;
};
