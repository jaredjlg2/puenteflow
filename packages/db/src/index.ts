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

prisma.$use(async (params: Prisma.MiddlewareParams, next: Prisma.MiddlewareNext) => {
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

type WorkspaceWhereArgs = { where?: Record<string, unknown> };

const addWorkspaceFilter = <T extends WorkspaceWhereArgs>(workspaceId: string, args: T): T => {
  return {
    ...args,
    where: {
      ...args.where,
      workspaceId
    }
  };
};

export { prisma, buildWorkspaceFilter, addWorkspaceFilter };
