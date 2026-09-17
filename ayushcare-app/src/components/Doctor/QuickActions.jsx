import React from "react";
import {
  Plus,
  UserRound,
} from "lucide-react";

export default function QuickActions({ setActiveTab }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">

      {/* HEADER */}
      <div className="border-b border-slate-100 p-5">
        <h3 className="text-sm font-bold text-slate-800">
          Quick Actions
        </h3>

        <p className="mt-1 text-[10px] text-slate-400">
          Frequently used doctor tools
        </p>
      </div>

      {/* ACTION BUTTONS */}
      <div className="grid grid-cols-2 gap-3 p-5">

        <QuickAction
          icon={Plus}
          label="New Case"
          onClick={() => setActiveTab("cases")}
        />

        <QuickAction
          icon={UserRound}
          label="Patient Follow Up"
          onClick={() => setActiveTab("patients")}
        />

      </div>
    </div>
  );
}


// ==========================================================
// QUICK ACTION BUTTON
// ==========================================================

function QuickAction({
  icon: Icon,
  label,
  onClick,
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3 text-left transition hover:border-emerald-200 hover:bg-emerald-50"
    >
      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-white">
        <Icon className="h-4 w-4 text-emerald-600" />
      </div>

      <span className="text-[10px] font-bold text-slate-600">
        {label}
      </span>
    </button>
  );
}