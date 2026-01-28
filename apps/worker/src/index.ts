import dotenv from "dotenv";
import { Worker } from "bullmq";
import Twilio from "twilio";
import sendgrid from "@sendgrid/mail";
import { prisma } from "@puenteflow/db";
import { ActionType } from "@puenteflow/shared";

dotenv.config();

const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";
const twilioClient = process.env.TWILIO_ACCOUNT_SID
  ? Twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN || "")
  : null;

if (process.env.SENDGRID_API_KEY) {
  sendgrid.setApiKey(process.env.SENDGRID_API_KEY);
}

const sanitizeTemplate = (value: string) => {
  return value.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "").trim();
};

const renderTemplate = (template: string, data: Record<string, string | undefined>) => {
  return Object.entries(data).reduce((acc, [key, value]) => {
    return acc.replaceAll(`{{${key}}}`, value ?? "");
  }, template);
};

const getThreadId = async (workspaceId: string, contactId: string, channel: "SMS" | "EMAIL") => {
  let thread = await prisma.messageThread.findFirst({
    where: { workspaceId, contactId, channel }
  });
  if (!thread) {
    thread = await prisma.messageThread.create({
      data: { workspaceId, contactId, channel }
    });
  }
  return thread.id;
};

const worker = new Worker(
  "workflow",
  async (job) => {
    const { workspaceId, workflowRunId, actionId, actionType, config, triggerPayload } = job.data as {
      workspaceId: string;
      workflowRunId: string;
      actionId: string;
      actionType: ActionType;
      config: Record<string, any>;
      triggerPayload: Record<string, any>;
    };

    const step = await prisma.workflowStepRun.findFirst({
      where: { workspaceId, workflowRunId, actionId }
    });
    if (!step) {
      return;
    }
    if (step.status === "COMPLETED") {
      return;
    }

    await prisma.workflowStepRun.update({
      where: { id: step.id },
      data: { status: "RUNNING", startedAt: new Date() }
    });

    const action = await prisma.action.findFirst({
      where: { id: actionId, workspaceId }
    });

    if (!action) {
      throw new Error("Action not found");
    }

    if (actionType === "wait") {
      await prisma.workflowStepRun.update({
        where: { id: step.id },
        data: { status: "COMPLETED", completedAt: new Date(), output: { waited: true } }
      });
      return;
    }

    const contactId = (triggerPayload.contactId as string | undefined) ?? (config.contactId as string | undefined);
    const contact = contactId
      ? await prisma.contact.findFirst({ where: { id: contactId, workspaceId } })
      : null;

    const templateData = {
      firstName: contact?.firstName,
      lastName: contact?.lastName,
      email: contact?.email,
      phone: contact?.phone
    };

    if (actionType === "send_sms") {
      const body = sanitizeTemplate(renderTemplate(config.text ?? config.body ?? "", templateData));
      if (twilioClient && contact?.phone) {
        const result = await twilioClient.messages.create({
          to: contact.phone,
          from: process.env.TWILIO_FROM_NUMBER || "",
          body
        });
        await prisma.message.create({
          data: {
            workspaceId,
            threadId: await getThreadId(workspaceId, contact.id, "SMS"),
            channel: "SMS",
            direction: "OUT",
            status: "sent",
            body,
            providerId: result.sid
          }
        });
      }
      await prisma.activity.create({
        data: {
          workspaceId,
          contactId: contact?.id,
          type: "SMS",
          body,
          status: "sent"
        }
      });
    }

    if (actionType === "send_email") {
      const subject = sanitizeTemplate(renderTemplate(config.subject ?? "", templateData));
      const html = sanitizeTemplate(renderTemplate(config.body ?? "", templateData));
      if (process.env.SENDGRID_API_KEY && contact?.email) {
        await sendgrid.send({
          to: contact.email,
          from: process.env.SENDGRID_FROM_EMAIL || "",
          subject,
          html
        });
      }
      await prisma.activity.create({
        data: {
          workspaceId,
          contactId: contact?.id,
          type: "EMAIL",
          body: `${subject}\n${html}`,
          status: "sent"
        }
      });
    }

    if (actionType === "create_task") {
      await prisma.activity.create({
        data: {
          workspaceId,
          contactId: contact?.id,
          type: "TASK",
          body: config.body ?? "Task created",
          status: "open"
        }
      });
    }

    if (actionType === "move_opportunity") {
      if (config.opportunityId && config.stageId) {
        await prisma.opportunity.updateMany({
          where: { id: config.opportunityId, workspaceId },
          data: { stageId: config.stageId }
        });
      }
    }

    await prisma.workflowStepRun.update({
      where: { id: step.id },
      data: { status: "COMPLETED", completedAt: new Date(), output: { ok: true } }
    });

    await prisma.automationAuditLog.create({
      data: {
        workspaceId,
        automationId: action.automationId,
        event: "workflow.step.completed",
        payload: { workflowRunId, actionId }
      }
    });
  },
  { connection: { url: redisUrl } }
);

worker.on("failed", (job, error) => {
  console.error("Job failed", job?.id, error);
});

console.log("Workflow worker started");
