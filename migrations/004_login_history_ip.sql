-- migrations/004_login_history_ip.sql
-- Add ip_address column to login_history table

ALTER TABLE login_history ADD COLUMN ip_address VARCHAR(45);
