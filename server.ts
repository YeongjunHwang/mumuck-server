import express from 'express';
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config(); // .env 파일에서 환경변수 로딩

const app = express();
const port = process.env.PORT || 3000;

// PostgreSQL 연결 풀 생성
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('render.com') ? { rejectUnauthorized: false } : false,
});

// API: 유저 목록 확인
app.get('/api/users', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT id, nickname FROM users LIMIT 10');
    res.json(rows);
  } catch (err) {
    console.error('❌ DB 연결 실패:', err);
    res.status(500).json({ error: 'Database query failed' });
  }
});

app.listen(port, () => {
  console.log(`🚀 Server running at http://localhost:${port}`);
});
