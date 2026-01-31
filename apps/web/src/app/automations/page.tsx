"use client";

import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import { apiFetch } from "@/lib/api";

const triggerOptions = [
  "contact.created",
  "form.submitted",
  "opportunity.stage_changed",
  "inbound.sms_received"
];

const actionOptions = ["send_sms", "send_email", "create_task", "wait", "move_opportunity"];

interface Automation {
  id: string;
  name: string;
  enabled: boolean;
}

interface AutomationAction {
  type: string;
  config: Record<string, string>;
}

export default function AutomationsPage() {
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [name, setName] = useState("");
  const [trigger, setTrigger] = useState(triggerOptions[0]);
  const [actions, setActions] = useState<AutomationAction[]>([{ type: "send_sms", config: { text: "" } }]);

  const loadAutomations = async () => {
    const data = await apiFetch("/automations");
    setAutomations(data.automations ?? []);
  };

  useEffect(() => {
    loadAutomations();
  }, []);

  const addAction = () => {
    setActions((prev) => [...prev, { type: "send_sms", config: { text: "" } }]);
  };

  const updateAction = (index: number, key: string, value: string) => {
    setActions((prev) =>
      prev.map((action, idx) => (idx === index ? { ...action, config: { ...action.config, [key]: value } } : action))
    );
  };

  const updateActionType = (index: number, type: string) => {
    setActions((prev) => prev.map((action, idx) => (idx === index ? { ...action, type } : action)));
  };

  const createAutomation = async (event: React.FormEvent) => {
    event.preventDefault();
    await apiFetch("/automations", {
      method: "POST",
      body: JSON.stringify({
        name,
        enabled: true,
        trigger: { type: trigger, config: {} },
        actions: actions.map((action, index) => ({
          type: action.type,
          order: index,
          config: action.config
        }))
      })
    });
    setName("");
    setActions([{ type: "send_sms", config: { text: "" } }]);
    loadAutomations();
  };

  return (
    <AppShell>
      <h1 className="text-2xl font-semibold mb-4">Automations</h1>
      <form onSubmit={createAutomation} className="bg-slate-900 border border-slate-800 rounded-lg p-4 mb-6 space-y-4">
        <div>
          <label className="text-sm text-slate-400">Name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} className="w-full mt-1" />
        </div>
        <div>
          <label className="text-sm text-slate-400">Trigger</label>
          <select value={trigger} onChange={(e) => setTrigger(e.target.value)} className="w-full mt-1">
            {triggerOptions.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-sm text-slate-400">Steps</label>
          <div className="space-y-2 mt-2">
            {actions.map((action, index) => (
              <div key={index} className="bg-slate-950 border border-slate-800 rounded p-3 space-y-2">
                <select value={action.type} onChange={(e) => updateActionType(index, e.target.value)} className="w-full">
                  {actionOptions.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
                {action.type === "send_sms" ? (
                  <input
                    placeholder="SMS text"
                    value={action.config.text}
                    onChange={(e) => updateAction(index, "text", e.target.value)}
                    className="w-full"
                  />
                ) : null}
                {action.type === "send_email" ? (
                  <input
                    placeholder="Email body"
                    value={action.config.body || ""}
                    onChange={(e) => updateAction(index, "body", e.target.value)}
                    className="w-full"
                  />
                ) : null}
                {action.type === "wait" ? (
                  <input
                    placeholder="Delay minutes"
                    value={action.config.delayMinutes || ""}
                    onChange={(e) => updateAction(index, "delayMinutes", e.target.value)}
                    className="w-full"
                  />
                ) : null}
              </div>
            ))}
          </div>
          <button type="button" onClick={addAction} className="mt-3">Add step</button>
        </div>
        <button type="submit">Create automation</button>
      </form>

      <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
        <h2 className="text-lg font-semibold mb-3">Existing automations</h2>
        <ul className="space-y-2">
          {automations.map((automation) => (
            <li key={automation.id} className="flex justify-between border border-slate-800 rounded p-3">
              <span>{automation.name}</span>
              <span className="text-xs text-slate-400">{automation.enabled ? "Enabled" : "Disabled"}</span>
            </li>
          ))}
        </ul>
      </div>
    </AppShell>
  );
}
