import { Router, type Request, type Response } from "express";
import { prisma, addWorkspaceFilter } from "@puenteflow/db";
import { authMiddleware, requireWorkspace } from "../middleware/auth";
import { zTemplateInput } from "@puenteflow/shared";

const router = Router();

router.get("/", authMiddleware, requireWorkspace, async (req: Request, res: Response) => {
  const workspaceId = req.workspaceId as string;
  const templates = await prisma.template.findMany(addWorkspaceFilter(workspaceId, {}));
  res.json({ templates });
});

router.post("/", authMiddleware, requireWorkspace, async (req: Request, res: Response) => {
  const workspaceId = req.workspaceId as string;
  const input = zTemplateInput.parse(req.body);
  const template = await prisma.template.create({
    data: { ...input, workspaceId }
  });
  res.json({ template });
});

export default router;
