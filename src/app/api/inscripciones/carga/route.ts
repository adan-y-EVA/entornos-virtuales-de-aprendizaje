import * as XLSX from "xlsx";
import { logger } from "@/src/lib/logger";
import { ok, fail } from "@/src/lib/api-response";
import type { ErrorValidacion } from "@/src/lib/inscripciones";
import type { EstadoPago } from "@/src/lib/estados-pago";
import {
  COL,
  COLUMNAS_REQUERIDAS,
  ErrorInscripcion,
  obtenerCurso,
  parsearMonto,
  registrarInscripcion,
  validarCamposFormulario,
} from "@/src/lib/inscripciones";

const MAXIMO_FILAS = 5000;

const COLUMNAS_OPCIONALES = [COL.email, COL.celular, COL.codigoSis, COL.montoPagado];

function estadoDePago(monto: number, precio: number): EstadoPago {
  if (monto <= 0) return "PENDIENTE";
  if (monto >= precio) return "PAGADO_TOTAL";
  return "PARCIAL";
}

export interface FilaReporte {
  fila: number;
  ciEstudiante: string;
  nombres: string;
  apellidos: string;
  estado: "OK" | "ERROR";
  errores: ErrorValidacion[];
}

function clave(columna: string): string {
  return columna
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[\s_-]+/g, "");
}

function mapearEncabezados(encabezados: unknown[]): Map<string, string> {
  const mapa = new Map<string, string>();
  const conocidas = new Set([...COLUMNAS_REQUERIDAS, ...COLUMNAS_OPCIONALES]);

  for (const encabezado of encabezados) {
    const texto = String(encabezado ?? "").trim();
    if (!texto) continue;
    for (const conocida of conocidas) {
      if (clave(conocida) === clave(texto)) {
        mapa.set(texto, conocida);
      }
    }
  }

  return mapa;
}

function aTexto(valor: unknown): string {
  if (valor === null || valor === undefined) return "";
  return String(valor).trim();
}

