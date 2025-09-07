-- Reset admin password to 'admin123'
UPDATE users SET password_hash = '$2a$12$N/HehJ6sDhP5atvjHtMVXelK0cWHvxT4YDC6pYwJkYX6vXV7Ht2my' WHERE username = 'admin_swms';
