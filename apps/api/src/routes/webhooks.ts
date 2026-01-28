import { Router, Request, Response } from "express";
import { prisma } from "@puenteflow/db";
import { config } from "../config";
import { validateRequest } from "twilio";
import { EventWebhook } from "@sendgrid/eventwebhook";
import { publishEvent } from "../services/workflows";

const router = Router();

router.post("/twilio/sms", async (req: Request, res: Response) => {
  const signature = req.headers["x-twilio-signature"] as string | undefined;
  const url = `${config.apiUrl}/webhooks/twilio/sms`;
  if (config.twilio.authToken && signature) {
    const valid = validateRequest(config.twilio.authToken, signature, url, req.body);
    if (!valid) {
      return res.status(403).send("invalid signature");
    }
  }

  const { From, Body } = req.body as { From?: string; Body?: string };
  if (!From || !Body) {
    return res.status(400).send("missing payload");
  }

  const workspaceParam = req.query.workspaceId as string | undefined;
  const contact = workspaceParam
    ? await prisma.contact.findFirst({
        where: { workspaceId: workspaceParam, phone: From }
      })
    : null;

  const workspaceId = workspaceParam || contact?.workspaceId;
  if (!workspaceId) {
    return res.status(400).send("workspaceId is required");
  }

  const resolvedContact = contact
    ? contact
    : await prisma.contact.create({
        data: {
          workspaceId,
          phone: From,
          tags: ["inbound"],
          customFields: {}
        }
      });

  let thread = await prisma.messageThread.findFirst({
    where: { workspaceId, contactId: resolvedContact.id, channel: "SMS" }
  });

  if (!thread) {
    thread = await prisma.messageThread.create({
      data: { workspaceId, contactId: resolvedContact.id, channel: "SMS" }
    });
  }

  await prisma.message.create({
    data: {
      workspaceId,
      threadId: thread.id,
      channel: "SMS",
      direction: "IN",
      status: "received",
      body: Body
    }
  });

  await prisma.activity.create({
    data: {
      workspaceId,
      contactId: resolvedContact.id,
      type: "SMS",
      body: Body,
      status: "received"
    }
  });

  await publishEvent({
    workspaceId,
    type: "inbound.sms_received",
    payload: { contactId: resolvedContact.id, body: Body }
  });

  res.status(200).send("ok");
});

router.post("/sendgrid/events", async (req: Request, res: Response) => {
  const signature = req.headers["x-twilio-email-event-webhook-signature"] as string | undefined;
  const timestamp = req.headers["x-twilio-email-event-webhook-timestamp"] as string | undefined;
  const publicKey = config.sendgrid.webhookPublicKey;
  if (publicKey && signature && timestamp) {
    const webhook = new EventWebhook();
    const payload = Buffer.isBuffer(req.body) ? req.body.toString() : JSON.stringify(req.body);
    const ecdsaKey = webhook.convertPublicKeyToECDSA(publicKey);
    const valid = webhook.verifySignature(ecdsaKey, payload, signature, timestamp);
    if (!valid) {
      return res.status(403).send("invalid signature");
    }
  }
  res.status(200).send("ok");
});

export default router;
