import React, { useEffect, useRef, useState, useMemo } from "react";
import {
Search,
FileText,
Download,
Eye,
Plus,
UploadCloud,
} from "lucide-react";

import { useTranslation } from "../../hooks/useTranslation";
import { useLanguage } from "../../context/LanguageContext";
import { API_BASE_URL, apiRequest } from "../../utils/api";

export default function ReportsSection() {
const [activeCategory, setActiveCategory] = useState("lab");
const [searchQuery, setSearchQuery] = useState("");
const [documents, setDocuments] = useState([]);
const fileInputRef = useRef(null);

// Get patient's selected language
const { language } = useLanguage();

useEffect(() => {
  const token = localStorage.getItem("patient_token");

  if (!token) return;

  apiRequest("/documents/my-documents", {
    headers: { Authorization: `Bearer ${token}` },
  })
    .then((data) => {
      setDocuments(
        (Array.isArray(data) ? data : data.documents || []).map((document) => ({
          id: document._id,
          title: document.name,
          date: document.uploadDate
            ? new Date(document.uploadDate).toLocaleDateString()
            : "N/A",
          source: document.doctorName || "Self Uploaded",
          type: document.type?.toLowerCase().includes("prescription")
            ? "prescription"
            : document.type?.toLowerCase().includes("lab") ||
                document.type?.toLowerCase().includes("report")
              ? "lab"
              : "other",
          fileUrl: document.fileUrl,
        })),
      );
    })
    .catch((error) => console.error("Failed to load documents:", error));
}, []);

// All text starts in English.
// useTranslation changes it according to the patient's language.
const texts = useMemo(
() => ({
title: "Medical Reports",


  searchPlaceholder:
    "Search documents or lab tests...",

  labReports: "Lab Reports",
  prescriptions: "Prescriptions",
  other: "Other",

  viewReport: "View Report",
  download: "Download",

  noReports:
    "No reports available in this category.",

  uploadDocuments: "Upload Documents",

  uploadDescription:
    "Upload prescriptions and medical reports.",

  uploadDocument: "Upload Document",

  bloodTestReport: "Blood Test Report",

  ayurvedicConsultationSummary:
    "Ayurvedic Consultation Summary",

  xrayReport: "X-Ray Report",
}),
[]


);

const { t } = useTranslation(texts);

const getFileUrl = (fileUrl) =>
  fileUrl ? `${API_BASE_URL.replace(/\/api\/?$/, "")}${fileUrl}` : "";

const handleUpload = async (event) => {
  const file = event.target.files[0];
  const token = localStorage.getItem("patient_token");

  if (!file || !token) return;

  const formData = new FormData();
  formData.append("document", file);
  formData.append("name", file.name);
  formData.append("type", "Medical Report");
  formData.append("doctorName", "Self Uploaded");

  try {
    const data = await apiRequest("/documents/upload", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    const document = data.document;
    setDocuments((currentDocuments) => [
      {
        id: document._id,
        title: document.name,
        date: new Date(document.uploadDate).toLocaleDateString(),
        source: document.doctorName || "Self Uploaded",
        type: "lab",
        fileUrl: document.fileUrl,
      },
      ...currentDocuments,
    ]);
  } catch (error) {
    console.error("Document upload failed:", error);
  } finally {
    event.target.value = "";
  }
};

// Translate document titles
const getTranslatedTitle = (document) => {
switch (document.id) {
case "1":
return t.bloodTestReport;


  case "2":
    return t.ayurvedicConsultationSummary;

  case "3":
    return t.xrayReport;

  default:
    return document.title;
}


};

// Filter documents
const filteredDocs = documents.filter((doc) => {
const translatedTitle =
getTranslatedTitle(doc);

return (
  doc.type === activeCategory &&
  (
    doc.title
      .toLowerCase()
      .includes(searchQuery.toLowerCase()) ||
    translatedTitle
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
  )
);


});

// Tab counts
const labCount = documents.filter(
(doc) => doc.type === "lab"
).length;

const prescriptionCount = documents.filter(
(doc) => doc.type === "prescription"
).length;

const otherCount = documents.filter(
(doc) => doc.type === "other"
).length;

const tabs = [
{
id: "lab",
label: t.labReports,
count: labCount,
},
{
id: "prescription",
label: t.prescriptions,
count: prescriptionCount,
},
{
id: "other",
label: t.other,
count: otherCount,
},
];

return ( <div className="bg-slate-50 min-h-screen p-6 font-sans">

```
  {/* Page Title */}
  <h1 className="text-xl font-bold text-slate-800 mb-6">
    {t.title}
  </h1>

  {/* Search Bar */}
  <div className="relative mb-6 max-w-lg">

    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />

    <input
      type="text"
      placeholder={t.searchPlaceholder}
      value={searchQuery}
      onChange={(e) =>
        setSearchQuery(e.target.value)
      }
      className="w-full pl-9 pr-4 py-2 border border-slate-300 bg-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
    />

  </div>

  {/* Category Tabs */}
  <div className="flex gap-2 mb-6 overflow-x-auto pb-1">

    {tabs.map((tab) => (
      <button
        key={tab.id}
        onClick={() =>
          setActiveCategory(tab.id)
        }
        className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
          activeCategory === tab.id
            ? "bg-emerald-700 text-white"
            : "bg-white text-slate-600 border hover:bg-slate-100"
        }`}
      >
        {tab.label} ({tab.count})
      </button>
    ))}

  </div>

  {/* Document List */}
  <div className="space-y-3 mb-8">

    {filteredDocs.length > 0 ? (
      filteredDocs.map((doc) => (

        <div
          key={doc.id}
          className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        >

          {/* Document Information */}
          <div className="flex items-center gap-3">

            <div className="p-2 bg-emerald-50 text-emerald-700 rounded-lg">
              <FileText className="w-5 h-5" />
            </div>

            <div>

              <h4 className="text-sm font-bold text-slate-800">
                {getTranslatedTitle(doc)}
              </h4>

              <p className="text-xs text-slate-400">
                {doc.date} • {doc.source}
              </p>

            </div>

          </div>

          {/* Actions */}
          <div className="flex items-center gap-4">

            <button
              type="button"
              onClick={() => window.open(getFileUrl(doc.fileUrl), "_blank", "noopener,noreferrer")}
              className="flex items-center gap-1 text-xs text-slate-600 hover:text-emerald-700 font-medium"
            >
              <Download className="w-3.5 h-3.5" />

              {t.download}
            </button>

            <button
              type="button"
              onClick={() => window.open(getFileUrl(doc.fileUrl), "_blank", "noopener,noreferrer")}
              className="flex items-center gap-1 text-xs text-slate-600 hover:text-emerald-700 font-medium"
            >
              <Eye className="w-3.5 h-3.5" />

              {t.viewReport}
            </button>

          </div>

        </div>

      ))
    ) : (

      /* No Reports */
      <div className="bg-white rounded-xl border border-slate-200 p-10 text-center">

        <FileText className="w-8 h-8 text-slate-300 mx-auto mb-3" />

        <p className="text-sm text-slate-500">
          {t.noReports}
        </p>

      </div>

    )}

  </div>

  {/* Upload Document Section */}
  <div className="border-2 border-dashed border-emerald-300 bg-emerald-50/50 rounded-xl p-6 text-center">

    <UploadCloud className="w-8 h-8 text-emerald-600 mx-auto mb-2" />

    <h3 className="text-sm font-bold text-slate-800 mb-1">
      {t.uploadDocuments}
    </h3>

    <p className="text-xs text-slate-500 mb-4">
      {t.uploadDescription}
    </p>

    <input
      ref={fileInputRef}
      type="file"
      accept=".pdf,.jpg,.jpeg,.png"
      onChange={handleUpload}
      className="hidden"
    />

    <button
      type="button"
      onClick={() => fileInputRef.current?.click()}
      className="inline-flex items-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
    >

      <Plus className="w-4 h-4" />

      {t.uploadDocument}

    </button>

  </div>

</div>


);
}
