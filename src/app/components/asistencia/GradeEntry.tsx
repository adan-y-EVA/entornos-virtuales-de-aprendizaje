'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Award, Save } from 'lucide-react';
import { toast } from 'sonner';
import { useApi } from '@/src/hooks/useApi';
import { Button } from '../Button';
import type { EstudianteCursoEstado, ResultadoNotas } from './types';

const POR_PAGINA = 25;

function validar(valor: string): number | null {
  const texto = valor.trim();
  if (texto === '') return null;
  const numero = Number(texto);
  if (!Number.isFinite(numero) || numero < 0 || numero > 100) return NaN;
  return Math.round(numero * 100) / 100;
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

export function GradeEntry({ codigoCurso }: { codigoCurso: string }) {
  const [filas, setFilas] = useState<EstudianteCursoEstado[]>([]);
  const [originales, setOriginales] = useState<Record<string, number>>({});
  const [notas, setNotas] = useState<Record<string, string>>({});
  const [cargando, setCargando] = useState(true);
  const [pagina, setPagina] = useState(1);
  const { call, loading } = useApi();

  const recargar = useCallback(async () => {
    const res = await call<EstudianteCursoEstado[]>(
      `/api/asistencia/curso/${codigoCurso}/stats`,
    );
    if (res?.ok) {
      setFilas(res.data);
      const orig: Record<string, number> = {};
      const actuales: Record<string, string> = {};
      for (const fila of res.data) {
        if (fila.notaFinal !== null) {
          orig[fila.ci] = fila.notaFinal;
          actuales[fila.ci] = String(fila.notaFinal);
        } else {
          actuales[fila.ci] = '';
        }
      }
      setOriginales(orig);
      setNotas(actuales);
      setCargando(false);
    } else {
      setCargando(false);
    }
  }, [call, codigoCurso]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPagina(1);
    recargar();
  }, [recargar]);

  const cambios = useMemo(() => {
    const lista: { ci: string; notaFinal: number }[] = [];
    let invalidas = 0;
    for (const fila of filas) {
      const texto = notas[fila.ci] ?? '';
      const valor = validar(texto);
      if (texto.trim() !== '' && (valor === null || Number.isNaN(valor))) {
        invalidas++;
        continue;
      }
      if (valor === null) continue;
      if (originales[fila.ci] === undefined || Math.abs(originales[fila.ci] - valor) > 0.001) {
        lista.push({ ci: fila.ci, notaFinal: valor });
      }
    }
    return { lista, invalidas };
  }, [filas, notas, originales]);

  const conNota = filas.filter((fila) => fila.notaFinal !== null).length;
  const todosConNota = filas.length > 0 && conNota === filas.length;

  const guardar = async () => {
    if (cambios.invalidas > 0) {
      toast.error(`Hay ${cambios.invalidas} nota${cambios.invalidas === 1 ? '' : 's'} inválida${cambios.invalidas === 1 ? '' : 's'} (debe estar entre 0 y 100).`);
      return;
    }
    if (cambios.lista.length === 0) {
      toast.info('No hay cambios pendientes.');
      return;
    }

    const res = await call<ResultadoNotas>(
      `/api/asistencia/curso/${codigoCurso}/notas`,
      { method: 'PUT', body: { notas: cambios.lista } },
    );
    if (!res?.ok) return;

    toast.success(
      res.data.restantes === 0
        ? `${res.data.guardados} nota(s) guardada(s). Todos los estudiantes tienen nota.`
        : `${res.data.guardados} nota(s) guardada(s). Faltan ${res.data.restantes} por registrar.`,
    );
    await recargar();
  };

  if (cargando) {
    return <div className="p-8 text-center text-text-muted">Cargando estudiantes...</div>;
  }

  if (filas.length === 0) {
    return (
      <div className="p-8 text-center text-text-muted">
        No hay estudiantes inscritos en este curso.
      </div>
    );
  }

  const totalPaginas = Math.max(1, Math.ceil(filas.length / POR_PAGINA));
  const paginaActual = Math.min(pagina, totalPaginas);
  const visibles = filas.slice((paginaActual - 1) * POR_PAGINA, paginaActual * POR_PAGINA);

  return (
    <div className="flex flex-col gap-4">
      {/* Resumen + guardar */}
      <div className="flex flex-wrap items-center gap-3 bg-white border border-card-border rounded-xl p-4 shadow-sm">
        <div className="flex items-center gap-2">
          <Award size={16} className="text-primary" />
          <span className="text-sm font-semibold text-text-main">
            {conNota} de {filas.length} estudiantes con nota
          </span>
        </div>

        <div className="w-40 h-2.5 rounded-full bg-card-bg overflow-hidden">
          <div
            className={`h-2.5 rounded-full ${todosConNota ? 'bg-green-500' : 'bg-primary'}`}
            style={{ width: `${filas.length > 0 ? Math.round((conNota / filas.length) * 100) : 0}%` }}
          />
        </div>

        <div className="flex-1" />

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

      {todosConNota && (
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
                <th className="p-4 font-semibold">Desglose</th>
                <th className="p-4 font-semibold">Habilitado</th>
                <th className="p-4 font-semibold">Nota (0-100)</th>
                <th className="p-4 font-semibold">Certificado</th>
              </tr>
            </thead>
            <tbody className="font-secondary text-sm">
              {visibles.map((fila, indice) => {
                const texto = notas[fila.ci] ?? '';
                const valor = validar(texto);
                const invalido = texto.trim() !== '' && (valor === null || Number.isNaN(valor));
                const original = originales[fila.ci];
                const nuevoValor = valor !== null && !Number.isNaN(valor) ? valor : null;
                const cambiado =
                  nuevoValor !== null &&
                  (original === undefined || Math.abs(original - nuevoValor) > 0.001);

                return (
                  <tr
                    key={fila.ci}
                    className={`border-b border-card-border ${
                      invalido
                        ? 'bg-red-50'
                        : cambiado
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
                    </td>
                    <td className="p-4 text-xs text-text-muted">
                      P: {fila.presentes} &middot; J: {fila.justificadas} &middot; A:{' '}
                      {fila.ausentes}
                    </td>
                    <td className="p-4">
                      {fila.elegibleCertificado ? (
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
                      )}
                    </td>
                    <td className="p-4">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        step={0.5}
                        value={texto}
                        onChange={(event) =>
                          setNotas((prev) => ({ ...prev, [fila.ci]: event.target.value }))
                        }
                        placeholder="—"
                        className={`w-24 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 ${
                          invalido
                            ? 'border-red-500 focus:border-red-500 focus:ring-red-300'
                            : 'border-input-border focus:border-primary focus:ring-primary'
                        }`}
                      />
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
              Página {paginaActual} de {totalPaginas} ({filas.length} estudiantes)
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
        Las notas se registran de 0 a 100. Los certificados se finalizan al emitir: se requiere
        nota mínima 70 para <span className="font-semibold">Aprobado</span>.
      </p>
    </div>
  );
}
