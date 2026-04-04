import React, { useEffect, useState } from "react";
import api from "../../API/axios";

export default function AdminOverview() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get("/auth/admin/stats/")
            .then(res => setData(res.data))
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return (
        <div className="flex flex-col items-center justify-center p-24">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-700"></div>
            <p className="mt-4 text-slate-500 font-medium tracking-wide">Loading platform analytics...</p>
        </div>
    );

    const stats = data?.stats || {};

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
             <div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">Overview</h1>
                <p className="text-slate-500 text-sm">Welcome back, Admin. Here's what's happening today.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Contractors" value={stats.totalContractors} icon={<UserIcon />} color="emerald" />
                <StatCard title="Clients" value={stats.totalClients} icon={<ClientIcon />} color="blue" />
                <StatCard title="Pending Reviews" value={stats.pendingLicenses} icon={<BadgeIcon />} color="orange" />
                <StatCard title="Active Projects" value={stats.activeProjects} icon={<ProjectIcon />} color="sky" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white/70 backdrop-blur-xl p-8 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/50">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-bold text-slate-800">Recent Activity</h3>
                        <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full uppercase tracking-tighter">Live Traffic</span>
                    </div>
                    <div className="space-y-4">
                        {data?.recentUsers?.map(user => (
                            <div key={user.id} className="flex items-center justify-between p-4 bg-slate-50/50 border border-slate-100 rounded-2xl hover:bg-white transition-colors group">
                                <div className="flex items-center gap-4">
                                    <div className="h-12 w-12 rounded-2xl bg-white shadow-sm overflow-hidden flex items-center justify-center font-black text-slate-300 group-hover:text-emerald-500 transition-colors">
                                        {user.profile_picture ? (
                                            <img src={user.profile_picture} alt={user.username} className="w-full h-full object-cover" />
                                        ) : (
                                            <span>{user.username[0].toUpperCase()}</span>
                                        )}
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-slate-800">{user.username}</p>
                                        <p className="text-[10px] font-bold text-slate-400 capitalize bg-white px-2 py-0.5 rounded-md inline-block mt-1">{user.role}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{new Date(user.date_joined).toLocaleDateString()}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="relative group overflow-hidden bg-emerald-900 rounded-[2rem] p-8 text-white shadow-xl shadow-emerald-900/20">
                     <div className="absolute -right-20 -top-20 h-64 w-64 bg-emerald-700/30 rounded-full blur-3xl group-hover:bg-emerald-600/40 transition-all duration-700"></div>
                     <div className="relative z-10">
                        <div className="h-14 w-14 bg-emerald-800 rounded-2xl flex items-center justify-center text-2xl mb-6 shadow-inner">
                            ⚡
                        </div>
                        <h3 className="text-xl font-bold mb-2">Needs Your Attention</h3>
                        <p className="text-emerald-100/80 text-sm leading-relaxed mb-8">
                            There are <span className="text-white font-bold underline decoration-emerald-400/50 underline-offset-4">{stats.pendingLicenses} contractor documents</span> waiting for verification. Keeping this queue low ensures workers can start earning faster.
                        </p>
                        <button className="w-full sm:w-auto px-6 py-3 bg-white text-emerald-900 rounded-xl font-bold text-sm hover:bg-emerald-50 transition-colors shadow-lg">
                            Go to License Review
                        </button>
                     </div>
                </div>
            </div>
        </div>
    );
}

function StatCard({ title, value, icon, color }) {
    const colors = {
        emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
        blue: "bg-blue-50 text-blue-600 border-blue-100",
        orange: "bg-orange-50 text-orange-600 border-orange-100",
        sky: "bg-sky-50 text-sky-600 border-sky-100",
    };
    return (
        <div className={`p-8 rounded-[2rem] border transition-all hover:scale-[1.02] hover:shadow-lg bg-white ${colors[color]}`}>
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 decoration-current underline underline-offset-4 mb-2">{title}</p>
                    <p className="text-4xl font-black text-slate-900">{value}</p>
                </div>
                <div className="h-12 w-12 flex items-center justify-center opacity-80">
                    {icon}
                </div>
            </div>
        </div>
    );
}

// Icons
const UserIcon = () => (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
);
const ClientIcon = () => (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
);
const BadgeIcon = () => (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
);
const ProjectIcon = () => (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
);
