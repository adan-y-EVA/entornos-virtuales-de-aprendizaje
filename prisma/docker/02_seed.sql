-- Datos de prueba para desarrollo, generados desde prisma/seed.ts.
-- Postgres los carga una sola vez, al inicializarse el volumen por primera vez.
-- Para regenerarlos: con la base sembrada (pnpm db:seed) ejecutar
--   docker exec entornos-postgres pg_dump -U postgres -d entornos-db --data-only --schema=public --exclude-table=_prisma_migrations --column-inserts --no-owner --no-privileges

-- Data for Name: ambiente; Type: TABLE DATA; Schema: public; Owner: -

INSERT INTO public.ambiente (id, nombre, capacidad) VALUES (1, 'Laboratorio de Informatica 1', 30);
INSERT INTO public.ambiente (id, nombre, capacidad) VALUES (3, 'Aula 204', 40);
INSERT INTO public.ambiente (id, nombre, capacidad) VALUES (4, 'Auditorio', 80);
INSERT INTO public.ambiente (id, nombre, capacidad) VALUES (2, 'Laboratorio de Informatica 2', 25);
INSERT INTO public.ambiente (id, nombre, capacidad) VALUES (5, 'Aula 301', 35);

-- Data for Name: usuario; Type: TABLE DATA; Schema: public; Owner: -

