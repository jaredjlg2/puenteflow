import { z } from "zod";

export const triggerTypes = [
  "contact.created",
  "form.submitted",
  "opportunity.stage_changed",
  "inbound.sms_received"
] as const;

export const actionTypes = [
  "send_sms",
  "send_email",
  "create_task",
  "wait",
  "move_opportunity"
] as const;

export type TriggerType = (typeof triggerTypes)[number];
export type ActionType = (typeof actionTypes)[number];

export const zTriggerType = z.enum(triggerTypes);
export const zActionType = z.enum(actionTypes);

export const zAutomationStep = z.object({
  id: z.string().optional(),
  type: zActionType,
  order: z.number().int().nonnegative(),
  config: z.record(z.any())
});

export const zAutomationCreate = z.object({
  name: z.string().min(2),
  enabled: z.boolean().default(false),
  trigger: z.object({
    type: zTriggerType,
    config: z.record(z.any()).default({})
  }),
  actions: z.array(zAutomationStep).min(1)
});

export const zFormSchema = z.array(
  z.object({
    key: z.string(),
    label: z.string(),
    type: z.enum(["text", "email", "tel", "textarea"])
  })
);

export const zContactCreate = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  tags: z.array(z.string()).optional(),
  customFields: z.record(z.any()).optional()
});

export const zPipelineMove = z.object({
  opportunityId: z.string(),
  stageId: z.string()
});

export const zTemplateInput = z.object({
  name: z.string(),
  channel: z.enum(["SMS", "EMAIL"]),
  subject: z.string().optional(),
  body: z.string()
});

export type AutomationCreateInput = z.infer<typeof zAutomationCreate>;
