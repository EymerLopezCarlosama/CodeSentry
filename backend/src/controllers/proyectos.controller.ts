import { NextFunction, Request, Response } from "express";
import * as proyectosService from "../services/proyectos.service";

export async function listar(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const proyectos = await proyectosService.listar();
    res.status(200).json(proyectos);
  } catch (err) {
    next(err);
  }
}

export async function obtener(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const proyecto = await proyectosService.obtener(Number(req.params.id));
    res.status(200).json(proyecto);
  } catch (err) {
    next(err);
  }
}

export async function crear(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const proyecto = await proyectosService.crear(req.body);
    res.status(201).json(proyecto);
  } catch (err) {
    next(err);
  }
}

export async function actualizar(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const proyecto = await proyectosService.actualizar(Number(req.params.id), req.body);
    res.status(200).json(proyecto);
  } catch (err) {
    next(err);
  }
}

export async function eliminar(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await proyectosService.eliminar(Number(req.params.id));
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

export async function listarArchivos(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const archivos = await proyectosService.listarArchivos(Number(req.params.id));
    res.status(200).json(archivos);
  } catch (err) {
    next(err);
  }
}

export async function escanear(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const resultado = await proyectosService.escanearLenguajes(req.body.ruta_carpeta);
    res.status(200).json(resultado);
  } catch (err) {
    next(err);
  }
}