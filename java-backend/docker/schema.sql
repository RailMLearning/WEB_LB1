CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(40) NOT NULL UNIQUE,
    email VARCHAR(254) NOT NULL UNIQUE,
    password_hash VARCHAR(60) NOT NULL,
    role VARCHAR(10) NOT NULL CHECK (role IN ('ADMIN', 'USER'))
);

CREATE TABLE students (
    id BIGSERIAL PRIMARY KEY,
    version BIGINT NOT NULL DEFAULT 0,
    isu VARCHAR(7) NOT NULL UNIQUE,
    fio VARCHAR(150) NOT NULL,
    grid VARCHAR(6) NOT NULL,
    dnum BIGINT NOT NULL CHECK (dnum BETWEEN 1 AND 9007199254740991),
    rnum BIGINT NOT NULL CHECK (rnum BETWEEN 1 AND 9007199254740991),
    expdate DATE NOT NULL,
    foreigner BOOLEAN NOT NULL,
    notes VARCHAR(500) NOT NULL
);

CREATE TABLE refresh_sessions (
    id VARCHAR(36) PRIMARY KEY,
    token_hash VARCHAR(64) NOT NULL UNIQUE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX refresh_sessions_user_idx ON refresh_sessions(user_id);
CREATE INDEX refresh_sessions_expiry_idx ON refresh_sessions(expires_at);
CREATE INDEX students_group_idx ON students(grid);
