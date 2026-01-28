import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-8 w-full max-w-md">
        <h1 className="text-2xl font-semibold mb-2">Puenteflow</h1>
        <p className="text-slate-400 mb-6">CRM + messaging + automations MVP</p>
        <div className="flex gap-3">
          <Link href="/login" className="flex-1 text-center bg-indigo-500 hover:bg-indigo-600 text-white py-2 rounded">Login</Link>
          <Link href="/signup" className="flex-1 text-center bg-slate-800 hover:bg-slate-700 text-white py-2 rounded">Sign up</Link>
        </div>
      </div>
    </div>
  );
}
