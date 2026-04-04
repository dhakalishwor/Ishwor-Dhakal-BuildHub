import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../API/axios";
import DashboardLayout from "../../components/DashboardLayout";
import { toast } from "react-hot-toast";

const StarRating = ({ rating }) => {
  return (
    <div className="flex gap-1 text-yellow-400">
      {[...Array(5)].map((_, i) => (
        <svg
          key={i}
          className={`w-5 h-5 ${i < Math.round(rating) ? "fill-current" : "text-gray-300 fill-current"}`}
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
};

export default function ContractorProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [contractor, setContractor] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await api.get(`/api/contractors/${id}/`);
        setContractor(res.data);
      } catch (err) {
        toast.error("Failed to load contractor profile");
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, [id]);

  if (loading) {
    return (
      <DashboardLayout role="client">
        <div className="flex flex-col items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-700"></div>
          <p className="mt-4 text-slate-600 font-medium font-primary">Loading profile...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (!contractor) {
    return (
      <DashboardLayout role="client">
        <div className="text-center py-20">
          <h2 className="text-2xl font-bold text-slate-800">Profile Not Found</h2>
          <button
            onClick={() => navigate(-1)}
            className="mt-4 text-emerald-700 font-semibold hover:underline"
          >
            Go Back
          </button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="client">
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Profile Header Card */}
        <div className="relative overflow-hidden rounded-[2.5rem] bg-white border border-slate-100 shadow-xl shadow-slate-200/50 p-8 md:p-12 mb-12">
          {/* Decorative Elements */}
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-emerald-50 rounded-full opacity-50 blur-3xl"></div>
          <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 bg-blue-50 rounded-full opacity-50 blur-3xl"></div>

          <div className="relative flex flex-col md:flex-row items-center md:items-start gap-8 md:gap-12">
            {/* Avatar / Picture */}
            <div className="w-32 h-32 md:w-40 md:h-40 rounded-3xl bg-slate-100 overflow-hidden flex items-center justify-center shadow-2xl shadow-slate-200/50 shrink-0 border-4 border-white relative z-10">
              {contractor.profilePicture ? (
                <img 
                  src={contractor.profilePicture} 
                  alt={contractor.fullName} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-emerald-600 to-emerald-800 flex items-center justify-center text-5xl md:text-6xl font-bold text-white uppercase">
                  {contractor.fullName?.[0] || 'C'}
                </div>
              )}
            </div>

            <div className="flex-1 text-center md:text-left">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                <div>
                  <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight font-primary">
                    {contractor.fullName}
                  </h1>
                  <p className="text-lg text-emerald-700 font-bold mt-1 tracking-wide uppercase">
                    {contractor.workType || contractor.contractorType}
                  </p>
                </div>
                
                <div className="flex flex-col items-center md:items-end gap-2">
                  <div className="px-4 py-2 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-700 font-bold text-sm tracking-wide">
                    {contractor.availabilityStatus}
                  </div>
                  <div className="text-sm font-semibold text-slate-500">
                    {contractor.experienceYears} Years Experience
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-8">
                {contractor.projectTypes?.map((tag, i) => (
                  <span key={i} className="px-4 py-1.5 rounded-full bg-slate-100/80 text-slate-600 text-sm font-bold border border-slate-200">
                    {tag}
                  </span>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-emerald-700">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Location</p>
                    <p className="text-sm font-bold text-slate-700">{contractor.address || "Nepal"}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-emerald-700">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Contact</p>
                    <p className="text-sm font-bold text-slate-700">{contractor.phone || "Not shared"}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-8">
          <div>
            {/* Feedbacks Section */}
            <div className="mb-8">
              <h2 className="text-2xl font-black text-slate-900 mb-6 font-primary tracking-tight">Recent Feedbacks</h2>
              
              <div className="space-y-6">
                {!contractor.feedbacks || contractor.feedbacks.length === 0 ? (
                  <div className="p-12 text-center rounded-3xl border border-dashed border-slate-300 bg-slate-50">
                    <p className="text-slate-400 font-medium italic">No feedbacks yet for this contractor.</p>
                  </div>
                ) : (
                  contractor.feedbacks.map((fb, idx) => (
                    <div key={fb.id} className="group p-6 rounded-3xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-all">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 font-bold">
                            {fb.client_name?.[0] || 'C'}
                          </div>
                          <div>
                            <p className="text-sm font-black text-slate-900">{fb.client_name}</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                              {new Date(fb.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <StarRating rating={fb.rating} />
                      </div>
                      <p className="text-slate-600 text-sm leading-relaxed italic">
                        "{fb.feedback || "Perfect service!"}"
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <aside className="space-y-6">
            {/* Rating Summary Card */}
            <div className="p-8 rounded-[2.5rem] bg-slate-900 text-white shadow-2xl shadow-slate-900/20">
              <h3 className="text-xl font-black mb-6 tracking-tight">Rating Summary</h3>
              
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-6xl font-black">{contractor.avgRating || '0'}</span>
                <span className="text-xl text-slate-400 font-bold">/ 5</span>
              </div>
              
              <div className="mb-6">
                <StarRating rating={contractor.avgRating || 0} />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-bold text-slate-400 uppercase tracking-widest text-[10px]">Total Reviews</span>
                  <span className="font-black">{contractor.totalRatings || 0}</span>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-emerald-500 rounded-full" 
                    style={{ width: `${(contractor.avgRating / 5) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Hiring Info Card */}
            <div className="p-8 rounded-[2.5rem] bg-emerald-50 border border-emerald-100">
              <h3 className="text-xl font-black text-emerald-900 mb-6 tracking-tight">Standard Rates</h3>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold text-emerald-700/70 uppercase tracking-widest text-[10px]">Pricing Model</span>
                <span className="font-black text-emerald-900">{contractor.rateType}</span>
              </div>
              <p className="text-xs text-emerald-700/60 leading-relaxed font-medium">
                Pricing is subject to project complexity and duration. Message the contractor for a detailed quote.
              </p>
              
              <button 
                onClick={() => toast.success("Feature coming soon: Hire from profile")}
                className="w-full mt-8 py-4 rounded-2xl bg-emerald-700 text-white font-black text-sm tracking-wide shadow-xl shadow-emerald-700/20 hover:bg-emerald-800 transition-all active:scale-[0.98]"
              >
                REQUEST QUOTE
              </button>
            </div>
          </aside>
        </div>
      </div>
    </DashboardLayout>
  );
}
