import cors from "cors";
import express from "express";
import routes from "./routes";
import { notFound } from "./middlewares/not-found";
import { errorHandler } from "./middlewares/error-handler";

export const app = express();
app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json());
app.use("/api", routes);
app.use(notFound);
app.use(errorHandler);