import { NextFunction, Request, Response } from "express";
import { ZodTypeAny } from "zod";

interface Esquemas { body?: ZodTypeAny; params?: ZodTypeAny; query?: ZodTypeAny }

export const validate = (esquemas: Esquemas) => (req: Request, _res: Response, next: NextFunction) => {
  try {
    if (esquemas.body) req.body = esquemas.body.parse(req.body);
    if (esquemas.params) req.params = esquemas.params.parse(req.params);
    if (esquemas.query) req.query = esquemas.query.parse(req.query);
    next();
  } catch (e) {
    next(e);
  }
};