INSERT INTO public.usuario (ci, nombres, apellidos, email, password_hash) VALUES ('30000001', 'Rosa', 'Mamani Villarroel', 'rmamani@umss.edu.bo', 'scrypt$2fbbc025c49259d30e213ef1292f40ab$88d447cb146766abcae3c4bf56ec0b8fd966c926dd17b6b375d137214e569b71f48b04d32f61e68cdf59b0523e78dd30ad304b563f987ec93b7f3080f9103cae');
INSERT INTO public.usuario (ci, nombres, apellidos, email, password_hash) VALUES ('10000001', 'Mario', 'Quispe Vargas', 'mquispe@umss.edu.bo', 'scrypt$2fbbc025c49259d30e213ef1292f40ab$88d447cb146766abcae3c4bf56ec0b8fd966c926dd17b6b375d137214e569b71f48b04d32f61e68cdf59b0523e78dd30ad304b563f987ec93b7f3080f9103cae');
INSERT INTO public.usuario (ci, nombres, apellidos, email, password_hash) VALUES ('10000002', 'Lucia', 'Mendoza Paz', 'lmendoza@umss.edu.bo', 'scrypt$2fbbc025c49259d30e213ef1292f40ab$88d447cb146766abcae3c4bf56ec0b8fd966c926dd17b6b375d137214e569b71f48b04d32f61e68cdf59b0523e78dd30ad304b563f987ec93b7f3080f9103cae');
INSERT INTO public.usuario (ci, nombres, apellidos, email, password_hash) VALUES ('10000003', 'Jorge', 'Antezana Rojas', 'jantezana@umss.edu.bo', 'scrypt$2fbbc025c49259d30e213ef1292f40ab$88d447cb146766abcae3c4bf56ec0b8fd966c926dd17b6b375d137214e569b71f48b04d32f61e68cdf59b0523e78dd30ad304b563f987ec93b7f3080f9103cae');
INSERT INTO public.usuario (ci, nombres, apellidos, email, password_hash) VALUES ('20000001', 'Ana', 'Flores Nina', 'aflores@student.umss.edu.bo', 'scrypt$2fbbc025c49259d30e213ef1292f40ab$88d447cb146766abcae3c4bf56ec0b8fd966c926dd17b6b375d137214e569b71f48b04d32f61e68cdf59b0523e78dd30ad304b563f987ec93b7f3080f9103cae');
INSERT INTO public.usuario (ci, nombres, apellidos, email, password_hash) VALUES ('20000002', 'Bruno', 'Cori Mamani', 'bcori@student.umss.edu.bo', 'scrypt$2fbbc025c49259d30e213ef1292f40ab$88d447cb146766abcae3c4bf56ec0b8fd966c926dd17b6b375d137214e569b71f48b04d32f61e68cdf59b0523e78dd30ad304b563f987ec93b7f3080f9103cae');
INSERT INTO public.usuario (ci, nombres, apellidos, email, password_hash) VALUES ('20000003', 'Carla', 'Rojas Sandoval', 'crojas@student.umss.edu.bo', 'scrypt$2fbbc025c49259d30e213ef1292f40ab$88d447cb146766abcae3c4bf56ec0b8fd966c926dd17b6b375d137214e569b71f48b04d32f61e68cdf59b0523e78dd30ad304b563f987ec93b7f3080f9103cae');
INSERT INTO public.usuario (ci, nombres, apellidos, email, password_hash) VALUES ('20000004', 'Diego', 'Alvarez Siles', 'dalvarez@student.umss.edu.bo', 'scrypt$2fbbc025c49259d30e213ef1292f40ab$88d447cb146766abcae3c4bf56ec0b8fd966c926dd17b6b375d137214e569b71f48b04d32f61e68cdf59b0523e78dd30ad304b563f987ec93b7f3080f9103cae');
INSERT INTO public.usuario (ci, nombres, apellidos, email, password_hash) VALUES ('20000005', 'Elena', 'Justiniano Ayub', 'ejustiniano@student.umss.edu.bo', 'scrypt$2fbbc025c49259d30e213ef1292f40ab$88d447cb146766abcae3c4bf56ec0b8fd966c926dd17b6b375d137214e569b71f48b04d32f61e68cdf59b0523e78dd30ad304b563f987ec93b7f3080f9103cae');
INSERT INTO public.usuario (ci, nombres, apellidos, email, password_hash) VALUES ('20000006', 'Fabricio', 'Torres Balderrama', 'ftorres@student.umss.edu.bo', 'scrypt$2fbbc025c49259d30e213ef1292f40ab$88d447cb146766abcae3c4bf56ec0b8fd966c926dd17b6b375d137214e569b71f48b04d32f61e68cdf59b0523e78dd30ad304b563f987ec93b7f3080f9103cae');
INSERT INTO public.usuario (ci, nombres, apellidos, email, password_hash) VALUES ('20000007', 'Gabriela', 'Ortiz Cuellar', 'gortiz@student.umss.edu.bo', 'scrypt$2fbbc025c49259d30e213ef1292f40ab$88d447cb146766abcae3c4bf56ec0b8fd966c926dd17b6b375d137214e569b71f48b04d32f61e68cdf59b0523e78dd30ad304b563f987ec93b7f3080f9103cae');
INSERT INTO public.usuario (ci, nombres, apellidos, email, password_hash) VALUES ('20000008', 'Hugo', 'Salazar Terrazas', 'hsalazar@student.umss.edu.bo', 'scrypt$2fbbc025c49259d30e213ef1292f40ab$88d447cb146766abcae3c4bf56ec0b8fd966c926dd17b6b375d137214e569b71f48b04d32f61e68cdf59b0523e78dd30ad304b563f987ec93b7f3080f9103cae');

-- Data for Name: instructor; Type: TABLE DATA; Schema: public; Owner: -

INSERT INTO public.instructor (ci, especialidad) VALUES ('10000001', 'Sistemas Distribuidos');
INSERT INTO public.instructor (ci, especialidad) VALUES ('10000002', 'Base de Datos');
INSERT INTO public.instructor (ci, especialidad) VALUES ('10000003', 'Redes y Comunicacion');

-- Data for Name: curso; Type: TABLE DATA; Schema: public; Owner: -

