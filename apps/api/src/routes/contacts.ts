import { Router, type Request, type Response } from "express";
import { prisma, addWorkspaceFilter } from "@puenteflow/db";
import { authMiddleware, requireWorkspace } from "../middleware/auth";
import { zContactCreate } from "@puenteflow/shared";
import { publishEvent } from "../services/workflows";

const router = Router();

router.get("/", authMiddleware, requireWorkspace, async (req: Request, res: Response) => {
  const workspaceId = req.workspaceId as string;
  const contacts = await prisma.contact.findMany(addWorkspaceFilter(workspaceId, {
    orderBy: { createdAt: "desc" }
  }));
  res.json({ contacts });
});

router.post("/", authMiddleware, requireWorkspace, async (req: Request, res: Response) => {
  const workspaceId = req.workspaceId as string;
  const input = zContactCreate.parse(req.body);
  const contact = await prisma.contact.create({
    data: {
      workspaceId,
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email,
      phone: input.phone,
      tags: input.tags ?? [],
      customFields: input.customFields ?? {}
    }
  });
  await publishEvent({
    workspaceId,
    type: "contact.created",
    payload: { contactId: contact.id }
  });
  res.json({ contact });
});

router.get("/:id", authMiddleware, requireWorkspace, async (req: Request, res: Response) => {
  const workspaceId = req.workspaceId as string;
  const contact = await prisma.contact.findFirst(addWorkspaceFilter(workspaceId, {
    where: { id: req.params.id },
    include: {
      activities: { orderBy: { createdAt: "desc" } },
      threads: { include: { messages: true } }
    }
  }));
  if (!contact) {
    return res.status(404).json({ error: "Not found" });
  }
  res.json({ contact });
});

export default router;
