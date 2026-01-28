import { EventEmitter } from "events";
import { prisma } from "@puenteflow/db";
import { workflowQueue } from "../queue";
import { ActionType, TriggerType } from "@puenteflow/shared";

export const eventBus = new EventEmitter();

export interface DomainEvent {
  workspaceId: string;
  type: TriggerType;
  payload: Record<string, unknown>;
}

export const publishEvent = async (event: DomainEvent) => {
  eventBus.emit("event", event);
};

export const startWorkflowListener = () => {
  eventBus.on("event", async (event: DomainEvent) => {
    const automations = await prisma.automation.findMany({
      where: {
        workspaceId: event.workspaceId,
        enabled: true,
        triggers: { some: { type: event.type } }
      },
      include: { actions: true }
    });

    for (const automation of automations) {
      const run = await prisma.workflowRun.create({
        data: {
          workspaceId: event.workspaceId,
          automationId: automation.id,
          triggerEvent: event.type,
          triggerPayload: event.payload,
          status: "queued"
        }
      });

      await prisma.automationAuditLog.create({
        data: {
          workspaceId: event.workspaceId,
          automationId: automation.id,
          event: "workflow.queued",
          payload: event.payload
        }
      });

      const orderedActions = automation.actions.sort((a, b) => a.order - b.order);
      for (const action of orderedActions) {
        const idempotencyKey = `${run.id}:${action.id}`;
        await prisma.workflowStepRun.create({
          data: {
            workspaceId: event.workspaceId,
            workflowRunId: run.id,
            actionId: action.id,
            idempotencyKey
          }
        });

        const delayMinutes = action.type === "wait" ? Number((action.config as any)?.delayMinutes ?? 0) : 0;
        await workflowQueue.add(
          "workflow-step",
          {
            workspaceId: event.workspaceId,
            workflowRunId: run.id,
            actionId: action.id,
            actionType: action.type as ActionType,
            config: action.config,
            triggerPayload: event.payload
          },
          {
            jobId: idempotencyKey,
            delay: delayMinutes > 0 ? delayMinutes * 60 * 1000 : 0
          }
        );
      }
    }
  });
};
