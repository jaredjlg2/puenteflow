import sendgrid from "@sendgrid/mail";
import { config } from "../config";

if (config.sendgrid.apiKey) {
  sendgrid.setApiKey(config.sendgrid.apiKey);
}

export const sendEmail = async ({
  to,
  subject,
  html
}: {
  to: string;
  subject: string;
  html: string;
}) => {
  if (!config.sendgrid.apiKey) {
    console.warn("SendGrid not configured, skipping email send");
    return { messageId: "mock" };
  }
  return sendgrid.send({
    to,
    from: config.sendgrid.fromEmail,
    subject,
    html
  });
};
