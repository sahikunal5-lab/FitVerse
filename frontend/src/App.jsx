
import {
  Navigate,
  Route,
  Routes,
} from "react-router-dom";


// Layout

import Navbar from "./components/layout/Navbar";


// Pages

import HomePage from "./pages/HomePage";
import LiveWorkoutPage from "./pages/LiveWorkoutPage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import ComingSoonPage from "./pages/ComingSoonPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";


// Route Protection

import ProtectedRoute from "./routes/ProtectedRoute";
import GuestRoute from "./routes/GuestRoute";


export default function App() {

  return (

    <div className="app-shell">

      <Navbar />

      <Routes>


        {/* =====================================
            1. PUBLIC ROUTES
        ====================================== */}

        <Route
          path="/"
          element={<HomePage />}
        />

        {/* PASSWORD RESET */}
        <Route
          path="/reset-password"
          element={<ResetPasswordPage />}
        />

        {/* =====================================
            2. GUEST ROUTES
        ====================================== */}

        <Route element={<GuestRoute />}>

          <Route
            path="/login"
            element={<LoginPage />}
          />

          <Route
            path="/signup"
            element={<SignupPage />}
          />

          <Route
            path="/forgot-password"
            element={<ForgotPasswordPage />}
          />

        </Route>


        {/* =====================================
            3. PROTECTED ROUTES
        ====================================== */}

        <Route element={<ProtectedRoute />}>

          <Route
            path="/workout"
            element={<LiveWorkoutPage />}
          />

          <Route
            path="/features/:slug"
            element={<ComingSoonPage />}
          />

        </Route>


        {/* =====================================
            4. FALLBACK ROUTE
        ====================================== */}

        <Route
          path="*"
          element={<Navigate to="/" replace />}
        />


      </Routes>

    </div>
  );
}
