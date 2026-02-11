import { Routes, Route } from "react-router-dom";
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

function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/clientdashboard" element={<ClientDashboard />} />
      <Route path="/admin/dashboard" element={<AdminDashboard />} />
      <Route path="/contractor/upload-license" element={<UploadLicense />} />
      <Route path="/client/postproject" element={<PostProject />} />
      <Route path="/contractor" element={<ContractorDashboard />} />
      <Route path="/client/projects" element={<MyProjects />} />
      <Route path="/client/myprojects" element={<MyProjects />} />
      <Route path="/client/project-bids" element={<ProjectBids />} />
      <Route path="/contractor/available-projects" element={<AvailableProjects />} />
      <Route path="/payment/esewa/success" element={<EsewaSuccess />} />
      <Route path="/payment/esewa/failure" element={<EsewaFailure />} />
    </Routes>
  );
}

export default App;
