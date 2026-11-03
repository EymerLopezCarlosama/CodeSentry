import { createBrowserRouter } from "react-router-dom";
import App from "../App";
import Analisis from "../pages/Analisis";
import Checklist from "../pages/Checklist";
import Dashboard from "../pages/Dashboard";
import NuevoProyecto from "../pages/NuevoProyecto";
import Proyectos from "../pages/Proyectos";
import Reporte from "../pages/Reporte";
import Resultados from "../pages/Resultados";
import Revision from "../pages/Revision";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      { index: true, element: <Dashboard /> },
      { path: "proyectos", element: <Proyectos /> },
      { path: "proyectos/nuevo", element: <NuevoProyecto /> },
      { path: "revision", element: <Revision /> },
      { path: "analisis", element: <Analisis /> },
      { path: "analisis/:id/resultados", element: <Resultados /> },
      { path: "analisis/:id/checklist", element: <Checklist /> },
      { path: "analisis/:id/reporte", element: <Reporte /> },
    ],
  },
]);