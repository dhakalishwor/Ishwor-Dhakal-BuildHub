import { useNavigate } from "react-router-dom";
import React from "react";
const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      
      {/* Navbar */}
      <header className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-green-600">
            BuildHub
          </h1>

          <div className="space-x-4">
            <button
              onClick={() => navigate("/login")}
              className="px-4 py-2 text-green-600 border border-green-600 rounded-lg hover:bg-green-50"
            >
              Login
            </button>
            <button
              onClick={() => navigate("/register")}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-800"
            >
              Register
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="flex-grow flex items-center">
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-10 items-center">
          
          {/* Text */}
          <div>
            <h2 className="text-4xl font-bold text-gray-800 mb-4">
              Connecting Clients & Contractors 
            </h2>
            <p className="text-gray-600 mb-6">
              BuildHub is a web-based construction project management platform
              that enables clients to post projects, contractors to bid on them,
              and teams to collaborate efficiently with real-time updates.
            </p>

            <div className="space-x-4">
              <button
                onClick={() => navigate("/register")}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Get Started
              </button>
              <button
                onClick={() => navigate("/login")}
                className="px-6 py-3 border border-green-600 text-green-600 rounded-lg hover:bg-green-50"
              >
                Login
              </button>
            </div>
          </div> 
        </div>
      </section>

      {/* About Project */}
      <section className="bg-white py-12">
        <div className="max-w-7xl mx-auto px-6">
          <h3 className="text-2xl font-bold text-center mb-8 text-gray-800">
            Key Features
          </h3>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="p-6 bg-green-100 rounded-lg shadow-sm">
              <h4 className="font-semibold text-lg mb-2">Project Posting</h4>
              <p className="text-gray-600 text-sm">
                Clients can post construction projects with budgets and deadlines.
              </p>
            </div>

            <div className="p-6 bg-green-100 rounded-lg shadow-sm">
              <h4 className="font-semibold text-lg mb-2">Bidding System</h4>
              <p className="text-gray-600 text-sm">
                Contractors submit bids and proposals transparently.
              </p>
            </div>

            <div className="p-6 bg-green-100 rounded-lg shadow-sm">
              <h4 className="font-semibold text-lg mb-2">Progress Tracking</h4>
              <p className="text-gray-600 text-sm">
                Track tasks, milestones, and overall project status in real-time.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-100 text-center py-4 text-sm text-gray-600">
        © {new Date().getFullYear()} BuildHub. Final Year Project.
      </footer>
    </div>
  );
};

export default Landing;