INSERT INTO public.curso (codigo, ci_instructor, nombre, grupo, nivel, costo, moneda, fecha_ini, fecha_fin, duracion_horas, num_inscritos) VALUES ('INF-101', '10000001', 'Fundamentos de Programacion', 'A', 'Licenciatura', 800.00, 'BOB', '2026-02-02', '2026-06-26', 40, 3);
INSERT INTO public.curso (codigo, ci_instructor, nombre, grupo, nivel, costo, moneda, fecha_ini, fecha_fin, duracion_horas, num_inscritos) VALUES ('INF-204', '10000002', 'Base de Datos Relacionales', 'B', 'Licenciatura', 1200.00, 'BOB', '2026-02-09', '2026-06-26', 48, 4);
INSERT INTO public.curso (codigo, ci_instructor, nombre, grupo, nivel, costo, moneda, fecha_ini, fecha_fin, duracion_horas, num_inscritos) VALUES ('INF-301', '10000003', 'Redes de Computadores', 'A', 'Licenciatura', 950.00, 'BOB', '2026-03-02', '2026-07-17', 40, 3);
INSERT INTO public.curso (codigo, ci_instructor, nombre, grupo, nivel, costo, moneda, fecha_ini, fecha_fin, duracion_horas, num_inscritos) VALUES ('INF-150', '10000001', 'Introduccion a la Informatica', 'C', 'Tecnologia Superior', 450.00, 'BOB', '2025-08-04', '2025-12-12', 32, 3);

-- Data for Name: estudiante; Type: TABLE DATA; Schema: public; Owner: -

INSERT INTO public.estudiante (ci, codigo_sis, celular) VALUES ('20000001', '2021001', '70111222');
INSERT INTO public.estudiante (ci, codigo_sis, celular) VALUES ('20000002', '2021002', '70222333');
INSERT INTO public.estudiante (ci, codigo_sis, celular) VALUES ('20000003', '2021003', '70333444');
INSERT INTO public.estudiante (ci, codigo_sis, celular) VALUES ('20000004', '2022001', '70444555');
INSERT INTO public.estudiante (ci, codigo_sis, celular) VALUES ('20000005', '2022002', '70555666');
INSERT INTO public.estudiante (ci, codigo_sis, celular) VALUES ('20000006', '2022003', '70666777');
INSERT INTO public.estudiante (ci, codigo_sis, celular) VALUES ('20000007', '2023001', '70777888');
INSERT INTO public.estudiante (ci, codigo_sis, celular) VALUES ('20000008', '2023002', '70888999');

-- Data for Name: sesion; Type: TABLE DATA; Schema: public; Owner: -

INSERT INTO public.sesion (id, codigo_curso, id_ambiente, fecha, hora_inicio, hora_fin) VALUES (1, 'INF-101', 1, '2026-02-02', '08:00:00', '10:00:00');
INSERT INTO public.sesion (id, codigo_curso, id_ambiente, fecha, hora_inicio, hora_fin) VALUES (2, 'INF-101', 1, '2026-02-09', '08:00:00', '10:00:00');
INSERT INTO public.sesion (id, codigo_curso, id_ambiente, fecha, hora_inicio, hora_fin) VALUES (3, 'INF-101', 3, '2026-02-16', '10:00:00', '12:00:00');
INSERT INTO public.sesion (id, codigo_curso, id_ambiente, fecha, hora_inicio, hora_fin) VALUES (4, 'INF-204', 2, '2026-02-09', '14:00:00', '16:00:00');
INSERT INTO public.sesion (id, codigo_curso, id_ambiente, fecha, hora_inicio, hora_fin) VALUES (5, 'INF-204', 2, '2026-02-16', '14:00:00', '16:00:00');
INSERT INTO public.sesion (id, codigo_curso, id_ambiente, fecha, hora_inicio, hora_fin) VALUES (6, 'INF-301', 5, '2026-03-02', '16:00:00', '18:00:00');
INSERT INTO public.sesion (id, codigo_curso, id_ambiente, fecha, hora_inicio, hora_fin) VALUES (7, 'INF-301', 4, '2026-03-09', '16:00:00', '18:00:00');
INSERT INTO public.sesion (id, codigo_curso, id_ambiente, fecha, hora_inicio, hora_fin) VALUES (8, 'INF-150', 3, '2025-08-04', '08:00:00', '10:00:00');
INSERT INTO public.sesion (id, codigo_curso, id_ambiente, fecha, hora_inicio, hora_fin) VALUES (9, 'INF-150', 3, '2025-08-11', '08:00:00', '10:00:00');

