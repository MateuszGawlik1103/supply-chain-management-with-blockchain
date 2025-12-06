CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS user_batches (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    batch_id VARCHAR(100) NOT NULL,
    display_name VARCHAR(255),
    coffee_type VARCHAR(100),
    UNIQUE(user_id, batch_id)
);
