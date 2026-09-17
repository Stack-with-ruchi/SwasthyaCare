import React, { useState, useEffect, useRef } from "react";
import { Globe, Search, Check, ChevronDown } from "lucide-react";
import { ALL_INDIAN_LANGUAGES } from "../../constants/languages";
import { useLanguage } from "../../context/LanguageContext";

export default function LanguageSelect({
  selectedLanguage,
  onSelectLanguage,
  isTranslating,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef(null);

  // Global language state
  const { language, setLanguage } = useLanguage();

  // Use prop language if provided, otherwise use global language
  const currentLanguage = selectedLanguage || language?.name || "English";

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Filter languages by English name, native name, or code
  const filteredLanguages = ALL_INDIAN_LANGUAGES.filter((lang) => {
    const search = searchTerm.toLowerCase();

    return (
      lang.name.toLowerCase().includes(search) ||
      lang.nativeName.toLowerCase().includes(search) ||
      lang.code.toLowerCase().includes(search)
    );
  });

  // Handle language selection
  const handleLanguageSelect = (selectedLang) => {
    // Update global language
    setLanguage(selectedLang);

    // Save language permanently in browser
    localStorage.setItem(
      "selectedLanguage",
      JSON.stringify(selectedLang)
    );

    // Keep compatibility with existing parent components
    if (onSelectLanguage) {
      onSelectLanguage(selectedLang.name);
    }

    // Close dropdown
    setIsOpen(false);
    setSearchTerm("");
  };

  return (
    <div className="relative" ref={dropdownRef}>
      
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 border border-slate-200 px-3.5 py-2 rounded-xl font-semibold text-xs transition-all shadow-sm"
      >
        <Globe className="w-4 h-4 text-emerald-600" />

        <span>{currentLanguage}</span>

        {isTranslating ? (
          <span className="text-[10px] text-emerald-600 font-bold animate-pulse">
            ...
          </span>
        ) : (
          <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-100 z-50 overflow-hidden">
          
          {/* Search Box */}
          <div className="p-2.5 border-b border-slate-100 bg-slate-50">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />

              <input
                type="text"
                placeholder="Search language..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                autoFocus
                className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
              />
            </div>
          </div>

          {/* Languages List */}
          <div className="max-h-64 overflow-y-auto py-1 divide-y divide-slate-50">
            
            {filteredLanguages.length > 0 ? (
              filteredLanguages.map((lang) => {
                const isSelected =
                  currentLanguage === lang.name;

                return (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() =>
                      handleLanguageSelect(lang)
                    }
                    className={`w-full text-left px-3.5 py-2.5 text-xs flex items-center justify-between transition ${
                      isSelected
                        ? "bg-emerald-50 text-emerald-800 font-bold"
                        : "text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex flex-col">
                      
                      {/* Native language name */}
                      <span className="text-xs">
                        {lang.nativeName}
                      </span>

                      {/* English language name */}
                      <span className="text-[10px] text-slate-400">
                        {lang.name}
                      </span>
                    </div>

                    {isSelected && (
                      <Check className="w-4 h-4 text-emerald-600" />
                    )}
                  </button>
                );
              })
            ) : (
              <div className="p-4 text-center text-xs text-slate-400">
                No language found matching "{searchTerm}"
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}