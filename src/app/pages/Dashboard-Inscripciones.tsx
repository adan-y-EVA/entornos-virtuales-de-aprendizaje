'use client';

import React, { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, CheckCircle, Download, FileSpreadsheet, Upload, UserPlus } from 'lucide-react';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { StatCard } from '../components/StatCard';

export interface CursoOption {
  codigo: string;
  nombre: string;
  grupo: string;
  nivel: string;
  fechaIni: string;
  cuposMax: number;
  inscritos: number;
  abiertos: boolean;
}

export interface ResumenInscripciones {
  cursosAbiertos: number;
  inscritosHoy: number;
  totalInscritos: number;
}

interface ErrorFila {
  columna: string;
  mensaje: string;
}

interface FilaReporte {
  fila: number;
  ciEstudiante: string;
  nombres: string;
  apellidos: string;
  estado: 'OK' | 'ERROR';
  errores: ErrorFila[];
}

interface ResultadoCarga {
  resumen: { total: number; exitosos: number; fallidos: number };
  filas: FilaReporte[];
}

interface DashboardInscripcionesProps {
  cursos: CursoOption[];
  resumen: ResumenInscripciones;
}

const tiposPrecio = ['ORIGINAL', 'BENEFICIARIO'];

const inputClases =
  'w-full px-3 py-2 border border-input-border rounded-lg text-sm bg-white text-text-main focus:outline-none';

const labelClases = 'block text-sm font-semibold text-text-main mb-1';

