"use client";

import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import { apiFetch } from "@/lib/api";

interface FormRecord {
  id: string;
  name: string;
  fields: { key: string; label: string; type: string }[];
}

export default function FormsPage() {
  const [forms, setForms] = useState<FormRecord[]>([]);
  const [name, setName] = useState("");
  const [embed, setEmbed] = useState("");

  const loadForms = async () => {
    const data = await apiFetch("/forms");
    setForms(data.forms ?? []);
  };

  useEffect(() => {
    loadForms();
  }, []);

  const createForm = async (event: React.FormEvent) => {
    event.preventDefault();
    const fields = [
      { key: "firstName", label: "First name", type: "text" },
      { key: "lastName", label: "Last name", type: "text" },
      { key: "email", label: "Email", type: "email" },
      { key: "phone", label: "Phone", type: "tel" },
      { key: "notes", label: "Notes", type: "textarea" }
    ];
    const data = await apiFetch("/forms", {
      method: "POST",
      body: JSON.stringify({ name, fields })
    });
    setEmbed(data.embed);
    setName("");
    loadForms();
  };

  return (
    <AppShell>
      <h1 className="text-2xl font-semibold mb-4">Forms</h1>
      <form onSubmit={createForm} className="bg-slate-900 border border-slate-800 rounded-lg p-4 mb-6 space-y-3">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Form name" className="w-full" />
        <button type="submit">Create form</button>
        {embed ? (
          <div className="text-xs text-slate-400 bg-slate-950 border border-slate-800 rounded p-3">
            <p className="font-semibold">Embed snippet</p>
            <code>{embed}</code>
          </div>
        ) : null}
      </form>
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
        <h2 className="text-lg font-semibold mb-3">Existing forms</h2>
        <ul className="space-y-2">
          {forms.map((form) => (
            <li key={form.id} className="border border-slate-800 rounded p-3">
              <p>{form.name}</p>
              <p className="text-xs text-slate-400">Fields: {form.fields.map((field) => field.label).join(", ")}</p>
            </li>
          ))}
        </ul>
      </div>
    </AppShell>
  );
}
