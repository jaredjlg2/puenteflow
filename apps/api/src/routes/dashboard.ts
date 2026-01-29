import { Router, type Request, type Response } from "express";
import type { Prisma } from "@prisma/client";
import { prisma, addWorkspaceFilter } from "@puenteflow/db";
import { authMiddleware, requireWorkspace } from "../middleware/auth";

const router = Router();

router.get("/", authMiddleware, requireWorkspace, async (req: Request, res: Response) => {
  const workspaceId = req.workspaceId as string;
  const stages: Prisma.StageGetPayload<{ include: { opportunities: true } }>[] = await prisma.stage.findMany(addWorkspaceFilter(workspaceId, {
    include: { opportunities: true }
  }));
  const stageCounts = stages.map((stage) => ({
    stageId: stage.id,
    name: stage.name,
    count: stage.opportunities.length
  }));

  const now = new Date();
  const daysAgo = (days: number) => new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  const leads7 = await prisma.contact.count(addWorkspaceFilter(workspaceId, {
    where: { createdAt: { gte: daysAgo(7) } }
  }));
  const leads30 = await prisma.contact.count(addWorkspaceFilter(workspaceId, {
    where: { createdAt: { gte: daysAgo(30) } }
  }));

  const outboundMessages = await prisma.message.count(addWorkspaceFilter(workspaceId, {
    where: { direction: "OUT" }
  }));
  const inboundMessages = await prisma.message.count(addWorkspaceFilter(workspaceId, {
    where: { direction: "IN" }
  }));
  const replyRate = outboundMessages === 0 ? 0 : Math.min(1, inboundMessages / outboundMessages);

  res.json({
    stageCounts,
    leads: { last7Days: leads7, last30Days: leads30 },
    messages: { outbound: outboundMessages, inbound: inboundMessages, replyRate }
  });
});

export default router;
