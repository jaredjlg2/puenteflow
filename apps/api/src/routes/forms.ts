import { Router } from "express";
import { prisma, addWorkspaceFilter } from "@puenteflow/db";
import { authMiddleware, requireWorkspace } from "../middleware/auth";
import { z } from "zod";
import { zFormSchema } from "@puenteflow/shared";
import { config } from "../config";

const router = Router();

router.get("/", authMiddleware, requireWorkspace, async (req, res) => {
  const workspaceId = req.workspaceId as string;
  const forms = await prisma.form.findMany(addWorkspaceFilter(workspaceId, {}));
  res.json({ forms });
});

router.post("/", authMiddleware, requireWorkspace, async (req, res) => {
  const workspaceId = req.workspaceId as string;
  const input = z.object({ name: z.string().min(2), fields: zFormSchema }).parse(req.body);
  const form = await prisma.form.create({
    data: { workspaceId, name: input.name, fields: input.fields }
  });
  const embed = `<form method="POST" action="${config.apiUrl}/public/forms/${form.id}/submit"></form>`;
  res.json({ form, embed });
});

export default router;
