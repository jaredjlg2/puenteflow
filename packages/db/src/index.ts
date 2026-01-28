import { PrismaClient, Prisma } from "@prisma/client";

const prisma = new PrismaClient();

const workspaceModels = new Set([
  "Contact",
  "Pipeline",
  "Stage",
  "Opportunity",
  "Activity",
  "MessageThread",
  "Message",
  "Template",
  "Form",
  "FormSubmission",
  "Automation",
  "Trigger",
  "Action",
  "WorkflowRun",
  "WorkflowStepRun",
  "AutomationAuditLog"
]);

prisma.$use(async (params, next) => {
  if (params.model && workspaceModels.has(params.model)) {
    const action = params.action;
    const args = params.args ?? {};

    if (["create", "createMany"].includes(action)) {
      const data = args.data;
      const entries = Array.isArray(data) ? data : [data];
      for (const entry of entries) {
        if (!entry?.workspaceId) {
          throw new Error(`Missing workspaceId for ${params.model} ${action}`);
        }
      }
    }

    if (["findMany", "findFirst", "update", "updateMany", "delete", "deleteMany", "count"].includes(action)) {
      if (!args.where?.workspaceId) {
        throw new Error(`Missing workspaceId filter for ${params.model} ${action}`);
      }
    }
  }

  return next(params);
});

const buildWorkspaceFilter = (workspaceId: string) => ({ workspaceId });

const addWorkspaceFilter = <T extends Prisma.Subset<any, any>>(workspaceId: string, args: T) => {
  return {
    ...args,
    where: {
      ...(args as any).where,
      workspaceId
    }
  } as T;
};

export { prisma, buildWorkspaceFilter, addWorkspaceFilter };
