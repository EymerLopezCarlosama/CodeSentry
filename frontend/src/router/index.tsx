// PROMPT — router/index.tsx
//
// Exportar `router` con createBrowserRouter: raíz "/" con element <App /> y como hijas: index → Dashboard · /proyectos → Proyectos · /proyectos/nuevo → NuevoProyecto · /revision → Revision (recibe ?proyecto=id) · /analisis/:id/resultados → Resultados · /analisis/:id/checklist → Checklist · /analisis/:id/reporte → Reporte.
//
// Depende de: App.tsx y todas las pages

import { createBrowserRouter } from "react-router-dom";
import App from "../App";
import Dashboard from "../pages/Dashboard";
import Proyectos from "../pages/Proyectos";
import NuevoProyecto from "../pages/NuevoProyecto";
import Revision from "../pages/Revision";
import Checklist from "../pages/Checklist";
import Resultados from "../pages/Resultados";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      { path: "analisis/:id/resultados", element: <Resultados /> },
      { index: true, element: <Dashboard /> },
      { path: "proyectos", element: <Proyectos /> },
      { path: "proyectos/nuevo", element: <NuevoProyecto /> },
      { path: "revision", element: <Revision /> },
      { path: "analisis/:id/checklist", element: <Checklist /> },
    ],
  },
]);