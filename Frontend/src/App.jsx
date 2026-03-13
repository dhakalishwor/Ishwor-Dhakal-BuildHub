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

import { Toaster } from "react-hot-toast";

function App() {
  return (
    <>
      <Toaster position="top-right" reverseOrder={false} />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/clientdashboard" element={<ClientDashboard />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/worker/dashboard" element={<WorkerDashboard />} />
        <Route path="/contractor/upload-license" element={<UploadLicense />} />
        <Route path="/client/postproject" element={<PostProject />} />
        <Route path="/contractor" element={<ContractorDashboard />} />
        <Route path="/client/projects" element={<MyProjects />} />
        <Route path="/client/myprojects" element={<MyProjects />} />
        <Route path="/client/project-bids" element={<ProjectBids />} />
        <Route path="/contractor/available-projects" element={<AvailableProjects />} />
        <Route path="/payment/esewa/success" element={<EsewaSuccess />} />
        <Route path="/payment/esewa/failure" element={<EsewaFailure />} />
        <Route path="/messages" element={<MessagesPage />} />
        <Route path="/support/report" element={<ReportIssue />} />
        <Route path="/support/my-issues" element={<MyIssues />} />
        <Route path="/projects/:id" element={<Navigate to="/" replace />} />
        <Route path="/projects/:id/progress" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}


export default App;
