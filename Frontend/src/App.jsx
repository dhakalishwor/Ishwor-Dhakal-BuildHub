import { Routes, Route } from "react-router-dom";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import Landing from "./assets/landing";
import React from "react";
import ClientDashboard from "./pages/dashboard/ClientDashboard";
import UploadLicense from "./pages/auth/UploadLicense";
function App() {
  return (
    <Routes>
      <Route path ="/" element = {<Landing/>}/>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path ="/clientdashboard" element={<ClientDashboard/>}/>
      <Route path="/contractor/upload-license" element={<UploadLicense />} />
    </Routes>
  );
}

export default App;
