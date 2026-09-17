import React from "react";
import {
  Calendar,
  Clock,
  Sparkles,
  Users,
} from "lucide-react";

export default function DashboardStats({ stats }) {
  const cards = [
    {
      label: "Today's Appointments",
      value: stats?.todayAppointments ?? 0,
      icon: Calendar,
      description: "Scheduled for today",
    },
    {
      label: "Pending Cases",
      value: stats?.pendingCases ?? 0,
      icon: Clock,
      description: "Waiting for review",
    },
    {
      label: "AI Summaries",
      value: stats?.availableAiSummaries ?? 0,
      icon: Sparkles,
      description: "Ready to review",
    },
    {
      label: "Total Patients",
      value: stats?.totalPatients ?? 0,
      icon: Users,
      description: "Assigned patients",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;

        return (
          <div
            key={card.label}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500">
                  {card.label}
                </p>

                <h3 className="mt-2 text-2xl font-bold text-slate-800">
                  {card.value}
                </h3>

                <p className="mt-1 text-[11px] text-slate-400">
                  {card.description}
                </p>
              </div>

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50">
                <Icon className="h-5 w-5 text-emerald-600" />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}