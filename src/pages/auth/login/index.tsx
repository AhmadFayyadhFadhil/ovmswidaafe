import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "@/auth/authContext";

export default function LoginPage() {

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();
  const { login } = useAuthContext();

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const userRole = await login(email, password);

      const dashboards: Record<string, string> = {
        employee: "/employee/dashboard",
        admin: "/admin/dashboard",
        approver: "/approver/dashboard",
        driver: "/driver/dashboard",
        gahrd: "/gahrd/dashboard",
      };

      navigate(dashboards[userRole] || "/admin/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login gagal");
    } finally {
      setIsLoading(false);
    }
  };

  return (

    <div className="min-h-screen bg-[#f4f7fb] flex overflow-hidden">

      {/* LEFT SIDE */}

      <div className="hidden lg:flex flex-1 relative overflow-hidden bg-gradient-to-br from-[#0f172a] via-[#1e3a8a] to-[#2563eb] p-12">

        {/* Blur Effects */}

        <div className="absolute top-0 left-0 w-[400px] h-[400px] bg-blue-400/20 rounded-full blur-3xl" />

        <div className="absolute bottom-0 right-0 w-[350px] h-[350px] bg-cyan-300/20 rounded-full blur-3xl" />

        <div className="relative z-10 flex flex-col justify-between w-full">

          {/* Logo */}

          <div className="flex items-center gap-4">

            <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur flex items-center justify-center border border-white/20">

              <span className="text-2xl text-white">
                🚘
              </span>

            </div>

            <div>

              <h1 className="text-3xl font-bold text-white">
                OVMS
              </h1>

              <p className="text-blue-100">
                Operational Vehicle Management
              </p>

            </div>

          </div>

          {/* Hero Content */}

          <div className="max-w-[520px]">

            <h2 className="text-5xl leading-tight font-bold text-white mb-6">

              Streamline Enterprise Fleet Operations

            </h2>

            <p className="text-lg text-blue-100 leading-relaxed">

              Manage vehicle requests, approvals,
              driver assignments, and operational schedules
              in one unified platform.

            </p>

            {/* Stats */}

            <div className="grid grid-cols-3 gap-4 mt-12">

              <div className="bg-white/10 border border-white/10 backdrop-blur rounded-3xl p-5">

                <h3 className="text-3xl font-bold text-white">
                  142
                </h3>

                <p className="text-sm text-blue-100 mt-1">
                  Active Vehicles
                </p>

              </div>

              <div className="bg-white/10 border border-white/10 backdrop-blur rounded-3xl p-5">

                <h3 className="text-3xl font-bold text-white">
                  98
                </h3>

                <p className="text-sm text-blue-100 mt-1">
                  Daily Requests
                </p>

              </div>

              <div className="bg-white/10 border border-white/10 backdrop-blur rounded-3xl p-5">

                <h3 className="text-3xl font-bold text-white">
                  24
                </h3>

                <p className="text-sm text-blue-100 mt-1">
                  Active Drivers
                </p>

              </div>

            </div>

          </div>

          {/* Footer */}

          <div className="text-sm text-blue-100">

            © 2026 OVMS Enterprise System

          </div>

        </div>

      </div>

      {/* RIGHT SIDE */}

      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">

        <div className="w-full max-w-[480px]">

          {/* Mobile Logo */}

          <div className="lg:hidden flex items-center gap-3 mb-10">

            <div className="w-12 h-12 rounded-2xl bg-[#1e3a8a] flex items-center justify-center">

              <span className="text-white text-xl">
                🚘
              </span>

            </div>

            <div>

              <h1 className="text-2xl font-bold text-slate-900">
                OVMS
              </h1>

              <p className="text-sm text-slate-500">
                Operational Vehicle Management
              </p>

            </div>

          </div>

          {/* Login Card */}

          <div className="bg-white rounded-[32px] shadow-[0_20px_50px_rgba(15,23,42,0.08)] border border-slate-200/70 p-8 lg:p-10">

            <div className="mb-8">

              <h2 className="text-3xl font-bold text-slate-900">
                Welcome Back
              </h2>

              <p className="text-slate-500 mt-2">
                Login to continue managing operational requests.
              </p>

            </div>

            {/* FORM */}

            <form
              className="space-y-5"
              onSubmit={handleLogin}
            >

              {/* Email */}

              <div>

                <label className="block text-sm font-semibold text-slate-700 mb-2">

                  Email Address

                </label>

                <input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-14 rounded-2xl border border-slate-200 px-5 outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all"
                />

              </div>

              {/* Password */}

              <div>

                <label className="block text-sm font-semibold text-slate-700 mb-2">

                  Password

                </label>

                <input
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  className="w-full h-14 rounded-2xl border border-slate-200 px-5 outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all disabled:opacity-50"
                />

              </div>

              {/* Error Message */}

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                  {error}
                </div>
              )}

              {/* Remember */}

              <div className="flex items-center justify-between">

                <label className="flex items-center gap-2 text-sm text-slate-600">

                  <input type="checkbox" disabled={isLoading} />

                  Remember me

                </label>

                <button
                  type="button"
                  onClick={() => navigate("/forgot-password")}
                  className="text-sm font-semibold text-blue-700 hover:text-blue-800"
                >

                  Forgot Password?

                </button>

              </div>

              {/* LOGIN BUTTON */}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-14 rounded-2xl bg-[#1e3a8a] hover:bg-[#1d4ed8] disabled:bg-slate-400 text-white font-semibold shadow-lg transition-all duration-300 hover:-translate-y-0.5 disabled:hover:translate-y-0"
              >

                {isLoading ? "Logging in..." : "Login"}

              </button>

            </form>

            {/* Bottom */}

            <div className="mt-8 text-center text-sm text-slate-500">

              Don&apos;t have an account?{" "}

              <button
                type="button"
                onClick={() => navigate("/register")}
                className="font-semibold text-blue-700 hover:text-blue-800"
              >

                Register

              </button>

            </div>

          </div>

        </div>

      </div>

    </div>

  );
}