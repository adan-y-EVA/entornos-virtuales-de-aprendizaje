'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Award, Pencil, Plus, Save, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import { useApi } from '@/src/hooks/useApi';
import { Button } from '../Button';
import type { DetalleNotasCurso, EstudianteNotas, EvaluacionResumen } from './types';

const POR_PAGINA = 25;
/** Clave sintética del modo nota única (los ids reales de evaluación arrancan en 1). */
const ID_UNICO = 0;

function validar(valor: string): number | null {
  const texto = valor.trim();
  if (texto === '') return null;
  const numero = Number(texto);
  if (!Number.isFinite(numero) || numero < 0 || numero > 100) return NaN;
  return Math.round(numero * 100) / 100;
}

const clave = (idEvaluacion: number, ci: string) => `${idEvaluacion}|${ci}`;

function textoDeNota(valor: number | null | undefined): string {
  return valor === null || valor === undefined ? '' : String(valor);
}

function BadgeCertificado({ tipo }: { tipo: string | null }) {
  if (tipo === 'APROBADO') {
    return (
      <span className="px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
        Aprobado
      </span>
    );
  }
  if (tipo === 'ASISTENCIA') {
    return (
      <span className="px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
        Asistencia
      </span>
    );
  }
  if (tipo === 'PENDIENTE') {
    return (
      <span className="px-2 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">
        Pendiente
      </span>
    );
  }
  return <span className="text-xs text-text-muted italic">Sin nota</span>;
}

function BadgeHabilitado({ elegible }: { elegible: boolean }) {
  return elegible ? (
    <span className="text-xs font-semibold text-green-700 bg-green-100 px-2 py-1 rounded-full">
      Sí
    </span>
  ) : (
    <span
      className="text-xs font-semibold text-red-700 bg-red-100 px-2 py-1 rounded-full"
      title="Supera el máximo de 3 ausencias"
    >
      No
    </span>
  );
}

function CeldaNota({
  ci,
  idEvaluacion,
  valor,
  invalida,
  cambiada,
  onChange,
}: {
  ci: string;
  idEvaluacion: number;
  valor: string;
  invalida: boolean;
  cambiada: boolean;
  onChange: (ci: string, idEvaluacion: number, texto: string) => void;
}) {
  return (
    <input
      type="number"
      min={0}
      max={100}
      step={0.5}
      value={valor}
      onChange={(event) => onChange(ci, idEvaluacion, event.target.value)}
      placeholder="—"
      className={`w-20 border rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-1 ${
        invalida
          ? 'border-red-500 focus:border-red-500 focus:ring-red-300'
          : cambiada
            ? 'border-yellow-400 bg-yellow-50 focus:border-primary focus:ring-primary'
            : 'border-input-border focus:border-primary focus:ring-primary'
      }`}
    />
  );
}