-- Data for Name: asistencia; Type: TABLE DATA; Schema: public; Owner: -

INSERT INTO public.asistencia (id, id_sesion, ci_estudiante, presente) VALUES (1, 1, '20000002', true);
INSERT INTO public.asistencia (id, id_sesion, ci_estudiante, presente) VALUES (2, 2, '20000002', true);
INSERT INTO public.asistencia (id, id_sesion, ci_estudiante, presente) VALUES (3, 3, '20000002', true);
INSERT INTO public.asistencia (id, id_sesion, ci_estudiante, presente) VALUES (4, 1, '20000003', true);
INSERT INTO public.asistencia (id, id_sesion, ci_estudiante, presente) VALUES (5, 2, '20000003', true);
INSERT INTO public.asistencia (id, id_sesion, ci_estudiante, presente) VALUES (6, 3, '20000003', true);
INSERT INTO public.asistencia (id, id_sesion, ci_estudiante, presente) VALUES (7, 4, '20000004', false);
INSERT INTO public.asistencia (id, id_sesion, ci_estudiante, presente) VALUES (8, 5, '20000004', false);
INSERT INTO public.asistencia (id, id_sesion, ci_estudiante, presente) VALUES (9, 4, '20000005', true);
INSERT INTO public.asistencia (id, id_sesion, ci_estudiante, presente) VALUES (10, 5, '20000005', true);
INSERT INTO public.asistencia (id, id_sesion, ci_estudiante, presente) VALUES (11, 4, '20000006', true);
INSERT INTO public.asistencia (id, id_sesion, ci_estudiante, presente) VALUES (12, 5, '20000006', true);
INSERT INTO public.asistencia (id, id_sesion, ci_estudiante, presente) VALUES (13, 6, '20000007', false);
INSERT INTO public.asistencia (id, id_sesion, ci_estudiante, presente) VALUES (14, 7, '20000007', false);
INSERT INTO public.asistencia (id, id_sesion, ci_estudiante, presente) VALUES (15, 6, '20000008', true);
INSERT INTO public.asistencia (id, id_sesion, ci_estudiante, presente) VALUES (16, 7, '20000008', true);
INSERT INTO public.asistencia (id, id_sesion, ci_estudiante, presente) VALUES (17, 6, '20000002', true);
INSERT INTO public.asistencia (id, id_sesion, ci_estudiante, presente) VALUES (18, 7, '20000002', true);
INSERT INTO public.asistencia (id, id_sesion, ci_estudiante, presente) VALUES (19, 8, '20000001', true);
INSERT INTO public.asistencia (id, id_sesion, ci_estudiante, presente) VALUES (20, 9, '20000001', true);
INSERT INTO public.asistencia (id, id_sesion, ci_estudiante, presente) VALUES (21, 8, '20000005', true);
INSERT INTO public.asistencia (id, id_sesion, ci_estudiante, presente) VALUES (22, 9, '20000005', true);

-- Data for Name: certificado; Type: TABLE DATA; Schema: public; Owner: -

INSERT INTO public.certificado (ci_estudiante, codigo_curso, fecha_emision, tipo, nota_final, pct_asistencia, codigo_verificacion, id) VALUES ('20000001', 'INF-150', '2025-12-19', 'APROVADO', 78.00, 100.00, 'CERT-2025-0001', 1);
INSERT INTO public.certificado (ci_estudiante, codigo_curso, fecha_emision, tipo, nota_final, pct_asistencia, codigo_verificacion, id) VALUES ('20000003', 'INF-150', '2025-12-19', 'APROVADO', 64.50, 80.00, 'CERT-2025-0002', 2);
INSERT INTO public.certificado (ci_estudiante, codigo_curso, fecha_emision, tipo, nota_final, pct_asistencia, codigo_verificacion, id) VALUES ('20000005', 'INF-150', '2025-12-19', 'ASISTENCIA', NULL, 75.00, 'CERT-2025-0003', 3);