export async function POST(request: Request) {
  let formData: FormData;

  try {
    formData = await request.formData();
  } catch {
    return fail(
      "No se pudo leer el archivo. Se esperaba un formulario con el campo 'archivo' y 'codigoCurso'.",
      400,
    );
  }

  const archivo = formData.get("archivo");
  const codigoCurso = String(formData.get("codigoCurso") ?? "").trim();

  if (!(archivo instanceof File)) {
    return fail("No se seleccionó ningún archivo.", 400);
  }

  const extension = archivo.name.split(".").pop()?.toLowerCase();
  if (extension !== "csv" && extension !== "xlsx") {
    return fail(`El formato "${extension ?? "desconocido"}" no está soportado. Usa .csv o .xlsx.`, 400);
  }

  if (!codigoCurso) {
    return fail("Debes indicar el curso destino de la carga.", 400);
  }

  const curso = await obtenerCurso(codigoCurso);
  if (!curso) {
    return fail(`El curso ${codigoCurso} no existe.`, 404, { columna: COL.codigoCurso });
  }

  if (!curso.abiertos) {
    return fail(
      curso.cerradoPorCupo
        ? `El curso ${curso.codigo} fue cerrado por no alcanzar el mínimo de inscritos.`
        : `La inscripción al curso ${curso.codigo} se cerró: la fecha límite (${curso.fechaLimite}) ya pasó.`,
      409,
      { columna: COL.fechaInicio },
    );
  }

  let libro: XLSX.WorkBook;
  try {
    libro = XLSX.read(await archivo.arrayBuffer(), { type: "array", codepage: 65001 });
  } catch {
    return fail("El archivo está corrupto o no se pudo leer.", 400);
  }

  const hoja = libro.Sheets[libro.SheetNames[0]];
  if (!hoja) {
    return fail("El archivo está vacío.", 400);
  }

  const matriz = XLSX.utils.sheet_to_json<unknown[]>(hoja, {
    header: 1,
    defval: "",
    blankrows: false,
  });

  if (matriz.length < 2) {
    return fail("El archivo no tiene filas de datos para procesar.", 400);
  }

  const mapa = mapearEncabezados(matriz[0]);
  const faltantes = COLUMNAS_REQUERIDAS.filter(
    (columna) => !Array.from(mapa.values()).includes(columna),
  );

  if (faltantes.length > 0) {
    return fail(
      `Al archivo le faltan columnas obligatorias: ${faltantes.join(", ")}.`,
      400,
      { columnas: faltantes },
    );
  }

  if (matriz.length - 1 > MAXIMO_FILAS) {
    return fail(
      `El archivo tiene ${matriz.length - 1} filas y el máximo permitido es ${MAXIMO_FILAS}.`,
      400,
    );
  }

  const reporte: FilaReporte[] = [];

  for (let indice = 1; indice < matriz.length; indice++) {
    const cruda = matriz[indice];
    const filaNumero = indice + 1;

    if (cruda.every((celda) => aTexto(celda) === "")) continue;

    const celdas: Record<string, string> = {};
    for (const [columnaOriginal, columnaEstandar] of mapa) {
      const posicion = matriz[0].indexOf(columnaOriginal);
      celdas[columnaEstandar] = aTexto(cruda[posicion]);
    }

    const montoPagado = parsearMonto(celdas[COL.montoPagado]);

    if (montoPagado.error) {
      reporte.push({
        fila: filaNumero,
        ciEstudiante: celdas[COL.ci],
        nombres: celdas[COL.nombres],
        apellidos: celdas[COL.apellidos],
        estado: "ERROR",
        errores: [{ columna: COL.montoPagado, mensaje: montoPagado.error }],
      });
      continue;
    }

    const costos = curso.costos as Record<string, number>;
    const precio = costos[celdas[COL.tipoPrecio].trim().toUpperCase()] ?? 0;

    const datos = {
      ciEstudiante: celdas[COL.ci],
      nombres: celdas[COL.nombres],
      apellidos: celdas[COL.apellidos],
      tipoPrecio: celdas[COL.tipoPrecio],
      estadoPago: estadoDePago(montoPagado.monto, precio),
      montoFisico: montoPagado.monto,
      email: celdas[COL.email] || undefined,
      celular: celdas[COL.celular] || undefined,
      codigoSis: celdas[COL.codigoSis] || undefined,
    };

    const errores = validarCamposFormulario(datos);

    if (errores.length > 0) {
      reporte.push({
        fila: filaNumero,
        ciEstudiante: datos.ciEstudiante,
        nombres: datos.nombres,
        apellidos: datos.apellidos,
        estado: "ERROR",
        errores,
      });
      continue;
    }

    try {
      await registrarInscripcion({
        ...datos,
        codigoCurso,
        fotocopiaCi: false,
      });

      reporte.push({
        fila: filaNumero,
        ciEstudiante: datos.ciEstudiante,
        nombres: datos.nombres,
        apellidos: datos.apellidos,
        estado: "OK",
        errores: [],
      });
    } catch (error) {
      if (error instanceof ErrorInscripcion) {
        reporte.push({
          fila: filaNumero,
          ciEstudiante: datos.ciEstudiante,
          nombres: datos.nombres,
          apellidos: datos.apellidos,
          estado: "ERROR",
          errores: [{ columna: error.columna, mensaje: error.message }],
        });
        continue;
      }

      logger.error("POST /api/inscripciones/carga (fila inesperada)", { fila: filaNumero, error: error instanceof Error ? error.message : String(error) });
      reporte.push({
        fila: filaNumero,
        ciEstudiante: datos.ciEstudiante,
        nombres: datos.nombres,
        apellidos: datos.apellidos,
        estado: "ERROR",
        errores: [
          {
            columna: COL.ci,
            mensaje: "Error interno al procesar la fila, no se realizó la inscripción.",
          },
        ],
      });
    }
  }

  const exitosos = reporte.filter((fila) => fila.estado === "OK");
  const fallidos = reporte.length - exitosos.length;

  return ok({
    resumen: { total: reporte.length, exitosos: exitosos.length, fallidos },
    filas: reporte,
  });
}
