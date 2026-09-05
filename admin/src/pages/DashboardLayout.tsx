import { NavLink, Outlet, Navigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";

export default function DashboardLayout() {
  const { token, user, signOut } = useAuthStore();

  if (!token || user?.role !== "admin") {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="app-shell">
      <nav className="sidebar">
        <h1>Blood Admin</h1>
        <NavLink to="/" end>
          Overview
        </NavLink>
        <NavLink to="/users">Users</NavLink>
        <NavLink to="/donors">Donors</NavLink>
        <NavLink to="/settings">Settings</NavLink>
        <div style={{ flex: 1 }} />
        <button className="btn secondary small" onClick={signOut}>
          Log out ({user.username})
        </button>
      </nav>
      <div className="main">
        <Outlet />
      </div>
    </div>
  );
}
