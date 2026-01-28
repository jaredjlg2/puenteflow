"use client";

import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import { apiFetch } from "@/lib/api";

interface Contact {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
}

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", phone: "" });

  const loadContacts = () => {
    apiFetch("/contacts").then((data) => setContacts(data.contacts ?? []));
  };

  useEffect(() => {
    loadContacts();
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    await apiFetch("/contacts", {
      method: "POST",
      body: JSON.stringify(form)
    });
    setForm({ firstName: "", lastName: "", email: "", phone: "" });
    loadContacts();
  };

  return (
    <AppShell>
      <h1 className="text-2xl font-semibold mb-4">Contacts</h1>
      <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-lg p-4 mb-6 grid md:grid-cols-4 gap-3">
        <input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} placeholder="First name" />
        <input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} placeholder="Last name" />
        <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Email" />
        <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="Phone" />
        <button type="submit" className="md:col-span-4">Add contact</button>
      </form>
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
        <table className="w-full text-sm">
          <thead className="text-slate-400">
            <tr>
              <th className="text-left py-2">Name</th>
              <th className="text-left py-2">Email</th>
              <th className="text-left py-2">Phone</th>
            </tr>
          </thead>
          <tbody>
            {contacts.map((contact) => (
              <tr key={contact.id} className="border-t border-slate-800">
                <td className="py-2">{[contact.firstName, contact.lastName].filter(Boolean).join(" ")}</td>
                <td className="py-2">{contact.email}</td>
                <td className="py-2">{contact.phone}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}
