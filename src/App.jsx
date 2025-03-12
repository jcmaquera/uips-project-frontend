import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, Outlet } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/SignUp";
import Sidebar from "./components/Sidebar";
import AddItem from "./pages/AddItem";
import DeleteItem from "./pages/DeleteItem";
import GenerateReports from "./pages/GenerateReports";
import AddDelivery from "./pages/AddDelivery";

const App = () => {
  return (
    <Router>
      <MainRoutes />
    </Router>
  );
};

// Layout with Sidebar for Protected Pages
const DashboardLayout = () => {
  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 p-5 lg:ml-64">
        <Outlet /> {/* This renders the child route components dynamically */}
      </div>
    </div>
  );
};

// Main Routes Component
const MainRoutes = () => {
  const location = useLocation();
  const isAuthPage = location.pathname === "/login" || location.pathname === "/signup";

  return (
    <Routes>
      {/* Redirect root to login */}
      <Route path="/" element={<Navigate to="/login" />} />

      {/* Authentication Pages (No Sidebar) */}
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />

      {/* Protected Pages (With Sidebar) */}
      <Route element={<DashboardLayout />}>
        <Route path="/dashboard" element={<Home />} />
        <Route path="/add-item" element={<AddItem />} />
        <Route path="/add-delivery" element={<AddDelivery />} />
        <Route path="/delete-item" element={<DeleteItem />} />
        <Route path="/generate-reports" element={<GenerateReports />} />
      </Route>
    </Routes>
  );
};

export default App;
