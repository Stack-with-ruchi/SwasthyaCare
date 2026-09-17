import React from "react";
import {
  Bell,
  Settings,
} from "lucide-react";

export default function DoctorHeader({
  doctor,
  setActiveTab,
}) {
  return (
    <header className="flex h-16 flex-shrink-0 items-center justify-between border-b border-slate-200/80 bg-white px-8">
      <div>
        <h1 className="flex items-center gap-2 text-xl font-bold text-slate-800">
          Good Morning, {doctor?.fullName || "Doctor"}
          <span className="inline-block animate-bounce">
            👋
          </span>
        </h1>

        <p className="text-xs font-medium text-slate-500">
          Here's what's happening in your practice today.
        </p>
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={() => (window.location.href = "/")}
          className="rounded-lg border border-slate-200 bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-emerald-50 hover:text-emerald-700"
        >
          Landing Page
        </button>

        <button className="relative rounded-xl p-2 text-slate-500 transition hover:bg-slate-100">
          <Bell className="h-4 w-4" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-emerald-500" />
        </button>

        <button
          className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100"
          title="Settings"
          onClick={() => setActiveTab("settings")}
        >
          <Settings className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}