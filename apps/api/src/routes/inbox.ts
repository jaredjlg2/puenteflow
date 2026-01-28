import { Router, type Request, type Response } from "express";
import { prisma, addWorkspaceFilter } from "@puenteflow/db";
import { authMiddleware, requireWorkspace } from "../middleware/auth";
import { z } from "zod";

const router = Router();

router.get("/threads", authMiddleware, requireWorkspace, async (req: Request, res: Response) => {
  const workspaceId = req.workspaceId as string;
  const threads = await prisma.messageThread.findMany(addWorkspaceFilter(workspaceId, {
    include: { contact: true, messages: { orderBy: { createdAt: "asc" } } },
    orderBy: { updatedAt: "desc" }
  }));
  res.json({ threads });
});

router.get("/threads/:id", authMiddleware, requireWorkspace, async (req: Request, res: Response) => {
  const workspaceId = req.workspaceId as string;
  const thread = await prisma.messageThread.findFirst(addWorkspaceFilter(workspaceId, {
    where: { id: req.params.id },
    include: { contact: true, messages: { orderBy: { createdAt: "asc" } } }
  }));
  if (!thread) {
    return res.status(404).json({ error: "Not found" });
  }
  res.json({ thread });
});

router.post("/threads/:id/messages", authMiddleware, requireWorkspace, async (req: Request, res: Response) => {
  const workspaceId = req.workspaceId as string;
  const input = z.object({ body: z.string().min(1) }).parse(req.body);
  const thread = await prisma.messageThread.findFirst(addWorkspaceFilter(workspaceId, {
    where: { id: req.params.id }
  }));
  if (!thread) {
    return res.status(404).json({ error: "Thread not found" });
  }
  const message = await prisma.message.create({
    data: {
      workspaceId,
      threadId: thread.id,
      channel: thread.channel,
      direction: "OUT",
      status: "queued",
      body: input.body
    }
  });
  res.json({ message });
});

export default router;