-- Data for Name: inscripcion; Type: TABLE DATA; Schema: public; Owner: -

INSERT INTO public.inscripcion (id, ci_estudiante, codigo_curso, tipo_precio, fotocopia_ci, fecha_inscripcion) VALUES (1, '20000001', 'INF-101', 'ORIGINAL', true, '2026-01-20');
INSERT INTO public.inscripcion (id, ci_estudiante, codigo_curso, tipo_precio, fotocopia_ci, fecha_inscripcion) VALUES (2, '20000002', 'INF-101', 'ORIGINAL', true, '2026-01-21');
INSERT INTO public.inscripcion (id, ci_estudiante, codigo_curso, tipo_precio, fotocopia_ci, fecha_inscripcion) VALUES (3, '20000003', 'INF-101', 'BENEFICIARIO', false, '2026-01-22');
INSERT INTO public.inscripcion (id, ci_estudiante, codigo_curso, tipo_precio, fotocopia_ci, fecha_inscripcion) VALUES (4, '20000004', 'INF-204', 'ORIGINAL', true, '2026-01-25');
INSERT INTO public.inscripcion (id, ci_estudiante, codigo_curso, tipo_precio, fotocopia_ci, fecha_inscripcion) VALUES (5, '20000005', 'INF-204', 'ORIGINAL', true, '2026-01-26');
INSERT INTO public.inscripcion (id, ci_estudiante, codigo_curso, tipo_precio, fotocopia_ci, fecha_inscripcion) VALUES (6, '20000006', 'INF-204', 'BENEFICIARIO', false, '2026-01-27');
INSERT INTO public.inscripcion (id, ci_estudiante, codigo_curso, tipo_precio, fotocopia_ci, fecha_inscripcion) VALUES (7, '20000001', 'INF-204', 'ORIGINAL', true, '2026-01-28');
INSERT INTO public.inscripcion (id, ci_estudiante, codigo_curso, tipo_precio, fotocopia_ci, fecha_inscripcion) VALUES (8, '20000007', 'INF-301', 'ORIGINAL', true, '2026-02-10');
INSERT INTO public.inscripcion (id, ci_estudiante, codigo_curso, tipo_precio, fotocopia_ci, fecha_inscripcion) VALUES (9, '20000008', 'INF-301', 'ORIGINAL', true, '2026-02-11');
INSERT INTO public.inscripcion (id, ci_estudiante, codigo_curso, tipo_precio, fotocopia_ci, fecha_inscripcion) VALUES (10, '20000002', 'INF-301', 'BENEFICIARIO', false, '2026-02-12');
INSERT INTO public.inscripcion (id, ci_estudiante, codigo_curso, tipo_precio, fotocopia_ci, fecha_inscripcion) VALUES (11, '20000001', 'INF-150', 'ORIGINAL', true, '2025-07-28');
INSERT INTO public.inscripcion (id, ci_estudiante, codigo_curso, tipo_precio, fotocopia_ci, fecha_inscripcion) VALUES (12, '20000003', 'INF-150', 'ORIGINAL', true, '2025-07-29');
INSERT INTO public.inscripcion (id, ci_estudiante, codigo_curso, tipo_precio, fotocopia_ci, fecha_inscripcion) VALUES (13, '20000005', 'INF-150', 'BENEFICIARIO', false, '2025-07-30');

-- Data for Name: pago; Type: TABLE DATA; Schema: public; Owner: -

