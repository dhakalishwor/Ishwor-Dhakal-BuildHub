import React from "react";
import Sidebar from "./Sidebar";
import { useNavigate } from "react-router-dom";
import NotificationBell from "./NotificationBell";

export default function DashboardLayout({ children, role, activeMenu }) {
    const navigate = useNavigate();
    const HEADER_H = 64;

    const logoText = role === "admin" ? "BH Admin" : "BuildHub";
    const subTitle = role === "admin" ? "Admin Dashboard" : role === "client" ? "Client Dashboard" : role === "contractor" ? "Contractor Dashboard" : role === "worker" ? "Worker Dashboard" : "Support Center";

    return (
        <div className="min-h-screen bg-white text-slate-900">
            <header className="sticky top-0 z-20 border-b bg-white">
                <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-emerald-700 text-white flex items-center justify-center font-bold">
                            BH
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-emerald-900">{logoText}</p>
                            <p className="text-xs text-slate-500">{subTitle}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <NotificationBell />
                        <button
                            onClick={() => navigate(-1)}
                            className="text-sm font-medium text-slate-600 hover:text-emerald-700 transition"
                        >
                            Back
                        </button>
                    </div>
                </div>
            </header>

            <div
                className="mx-auto grid max-w-7xl grid-cols-1 md:grid-cols-[260px_1fr]"
                style={{ minHeight: `calc(100vh - ${HEADER_H}px)` }}
            >
                <Sidebar
                    role={role || "client"}
                    activeMenu={activeMenu}
                    onItemClick={(key) => {
                        if (key === "messages") {
                            navigate("/messages");
                            return;
                        }
                        if (key === "report-issue") {
                            navigate("/support/report");
                            return;
                        }
                        if (key === "my-issues") {
                            navigate("/support/my-issues");
                            return;
                        }
                        const dashPath = role === "admin" ? "/admin/dashboard" : role === "client" ? "/clientdashboard" : role === "worker" ? "/worker/dashboard" : "/contractor";
                        navigate(dashPath, { state: { activeMenu: key } });
                    }}
                />

                <main className="p-6 bg-slate-50/50">
                    <div className="mx-auto max-w-5xl">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
