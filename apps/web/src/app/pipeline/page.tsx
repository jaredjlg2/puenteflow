"use client";

import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import { apiFetch } from "@/lib/api";

interface Stage {
  id: string;
  name: string;
  order: number;
}

interface Opportunity {
  id: string;
  stageId: string;
  contact: { firstName?: string; lastName?: string };
}

export default function PipelinePage() {
  const [stages, setStages] = useState<Stage[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);

  const loadData = async () => {
    const pipelineData = await apiFetch("/pipeline/pipelines");
    const stageList = pipelineData.pipelines?.[0]?.stages ?? [];
    setStages(stageList.sort((a: Stage, b: Stage) => a.order - b.order));

    const oppData = await apiFetch("/pipeline/opportunities");
    setOpportunities(oppData.opportunities ?? []);
  };

  useEffect(() => {
    loadData();
  }, []);

  const moveOpportunity = async (opportunityId: string, stageId: string) => {
    await apiFetch("/pipeline/opportunities/move", {
      method: "POST",
      body: JSON.stringify({ opportunityId, stageId })
    });
    loadData();
  };

  return (
    <AppShell>
      <h1 className="text-2xl font-semibold mb-4">Pipeline</h1>
      <div className="grid md:grid-cols-3 gap-4">
        {stages.map((stage) => (
          <div key={stage.id} className="bg-slate-900 border border-slate-800 rounded-lg p-4">
            <h2 className="text-sm font-semibold mb-3">{stage.name}</h2>
            <div className="space-y-3">
              {opportunities
                .filter((opp) => opp.stageId === stage.id)
                .map((opp) => (
                  <div key={opp.id} className="bg-slate-950 border border-slate-800 rounded p-3">
                    <p className="text-sm font-medium">
                      {[opp.contact?.firstName, opp.contact?.lastName].filter(Boolean).join(" ")}
                    </p>
                    <select
                      className="mt-2 w-full"
                      value={stage.id}
                      onChange={(event) => moveOpportunity(opp.id, event.target.value)}
                    >
                      {stages.map((option) => (
                        <option key={option.id} value={option.id}>
                          {option.name}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>
    </AppShell>
  );
}
