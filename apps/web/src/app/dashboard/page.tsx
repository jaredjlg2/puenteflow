"use client";

import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import { apiFetch } from "@/lib/api";

interface DashboardData {
  stageCounts: { stageId: string; name: string; count: number }[];
  leads: { last7Days: number; last30Days: number };
  messages: { outbound: number; inbound: number; replyRate: number };
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    apiFetch("/dashboard")
      .then(setData)
      .catch(() => setData(null));
  }, []);

  return (
    <AppShell>
      <h1 className="text-2xl font-semibold mb-4">Dashboard</h1>
      {!data ? (
        <p className="text-slate-400">Loading...</p>
      ) : (
        <div className="grid md:grid-cols-3 gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
            <h2 className="text-sm text-slate-400">Leads</h2>
            <p className="text-2xl font-semibold mt-2">{data.leads.last7Days} (7d)</p>
            <p className="text-sm text-slate-400">{data.leads.last30Days} in 30 days</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
            <h2 className="text-sm text-slate-400">Messages</h2>
            <p className="text-2xl font-semibold mt-2">{data.messages.outbound} sent</p>
            <p className="text-sm text-slate-400">Reply rate {(data.messages.replyRate * 100).toFixed(0)}%</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
            <h2 className="text-sm text-slate-400">Pipeline</h2>
            <ul className="mt-2 space-y-1 text-sm">
              {data.stageCounts.map((stage) => (
                <li key={stage.stageId} className="flex justify-between">
                  <span>{stage.name}</span>
                  <span>{stage.count}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </AppShell>
  );
}
