-- CREATE DATABASE HCL CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE HCL;  
SHOW TABLES;
SELECT * FROM auth_user; -- all email and password data is stroing here
DESCRIBE auth_user;

SELECT * FROM auth_user;
SELECT * FROM api_userextra;
SELECT * FROM api_process;
SELECT * FROM api_subprocess;
SELECT * FROM api_document;
SELECT * FROM api_image;
SELECT * FROM api_objective;
SELECT * FROM api_video;


CREATE TABLE User (
    UserID INT PRIMARY KEY AUTO_INCREMENT,
    Username VARCHAR(100) NOT NULL UNIQUE,
    Password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
SELECT * from User; -- Created a new User table 
UPDATE api_userextra
SET phone = '8700745527', status = 'active'
WHERE user_id = 1;
UPDATE api_userextra
SET  role = 'admin'
WHERE user_id = 1;
SET SQL_SAFE_UPDATES = 0;

UPDATE api_userextra
SET assigned_processes = '[]',
    assigned_subprocesses = '[]',
    assigned_objectives = '[]';



