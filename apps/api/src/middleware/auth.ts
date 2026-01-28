import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { prisma } from "@puenteflow/db";
import { config } from "../config";

export interface AuthRequest extends Request {
  user?: { id: string; email: string };
  workspaceId?: string;
  role?: string;
}

export const authMiddleware = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const header = req.headers.authorization;
  if (!header) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const token = header.replace("Bearer ", "");
  try {
    const payload = jwt.verify(token, config.jwtSecret) as { sub: string; email: string };
    req.user = { id: payload.sub, email: payload.email };

    const workspaceId = req.headers["x-workspace-id"] as string | undefined;
    if (workspaceId) {
      const membership = await prisma.workspaceMember.findFirst({
        where: { workspaceId, userId: payload.sub }
      });
      if (!membership) {
        return res.status(403).json({ error: "No access to workspace" });
      }
      req.workspaceId = workspaceId;
      req.role = membership.role;
    }
    return next();
  } catch (error) {
    return res.status(401).json({ error: "Invalid token" });
  }
};

export const requireWorkspace = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.workspaceId) {
    return res.status(400).json({ error: "Missing workspace header" });
  }
  return next();
};

export const requireRole = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.role || !roles.includes(req.role)) {
      return res.status(403).json({ error: "Insufficient role" });
    }
    return next();
  };
};
