import { Request, Response } from "express";
import { handleError } from "../utils/ErrorHandle";
import * as usersService from "../services/users.service";

export async function registerDevice(req: Request, res: Response) {
  try {
    const userId = req.user?.userId || "";
    const result = await usersService.registerDevice({ userId, ...req.body });
    return res.json({ success: true, ...result });
  } catch (err: any) {
    return handleError(res, err.status || 500, err.message || "Server error");
  }
}

export async function getTeamMembers(req: Request, res: Response) {
  try {
    const userId = req.user?.userId || "";
    const role = req.user?.role || "";
    
    console.log('🔍 getTeamMembers - userId:', userId, 'role:', role);
    
    // Only commanders can view team
    if (role !== "COMMANDER") {
      console.log('❌ Access denied - not a commander');
      return handleError(res, 403, "Unauthorized - commanders only");
    }
    
    const team = await usersService.getTeamMembers(userId);
    return res.json(team);
  } catch (err: any) {
    return handleError(res, err.status || 500, err.message || "Server error");
  }
}
