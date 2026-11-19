import { Navigate, Route, Routes } from "react-router-dom";
import Navbar from "./components/layout/Navbar";
import HomePage from "./pages/HomePage";
import LiveWorkoutPage from "./pages/LiveWorkoutPage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import ComingSoonPage from "./pages/ComingSoonPage";

export default function App() {
  return (
    <div className="app-shell">
      <Navbar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/workout" element={<LiveWorkoutPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/features/:slug" element={<ComingSoonPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}
