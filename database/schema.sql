CREATE DATABASE aphians_db;
USE aphians_db;

CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  google_id VARCHAR(255),
  facebook_id VARCHAR(255),
  apple_id VARCHAR(255),
  yahoo_id VARCHAR(255),
  email VARCHAR(255) UNIQUE,
  name VARCHAR(255)
);

CREATE TABLE profiles (
  user_id INT PRIMARY KEY,
  full_name VARCHAR(255),
  street_address TEXT,
  city VARCHAR(100),
  state VARCHAR(100),
  zip VARCHAR(20),
  country VARCHAR(100),
  phone_number VARCHAR(20),
  email_id VARCHAR(255),
  birthday DATE,
  current_occupation VARCHAR(255),
  company_name VARCHAR(255),
  job_role VARCHAR(255),
  social_media_1 TEXT,
  social_media_2 TEXT,
  social_media_3 TEXT,
  spouse_name VARCHAR(255),
  child_1_name VARCHAR(255),
  child_2_name VARCHAR(255),
  child_3_name VARCHAR(255),
  child_1_age INT,
  child_2_age INT,
  child_3_age INT,
  special_message TEXT,
  latest_photo TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id)
);