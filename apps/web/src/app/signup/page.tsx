"use client";

import { useState } from "react";
import { apiUrl } from "@/lib/api";
import { useRouter } from "next/navigation";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [workspaceName, setWorkspaceName] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    const response = await fetch(`${apiUrl}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, workspaceName })
    });
    if (!response.ok) {
      setError("Signup failed");
      return;
    }
    const data = await response.json();
    localStorage.setItem("accessToken", data.accessToken);
    localStorage.setItem("refreshToken", data.refreshToken);

    const workspaceResponse = await fetch(`${apiUrl}/workspaces`, {
      headers: { Authorization: `Bearer ${data.accessToken}` }
    });
    if (workspaceResponse.ok) {
      const workspaceData = await workspaceResponse.json();
      if (workspaceData.workspaces?.length) {
        localStorage.setItem("workspaceId", workspaceData.workspaces[0].id);
      }
    }
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-lg p-8 w-full max-w-md">
        <h1 className="text-xl font-semibold mb-4">Create account</h1>
        <div className="space-y-3">
          <input
            value={workspaceName}
            onChange={(event) => setWorkspaceName(event.target.value)}
            placeholder="Workspace name"
            required
            className="w-full"
          />
          <input
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Email"
            type="email"
            required
            className="w-full"
          />
          <input
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Password"
            type="password"
            required
            className="w-full"
          />
        </div>
        {error ? <p className="text-red-400 text-sm mt-3">{error}</p> : null}
        <button type="submit" className="w-full mt-4">Sign up</button>
      </form>
    </div>
  );
}
