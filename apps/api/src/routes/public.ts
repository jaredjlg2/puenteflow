import { Router } from "express";
import { prisma } from "@puenteflow/db";
import { publishEvent } from "../services/workflows";

const router = Router();

router.post("/forms/:formId/submit", async (req, res) => {
  const form = await prisma.form.findUnique({ where: { id: req.params.formId } });
  if (!form) {
    return res.status(404).json({ error: "Form not found" });
  }

  const payload = req.body as Record<string, string>;
  const email = payload.email as string | undefined;
  const phone = payload.phone as string | undefined;

  let contact = await prisma.contact.findFirst({
    where: {
      workspaceId: form.workspaceId,
      OR: [
        email ? { email } : undefined,
        phone ? { phone } : undefined
      ].filter(Boolean) as any
    }
  });

  if (!contact) {
    contact = await prisma.contact.create({
      data: {
        workspaceId: form.workspaceId,
        firstName: payload.firstName,
        lastName: payload.lastName,
        email,
        phone,
        tags: ["form"],
        customFields: payload
      }
    });
  }

  await prisma.formSubmission.create({
    data: {
      workspaceId: form.workspaceId,
      formId: form.id,
      payload
    }
  });

  await prisma.activity.create({
    data: {
      workspaceId: form.workspaceId,
      contactId: contact.id,
      type: "NOTE",
      body: "Form submitted",
      status: "submitted"
    }
  });

  await publishEvent({
    workspaceId: form.workspaceId,
    type: "form.submitted",
    payload: { formId: form.id, contactId: contact.id }
  });

  res.json({ success: true });
});

export default router;
