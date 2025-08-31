"use client";
import { useEffect } from "react";
import MainContent from "./components/MainContent";
import Footer from "./components/Footer";
import AuthForm from "./components/AuthForm";
import { useAuthStore } from "./store/authStore";

const Dashboard = () => {
  const { user, logout } = useAuthStore();

  return (
    <div className="max-w-md mx-auto bg-white p-6 rounded-lg shadow-lg mt-20 pt-10">
      <h2 className="text-2xl font-semibold mb-6 text-center text-gray-800">Welcome to Dashboard</h2>

      <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
        <p className="text-green-800 font-medium">Welcome back!</p>
        <p className="text-green-700">Email: {user?.email}</p>
        <p className="text-green-700">User ID: {user?.id}</p>
      </div>

      <div className="text-center">
        <button
          onClick={logout}
          className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
};

export default function Home() {
  const { isLoggedIn, initialize } = useAuthStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <div className="font-sans grid grid-rows-[200px_1fr_auto] items-center justify-items-center min-h-screen p-4 pb-4 gap-8 sm:p-12">
      <MainContent />
      {isLoggedIn ? <Dashboard /> : <AuthForm />}
      <Footer />
    </div>
  );
}
