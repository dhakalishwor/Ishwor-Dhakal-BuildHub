import React from "react";
import { useSearchParams } from "react-router-dom";
import ChatPanel from "../message/ChatPanel";
import Sidebar from "../../components/Sidebar";


export default function MessagesPage() {
    const [searchParams] = useSearchParams();
    const conversationId = searchParams.get("conversation");

    const role = localStorage.getItem("role") || "client"; 
    return (
        <div className="min-h-screen bg-white text-slate-900">
            <header className="sticky top-0 z-20 border-b bg-white">
                <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-emerald-700 text-white flex items-center justify-center font-bold">
                            BH
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-emerald-900">BuildHub</p>
                            <p className="text-xs text-slate-500">{role === "client" ? "Client" : "Contractor"} Dashboard</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-xs">
                            {localStorage.getItem("username")?.[0]?.toUpperCase() || "U"}
                        </div>
                        <span className="text-sm font-medium text-slate-700 hidden sm:inline">
                            {localStorage.getItem("username") || "User"}
                        </span>
                    </div>
                </div>
            </header>

            <div className="mx-auto grid max-w-7xl grid-cols-1 md:grid-cols-[260px_1fr]">
                <Sidebar role={role} activeMenu="messages" />
                <main className="p-6">
                    <div className="max-w-6xl mx-auto">
                        <h1 className="text-2xl font-bold text-emerald-900 mb-6">Messages</h1>
                        <ChatPanel initialConversation={conversationId} />
                    </div>
                </main>
            </div>
        </div>
    );
}
