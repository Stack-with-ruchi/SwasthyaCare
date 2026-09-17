import React from "react";
import { Sparkles, ArrowRight, UserRound } from "lucide-react";

export default function AISummaryCard({
  aiSummary,
  setActiveTab,
  fullPage = false,
}) {
  const summaryText = aiSummary?.overview || aiSummary?.summary || "";
  const patientName = aiSummary?.patient?.fullName || "Patient";
  const caseId = aiSummary?.caseId || "N/A";
  const summaryStatus = aiSummary?.summaryStatus || "Available";

  return (
    <div
      className={`rounded-2xl border border-emerald-100 bg-white shadow-sm ${
        fullPage ? "mt-6" : ""
      }`}
    >
      {/* HEADER */}
      <div className="flex items-center justify-between border-b border-emerald-50 p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50">
            <Sparkles className="h-5 w-5 text-emerald-600" />
          </div>

          <div>
            <h3 className="text-sm font-bold text-slate-800">
              AI Case Summary
            </h3>

            <p className="mt-1 text-[10px] text-slate-400">
              AI-generated clinical case overview
            </p>
          </div>
        </div>

        <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[9px] font-bold text-emerald-700">
          AI
        </span>
      </div>

      {/* CONTENT */}
      <div className="p-5">
        {aiSummary ? (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5 rounded-full bg-slate-100 px-2 py-1 text-[10px] font-medium text-slate-600">
                <UserRound className="h-3.5 w-3.5" />
                {patientName}
              </div>

              <span className="rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-semibold text-emerald-700">
                {summaryStatus}
              </span>
            </div>

            <div className="rounded-xl border border-emerald-100 bg-emerald-50/40 p-3">
              <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
                Case ID
              </p>

              <p className="mt-1 text-[11px] font-medium text-slate-700">
                {caseId}
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs leading-6 text-slate-700 whitespace-pre-wrap">
                {summaryText || "AI summary is available for review."}
              </p>
            </div>

            {aiSummary?.generatedAt && (
              <p className="text-[10px] text-slate-400">
                Generated: {new Date(aiSummary.generatedAt).toLocaleString()}
              </p>
            )}
          </div>
        ) : (
          <div className="rounded-xl bg-slate-50 p-4">
            <div className="flex items-center gap-3">
              <Sparkles className="h-5 w-5 text-slate-300" />

              <div>
                <p className="text-xs font-semibold text-slate-600">
                  No AI summary available
                </p>

                <p className="mt-1 text-[10px] text-slate-400">
                  AI summaries will appear here when available.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* FOOTER */}
      <div className="border-t border-emerald-50 p-4">
        <button
          onClick={() => setActiveTab && setActiveTab("ai-summary")}
          className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-600 hover:text-emerald-700"
        >
          Open AI Case Summary

          <ArrowRight className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}