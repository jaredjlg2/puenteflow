import express from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import { config } from "./config";
import authRoutes from "./routes/auth";
import workspaceRoutes from "./routes/workspaces";
import contactRoutes from "./routes/contacts";
import pipelineRoutes from "./routes/pipeline";
import inboxRoutes from "./routes/inbox";
import templateRoutes from "./routes/templates";
import formRoutes from "./routes/forms";
import automationRoutes from "./routes/automations";
import dashboardRoutes from "./routes/dashboard";
import webhookRoutes from "./routes/webhooks";
import publicRoutes from "./routes/public";
import healthRoutes from "./routes/health";
import { errorHandler } from "./middleware/error";
import { openapiSpec } from "./openapi";
import { startWorkflowListener } from "./services/workflows";

const app = express();

app.use(cors());
app.use(pinoHttp());
app.use("/webhooks/sendgrid/events", express.raw({ type: "application/json" }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/auth", authRoutes);
app.use("/workspaces", workspaceRoutes);
app.use("/contacts", contactRoutes);
app.use("/pipeline", pipelineRoutes);
app.use("/inbox", inboxRoutes);
app.use("/templates", templateRoutes);
app.use("/forms", formRoutes);
app.use("/automations", automationRoutes);
app.use("/dashboard", dashboardRoutes);
app.use("/public", publicRoutes);

app.use("/webhooks", webhookRoutes);
app.use(healthRoutes);

app.get("/", (_req, res) => {
  res.json({ status: "ok" });
});

app.get("/docs", (_req, res) => {
  res.json(openapiSpec);
});

app.use(errorHandler);

startWorkflowListener();

app.listen(config.port, () => {
  console.log(`API listening on ${config.port}`);
});
