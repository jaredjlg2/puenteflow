"use client";

import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import { apiFetch } from "@/lib/api";

interface Thread {
  id: string;
  contact: { firstName?: string; lastName?: string; phone?: string; email?: string };
  channel: "SMS" | "EMAIL";
  messages: { id: string; body: string; direction: string; createdAt: string }[];
}

export default function InboxPage() {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [active, setActive] = useState<Thread | null>(null);
  const [message, setMessage] = useState("");

  const loadThreads = async () => {
    const data = await apiFetch("/inbox/threads");
    setThreads(data.threads ?? []);
    setActive((prev) => prev ?? data.threads?.[0] ?? null);
  };

  useEffect(() => {
    loadThreads();
  }, []);

  const sendReply = async () => {
    if (!active || !message) return;
    await apiFetch(`/inbox/threads/${active.id}/messages`, {
      method: "POST",
      body: JSON.stringify({ body: message })
    });
    setMessage("");
    loadThreads();
  };

  return (
    <AppShell>
      <h1 className="text-2xl font-semibold mb-4">Inbox</h1>
      <div className="grid md:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 space-y-2">
          {threads.map((thread) => (
            <button
              key={thread.id}
              className={`w-full text-left p-3 rounded border ${active?.id === thread.id ? "border-indigo-500" : "border-slate-800"}`}
              onClick={() => setActive(thread)}
            >
              <p className="text-sm font-semibold">
                {[thread.contact.firstName, thread.contact.lastName].filter(Boolean).join(" ")}
              </p>
              <p className="text-xs text-slate-400">{thread.channel}</p>
            </button>
          ))}
        </div>
        <div className="md:col-span-2 bg-slate-900 border border-slate-800 rounded-lg p-4">
          {!active ? (
            <p className="text-slate-400">Select a thread.</p>
          ) : (
            <div className="flex flex-col gap-3">
              <div className="flex-1 space-y-2 max-h-[400px] overflow-y-auto">
                {active.messages.map((msg) => (
                  <div key={msg.id} className={`p-2 rounded ${msg.direction === "IN" ? "bg-slate-800" : "bg-indigo-600"}`}>
                    <p className="text-sm">{msg.body}</p>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  placeholder="Type a reply"
                  className="flex-1"
                />
                <button type="button" onClick={sendReply}>Send</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