export function GradeMatrix({ codigoCurso }: { codigoCurso: string }) {
  const [detalle, setDetalle] = useState<DetalleNotasCurso | null>(null);
  const [cargando, setCargando] = useState(true);
  const [borrador, setBorrador] = useState<Record<string, string>>({});
  const [originales, setOriginales] = useState<Record<string, string>>({});
  const [pagina, setPagina] = useState(1);

  // Gestión de evaluaciones
  const [formVisible, setFormVisible] = useState(false);
  const [editando, setEditando] = useState<EvaluacionResumen | null>(null);
  const [nombre, setNombre] = useState('');
  const [peso, setPeso] = useState('');
  const [eliminando, setEliminando] = useState<EvaluacionResumen | null>(null);

  const { call, loading } = useApi();

  const recargar = useCallback(async () => {
    const res = await call<DetalleNotasCurso>(`/api/asistencia/curso/${codigoCurso}/notas`);
    if (res?.ok) {
      setDetalle(res.data);
      const orig: Record<string, string> = {};
      const actuales: Record<string, string> = {};

      for (const estudiante of res.data.estudiantes) {
        if (res.data.modo === 'evaluaciones') {
          for (const evaluacion of res.data.evaluaciones) {
            const texto = textoDeNota(estudiante.notas[evaluacion.id]);
            orig[clave(evaluacion.id, estudiante.ci)] = texto;
            actuales[clave(evaluacion.id, estudiante.ci)] = texto;
          }
        } else {
          const texto = textoDeNota(estudiante.promedio);
          orig[clave(ID_UNICO, estudiante.ci)] = texto;
          actuales[clave(ID_UNICO, estudiante.ci)] = texto;
        }
      }

      setOriginales(orig);
      setBorrador(actuales);
    }
    setCargando(false);
  }, [call, codigoCurso]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCargando(true);
    setPagina(1);
    recargar();
  }, [recargar]);

  const modo = detalle?.modo ?? 'nota_unica';
  const evaluaciones = useMemo(() => detalle?.evaluaciones ?? [], [detalle]);
  const estudiantes = useMemo(() => detalle?.estudiantes ?? [], [detalle]);
  const resumen = detalle?.resumen;
  const notaMinima = resumen?.notaMinima ?? 70;

  const cambios = useMemo(() => {
    const lista: { ci: string; idEvaluacion: number; valor: number | null }[] = [];
    let invalidas = 0;

    for (const [key, texto] of Object.entries(borrador)) {
      const original = originales[key] ?? '';
      if (texto.trim() === original.trim()) continue;

      const valor = validar(texto);
      if (Number.isNaN(valor)) {
        invalidas++;
        continue;
      }
      const [idTexto, ci] = key.split('|');
      lista.push({ ci, idEvaluacion: Number(idTexto), valor });
    }

    return { lista, invalidas };
  }, [borrador, originales]);

  const totalPesos = useMemo(
    () => Math.round(evaluaciones.reduce((suma, e) => suma + e.peso, 0) * 100) / 100,
    [evaluaciones],
  );

  const cambiarNota = useCallback((ci: string, idEvaluacion: number, texto: string) => {
    setBorrador((prev) => ({ ...prev, [clave(idEvaluacion, ci)]: texto }));
  }, []);

  const guardar = async () => {
    if (cambios.invalidas > 0) {
      toast.error(
        `Hay ${cambios.invalidas} nota${cambios.invalidas === 1 ? '' : 's'} inválida${cambios.invalidas === 1 ? '' : 's'} (debe estar entre 0 y 100).`,
      );
      return;
    }
    if (cambios.lista.length === 0) {
      toast.info('No hay cambios pendientes.');
      return;
    }

    // Modo nota única: una sola nota final por estudiante.
    if (modo === 'nota_unica') {
      const lista = cambios.lista
        .filter((cambio) => cambio.idEvaluacion === ID_UNICO && cambio.valor !== null)
        .map((cambio) => ({ ci: cambio.ci, notaFinal: cambio.valor as number }));

      if (lista.length === 0) {
        toast.info('No hay cambios pendientes.');
        return;
      }

      const res = await call<{ guardados: number; restantes: number }>(
        `/api/asistencia/curso/${codigoCurso}/notas`,
        { method: 'PUT', body: { notas: lista } },
      );
      if (!res?.ok) return;

      toast.success(
        res.data.restantes === 0
          ? `${res.data.guardados} nota(s) guardada(s). Todos los estudiantes tienen nota.`
          : `${res.data.guardados} nota(s) guardada(s). Faltan ${res.data.restantes} por registrar.`,
      );
      await recargar();
      return;
    }

    // Modo evaluaciones: un guardado por evaluación afectada.
    const porEvaluacion = new Map<number, { ci: string; valor: number | null }[]>();
    for (const cambio of cambios.lista) {
      const actual = porEvaluacion.get(cambio.idEvaluacion) ?? [];
      actual.push({ ci: cambio.ci, valor: cambio.valor });
      porEvaluacion.set(cambio.idEvaluacion, actual);
    }

    for (const [idEvaluacion, notas] of porEvaluacion) {
      const res = await call<{ guardados: number; restantes: number }>(
        `/api/asistencia/curso/${codigoCurso}/evaluaciones/${idEvaluacion}/notas`,
        { method: 'PUT', body: { notas } },
      );
      if (!res?.ok) return;
    }

    toast.success('Notas guardadas. Promedios recalculados.');
    await recargar();
  };

  const abrirFormulario = (evaluacion?: EvaluacionResumen) => {
    setEditando(evaluacion ?? null);
    setNombre(evaluacion?.nombre ?? '');
    setPeso(evaluacion ? String(evaluacion.peso) : '');
    setFormVisible(true);
  };

  const cancelarFormulario = () => {
    setFormVisible(false);
    setEditando(null);
    setNombre('');
    setPeso('');
  };

  const guardarEvaluacion = async () => {
    const cuerpo = { nombre, peso: Number(peso) };
    const res = editando
      ? await call<EvaluacionResumen>(
          `/api/asistencia/curso/${codigoCurso}/evaluaciones/${editando.id}`,
          { method: 'PATCH', body: cuerpo },
        )
      : await call<EvaluacionResumen>(`/api/asistencia/curso/${codigoCurso}/evaluaciones`, {
          method: 'POST',
          body: cuerpo,
        });
    if (!res?.ok) return;

    toast.success(
      editando
        ? 'Evaluación actualizada. Promedios recalculados.'
        : 'Evaluación creada. Ya puedes registrar notas.',
    );
    cancelarFormulario();
    await recargar();
  };

  const confirmarEliminacion = async () => {
    if (!eliminando) return;
    const res = await call<{ eliminadas: number }>(
      `/api/asistencia/curso/${codigoCurso}/evaluaciones/${eliminando.id}`,
      { method: 'DELETE' },
    );
    setEliminando(null);
    if (!res?.ok) return;

    toast.success(
      res.data.eliminadas > 0
        ? `Evaluación eliminada con ${res.data.eliminadas} nota(s). Promedios recalculados.`
        : 'Evaluación eliminada.',
    );
    await recargar();
  };

  if (cargando) {
    return <div className="p-8 text-center text-text-muted">Cargando estudiantes...</div>;
  }

  if (!detalle) {
    return <div className="p-8 text-center text-text-muted">No se pudieron cargar las notas.</div>;
  }

  if (estudiantes.length === 0) {
    return (
      <div className="p-8 text-center text-text-muted">
        No hay estudiantes inscritos en este curso.
      </div>
    );
  }

  const totalPaginas = Math.max(1, Math.ceil(estudiantes.length / POR_PAGINA));
  const paginaActual = Math.min(pagina, totalPaginas);
  const visibles = estudiantes.slice((paginaActual - 1) * POR_PAGINA, paginaActual * POR_PAGINA);

  return (
    <div className="flex flex-col gap-4">
      {/* Resumen del curso */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="bg-white border border-card-border rounded-xl p-4 shadow-sm">
          <p className="text-xs text-text-muted font-semibold">Promedio general</p>
          <p className="text-xl font-bold text-primary">
            {resumen?.promedioGeneral ?? '—'}
          </p>
        </div>
        <div className="bg-white border border-card-border rounded-xl p-4 shadow-sm">
          <p className="text-xs text-text-muted font-semibold">Aprobados</p>
          <p className="text-xl font-bold text-green-700">{resumen?.aprobados ?? 0}</p>
          <p className="text-[10px] text-text-muted">Nota mínima {notaMinima}</p>
        </div>
        <div className="bg-white border border-card-border rounded-xl p-4 shadow-sm">
          <p className="text-xs text-text-muted font-semibold">Reprobados</p>
          <p className="text-xl font-bold text-red-700">{resumen?.reprobados ?? 0}</p>
        </div>
        <div className="bg-white border border-card-border rounded-xl p-4 shadow-sm">
          <p className="text-xs text-text-muted font-semibold">Con nota</p>
          <p className="text-xl font-bold text-text-main">
            {resumen?.conNota ?? 0}
            <span className="text-sm text-text-muted"> / {resumen?.inscritos ?? 0}</span>
          </p>
        </div>
        <div className="bg-white border border-card-border rounded-xl p-4 shadow-sm">
          <p className="text-xs text-text-muted font-semibold">Sin nota</p>
          <p className="text-xl font-bold text-yellow-700">{resumen?.sinNota ?? 0}</p>
        </div>
      </div>

      {/* Gestión de evaluaciones */}
      <div className="bg-white border border-card-border rounded-xl p-4 shadow-sm flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm font-semibold text-text-main">Evaluaciones del curso</span>

          {evaluaciones.length > 0 && (
            <span
              className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                totalPesos === 100
                  ? 'bg-green-100 text-green-800'
                  : 'bg-yellow-100 text-yellow-800'
              }`}
              title="El promedio se normaliza aunque no sumen 100"
            >
              Total pesos: {totalPesos}%
            </span>
          )}

          <div className="flex-1" />

          <Button
            variant="outline"
            size="sm"
            icon={<Plus size={16} />}
            onClick={() => abrirFormulario()}
          >
            Agregar evaluación
          </Button>
        </div>

        {evaluaciones.length === 0 && (
          <p className="text-xs text-text-muted bg-card-bg border border-card-border rounded-lg p-3">
            Este curso aún no define evaluaciones, por lo que se registra una única nota final.
            Crea evaluaciones (Parcial 1, Trabajos, ...) para calcular el promedio automáticamente.
          </p>
        )}

        {evaluaciones.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {evaluaciones.map((evaluacion) => (
              <span
                key={evaluacion.id}
                className="inline-flex items-center gap-2 bg-card-bg border border-input-border rounded-lg px-3 py-1.5 text-xs font-secondary"
              >
                <span className="font-semibold text-text-main">{evaluacion.nombre}</span>
                <span className="text-text-muted">{evaluacion.peso}%</span>
                <button
                  onClick={() => abrirFormulario(evaluacion)}
                  className="text-text-muted hover:text-primary transition-colors"
                  title="Editar evaluación"
                >
                  <Pencil size={13} />
                </button>
                <button
                  onClick={() => setEliminando(evaluacion)}
                  className="text-text-muted hover:text-red-600 transition-colors"
                  title="Eliminar evaluación y sus notas"
                >
                  <Trash2 size={13} />
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Formulario crear / editar */}
        {formVisible && (
          <div className="flex flex-wrap items-end gap-3 border-t border-card-border pt-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-text-muted">Nombre</label>
              <input
                type="text"
                value={nombre}
                onChange={(event) => setNombre(event.target.value)}
                placeholder="Ej. Parcial 1"
                maxLength={80}
                className="w-56 border border-input-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-text-muted">Peso (%)</label>
              <input
                type="number"
                min={0}
                max={100}
                step={0.5}
                value={peso}
                onChange={(event) => setPeso(event.target.value)}
                placeholder="30"
                className="w-28 border border-input-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>
            <Button variant="primary" size="sm" icon={<Save size={16} />} onClick={guardarEvaluacion}>
              {editando ? 'Guardar cambios' : 'Crear'}
            </Button>
            <Button variant="outline" size="sm" icon={<X size={16} />} onClick={cancelarFormulario}>
              Cancelar
            </Button>
          </div>
        )}
      </div>

      {/* Guardar notas */}
      <div className="flex flex-wrap items-center gap-3 bg-white border border-card-border rounded-xl p-4 shadow-sm">
        <div className="flex items-center gap-2">
          <Award size={16} className="text-primary" />
          <span className="text-sm font-semibold text-text-main">
            {resumen?.conNota ?? 0} de {resumen?.inscritos ?? 0} estudiantes con nota
          </span>
        </div>

        <div className="w-40 h-2.5 rounded-full bg-card-bg overflow-hidden">
          <div
            className={`h-2.5 rounded-full ${
              (resumen?.sinNota ?? 1) === 0 ? 'bg-green-500' : 'bg-primary'
            }`}
            style={{
              width: `${
                resumen && resumen.inscritos > 0
                  ? Math.round((resumen.conNota / resumen.inscritos) * 100)
                  : 0
              }%`,
            }}
          />
        </div>

        <div className="flex-1" />

        {cambios.invalidas > 0 && (
          <span className="text-xs font-semibold text-red-700 bg-red-100 px-2.5 py-1 rounded-full">
            {cambios.invalidas} nota{cambios.invalidas === 1 ? '' : 's'} inválida
            {cambios.invalidas === 1 ? '' : 's'}
          </span>
        )}
        {cambios.lista.length > 0 && (
          <span className="text-xs font-semibold text-yellow-700 bg-yellow-100 px-2.5 py-1 rounded-full">
            {cambios.lista.length} cambio{cambios.lista.length === 1 ? '' : 's'} sin guardar
          </span>
        )}
        <Button
          variant="primary"
          size="sm"
          icon={<Save size={16} />}
          onClick={guardar}
          disabled={loading || cambios.lista.length === 0 || cambios.invalidas > 0}
        >
          {loading ? 'Guardando...' : 'Guardar notas'}
        </Button>
      </div>

      {(resumen?.sinNota ?? 1) === 0 && (
        <div className="text-xs font-semibold text-green-700 bg-green-50 border border-green-100 rounded-lg p-3">
          Todos los estudiantes tienen nota: el curso está listo para la emisión de certificados.
        </div>
      )}

      {/* Tabla de notas */}
      <div className="bg-white border border-card-border rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-card-bg text-text-muted font-secondary text-sm border-b border-card-border">
              <tr>
                <th className="p-4 font-semibold w-12">N°</th>
                <th className="p-4 font-semibold">Estudiante</th>
                <th className="p-4 font-semibold">Asistencia</th>
                {modo === 'evaluaciones' ? (
                  evaluaciones.map((evaluacion) => (
                    <th key={evaluacion.id} className="p-4 font-semibold">
                      {evaluacion.nombre}
                      <span className="block text-[10px] text-text-muted font-normal">
                        {evaluacion.peso}%
                      </span>
                    </th>
                  ))
                ) : (
                  <>
                    <th className="p-4 font-semibold">Desglose</th>
                    <th className="p-4 font-semibold">Nota (0-100)</th>
                  </>
                )}
                <th className="p-4 font-semibold">
                  {modo === 'evaluaciones' ? 'Promedio' : 'Nota final'}
                </th>
                <th className="p-4 font-semibold">Habilitado</th>
                <th className="p-4 font-semibold">Certificado</th>
              </tr>
            </thead>
            <tbody className="font-secondary text-sm">
              {visibles.map((fila: EstudianteNotas, indice) => {
                const filaInvalida =
                  modo === 'evaluaciones'
                    ? evaluaciones.some((evaluacion) => {
                        const texto = borrador[clave(evaluacion.id, fila.ci)] ?? '';
                        return texto.trim() !== '' && Number.isNaN(validar(texto));
                      })
                    : (() => {
                        const texto = borrador[clave(ID_UNICO, fila.ci)] ?? '';
                        return texto.trim() !== '' && Number.isNaN(validar(texto));
                      })();

                const filaCambiada =
                  modo === 'evaluaciones'
                    ? evaluaciones.some((evaluacion) => {
                        const key = clave(evaluacion.id, fila.ci);
                        return (borrador[key] ?? '').trim() !== (originales[key] ?? '').trim();
                      })
                    : (() => {
                        const key = clave(ID_UNICO, fila.ci);
                        return (borrador[key] ?? '').trim() !== (originales[key] ?? '').trim();
                      })();

                // Promedio en vivo: se recalcula con lo que hay en pantalla.
                const enPantalla: Record<number, number> = {};
                for (const evaluacion of evaluaciones) {
                  const valor = validar(borrador[clave(evaluacion.id, fila.ci)] ?? '');
                  enPantalla[evaluacion.id] = Number.isNaN(valor) || valor === null ? NaN : valor;
                }
                const promedioVivo =
                  modo === 'evaluaciones'
                    ? promedioDe(enPantalla, evaluaciones)
                    : (() => {
                        const texto = borrador[clave(ID_UNICO, fila.ci)] ?? '';
                        const valor = validar(texto);
                        return valor === null || Number.isNaN(valor) ? fila.promedio : valor;
                      })();

                return (
                  <tr
                    key={fila.ci}
                    className={`border-b border-card-border ${
                      filaInvalida
                        ? 'bg-red-50'
                        : filaCambiada
                          ? 'bg-yellow-50'
                          : 'hover:bg-gray-50'
                    }`}
                  >
                    <td className="p-4 text-text-muted text-xs">
                      {(paginaActual - 1) * POR_PAGINA + indice + 1}
                    </td>
                    <td className="p-4">
                      <p className="font-bold text-text-main">
                        {fila.apellidos} {fila.nombres}
                      </p>
                      <p className="text-text-muted text-xs">
                        CI: {fila.ci} &middot; SIS: {fila.codigoSis}
                      </p>
                    </td>
                    <td className="p-4">
                      <span className="text-sm font-bold text-text-main">{fila.pctAsistencia}%</span>
                      <p className="text-[10px] text-text-muted">
                        P: {fila.presentes} &middot; J: {fila.justificadas} &middot; A:{' '}
                        {fila.ausentes}
                      </p>
                    </td>

                    {modo === 'evaluaciones' ? (
                      evaluaciones.map((evaluacion) => {
                        const key = clave(evaluacion.id, fila.ci);
                        const texto = borrador[key] ?? '';
                        const invalida = texto.trim() !== '' && Number.isNaN(validar(texto));
                        const cambiada = texto.trim() !== (originales[key] ?? '').trim();
                        return (
                          <td key={evaluacion.id} className="p-4">
                            <CeldaNota
                              ci={fila.ci}
                              idEvaluacion={evaluacion.id}
                              valor={texto}
                              invalida={invalida}
                              cambiada={cambiada}
                              onChange={cambiarNota}
                            />
                          </td>
                        );
                      })
                    ) : (
                      <>
                        <td className="p-4 text-xs text-text-muted">
                          P: {fila.presentes} &middot; J: {fila.justificadas} &middot; A:{' '}
                          {fila.ausentes}
                        </td>
                        <td className="p-4">
                          <CeldaNota
                            ci={fila.ci}
                            idEvaluacion={ID_UNICO}
                            valor={borrador[clave(ID_UNICO, fila.ci)] ?? ''}
                            invalida={(() => {
                              const texto = borrador[clave(ID_UNICO, fila.ci)] ?? '';
                              return texto.trim() !== '' && Number.isNaN(validar(texto));
                            })()}
                            cambiada={(() => {
                              const key = clave(ID_UNICO, fila.ci);
                              return (borrador[key] ?? '').trim() !== (originales[key] ?? '').trim();
                            })()}
                            onChange={cambiarNota}
                          />
                        </td>
                      </>
                    )}

                    <td className="p-4">
                      {promedioVivo === null ? (
                        <span className="text-xs text-text-muted italic">—</span>
                      ) : (
                        <span
                          className={`text-sm font-bold ${
                            promedioVivo >= notaMinima ? 'text-green-700' : 'text-red-700'
                          }`}
                          title={
                            modo === 'evaluaciones'
                              ? 'Promedio ponderado de las evaluaciones con nota'
                              : 'Nota final registrada'
                          }
                        >
                          {promedioVivo}
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                      <BadgeHabilitado elegible={fila.elegibleCertificado} />
                    </td>
                    <td className="p-4">
                      <BadgeCertificado tipo={fila.tipoCertificado} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        {totalPaginas > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-card-border bg-card-bg font-secondary text-sm">
            <button
              onClick={() => setPagina((p) => Math.max(1, p - 1))}
              disabled={paginaActual === 1}
              className="px-3 py-1.5 rounded-lg border border-input-border bg-white text-text-main disabled:opacity-40 hover:bg-gray-50"
            >
              Anterior
            </button>
            <span className="text-text-muted">
              Página {paginaActual} de {totalPaginas} ({estudiantes.length} estudiantes)
            </span>
            <button
              onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
              disabled={paginaActual === totalPaginas}
              className="px-3 py-1.5 rounded-lg border border-input-border bg-white text-text-main disabled:opacity-40 hover:bg-gray-50"
            >
              Siguiente
            </button>
          </div>
        )}
      </div>

      {/* Leyenda */}
      <p className="text-xs text-text-muted">
        Las notas se registran de 0 a 100.
        {modo === 'evaluaciones'
          ? ' El promedio es ponderado según el peso de cada evaluación y se recalcula automáticamente. '
          : ' '}
        Se requiere nota mínima {notaMinima} para <span className="font-semibold">Aprobado</span>.
      </p>

      {/* Confirmar eliminación de evaluación */}
      {eliminando && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 flex flex-col gap-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-primary font-bold text-text-main">Eliminar evaluación</h3>
                <p className="text-text-muted text-sm mt-1">
                  Vas a eliminar <span className="font-semibold">{eliminando.nombre}</span> (
                  {eliminando.peso}%).
                </p>
              </div>
              <button
                onClick={() => setEliminando(null)}
                className="text-text-muted hover:text-text-main"
              >
                <X size={20} />
              </button>
            </div>

            {eliminando.totalNotas > 0 && (
              <p className="text-xs text-yellow-800 bg-yellow-50 border border-yellow-100 rounded-lg p-3">
                Esta evaluación tiene {eliminando.totalNotas} nota
                {eliminando.totalNotas === 1 ? '' : 's'} cargada
                {eliminando.totalNotas === 1 ? '' : 's'}. Se eliminarán y los promedios se
                recalcularán sin ella.
              </p>
            )}

            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setEliminando(null)}>
                Cancelar
              </Button>
              <Button
                variant="secondary"
                size="sm"
                icon={<Trash2 size={16} />}
                onClick={confirmarEliminacion}
                disabled={loading}
              >
                {loading ? 'Eliminando...' : 'Eliminar'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/** Promedio ponderado en vivo (mismo criterio que el backend). */
function promedioDe(
  notas: Record<number, number>,
  evaluaciones: { id: number; peso: number }[],
): number | null {
  let sumaPonderada = 0;
  let sumaPesos = 0;

  for (const evaluacion of evaluaciones) {
    const valor = notas[evaluacion.id];
    if (valor === null || valor === undefined || Number.isNaN(valor)) continue;
    sumaPonderada += valor * evaluacion.peso;
    sumaPesos += evaluacion.peso;
  }

  if (sumaPesos <= 0) return null;
  return Math.round((sumaPonderada / sumaPesos) * 100) / 100;
}
