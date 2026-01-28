import Twilio from "twilio";
import { config } from "../config";

export const twilioClient = config.twilio.accountSid
  ? Twilio(config.twilio.accountSid, config.twilio.authToken)
  : null;

export const sendSms = async (to: string, body: string) => {
  if (!twilioClient) {
    console.warn("Twilio not configured, skipping SMS send");
    return { sid: "mock" };
  }
  return twilioClient.messages.create({
    to,
    from: config.twilio.fromNumber,
    body
  });
};
