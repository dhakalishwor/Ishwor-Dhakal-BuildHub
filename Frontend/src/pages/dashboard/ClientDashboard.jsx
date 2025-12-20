import React from "react";
const ClientDashboard = () => {
  return (
    <>
      <div className="min h-screen bg-gray-50 flex flex-col">
        {/* NavBar vertical */}
        <header className="bg-green-300 shadow-md ">
          <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
            <h1>BuildHub</h1>

            <div className="flex justify-between space-x-4 ">
              <h1>Dashboard</h1>
              <h1>My Project</h1>
              <h1> Notification</h1>
              <h1> Profile</h1>
            </div>
          </div>
        </header>

        {/* Horizontal Dashbaord Components */}
        <div>
          <h1>Dashboard</h1>
          <h1>Post New Project</h1>
          <h1>My Project</h1>
          <h1>Messages</h1>
          <h1>Settings</h1>
          <h1>Logout</h1>
        </div>
      </div>
    </>
  );
};
export default ClientDashboard;
