CREATE DATABASE scouter_backend_db;

CREATE TABLE users (
    id SERIAL NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(254) NOT NULL,
    password_hash VARCHAR(100) NOT NULL
);

CREATE UNIQUE INDEX unique_email ON users (LOWER(email));

CREATE TABLE entries (
    user_id INT NOT NULL,
    team SMALLINT NOT NULL
    FOREIGN KEY (user_id) REFERENCES users (id)
);