export default function DashboardInscripciones({
  cursos,
  resumen,
}: DashboardInscripcionesProps) {
  const router = useRouter();
  const [codigoCurso, setCodigoCurso] = useState(cursos[0]?.codigo ?? '');

  const [enviando, setEnviando] = useState(false);
  const [errorManual, setErrorManual] = useState<string | null>(null);
  const [exitoManual, setExitoManual] = useState<string | null>(null);

  const [errorCarga, setErrorCarga] = useState<string | null>(null);
  const [resultado, setResultado] = useState<ResultadoCarga | null>(null);
  const [subiendo, setSubiendo] = useState(false);
  const [nombreArchivo, setNombreArchivo] = useState('');

  const curso = cursos.find((item) => item.codigo === codigoCurso);
  const cargaHabilitada = Boolean(curso?.abiertos);

  async function registrarEstudiante(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const formulario = evento.currentTarget;
    setErrorManual(null);
    setExitoManual(null);
    setEnviando(true);

    const datos = Object.fromEntries(new FormData(formulario));

    try {
      const respuesta = await fetch('/api/inscripciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...datos,
          codigoCurso,
          fotocopiaCi: datos.fotocopiaCi === 'on',
        }),
      });
      const cuerpo = await respuesta.json();

      if (!respuesta.ok) {
        setErrorManual(cuerpo.error ?? 'No se pudo completar la inscripción.');
      } else {
        const inscripcion = cuerpo.inscripcion;
        setExitoManual(
          `${inscripcion.nombres} ${inscripcion.apellidos} quedó inscrito en ${codigoCurso} (CI ${inscripcion.ciEstudiante}, SIS ${inscripcion.codigoSis}).` +
            (inscripcion.estudianteNuevo ? ' Se creó su ficha de estudiante.' : ''),
        );
        formulario.reset();
        router.refresh();
      }
    } catch {
      setErrorManual('No se pudo conectar con el servidor.');
    } finally {
      setEnviando(false);
    }
  }

  async function cargarArchivo(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const formulario = evento.currentTarget;
    setErrorCarga(null);
    setResultado(null);
    setSubiendo(true);

    const datos = new FormData(formulario);
    datos.set('codigoCurso', codigoCurso);

    try {
      const respuesta = await fetch('/api/inscripciones/carga', {
        method: 'POST',
        body: datos,
      });
      const cuerpo = await respuesta.json();

      if (!respuesta.ok) {
        setErrorCarga(cuerpo.error ?? 'No se pudo procesar el archivo.');
      } else {
        setResultado(cuerpo);
        formulario.reset();
        setNombreArchivo('');
        router.refresh();
      }
    } catch {
      setErrorCarga('No se pudo conectar con el servidor.');
    } finally {
      setSubiendo(false);
    }
  }

  function descargarPlantilla() {
    const contenido =
      '\uFEFFciEstudiante,nombresEstudiante,apellidosEstudiante,tipoPrecio,email,celular,codigoSis\n' +
      '20000009,Ana,Torrez,ORIGINAL,ana.torres@umss.edu.bo,70123456,\n' +
      '20000010,Luis,Fernandez,BENEFICIARIO,,,\n';
    const url = URL.createObjectURL(new Blob([contenido], { type: 'text/csv;charset=utf-8' }));
    const enlace = document.createElement('a');
    enlace.href = url;
    enlace.download = 'plantilla-inscripcion.csv';
    enlace.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="w-full h-full bg-white flex flex-col">
      <header className="bg-white border-b border-card-border p-4 flex justify-between items-center w-full">
        <div>
          <h2 className="text-2xl font-primary font-bold text-text-main">Inscripciones</h2>
          <p className="text-sm text-text-muted">
            Inscripción manual y carga masiva de estudiantes a un curso.
          </p>
        </div>
        <Button variant="outline" icon={<Download size={16} />} onClick={descargarPlantilla}>
          Plantilla CSV
        </Button>
      </header>

      <main className="p-6 flex-1 w-full overflow-x-hidden space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard
            title="Cursos abiertos"
            value={resumen.cursosAbiertos}
            icon={<UserPlus />}
            iconBgClass="bg-blue-100"
            iconTextClass="text-primary"
          />
          <StatCard
            title="Inscripciones de hoy"
            value={resumen.inscritosHoy}
            icon={<CheckCircle />}
            iconBgClass="bg-green-100"
            iconTextClass="text-green-700"
          />
          <StatCard
            title="Total inscritos"
            value={resumen.totalInscritos}
            icon={<FileSpreadsheet />}
            iconBgClass="bg-red-100"
            iconTextClass="text-secondary"
          />
        </div>

        <div className="bg-card-bg border border-card-border rounded-xl p-4">
          <label htmlFor="curso" className={labelClases}>
            Curso de destino
          </label>
          <select
            id="curso"
            name="codigoCurso"
            value={codigoCurso}
            onChange={(evento) => setCodigoCurso(evento.target.value)}
            className={inputClases}
          >
            {cursos.length === 0 && <option value="">No hay cursos registrados</option>}
            {cursos.map((item) => (
              <option key={item.codigo} value={item.codigo}>
                {item.codigo} — {item.nombre} ({item.grupo}){item.abiertos ? '' : ' — inscripción cerrada'}
              </option>
            ))}
          </select>
          {curso && (
            <p className="text-sm text-text-muted mt-2">
              Inicio: {curso.fechaIni} • Inscritos: {curso.inscritos}
              {curso.cuposMax > 0 ? ` de ${curso.cuposMax}` : ' (sin límite de cupos)'}
              {curso.cuposMax > 0
                ? ` • Quedan ${Math.max(curso.cuposMax - curso.inscritos, 0)} cupos`
                : ''}
              {!curso.abiertos && ' • Inscripción cerrada'}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <section className="bg-white border border-card-border rounded-xl p-6">
            <h3 className="text-xl font-primary font-bold text-text-main mb-1">
              Inscripción manual
            </h3>
            <p className="text-sm text-text-muted mb-4">
              Registra un estudiante a la vez. Si el carnet no existe, se crea su ficha
              automáticamente.
            </p>

            <form onSubmit={registrarEstudiante} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="ciEstudiante" className={labelClases}>
                    CI *
                  </label>
                  <input id="ciEstudiante" name="ciEstudiante" maxLength={10} className={inputClases} />
                </div>
                <div>
                  <label htmlFor="codigoSis" className={labelClases}>
                    Código SIS
                  </label>
                  <input id="codigoSis" name="codigoSis" maxLength={20} className={inputClases} />
                </div>
                <div>
                  <label htmlFor="nombres" className={labelClases}>
                    Nombres *
                  </label>
                  <input id="nombres" name="nombres" maxLength={80} className={inputClases} />
                </div>
                <div>
                  <label htmlFor="apellidos" className={labelClases}>
                    Apellidos *
                  </label>
                  <input id="apellidos" name="apellidos" maxLength={80} className={inputClases} />
                </div>
                <div>
                  <label htmlFor="email" className={labelClases}>
                    Correo
                  </label>
                  <input id="email" name="email" type="email" maxLength={120} className={inputClases} />
                </div>
                <div>
                  <label htmlFor="celular" className={labelClases}>
                    Celular
                  </label>
                  <input id="celular" name="celular" maxLength={20} className={inputClases} />
                </div>
                <div>
                  <label htmlFor="tipoPrecio" className={labelClases}>
                    Tipo de precio *
                  </label>
                  <select id="tipoPrecio" name="tipoPrecio" className={inputClases} defaultValue="ORIGINAL">
                    {tiposPrecio.map((tipo) => (
                      <option key={tipo} value={tipo}>
                        {tipo}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-end pb-2">
                  <label className="flex items-center gap-2 text-sm text-text-main">
                    <input type="checkbox" name="fotocopiaCi" className="w-4 h-4" />
                    Fotocopia de CI
                  </label>
                </div>
              </div>

              {errorManual && (
                <p className="flex items-start gap-2 text-sm text-secondary font-semibold">
                  <AlertCircle size={16} className="mt-0.5 shrink-0" />
                  Error al inscribir: {errorManual}
                </p>
              )}

              {exitoManual && (
                <p className="flex items-start gap-2 text-sm text-green-700 font-semibold">
                  <CheckCircle size={16} className="mt-0.5 shrink-0" />
                  {exitoManual}
                </p>
              )}

              <Button
                type="submit"
                icon={<UserPlus size={18} />}
                disabled={enviando || !cargaHabilitada}
              >
                {enviando ? 'Inscribiendo...' : 'Inscribir estudiante'}
              </Button>
            </form>
          </section>

          <section className="bg-white border border-card-border rounded-xl p-6">
            <h3 className="text-xl font-primary font-bold text-text-main mb-1">
              Carga masiva
            </h3>
            <p className="text-sm text-text-muted mb-4">
              Sube un archivo .csv o .xlsx con las columnas{' '}
              <span className="font-mono text-xs">ciEstudiante, nombresEstudiante, apellidosEstudiante, tipoPrecio</span>{' '}
              y opcionalmente <span className="font-mono text-xs">email, celular, codigoSis</span>. Las
              filas inválidas no bloquean a las válidas.
            </p>

            <form onSubmit={cargarArchivo} className="space-y-4">
              <div>
                <label htmlFor="archivo" className={labelClases}>
                  Archivo de estudiantes
                </label>
                <input
                  id="archivo"
                  name="archivo"
                  type="file"
                  accept=".csv,.xlsx"
                  onChange={(evento) => setNombreArchivo(evento.target.files?.[0]?.name ?? '')}
                  className="w-full text-sm text-text-muted file:mr-4 file:rounded-lg file:border file:border-input-border file:bg-card-bg file:px-4 file:py-2 file:text-sm file:font-semibold file:text-text-main"
                />
                {nombreArchivo && (
                  <p className="text-xs text-text-muted mt-1">Archivo seleccionado: {nombreArchivo}</p>
                )}
              </div>

              {errorCarga && (
                <p className="flex items-start gap-2 text-sm text-secondary font-semibold">
                  <AlertCircle size={16} className="mt-0.5 shrink-0" />
                  Error al cargar: {errorCarga}
                </p>
              )}

              <Button type="submit" icon={<Upload size={18} />} disabled={subiendo || !cargaHabilitada}>
                {subiendo ? 'Procesando...' : 'Cargar archivo'}
              </Button>
            </form>

            {resultado && (
              <div className="mt-6 space-y-3">
                <div className="flex flex-wrap gap-2 text-sm">
                  <Badge variant="default">Filas: {resultado.resumen.total}</Badge>
                  <Badge variant="success">Procesadas: {resultado.resumen.exitosos}</Badge>
                  <Badge variant={resultado.resumen.fallidos > 0 ? 'error' : 'default'}>
                    Con error: {resultado.resumen.fallidos}
                  </Badge>
                </div>

                <div className="border border-card-border rounded-lg overflow-x-auto max-h-96">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-card-bg text-text-muted font-secondary border-b border-card-border">
                      <tr>
                        <th className="p-3">Fila</th>
                        <th className="p-3">CI</th>
                        <th className="p-3">Estudiante</th>
                        <th className="p-3">Estado</th>
                        <th className="p-3">Detalle</th>
                      </tr>
                    </thead>
                    <tbody>
                      {resultado.filas.map((fila) => (
                        <tr key={fila.fila} className="border-b border-card-border align-top">
                          <td className="p-3 font-mono text-xs text-text-muted">{fila.fila}</td>
                          <td className="p-3 font-mono text-xs text-text-main">{fila.ciEstudiante}</td>
                          <td className="p-3 text-text-main">
                            {fila.nombres} {fila.apellidos}
                          </td>
                          <td className="p-3">
                            {fila.estado === 'OK' ? (
                              <Badge variant="success">Inscrito</Badge>
                            ) : (
                              <Badge variant="error">Error</Badge>
                            )}
                          </td>
                          <td className="p-3 text-xs text-secondary">
                            {fila.errores.length === 0
                              ? '—'
                              : fila.errores.map((error) => (
                                  <p key={`${fila.fila}-${error.columna}`}>
                                    <span className="font-mono font-semibold">{error.columna}:</span>{' '}
                                    {error.mensaje}
                                  </p>
                                ))}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
