// PROMPT — services/dashboard.service.ts — Dashboard (HU-10)
//
// Funciones: obtener() → totales, por severidad, checklist y por proyecto.
// Cada función usa api<T>() de services/api.ts y devuelve tipos de types/index.ts. Sin lógica de pantalla.
//
// Depende de: services/api.ts, types/index.ts
// Referencia: docs/api-contract.md (sección "Dashboard")

import { api } from "./api";
import type { Dashboard } from "../types";

export function obtener(): Promise<Dashboard> {
  return api<Dashboard>("/dashboard");
}