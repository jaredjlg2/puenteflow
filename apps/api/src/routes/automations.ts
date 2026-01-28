import { Router } from "express";
import { prisma, addWorkspaceFilter } from "@puenteflow/db";
import { authMiddleware, requireWorkspace } from "../middleware/auth";
import { zAutomationCreate } from "@puenteflow/shared";

const router = Router();

router.get("/", authMiddleware, requireWorkspace, async (req, res) => {
  const workspaceId = req.workspaceId as string;
  const automations = await prisma.automation.findMany(addWorkspaceFilter(workspaceId, {
    include: { triggers: true, actions: true }
  }));
  res.json({ automations });
});

router.post("/", authMiddleware, requireWorkspace, async (req, res) => {
  const workspaceId = req.workspaceId as string;
  const input = zAutomationCreate.parse(req.body);

  const automation = await prisma.automation.create({
    data: {
      workspaceId,
      name: input.name,
      enabled: input.enabled,
      triggers: {
        create: {
          workspaceId,
          type: input.trigger.type,
          config: input.trigger.config
        }
      },
      actions: {
        create: input.actions.map((action) => ({
          workspaceId,
          type: action.type,
          order: action.order,
          config: action.config
        }))
      }
    },
    include: { triggers: true, actions: true }
  });

  res.json({ automation });
});

router.patch("/:id", authMiddleware, requireWorkspace, async (req, res) => {
  const workspaceId = req.workspaceId as string;
  const input = req.body as { enabled?: boolean; name?: string };
  await prisma.automation.updateMany({
    where: { id: req.params.id, workspaceId },
    data: {
      enabled: input.enabled,
      name: input.name
    }
  });
  const automation = await prisma.automation.findFirst({
    where: { id: req.params.id, workspaceId }
  });
  res.json({ automation });
});

export default router;
