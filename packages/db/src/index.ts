import { PrismaClient } from "@prisma/client";

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

type MiddlewareParams = {
  model?: string | null;
  action: string;
  args?: {
    data?: unknown;
    where?: { workspaceId?: string | null };
  };
};
type MiddlewareNext = (params: MiddlewareParams) => Promise<unknown>;

const prismaUse = prisma.$use.bind(prisma) as unknown as (
  middleware: (params: MiddlewareParams, next: MiddlewareNext) => Promise<unknown>
) => void;

prismaUse(async (params: MiddlewareParams, next: MiddlewareNext) => {
  if (params.model && workspaceModels.has(params.model)) {
    const action = params.action;
    const args = params.args ?? {};

    if (["create", "createMany"].includes(action)) {
      const data = args.data;
      const entries = Array.isArray(data) ? data : [data];
      for (const entry of entries) {
        if (!(entry as { workspaceId?: string })?.workspaceId) {
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
export { prisma };
