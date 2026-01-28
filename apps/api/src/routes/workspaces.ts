import { Router, type Request, type Response } from "express";
import { prisma } from "@puenteflow/db";
import { authMiddleware, requireRole } from "../middleware/auth";
import { z } from "zod";

const router = Router();

router.get("/", authMiddleware, async (req: Request, res: Response) => {
  const userId = req.user?.id as string;
  const memberships = await prisma.workspaceMember.findMany({
    where: { userId },
    include: { workspace: true }
  });
  res.json({ workspaces: memberships.map((m) => ({
    id: m.workspaceId,
    name: m.workspace.name,
    role: m.role
  })) });
});

router.post("/", authMiddleware, async (req: Request, res: Response) => {
  const input = z.object({ name: z.string().min(2) }).parse(req.body);
  const userId = req.user?.id as string;
  const workspace = await prisma.workspace.create({
    data: {
      name: input.name,
      members: {
        create: {
          userId,
          role: "OWNER"
        }
      }
    }
  });
  res.json({ workspace });
});

router.post("/:workspaceId/members", authMiddleware, requireRole(["OWNER", "ADMIN"]), async (req: Request, res: Response) => {
  const input = z.object({ email: z.string().email(), role: z.enum(["OWNER", "ADMIN", "MEMBER"]) }).parse(req.body);
  const workspaceId = req.params.workspaceId;
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }
  const membership = await prisma.workspaceMember.create({
    data: { workspaceId, userId: user.id, role: input.role }
  });
  res.json({ membership });
});

export default router;
