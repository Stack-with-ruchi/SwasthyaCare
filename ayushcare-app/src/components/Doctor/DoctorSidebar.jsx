import React from "react";
import {
  LayoutDashboard,
  Users,
  Calendar,
  FolderKanban,
  Search,
  Settings,
  LogOut,
  HelpCircle,
} from "lucide-react";

import doctorIcon from "../../assets/doctorIcon.png.jpeg";

export default function DoctorSidebar({
  doctor,
  activeTab,
  setActiveTab,
  handleLogout,
}) {
  const navigation = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
    },
    {
      id: "patients",
      label: "Patients",
      icon: Users,
    },
    {
      id: "appointments",
      label: "Appointments",
      icon: Calendar,
    },
    {
      id: "cases",
      label: "Recent Cases",
      icon: FolderKanban,
    },
    {
      id: "abha-search",
      label: "ABHA Search",
      icon: Search,
    },
    {
      id: "settings",
      label: "Settings",
      icon: Settings,
    },
  ];

  return (
    <aside className="w-64 flex-shrink-0 overflow-y-auto bg-[#084832] p-4 text-emerald-100">
      <div>
        {/* Doctor Profile */}
        <div className="mb-4 flex flex-col items-center border-b border-emerald-600/30 pb-5 text-center">
          <div className="relative mb-3">
            <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-slate-900 shadow-md ring-2 ring-emerald-200/50">
              <img
                src={doctorIcon}
                alt="Doctor Icon"
                className="h-full w-full object-cover"
              />
            </div>
          </div>

          <h2 className="text-base font-bold tracking-wide text-white">
            {doctor?.fullName || "Doctor"}
          </h2>

          <p className="text-xs font-medium text-emerald-200/80">
            {doctor?.specialization || "Ayurveda Physician"}
          </p>

          {doctor?.degree && (
            <p className="mt-1.5 rounded-full border border-emerald-400/30 bg-emerald-500/20 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-300">
              {doctor.degree}
            </p>
          )}

          {doctor?.regNumber && (
            <p className="mt-1 text-[9px] text-emerald-300/70">
              Reg. No: {doctor.regNumber}
            </p>
          )}
        </div>

        {/* Navigation */}
        <nav className="space-y-1">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex w-full items-center rounded-xl px-3.5 py-2.5 text-xs font-semibold transition-all ${
                  isActive
                    ? "border-l-4 border-emerald-400 bg-[#105d43] text-white shadow-sm"
                    : "text-emerald-100/70 hover:bg-[#0c533b] hover:text-white"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon
                    className={`h-4 w-4 ${
                      isActive
                        ? "text-emerald-400"
                        : "text-emerald-200/60"
                    }`}
                  />

                  <span>{item.label}</span>
                </div>
              </button>
            );
          })}

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="flex w-full items-center rounded-xl px-3.5 py-2.5 text-xs font-semibold text-emerald-100/70 transition-all hover:bg-[#0c533b] hover:text-white"
          >
            <div className="flex items-center gap-2.5">
              <LogOut className="h-4 w-4 text-emerald-200/60" />
              <span>Logout</span>
            </div>
          </button>
        </nav>
      </div>

      {/* Help */}
      <div className="mt-4 flex items-center gap-2 rounded-2xl border border-emerald-600/30 bg-[#0b543c] p-3 text-xs text-emerald-200">
        <HelpCircle className="h-4 w-4 text-emerald-300" />

        <div>
          <p className="text-[11px] font-bold text-white">
            Need Help?
          </p>

          <p className="text-[10px] text-emerald-200/80">
            Contact Support
          </p>
        </div>
      </div>
    </aside>
  );
}