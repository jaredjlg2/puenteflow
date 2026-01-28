export const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export const getAuthHeaders = () => {
  if (typeof window === "undefined") {
    return {};
  }
  const token = localStorage.getItem("accessToken");
  const workspaceId = localStorage.getItem("workspaceId");
  return {
    Authorization: token ? `Bearer ${token}` : "",
    "X-Workspace-Id": workspaceId || ""
  };
};

export const apiFetch = async (path: string, options: RequestInit = {}) => {
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
    ...getAuthHeaders()
  };
  const response = await fetch(`${apiUrl}${path}`, {
    ...options,
    headers
  });
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }
  return response.json();
};
