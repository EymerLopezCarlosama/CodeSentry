// PROMPT — main.tsx
//
// Punto de entrada: importar ./index.css y montar <RouterProvider router={router} /> en #root con createRoot.
//
// Depende de: router/index.tsx, index.css

import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import "./index.css";
import { router } from "./router";

createRoot(document.getElementById("root")!).render(<RouterProvider router={router} />);