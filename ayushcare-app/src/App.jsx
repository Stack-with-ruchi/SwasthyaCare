import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
} from "react-router-dom";

import { LanguageProvider } from "./context/LanguageContext";

import LandingPage from "./pages/LandingPage";
import DoctorSignup from "./pages/DoctorSignup";
import DoctorLogin from "./pages/DoctorLogin";
import PatientSignup from "./pages/PatientSignup";
import PatientLogin from "./pages/PatientLogin";
import PatientDashboard from "./pages/PatientDashboard";
import DoctorDashboard from "./pages/DoctorDashboard";
import AppointmentDetails from "./pages/AppointmentDetails";
import Chatbot from "./components/Chatbot";
import DoctorPatientDetails from "./pages/DoctorPatientDetails";
import DoctorCaseDetails from "./pages/DoctorCaseDetails";

export default function App() {
  return (
    <LanguageProvider>
      <Router>
        <Routes>

          <Route path="/" element={<LandingPage />} />

          <Route path="/home" element={<LandingPage />} />

          {/* Doctor */}
          <Route
            path="/doctor/signup"
            element={<DoctorSignup />}
          />

          <Route
            path="/doctor/login"
            element={<DoctorLogin />}
          />

          <Route
            path="/doctor/dashboard"
            element={<DoctorDashboard />}
          />

          <Route
            path="/doctor/patient/:patientId"
            element={<DoctorPatientDetails />}
          />

          <Route
          path="/doctor/case/:caseId"
          element={<DoctorCaseDetails />}
          />

          {/* Patient */}
          <Route
            path="/patient/signup"
            element={<PatientSignup />}
          />

          <Route
            path="/patient/login"
            element={<PatientLogin />}
          />

          <Route
            path="/patient/dashboard"
            element={<PatientDashboard />}
          />

          {/* Appointment */}
          <Route
            path="/appointment/:id"
            element={<AppointmentDetails />}
          />

          {/* Chatbot */}
          <Route
            path="/chatbot"
            element={<Chatbot />}
          />

        </Routes>
      </Router>
    </LanguageProvider>
  );
}