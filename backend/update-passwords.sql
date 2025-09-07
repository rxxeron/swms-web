-- Update admin password to 'swmsewu2025'
UPDATE users SET password_hash = '$2a$12$I4ER4.qAVBPX2i.MN9ysjOKcvrWSqTEXaxuTLTo0RTPtArXYgMLHa' WHERE username = 'admin_swms';

-- Update all other users to 'password123'  
UPDATE users SET password_hash = '$2a$12$u6vOEZcHNXnyOPatUQzmaOPKwFBcz3BEbEKhOAWSL4x7kptWnZjpu' WHERE role IN ('student', 'faculty', 'consultant');
