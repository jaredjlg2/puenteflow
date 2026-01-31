export const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export const getAuthHeaders = () => {
  if (typeof window === "undefined") {
    return {};
  }
  const token = localStorage.getItem("accessToken");
  const workspaceId = localStorage.getItem("workspaceId");
  return {
    Authorization: token ? `Bearer ${token}` : undefined,
    "X-Workspace-Id": workspaceId || undefined
  };
};

export const apiFetch = async (path: string, options: RequestInit = {}) => {
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");
  const authHeaders = getAuthHeaders();
  if (authHeaders.Authorization) {
    headers.set("Authorization", authHeaders.Authorization);
  }
  if (authHeaders["X-Workspace-Id"]) {
    headers.set("X-Workspace-Id", authHeaders["X-Workspace-Id"]);
  }
  const response = await fetch(`${apiUrl}${path}`, {
    ...options,
    headers
  });
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }
  return response.json();
};
