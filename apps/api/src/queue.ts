import { Queue } from "bullmq";
import { config } from "./config";

export const workflowQueue = new Queue("workflow", {
  connection: { url: config.redisUrl }
});
