import React from "react";
import { useSearchParams } from "react-router-dom";
import ChatPanel from "../message/ChatPanel";
import DashboardLayout from "../../components/DashboardLayout";

export default function MessagesPage() {
    const [searchParams] = useSearchParams();
    const conversationId = searchParams.get("conversation");
    const role = localStorage.getItem("role") || "client"; 

    return (
        <DashboardLayout role={role} activeMenu="messages">
            <div className="max-w-6xl mx-auto">
                <h1 className="text-2xl font-bold text-emerald-900 mb-6">Messages</h1>
                <ChatPanel initialConversation={conversationId} />
            </div>
        </DashboardLayout>
    );
}
