import mongoose from "mongoose";

// List of Indian languages including official and prominent regional languages
export const INDIAN_LANGUAGES = [
  { code: "en", name: "English", nativeName: "English" },
  { code: "hi", name: "Hindi", nativeName: "हिन्दी" },
  { code: "hne", name: "Chhattisgarhi", nativeName: "छत्तीसगढ़ी" },
  { code: "mr", name: "Marathi", nativeName: "मराठी" },
  { code: "gu", name: "Gujarati", nativeName: "ગુજરાતી" },
  { code: "bn", name: "Bengali", nativeName: "বাংলা" },
  { code: "ta", name: "Tamil", nativeName: "தமிழ்" },
  { code: "te", name: "Telugu", nativeName: "తెలుగు" },
  { code: "kn", name: "Kannada", nativeName: "ಕನ್ನಡ" },
  { code: "ml", name: "Malayalam", nativeName: "മലയാളം" },
  { code: "pa", name: "Punjabi", nativeName: "ਪੰਜਾਬੀ" },
  { code: "or", name: "Odia", nativeName: "ଓଡ଼ିଆ" },
  { code: "as", name: "Assamese", nativeName: "অসমীয়া" },
  { code: "ur", name: "Urdu", nativeName: "اردو" },
  { code: "sa", name: "Sanskrit", nativeName: "संस्कृतम्" },
  { code: "ks", name: "Kashmiri", nativeName: "कश्मीरी / كشميري" },
  { code: "ne", name: "Nepali", nativeName: "नेपाली" },
  { code: "sd", name: "Sindhi", nativeName: "सिन्धी / سنڌي" },
  { code: "kok", name: "Konkani", nativeName: "कोंकणी" },
  { code: "doi", name: "Dogri", nativeName: "डोगरी" },
  { code: "mni", name: "Manipuri (Meitei)", nativeName: "मैतेई" },
  { code: "sat", name: "Santali", nativeName: "संथाली" },
  { code: "mai", name: "Maithili", nativeName: "मैथिली" },
  { code: "brx", name: "Bodo", nativeName: "बड़ो" },
];

const languageSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true },
    translations: { type: Map, of: String },
  },
  { timestamps: true },
);

export default mongoose.model("Language", languageSchema);
