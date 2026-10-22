import fs from "fs/promises";
import path from "path";
import { env } from "../config/env";
import { AppError } from "../middlewares/error-handler";
import * as reportesRepository from "../repositories/reportes.repository";
import type { AnalisisBasico, DatosReporte } from "../repositories/reportes.repository";
import { FormatoReporte, Reporte } from "../types";
import { createWriteStream } from "fs";
import PDFDocument from "pdfkit";

// REPORTS_DIR es relativo a backend/ (ej. ../storage/reportes)
function carpetaReportes(): string {
  return path.resolve(__dirname, "../..", env.REPORTS_DIR);
}

function escaparHtml(texto: string): string {
  return texto
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function aJson(analisis: AnalisisBasico, datos: DatosReporte): string {
  return JSON.stringify(
    {
      id_analisis: analisis.id_analisis,
      fecha_analisis: analisis.fecha_analisis,
      modelo_ia_usado: analisis.modelo_ia_usado,
      total_hallazgos: datos.total,
      por_severidad: datos.por_severidad,
      por_archivo: datos.por_archivo,
    },
    null,
    2
  );
}

function aHtml(analisis: AnalisisBasico, datos: DatosReporte): string {
  const sev = Object.entries(datos.por_severidad)
    .map(([k, v]) => `<tr><td>${escaparHtml(k)}</td><td>${v}</td></tr>`)
    .join("");
  const arch = datos.por_archivo
    .map((a) => `<tr><td>${escaparHtml(a.ruta_relativa)}</td><td>${a.hallazgos}</td></tr>`)
    .join("");
  return `<!doctype html>
<html lang="es"><head><meta charset="UTF-8"><title>Reporte análisis ${analisis.id_analisis}</title>
<style>body{font-family:system-ui,sans-serif;max-width:720px;margin:2rem auto}
table{border-collapse:collapse;width:100%;margin-bottom:1.5rem}
td,th{border:1px solid #ccc;padding:6px 10px;text-align:left}</style></head>
<body>
<h1>Reporte de análisis #${analisis.id_analisis}</h1>
<p>Fecha: ${escaparHtml(analisis.fecha_analisis)} · Modelo: ${escaparHtml(analisis.modelo_ia_usado)}</p>
<p><strong>Total de hallazgos:</strong> ${datos.total}</p>
<h2>Por severidad</h2><table><tr><th>Severidad</th><th>Hallazgos</th></tr>${sev}</table>
<h2>Por archivo</h2><table><tr><th>Archivo</th><th>Hallazgos</th></tr>${arch}</table>
</body></html>`;
}

function aPdf(analisis: AnalisisBasico, datos: DatosReporte, ruta: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const salida = createWriteStream(ruta);
    salida.on("finish", resolve);
    salida.on("error", reject);
    doc.on("error", reject);
    doc.pipe(salida);

    doc.fontSize(20).text(`Reporte de análisis #${analisis.id_analisis}`);
    doc.moveDown(0.5);
    doc
      .fontSize(11)
      .text(`Fecha: ${analisis.fecha_analisis}   Modelo: ${analisis.modelo_ia_usado}`);
    doc.moveDown();
    doc.fontSize(13).text(`Total de hallazgos: ${datos.total}`);

    doc.moveDown().fontSize(15).text("Por severidad");
    doc.fontSize(11);
    for (const [sev, total] of Object.entries(datos.por_severidad)) {
      doc.text(`• ${sev}: ${total}`);
    }

    doc.moveDown().fontSize(15).text("Por archivo");
    doc.fontSize(11);
    for (const a of datos.por_archivo) {
      doc.text(`• ${a.ruta_relativa}: ${a.hallazgos}`);
    }

    doc.end();
  });
}

export async function generar(
  idAnalisis: number,
  formato: FormatoReporte
): Promise<{ id_reporte: number; formato: FormatoReporte; ruta_archivo: string }> {
  const analisis = await reportesRepository.obtenerAnalisis(idAnalisis);
  if (!analisis) {
    throw new AppError(404, "ANALISIS_NO_ENCONTRADO", "El análisis no existe.");
  }
  if (analisis.estado !== "completado") {
    throw new AppError(
      409,
      "ANALISIS_NO_COMPLETADO",
      "El análisis aún no está completado; no se puede generar el reporte."
    );
  }
  
  const datos = await reportesRepository.datosParaReporte(idAnalisis);

  const carpeta = carpetaReportes();
  await fs.mkdir(carpeta, { recursive: true });
  const nombre = `reporte-${idAnalisis}-${Date.now()}.${formato}`;
  const ruta = path.join(carpeta, nombre);

  if (formato === "pdf") {
    await aPdf(analisis, datos, ruta);
  } else {
    const contenido = formato === "json" ? aJson(analisis, datos) : aHtml(analisis, datos);
    await fs.writeFile(ruta, contenido, "utf-8");
  }

  const id = await reportesRepository.insertar(idAnalisis, formato, ruta);
  return { id_reporte: id, formato, ruta_archivo: ruta };
}

export async function listar(idAnalisis: number): Promise<Reporte[]> {
  return reportesRepository.listarPorAnalisis(idAnalisis);
}

// Devuelve el reporte validando que el archivo siga en disco
export async function descargar(idReporte: number): Promise<Reporte> {
  const reporte = await reportesRepository.obtenerPorId(idReporte);
  if (!reporte) {
    throw new AppError(404, "REPORTE_NO_ENCONTRADO", "El reporte no existe.");
  }
  try {
    await fs.access(reporte.ruta_archivo);
  } catch {
    throw new AppError(404, "ARCHIVO_NO_ENCONTRADO", "El archivo del reporte ya no existe en disco.");
  }
  return reporte;
}