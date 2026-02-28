import React from "react";
import { useNavigate } from "react-router-dom";

function classNames(...classes) {
    return classes.filter(Boolean).join(" ");
}

export default function Sidebar({ role, activeMenu, onItemClick }) {
    const navigate = useNavigate();

    const clientItems = [
        { key: "dashboard", label: "Dashboard", path: "/clientdashboard" },
        { key: "monitoring", label: "Monitor Progress", path: "/clientdashboard" },
        { key: "estimate", label: "Cost Estimation", path: "/clientdashboard" },
        { key: "postproject", label: "Post Project", path: "/clientdashboard" },
        { key: "my-projects", label: "My Projects", path: "/clientdashboard" },
        { key: "project-bids", label: "Project Bids", path: "/clientdashboard" },
        { key: "messages", label: "Messages", path: "/messages" },
        { key: "report-issue", label: "Report Issue", path: "/support/report" },
        { key: "my-issues", label: "My Issues", path: "/support/my-issues" },
        { key: "profile", label: "Profile", path: "/clientdashboard" },
    ];

    const contractorItems = [
        { key: "profile", label: "Manage Profile", path: "/contractor" },
        { key: "projects", label: "Available Projects", path: "/contractor" },
        { key: "bids", label: "My Bids", path: "/contractor" },
        { key: "manage-tasks", label: "Manage Tasks", path: "/contractor" },
        { key: "manage-team", label: "Manage Team", path: "/contractor" },
        { key: "sub-job-apps", label: "Sub-Job Applications", path: "/contractor" },
        { key: "hire-workers", label: "Hire Workers", path: "/contractor" },
        { key: "ratings", label: "Ratings", path: "/contractor" },
        { key: "messages", label: "Messages", path: "/messages" },
        { key: "report-issue", label: "Report Issue", path: "/support/report" },
        { key: "my-issues", label: "My Issues", path: "/support/my-issues" },
    ];

    const items = role === "client" ? clientItems : contractorItems;
    const menuTitle = role === "client" ? "Client Menu" : "Contractor Menu";

    const handleItemClick = (item) => {
        if (onItemClick) {
            onItemClick(item.key);
        } else {
            navigate(item.path, { state: { activeMenu: item.key } });
        }
    };

    return (
        <aside className="border-r bg-emerald-900 text-white p-4 md:sticky md:top-[64px] h-[calc(100vh-64px)] overflow-y-auto">
            <p className="text-xs uppercase tracking-wider text-emerald-200 mb-4">{menuTitle}</p>
            <div className="space-y-2">
                {items.map((item) => (
                    <button
                        key={item.key}
                        onClick={() => handleItemClick(item)}
                        className={classNames(
                            "w-full rounded-xl px-4 py-3 text-left transition font-semibold",
                            activeMenu === item.key
                                ? "bg-emerald-700 text-white shadow"
                                : "hover:bg-emerald-800 text-emerald-100"
                        )}
                    >
                        {item.label}
                    </button>
                ))}
            </div>

            <div className="mt-8 rounded-xl bg-white/10 p-4">
                <p className="text-xs text-emerald-200">Tip</p>
                <p className="mt-2 text-sm text-white/90">
                    {role === "client"
                        ? "Post clear project details to get better bids."
                        : "Keep your profile updated so clients can trust your work."}
                </p>
            </div>
        </aside>
    );
}
