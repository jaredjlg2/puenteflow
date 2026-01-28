import dotenv from "dotenv";

dotenv.config();

export const config = {
  port: Number(process.env.PORT || 4000),
  appUrl: process.env.APP_URL || "http://localhost:3000",
  apiUrl: process.env.API_URL || "http://localhost:4000",
  jwtSecret: process.env.JWT_SECRET || "dev_secret",
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || "dev_refresh",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "15m",
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "30d",
  redisUrl: process.env.REDIS_URL || "redis://localhost:6379",
  twilio: {
    accountSid: process.env.TWILIO_ACCOUNT_SID || "",
    authToken: process.env.TWILIO_AUTH_TOKEN || "",
    fromNumber: process.env.TWILIO_FROM_NUMBER || ""
  },
  sendgrid: {
    apiKey: process.env.SENDGRID_API_KEY || "",
    fromEmail: process.env.SENDGRID_FROM_EMAIL || "",
    webhookPublicKey: process.env.SENDGRID_WEBHOOK_PUBLIC_KEY || ""
  }
};
