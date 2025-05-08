import express from 'express';
import { Pool } from 'pg';
import dotenv from 'dotenv';
import { OAuth2Client } from 'google-auth-library';

dotenv.config(); // .env 로딩

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json()); // ✅ JSON 파싱 미들웨어 추가

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL?.includes('render.com') ? { rejectUnauthorized: false } : false,
});

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// ✅ 유저 목록 확인
app.get('/api/users', async (req: express.Request, res: express.Response) => {
    try {
        const { rows } = await pool.query('SELECT id, nickname FROM users LIMIT 10');
        res.json(rows);
    } catch (err) {
        console.error('❌ DB 연결 실패:', err);
        res.status(500).json({ error: 'Database query failed' });
    }
});

// ✅ 구글 로그인 처리 라우트
app.post('/api/auth/google', async (req: express.Request, res: express.Response) => {
    const { id_token } = req.body;

    try {
        const ticket = await googleClient.verifyIdToken({
            idToken: id_token,
            audience: process.env.GOOGLE_CLIENT_ID,
        });

        const payload = ticket.getPayload();
        const provider_id = payload?.sub;
        const nickname = payload?.name;

        if (!provider_id || !nickname) {
            return res.status(400).json({ error: 'Invalid Google token payload' });
        }

        const provider = 'google';

        // DB 조회
        const { rows } = await pool.query(
            'SELECT * FROM users WHERE provider = $1 AND provider_id = $2',
            [provider, provider_id]
        );

        let user;
        if (rows.length === 0) {
            const insert = await pool.query(
                'INSERT INTO users (provider, provider_id, nickname) VALUES ($1, $2, $3) RETURNING *',
                [provider, provider_id, nickname]
            );
            user = insert.rows[0];
        } else {
            user = rows[0];
        }

        res.json(user);
    } catch (err) {
        console.error('❌ 구글 로그인 실패:', err);
        res.status(500).json({ error: 'Google authentication failed' });
    }
});

app.listen(port, () => {
    console.log(`🚀 Server running at http://localhost:${port}`);
});