INSERT INTO public.pago (id, id_inscripcion, monto_fisico, monto_qr, fecha_pago) VALUES (1, 1, 800.00, 0.00, '2026-01-20');
INSERT INTO public.pago (id, id_inscripcion, monto_fisico, monto_qr, fecha_pago) VALUES (2, 2, 400.00, 400.00, '2026-01-21');
INSERT INTO public.pago (id, id_inscripcion, monto_fisico, monto_qr, fecha_pago) VALUES (3, 3, 0.00, 600.00, '2026-01-22');
INSERT INTO public.pago (id, id_inscripcion, monto_fisico, monto_qr, fecha_pago) VALUES (4, 4, 1200.00, 0.00, '2026-01-25');
INSERT INTO public.pago (id, id_inscripcion, monto_fisico, monto_qr, fecha_pago) VALUES (5, 5, 600.00, 600.00, '2026-01-26');
INSERT INTO public.pago (id, id_inscripcion, monto_fisico, monto_qr, fecha_pago) VALUES (6, 6, 0.00, 900.00, '2026-01-27');
INSERT INTO public.pago (id, id_inscripcion, monto_fisico, monto_qr, fecha_pago) VALUES (7, 7, 1200.00, 0.00, '2026-01-28');
INSERT INTO public.pago (id, id_inscripcion, monto_fisico, monto_qr, fecha_pago) VALUES (8, 8, 950.00, 0.00, '2026-02-10');
INSERT INTO public.pago (id, id_inscripcion, monto_fisico, monto_qr, fecha_pago) VALUES (9, 9, 950.00, 0.00, '2026-02-11');
INSERT INTO public.pago (id, id_inscripcion, monto_fisico, monto_qr, fecha_pago) VALUES (10, 10, 0.00, 700.00, '2026-02-12');
INSERT INTO public.pago (id, id_inscripcion, monto_fisico, monto_qr, fecha_pago) VALUES (11, 11, 450.00, 0.00, '2025-07-28');
INSERT INTO public.pago (id, id_inscripcion, monto_fisico, monto_qr, fecha_pago) VALUES (12, 12, 450.00, 0.00, '2025-07-29');

-- Data for Name: rol; Type: TABLE DATA; Schema: public; Owner: -

INSERT INTO public.rol (id, nombre) VALUES (1, 'ADMIN');
INSERT INTO public.rol (id, nombre) VALUES (2, 'ESTUDIANTE');
INSERT INTO public.rol (id, nombre) VALUES (3, 'INSTRUCTOR');

-- Data for Name: usuario_rol; Type: TABLE DATA; Schema: public; Owner: -

INSERT INTO public.usuario_rol (ci, id_rol) VALUES ('30000001', 1);
INSERT INTO public.usuario_rol (ci, id_rol) VALUES ('10000001', 3);
INSERT INTO public.usuario_rol (ci, id_rol) VALUES ('10000002', 3);
INSERT INTO public.usuario_rol (ci, id_rol) VALUES ('10000003', 3);
INSERT INTO public.usuario_rol (ci, id_rol) VALUES ('20000001', 2);
INSERT INTO public.usuario_rol (ci, id_rol) VALUES ('20000002', 2);
INSERT INTO public.usuario_rol (ci, id_rol) VALUES ('20000003', 2);
INSERT INTO public.usuario_rol (ci, id_rol) VALUES ('20000004', 2);
INSERT INTO public.usuario_rol (ci, id_rol) VALUES ('20000005', 2);
INSERT INTO public.usuario_rol (ci, id_rol) VALUES ('20000006', 2);
INSERT INTO public.usuario_rol (ci, id_rol) VALUES ('20000007', 2);
INSERT INTO public.usuario_rol (ci, id_rol) VALUES ('20000008', 2);

-- Name: ambiente_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -

SELECT pg_catalog.setval('public.ambiente_id_seq', 5, true);

-- Name: asistencia_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -

SELECT pg_catalog.setval('public.asistencia_id_seq', 22, true);

-- Name: certificado_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -

SELECT pg_catalog.setval('public.certificado_id_seq', 3, true);

-- Name: inscripcion_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -

SELECT pg_catalog.setval('public.inscripcion_id_seq', 13, true);

-- Name: pago_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -

SELECT pg_catalog.setval('public.pago_id_seq', 12, true);

-- Name: rol_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -

SELECT pg_catalog.setval('public.rol_id_seq', 3, true);

-- Name: sesion_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -

SELECT pg_catalog.setval('public.sesion_id_seq', 9, true);

