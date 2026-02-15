import { Request, Response } from "express";
import { getAvailableAreas } from "../services/areas.service";

export async function getAreas(req: Request, res: Response) {
  const areas = await getAvailableAreas();
  return res.json({ areas });
}
