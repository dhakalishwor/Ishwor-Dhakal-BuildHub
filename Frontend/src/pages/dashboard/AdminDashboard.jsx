import React, { useState, useEffect } from "react";
import { useSearchParams, useLocation } from "react-router-dom";
import DashboardLayout from "../../components/DashboardLayout";

// Sub-components
import AdminOverview from "./AdminOverview";
import AdminContractorManagement from "./AdminContractorManagement";
import AdminClientManagement from "./AdminClientManagement";
import AdminLicenseManagement from "./AdminLicenseManagement";
import AdminProjectMonitoring from "./AdminProjectMonitoring";
import AdminIssueManagement from "./AdminIssueManagement";

export default function AdminDashboard() {
  const [activeMenu, setActiveMenu] = useState("overview");
  const [searchParams] = useSearchParams();
  const location = useLocation();

  useEffect(() => {
    // 1. Check location state (from Sidebar clicks)
    if (location.state?.activeMenu) {
      setActiveMenu(location.state.activeMenu);
    }
    
    // 2. Check query params (from URL entry)
    const section = searchParams.get("section");
    if (section) setActiveMenu(section);
    
    // 3. Special case for issue highlighting
    if (searchParams.get("issue")) {
      setActiveMenu("issues");
    }
  }, [searchParams, location.state]);

  const renderContent = () => {
    switch (activeMenu) {
      case "overview": return <AdminOverview />;
      case "licenses": return <AdminLicenseManagement />;
      case "contractors": return <AdminContractorManagement />;
      case "clients": return <AdminClientManagement />;
      case "monitoring": return <AdminProjectMonitoring />;
      case "issues": return <AdminIssueManagement />;
      default: return <AdminOverview />;
    }
  };

  return (
    <DashboardLayout role="admin" activeMenu={activeMenu}>
      <div className="py-2">
         {renderContent()}
      </div>
    </DashboardLayout>
  );
}
