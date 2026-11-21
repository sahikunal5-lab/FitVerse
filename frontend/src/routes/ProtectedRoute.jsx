
import { Navigate, Outlet } from "react-router-dom";
import { useSelector } from "react-redux";

import {
  selectAuthStatus,
} from "../features/auth/authSlice";


export default function ProtectedRoute() {

  const status = useSelector(selectAuthStatus);


  // 1. Wait for session restoration

  if (status === "loading") {
    return (
      <main className="container">
        <p role="status">Checking session...</p>
      </main>
    );
  }


  // 2. Block unauthenticated users

  if (status !== "authenticated") {
    return <Navigate to="/login" replace />;
  }


  // 3. Allow authenticated users

  return <Outlet />;
}
