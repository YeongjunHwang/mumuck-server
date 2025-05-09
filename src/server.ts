// ✅ server.ts (또는 app.ts)
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { Pool } from 'pg';
import jwt from 'jsonwebtoken';
import axios from 'axios';
import qs from 'qs';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// ✅ PostgreSQL 연결
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const {
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  REDIRECT_URI,
  JWT_SECRET,
} = process.env;

// ✅ Google OAuth 서버 기반 로그인 처리
app.get('/api/auth/google/callback', async (req, res) => {
  const code = req.query.code as string;
  if (!code) return res.status(400).send('Missing code');

  try {
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

    // 2. access_token으로 사용자 정보 요청
    const userInfoRes = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const { sub, name, email, picture } = userInfoRes.data;

    // 3. 사용자 DB 저장 or 조회
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
    const token = jwt.sign(
      {
        id: user.id,
        nickname: user.nickname,
        provider: user.provider,
        provider_id: user.provider_id,
      },
      JWT_SECRET!,
      { expiresIn: '7d' }
    );

    // 5. 프론트로 리디렉트
    res.redirect(`https://mumuck.com/oauth/callback?token=${token}`);
  } catch (err: any) {
    console.error('Google OAuth Error:', err.response?.data || err.message);
    res.status(500).send('OAuth 처리 중 오류 발생');
  }
});

// ✅ 기본 서버 시작
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`🚀 Server listening on port ${PORT}`);
});
