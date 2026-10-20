import { execFile } from "child_process";
import { AppError } from "../middlewares/error-handler";

const TIEMPO_MAXIMO_MS = 5 * 60 * 1000;

// Script fijo: no recibe texto del usuario, así que no se concatena nada.
const SCRIPT_WINDOWS = [
  "[Console]::OutputEncoding = New-Object System.Text.UTF8Encoding $false",
  "Add-Type -AssemblyName System.Windows.Forms",
  "$d = New-Object System.Windows.Forms.FolderBrowserDialog",
  "$d.Description = 'Seleccione la carpeta del proyecto'",
  "$d.ShowNewFolderButton = $false",
  "$f = New-Object System.Windows.Forms.Form",
  "$f.TopMost = $true",
  "if ($d.ShowDialog($f) -eq [System.Windows.Forms.DialogResult]::OK) { [Console]::Out.Write($d.SelectedPath) }",
].join("; ");

function ejecutarPowershell(script: string): Promise<string> {
  return new Promise((resolve, reject) => {
    execFile(
      "powershell.exe",
      ["-NoProfile", "-STA", "-Command", script],
      { windowsHide: true, timeout: TIEMPO_MAXIMO_MS, encoding: "utf8" },
      (error, stdout) => {
        if (error) return reject(error);
        resolve(stdout);
      }
    );
  });
}

// Devuelve la ruta elegida, o null si el usuario cancela.
export async function seleccionarCarpeta(): Promise<string | null> {
  if (process.platform !== "win32") {
    throw new AppError(
      501,
      "SELECTOR_NO_DISPONIBLE",
      "El selector de carpetas solo está disponible en Windows. Escriba la ruta a mano."
    );
  }

  try {
    const salida = await ejecutarPowershell(SCRIPT_WINDOWS);
    const ruta = salida.replace(/^\uFEFF/, "").trim();
    return ruta === "" ? null : ruta;
  } catch {
    throw new AppError(500, "SELECTOR_ERROR", "No se pudo abrir el selector de carpetas.");
  }
}