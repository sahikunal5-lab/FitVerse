
import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";

import AuthForm from "../components/ui/AuthForm";

import {
  selectAuthStatus,
} from "../features/auth/authSlice";


export default function LoginPage() {

  const status = useSelector(selectAuthStatus);


  // 1. Wait until Supabase restores the session

  if (status === "loading") {

    return (
      <main className="container">
        <p role="status">Checking session...</p>
      </main>
    );

  }


  // 2. Redirect authenticated users to homepage

  if (status === "authenticated") {

    return <Navigate to="/" replace />;

  }


  // 3. Display login form for unauthenticated users

  return <AuthForm mode="login" />;

}
