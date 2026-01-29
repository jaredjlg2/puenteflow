import { Router, type Request, type Response } from "express";
import { prisma } from "@puenteflow/db";
import { authMiddleware, requireWorkspace } from "../middleware/auth";
import { z } from "zod";
import { publishEvent } from "../services/workflows";

const router = Router();

router.get("/pipelines", authMiddleware, requireWorkspace, async (req: Request, res: Response) => {
  const workspaceId = req.workspaceId as string;
  const pipelines = await prisma.pipeline.findMany({
    where: { workspaceId },
    include: { stages: true }
  });
  res.json({ pipelines });
});

router.post("/pipelines", authMiddleware, requireWorkspace, async (req: Request, res: Response) => {
  const workspaceId = req.workspaceId as string;
  const input = z.object({ name: z.string().min(2) }).parse(req.body);
  const pipeline = await prisma.pipeline.create({
    data: { workspaceId, name: input.name }
  });
  res.json({ pipeline });
});

router.post("/stages", authMiddleware, requireWorkspace, async (req: Request, res: Response) => {
  const workspaceId = req.workspaceId as string;
  const input = z.object({ pipelineId: z.string(), name: z.string(), order: z.number() }).parse(req.body);
  const stage = await prisma.stage.create({
    data: { workspaceId, pipelineId: input.pipelineId, name: input.name, order: input.order }
  });
  res.json({ stage });
});

router.get("/opportunities", authMiddleware, requireWorkspace, async (req: Request, res: Response) => {
  const workspaceId = req.workspaceId as string;
  const opportunities = await prisma.opportunity.findMany({
    where: { workspaceId },
    include: { contact: true, stage: true }
  });
  res.json({ opportunities });
});

router.post("/opportunities", authMiddleware, requireWorkspace, async (req: Request, res: Response) => {
  const workspaceId = req.workspaceId as string;
  const input = z.object({ contactId: z.string(), stageId: z.string(), value: z.number().optional() }).parse(req.body);
  const opportunity = await prisma.opportunity.create({
    data: {
      workspaceId,
      contactId: input.contactId,
      stageId: input.stageId,
      value: input.value
    }
  });
  res.json({ opportunity });
});

router.post("/opportunities/move", authMiddleware, requireWorkspace, async (req: Request, res: Response) => {
  const workspaceId = req.workspaceId as string;
  const input = z.object({ opportunityId: z.string(), stageId: z.string() }).parse(req.body);
  await prisma.opportunity.updateMany({
    where: { id: input.opportunityId, workspaceId },
    data: { stageId: input.stageId }
  });
  const opportunity = await prisma.opportunity.findFirst({
    where: { id: input.opportunityId, workspaceId }
  });
  if (!opportunity) {
    return res.status(404).json({ error: "Opportunity not found" });
  }
  await prisma.activity.create({
    data: {
      workspaceId,
      opportunityId: opportunity.id,
      type: "TASK",
      body: `Moved opportunity to stage ${input.stageId}`,
      status: "done"
    }
  });
  await publishEvent({
    workspaceId,
    type: "opportunity.stage_changed",
    payload: { opportunityId: opportunity.id, stageId: input.stageId }
  });
  res.json({ opportunity });
});

export default router;
