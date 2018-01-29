DROP TABLE IF EXISTS users_table;
DROP TABLE IF EXISTS petition_data;
DROP TABLE IF EXISTS users_profile;


CREATE TABLE petition_data (
    id SERIAL PRIMARY KEY,
    canvas TEXT not null,
    user_id INTEGER not null
);
CREATE TABLE users_table (
    id SERIAL PRIMARY KEY,
    first VARCHAR(255) not null,
    last VARCHAR(255) not null,
    email VARCHAR(255) not null UNIQUE,
    hashedpassword VARCHAR(255) not null,
    account_created TIMESTAMP
);
CREATE table users_profile (
    id SERIAL PRIMARY KEY,
    age VARCHAR(255),
    city VARCHAR(255),
    website VARCHAR(255),
    user_id INTEGER not null UNIQUE
);
