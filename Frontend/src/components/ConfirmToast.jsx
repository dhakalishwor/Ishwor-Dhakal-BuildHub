import React, { useState } from "react";
import toast from "react-hot-toast";


export function confirmToast(message) {
  return new Promise((resolve) => {
    toast.custom(
      (t) => (
        <div
          className={`${t.visible ? "scale-100 translate-y-0 opacity-100" : "scale-95 translate-y-4 opacity-0"
            } max-w-sm w-full mx-4 bg-white shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] rounded-[2rem] pointer-events-auto flex flex-col border border-slate-100/50 transform transition-all duration-300 overflow-hidden backdrop-blur-xl`}
        >
          <div className="p-8 text-center bg-gradient-to-b from-slate-50/50 to-white">
            <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-5 shadow-inner shadow-emerald-100">
               <svg className="w-10 h-10 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
               </svg>
            </div>
            <p className="text-xl font-bold text-slate-800 mb-2">{message}</p>
            <p className="text-sm font-medium text-slate-500">Please confirm your action.</p>
          </div>
          <div className="flex gap-4 p-8 pt-4 bg-white">
            <button
              onClick={() => {
                toast.dismiss(t.id);
                resolve(false);
              }}
              className="flex-1 px-4 py-3.5 text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 hover:text-slate-900 rounded-2xl transition-all active:scale-[0.98]"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                toast.dismiss(t.id);
                resolve(true);
              }}
              className="flex-1 px-4 py-3.5 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-[0_8px_16px_-4px_rgba(16,185,129,0.4)] hover:shadow-[0_12px_20px_-4px_rgba(16,185,129,0.5)] rounded-2xl transition-all active:scale-[0.98]"
            >
              Confirm
            </button>
          </div>
        </div>
      ),
      { duration: Infinity, id: 'confirm-toast', position: 'top-center', style: { top: '30vh' } }
    );
  });
}

export function promptToast(message) {
  return new Promise((resolve) => {
    toast.custom(
      (t) => <PromptContent t={t} message={message} resolve={resolve} />,
      { duration: Infinity, id: 'prompt-toast', position: 'top-center', style: { top: '30vh' } }
    );
  });
}

// eslint-disable-next-line react-refresh/only-export-components
function PromptContent({ t, message, resolve }) {
  const [value, setValue] = useState("");

  return (
    <div
      className={`${t.visible ? "scale-100 translate-y-0 opacity-100" : "scale-95 translate-y-4 opacity-0"
        } max-w-sm w-full mx-4 bg-white shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] rounded-[2rem] pointer-events-auto flex flex-col border border-slate-100/50 transform transition-all duration-300 overflow-hidden backdrop-blur-xl`}
    >
      <div className="p-8 bg-gradient-to-b from-slate-50/50 to-white">
        <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-5 shadow-inner shadow-blue-100">
           <svg className="w-10 h-10 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
           </svg>
        </div>
        <p className="text-xl font-bold text-slate-800 mb-5">{message}</p>
        <input
          type="text"
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="w-full rounded-2xl border border-slate-200 bg-white px-5 py-3.5 text-sm font-medium focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-inner"
          placeholder="Enter details..."
        />
      </div>
      <div className="flex gap-4 p-8 pt-2 bg-white">
        <button
          onClick={() => {
            toast.dismiss(t.id);
            resolve(null);
          }}
          className="flex-1 px-4 py-3.5 text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 hover:text-slate-900 rounded-2xl transition-all active:scale-[0.98]"
        >
          Cancel
        </button>
        <button
          onClick={() => {
            toast.dismiss(t.id);
            resolve(value);
          }}
          disabled={!value.trim()}
          className="flex-1 px-4 py-3.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-[0_8px_16px_-4px_rgba(37,99,235,0.4)] hover:shadow-[0_12px_20px_-4px_rgba(37,99,235,0.5)] rounded-2xl transition-all active:scale-[0.98] disabled:opacity-50 disabled:shadow-none disabled:cursor-not-allowed"
        >
          Submit
        </button>
      </div>
    </div>
  );
}


