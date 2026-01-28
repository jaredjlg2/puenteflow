export const openapiSpec = {
  openapi: "3.0.0",
  info: {
    title: "Puenteflow API",
    version: "0.1.0"
  },
  paths: {
    "/auth/register": { post: {} },
    "/auth/login": { post: {} },
    "/contacts": { get: {}, post: {} },
    "/pipeline/pipelines": { get: {}, post: {} },
    "/pipeline/opportunities/move": { post: {} },
    "/inbox/threads": { get: {} },
    "/automations": { get: {}, post: {} },
    "/forms": { get: {}, post: {} },
    "/dashboard": { get: {} }
  }
};
