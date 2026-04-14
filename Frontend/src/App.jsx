import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import Landing from "./assets/landing";
import React from "react";
import ClientDashboard from "./pages/dashboard/ClientDashboard";
import UploadLicense from "./pages/auth/UploadLicense";
import AdminDashboard from "./pages/dashboard/AdminDashboard";
import PostProject from "./pages/client/PostProject";
import ContractorDashboard from "./pages/dashboard/ContractorDashboard";
import MyProjects from "./pages/client/MyProjects";
import ProjectBids from "./pages/client/ProjectBids";
import AvailableProjects from "./pages/Contractor/AvailableProjects";
import EsewaFailure from "./pages/payments/EsewaFailure";
import EsewaSuccess from "./pages/payments/EsewaSuccess";
import WorkerDashboard from "./pages/dashboard/WorkerDashboard";
import MessagesPage from "./pages/message/MessagesPage";
import ReportIssue from "./pages/support/ReportIssue";
import MyIssues from "./pages/support/MyIssues";
import ContractorProfile from "./pages/client/ContractorProfile";
import ProtectedRoute from "./components/ProtectedRoute";

import { Toaster } from "react-hot-toast";

function App() {
  return (
    <>
      <Toaster position="top-right" reverseOrder={false} />
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/contractor/upload-license" element={<UploadLicense />} />
        
        {/* Protected Generic Routes (must be logged in) */}
        <Route element={<ProtectedRoute />}>
          <Route path="/messages" element={<MessagesPage />} />
          <Route path="/support/report" element={<ReportIssue />} />
          <Route path="/support/my-issues" element={<MyIssues />} />
          <Route path="/contractor-profile/:id" element={<ContractorProfile />} />
          <Route path="/payment/esewa/success" element={<EsewaSuccess />} />
          <Route path="/payment/esewa/failure" element={<EsewaFailure />} />
        </Route>
        
        {/* Protected Admin Routes */}
        <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
        </Route>

        {/* Protected Client Routes */}
        <Route element={<ProtectedRoute allowedRoles={['client']} />}>
          <Route path="/clientdashboard" element={<ClientDashboard />} />
          <Route path="/client/postproject" element={<PostProject />} />
          <Route path="/client/projects" element={<MyProjects />} />
          <Route path="/client/myprojects" element={<MyProjects />} />
          <Route path="/client/project-bids" element={<ProjectBids />} />
        </Route>

        {/* Protected Contractor Routes */}
        <Route element={<ProtectedRoute allowedRoles={['contractor']} />}>
          <Route path="/contractor" element={<ContractorDashboard />} />
          <Route path="/contractor/available-projects" element={<AvailableProjects />} />
        </Route>

        {/* Protected Worker Routes */}
        <Route element={<ProtectedRoute allowedRoles={['worker']} />}>
          <Route path="/worker/dashboard" element={<WorkerDashboard />} />
        </Route>

        {/* Fallback routing */}
        <Route path="/projects/:id" element={<Navigate to="/" replace />} />
        <Route path="/projects/:id/progress" element={<Navigate to="/" replace />} />
        
        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default App;
