CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  provider VARCHAR(20) NOT NULL,                   -- 'google' 또는 'kakao'
  provider_id VARCHAR(255) UNIQUE NOT NULL,        -- Google sub 또는 Kakao id
  nickname VARCHAR(100) NOT NULL,                  -- 사용자 표시 이름
  email TEXT,                                        -- 이메일 추가
  role VARCHAR(20) DEFAULT 'user' NOT NULL,        -- 권한: 'user', 'admin' 등
  last_login TIMESTAMP WITH TIME ZONE,             -- 마지막 로그인 시각
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);