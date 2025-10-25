import "@assets/input.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./Context/AuthContext";
import { NotificationProvider } from "./Context/NotificationContext";

import User from "./pages/user";
import Admin from "./pages/admin";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";

import "../src/assets/input.css";

export default function App() {
  const { user, role } = useAuth();

  return (
    <NotificationProvider>
      <BrowserRouter>
        <Routes>
          <Route
            path="/"
            element={user ? <User /> : <Navigate to="/login" />}
          />
          <Route
            path="/admin"
            element={
              user && role === "admin" ? <Admin /> : <Navigate to="/login" />
            }
          />
          <Route
            path="/login"
            element={!user ? <Login /> : <Navigate to="/" />}
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </NotificationProvider>
  );
}
