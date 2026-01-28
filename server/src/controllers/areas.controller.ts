import { Request, Response } from "express";
import { AREAS } from "../config/areas";

export function getAreas(req: Request, res: Response) {
  return res.json({ areas: AREAS });
}
