'use client';

import { useEffect, useMemo, useState } from 'react';
import { X, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { useApi } from '@/src/hooks/useApi';
import { Button } from '../Button';
import { Badge } from '../Badge';

interface InscripcionDetalle {
  ciEstudiante: string;
  nombre: string;
  estado: 'INSCRITO' | 'CANCELADO';
}

interface CursoDetalle {
  codigo: string;
  nombre: string;
  grupo: string;
  cuposMin: number;
  cuposMax: number;
  fechaLimiteInscripcion: string;
  estadoApertura: 'PENDIENTE' | 'ABIERTO' | 'CERRADO';
  inscritos: number;
  inscripciones: InscripcionDetalle[];
}

interface GrupoAlternativo {
  codigo: string;
  grupo: string;
  instructor: string;
  fechaIni: string;
  inscritos: number;
  cuposMax: number;
  cuposLibres: number | null;
}

interface ResultadoCierre {
  movidos: { ciEstudiante: string; nombre: string; grupoDestino: string; codigoDestino: string }[];
  cancelados: { ciEstudiante: string; nombre: string; motivo: string }[];
}

/** Montar con key={codigo} para que el estado se reinicie al cambiar de curso. */
interface Props {
  codigo: string;
  onClose: () => void;
  /** Se llama despues de abrir o cerrar el curso con exito. */
  onRevisado: () => void;
}

/** Valor del select que significa "cancelar la inscripcion". */
const CANCELAR = '';
/** Valor del select por estudiante que significa "usar el grupo por defecto". */
const POR_DEFECTO = '__defecto__';

export function RevisionAperturaModal({ codigo, onClose, onRevisado }: Props) {
  const { call, loading } = useApi();
  const [curso, setCurso] = useState<CursoDetalle | null>(null);
  const [grupos, setGrupos] = useState<GrupoAlternativo[]>([]);
  const [destinoDefecto, setDestinoDefecto] = useState<string>(CANCELAR);
  const [porEstudiante, setPorEstudiante] = useState<Record<string, string>>({});
  const [confirmando, setConfirmando] = useState(false);
  const [resultado, setResultado] = useState<ResultadoCierre | null>(null);

  useEffect(() => {
    let montado = true;
    (async () => {
      const [resCurso, resGrupos] = await Promise.all([
        call<CursoDetalle>(`/api/cursos/${encodeURIComponent(codigo)}`),
        call<GrupoAlternativo[]>(`/api/cursos/${encodeURIComponent(codigo)}/grupos-alternativos`),
      ]);
      if (!montado) return;
      if (resCurso?.ok) setCurso(resCurso.data);
      if (resGrupos?.ok) {
        setGrupos(resGrupos.data);
        const conCupo = resGrupos.data.find((g) => g.cuposLibres === null || g.cuposLibres > 0);
        setDestinoDefecto(conCupo?.codigo ?? CANCELAR);
      }
    })();

    return () => {
      montado = false;
    };
  }, [codigo, call]);

  const inscritos = useMemo(
    () => curso?.inscripciones.filter((i) => i.estado === 'INSCRITO') ?? [],
    [curso],
  );

  const cumpleMinimo = curso ? curso.inscritos >= curso.cuposMin : false;
  const yaRevisado = curso ? curso.estadoApertura !== 'PENDIENTE' : false;

  const etiquetaGrupo = (g: GrupoAlternativo) =>
    `Grupo ${g.grupo} (${g.codigo}) — ${g.instructor} — ` +
    (g.cuposLibres === null ? 'sin límite' : `${g.cuposLibres} cupos libres`);

  const handleAbrir = async () => {
    const res = await call<{ inscritos: number }>(`/api/cursos/${encodeURIComponent(codigo)}/abrir`, {
      method: 'POST',
    });
    if (!res?.ok) return;
    toast.success(`Curso ${codigo} abierto con ${res.data.inscritos} inscritos.`);
    onRevisado();
    onClose();
  };

  const handleCerrar = async () => {
    const reasignaciones: Record<string, string | null> = {};
    for (const [ci, valor] of Object.entries(porEstudiante)) {
      if (valor !== POR_DEFECTO) reasignaciones[ci] = valor === CANCELAR ? null : valor;
    }

    const res = await call<ResultadoCierre>(`/api/cursos/${encodeURIComponent(codigo)}/cerrar-cupo`, {
      method: 'POST',
      body: { codigoDestino: destinoDefecto === CANCELAR ? null : destinoDefecto, reasignaciones },
    });
    if (!res?.ok) return;
    setResultado(res.data);
    toast.success(`Curso ${codigo} cerrado. Se notificó a ${inscritos.length} estudiante(s).`);
    onRevisado();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b border-card-border sticky top-0 bg-white">
          <div>
            <h3 className="text-xl font-primary font-bold text-text-main">Revisar apertura</h3>
            {curso && (
              <p className="text-sm text-text-muted">
                {curso.codigo} — {curso.nombre} (grupo {curso.grupo})
              </p>
            )}
          </div>
          <button onClick={onClose} className="text-text-muted" aria-label="Cerrar">
            <X size={24} />
          </button>
        </div>

        {!curso ? (
          <div className="p-8 text-center text-text-muted">Cargando...</div>
        ) : resultado ? (
          <div className="p-6 space-y-4">
            <p className="font-semibold text-text-main">El curso quedó cerrado.</p>
            {resultado.movidos.length > 0 && (
              <div>
                <p className="text-sm font-semibold text-green-700 mb-1">
                  Movidos a otro grupo ({resultado.movidos.length})
                </p>
                <ul className="text-sm text-text-main list-disc pl-5">
                  {resultado.movidos.map((m) => (
                    <li key={m.ciEstudiante}>
                      {m.nombre} → grupo {m.grupoDestino} ({m.codigoDestino})
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {resultado.cancelados.length > 0 && (
              <div>
                <p className="text-sm font-semibold text-secondary mb-1">
                  Inscripción cancelada ({resultado.cancelados.length})
                </p>
                <ul className="text-sm text-text-main list-disc pl-5">
                  {resultado.cancelados.map((c) => (
                    <li key={c.ciEstudiante}>
                      {c.nombre} — {c.motivo}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <p className="text-xs text-text-muted">Todos los estudiantes recibieron una notificación.</p>
            <div className="flex justify-end">
              <Button onClick={onClose}>Listo</Button>
            </div>
          </div>
        ) : (
          <div className="p-6 space-y-5">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="bg-card-bg rounded-lg p-3">
                <p className="text-xs text-text-muted">Inscritos</p>
                <p className="text-2xl font-bold text-text-main">{curso.inscritos}</p>
              </div>
              <div className="bg-card-bg rounded-lg p-3">
                <p className="text-xs text-text-muted">Mínimo</p>
                <p className="text-2xl font-bold text-text-main">{curso.cuposMin}</p>
              </div>
              <div className="bg-card-bg rounded-lg p-3">
                <p className="text-xs text-text-muted">Fecha límite</p>
                <p className="text-lg font-bold text-text-main">{curso.fechaLimiteInscripcion}</p>
              </div>
            </div>

            {yaRevisado ? (
              <p className="text-sm text-text-muted">
                Este curso ya fue revisado: <Badge>{curso.estadoApertura}</Badge>
              </p>
            ) : cumpleMinimo ? (
              <div className="space-y-4">
                <p className="flex items-center gap-2 text-sm text-green-700">
                  <CheckCircle size={18} /> Alcanza el mínimo de inscritos. Puedes abrir el curso.
                </p>
                <div className="flex justify-end gap-3">
                  <Button variant="outline" onClick={onClose}>Cancelar</Button>
                  <Button onClick={handleAbrir} disabled={loading}>Abrir curso</Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="flex items-center gap-2 text-sm text-secondary">
                  <XCircle size={18} /> No alcanza el mínimo. Al cerrarlo, los estudiantes se mueven al
                  grupo elegido y reciben una notificación.
                </p>

                <div className="space-y-1">
                  <label className="text-sm font-semibold text-text-main">Mover a todos a</label>
                  <select
                    value={destinoDefecto}
                    onChange={(e) => setDestinoDefecto(e.target.value)}
                    className="w-full border border-input-border rounded-lg px-3 py-2 text-sm bg-white"
                  >
                    {grupos.map((g) => (
                      <option key={g.codigo} value={g.codigo}>
                        {etiquetaGrupo(g)}
                      </option>
                    ))}
                    <option value={CANCELAR}>Ninguno: cancelar inscripción</option>
                  </select>
                  {grupos.length === 0 && (
                    <p className="text-xs text-text-muted">
                      No hay otros grupos de esta materia. Revisa el &quot;código de materia&quot; de los cursos.
                    </p>
                  )}
                </div>

                {inscritos.length > 0 && (
                  <div>
                    <p className="text-sm font-semibold text-text-main mb-2">
                      Estudiantes ({inscritos.length})
                    </p>
                    <div className="border border-card-border rounded-lg divide-y divide-card-border">
                      {inscritos.map((i) => (
                        <div key={i.ciEstudiante} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3">
                          <div className="text-sm">
                            <p className="font-semibold text-text-main">{i.nombre}</p>
                            <p className="text-xs text-text-muted">CI {i.ciEstudiante}</p>
                          </div>
                          <select
                            value={porEstudiante[i.ciEstudiante] ?? POR_DEFECTO}
                            onChange={(e) =>
                              setPorEstudiante((prev) => ({ ...prev, [i.ciEstudiante]: e.target.value }))
                            }
                            className="border border-input-border rounded-lg px-2 py-1 text-xs bg-white sm:max-w-[16rem]"
                          >
                            <option value={POR_DEFECTO}>Igual que todos</option>
                            {grupos.map((g) => (
                              <option key={g.codigo} value={g.codigo}>
                                Grupo {g.grupo} ({g.codigo})
                              </option>
                            ))}
                            <option value={CANCELAR}>Cancelar inscripción</option>
                          </select>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-text-muted mt-2">
                      Si el grupo destino se queda sin cupos, la inscripción se cancela.
                    </p>
                  </div>
                )}

                {confirmando ? (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="flex items-center gap-2 text-sm text-secondary">
                      <AlertTriangle size={16} /> Esta acción no se puede deshacer.
                    </p>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => setConfirmando(false)}>Volver</Button>
                      <Button variant="secondary" size="sm" onClick={handleCerrar} disabled={loading}>
                        Sí, cerrar curso
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-end gap-3">
                    <Button variant="outline" onClick={onClose}>Cancelar</Button>
                    <Button variant="secondary" onClick={() => setConfirmando(true)}>Cerrar curso</Button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
