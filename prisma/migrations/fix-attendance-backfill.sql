-- Migration: Fix attendance records and certificate stats
-- 1. Delete attendance for cancelled inscriptions
-- 2. Backfill missing attendance for enrolled students (AUSENTE default)
-- 3. Recompute pct_asistencia for all certificates from actual attendance
--    (only PRESENTE and JUSTIFICADA count as attended)

-- 1. Delete attendance for cancelled inscriptions
DELETE FROM asistencia a
USING inscripcion i
WHERE a.ci_estudiante = i.ci_estudiante
  AND i.codigo_curso = (SELECT codigo_curso FROM sesion WHERE id = a.id_sesion)
  AND i.estado = 'CANCELADO';

-- 2. Backfill missing attendance: for each enrolled student, insert AUSENTE
--    for every session where they have no attendance record
INSERT INTO asistencia (id_sesion, ci_estudiante, estado)
SELECT s.id, i.ci_estudiante, 'AUSENTE'
FROM sesion s
JOIN inscripcion i ON i.codigo_curso = s.codigo_curso AND i.estado = 'INSCRITO'
WHERE NOT EXISTS (
  SELECT 1 FROM asistencia a
  WHERE a.id_sesion = s.id AND a.ci_estudiante = i.ci_estudiante
)
ON CONFLICT (id_sesion, ci_estudiante) DO NOTHING;

-- 3. Recompute pct_asistencia: only PRESENTE + JUSTIFICADA count as attended
UPDATE certificado c
SET pct_asistencia = sub.pct
FROM (
  SELECT c2.ci_estudiante, c2.codigo_curso,
         ROUND(
           100.0 * COUNT(a.id) FILTER (WHERE a.estado IN ('PRESENTE', 'JUSTIFICADA'))
           / NULLIF((SELECT COUNT(*) FROM sesion s WHERE s.codigo_curso = c2.codigo_curso), 0),
           2
         ) AS pct
  FROM certificado c2
  LEFT JOIN sesion s ON s.codigo_curso = c2.codigo_curso
  LEFT JOIN asistencia a ON a.id_sesion = s.id AND a.ci_estudiante = c2.ci_estudiante
  GROUP BY c2.ci_estudiante, c2.codigo_curso
) sub
WHERE c.ci_estudiante = sub.ci_estudiante
  AND c.codigo_curso = sub.codigo_curso;
