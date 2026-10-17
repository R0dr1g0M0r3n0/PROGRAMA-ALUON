-- Credencial de trabajo exclusiva del entorno DEV2 para validación local.
-- La contraseña nunca se almacena en claro: solo se conserva el hash BCrypt.
DELETE FROM users WHERE username = 'cctvmoreno';

INSERT INTO users (id, tenant_id, username, password_hash, rol, nombre, apellidos, email, tipo_contrato)
VALUES (nextval(pg_get_serial_sequence('users', 'id')), '00000000-0000-0000-0000-000000000000', 'cctvmoreno',
        '$2a$10$AdIk41lbsWqabxWgu78CgOs7wg7bvda1LF5dVN7SJl7v/WuvP5Zsa',
        'DIOS', 'CCTV', 'Moreno', 'cctvmoreno@aluon.local', 'INDEFINIDO');

SELECT setval(pg_get_serial_sequence('users', 'id'), COALESCE(MAX(id), 1)) FROM users;
