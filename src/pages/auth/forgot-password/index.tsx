import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiClient } from "@/services/api/api";

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();

  // Stage 1: Verify Email
  const handleVerifyEmail = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await apiClient.post("/forgot-password", { email });
      if (response.data?.status === "success" || response.status === 200) {
        const receivedToken = response.data.data?.token || "";
        setToken(receivedToken); // Prefill if returned by local api for convenience
        setStep(2); // Go to Reset Password step
      } else {
        setError("Email tidak ditemukan atau tidak valid.");
      }
    } catch (err: any) {
      console.error(err);
      setError(
        err.response?.data?.message ||
        "Terjadi kesalahan saat memverifikasi email Anda."
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Stage 2: Reset Password
  const handleResetPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    if (!token) {
      setError("Token / Kode verifikasi (OTP) wajib diisi.");
      return;
    }

    if (password !== passwordConfirmation) {
      setError("Konfirmasi password baru tidak cocok.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await apiClient.post("/reset-password", {
        email,
        token,
        password,
        password_confirmation: passwordConfirmation,
      });

      if (response.data?.status === "success" || response.status === 200) {
        setSuccessMessage(response.data?.message || "Password berhasil diubah!");
        setStep(3); // Show success step
      } else {
        setError("Gagal merubah password. Silakan coba kembali.");
      }
    } catch (err: any) {
      console.error(err);
      setError(
        err.response?.data?.message ||
        "Gagal merubah password. Pastikan password baru minimal 6 karakter."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f7fb] flex flex-col lg:flex-row overflow-y-auto lg:overflow-hidden">
      {/* LEFT SIDE (Hero) */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden bg-gradient-to-br from-[#0f172a] via-[#1e3a8a] to-[#2563eb] p-12">
        <div className="absolute top-0 left-0 w-[400px] h-[400px] bg-blue-400/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-[350px] h-[350px] bg-cyan-300/20 rounded-full blur-3xl" />

        <div className="relative z-10 flex flex-col justify-between w-full">
          {/* Logo */}
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur flex items-center justify-center border border-white/20">
              <span className="text-2xl text-white">🚘</span>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">OVMS</h1>
              <p className="text-blue-100">Operational Vehicle Management</p>
            </div>
          </div>

          {/* Hero Content */}
          <div className="max-w-[520px]">
            <h2 className="text-5xl leading-tight font-bold text-white mb-6">
              Recover Your Account Access
            </h2>
            <p className="text-lg text-blue-100 leading-relaxed">
              Reset your password securely to return to managing vehicle requests and scheduling.
            </p>
          </div>

          {/* Footer */}
          <div className="text-sm text-blue-100">
            © 2026 OVMS Enterprise System
          </div>
        </div>
      </div>

      {/* RIGHT SIDE (Forms) */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 lg:p-12 overflow-y-auto my-auto">
        <div className="w-full max-w-[480px]">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-3 mb-6">
            <div className="w-11 h-11 rounded-2xl bg-[#1e3a8a] flex items-center justify-center shadow-sm">
              <span className="text-white text-lg">🚘</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 leading-tight">OVMS</h1>
              <p className="text-xs text-slate-500 font-medium">Operational Vehicle Management</p>
            </div>
          </div>

          {/* Card */}
          <div className="bg-white rounded-[24px] sm:rounded-[32px] shadow-[0_20px_50px_rgba(15,23,42,0.08)] border border-slate-200/70 p-6 sm:p-8 lg:p-10">
            {step === 1 && (
              <div>
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-slate-900">Lupa Kata Sandi?</h2>
                  <p className="text-slate-500 mt-1.5 text-sm">
                    Masukkan alamat email akun Anda untuk memverifikasi dan mereset kata sandi.
                  </p>
                </div>

                <form className="space-y-4" onSubmit={handleVerifyEmail}>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Alamat Email
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="Masukkan alamat email Anda"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full h-11 rounded-xl border border-slate-200 px-4 outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 text-sm transition-all"
                    />
                  </div>

                  {error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600">
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full h-12 rounded-xl bg-[#1e3a8a] hover:bg-[#1d4ed8] disabled:bg-slate-400 text-white font-semibold text-sm shadow-md transition-all duration-300 hover:-translate-y-0.5 disabled:hover:translate-y-0 cursor-pointer"
                  >
                    {isLoading ? "Memverifikasi..." : "Verifikasi Email"}
                  </button>
                </form>
              </div>
            )}

            {step === 2 && (
              <div>
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-slate-900">Reset Kata Sandi</h2>
                  <p className="text-slate-500 mt-1.5 text-sm">
                    Verifikasi berhasil untuk <strong>{email}</strong>. Silakan ketik kata sandi baru Anda.
                  </p>
                </div>

                <form className="space-y-4" onSubmit={handleResetPassword}>
                  {/* Token OTP */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Token / Kode Verifikasi (OTP)
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Masukkan 6-digit kode OTP"
                      value={token}
                      onChange={(e) => setToken(e.target.value)}
                      className="w-full h-11 rounded-xl border border-slate-200 px-4 outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 text-sm transition-all"
                    />
                  </div>

                  {/* Password */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Kata Sandi Baru
                    </label>
                    <input
                      type="password"
                      required
                      placeholder="Min. 6 karakter"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full h-11 rounded-xl border border-slate-200 px-4 outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 text-sm transition-all"
                    />
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Konfirmasi Kata Sandi Baru
                    </label>
                    <input
                      type="password"
                      required
                      placeholder="Ulangi kata sandi baru"
                      value={passwordConfirmation}
                      onChange={(e) => setPasswordConfirmation(e.target.value)}
                      className="w-full h-11 rounded-xl border border-slate-200 px-4 outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 text-sm transition-all"
                    />
                  </div>

                  {error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600">
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white font-semibold text-sm shadow-md transition-all duration-300 hover:-translate-y-0.5 disabled:hover:translate-y-0 cursor-pointer"
                  >
                    {isLoading ? "Menyimpan..." : "Reset Kata Sandi"}
                  </button>
                </form>
              </div>
            )}

            {step === 3 && (
              <div className="text-center py-4 space-y-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto text-green-600 text-3xl">
                  ✓
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">Berhasil!</h2>
                  <p className="text-slate-500 mt-2 text-sm">
                    {successMessage || "Password Anda telah berhasil diperbarui."}
                  </p>
                </div>

                <button
                  onClick={() => navigate("/login")}
                  type="button"
                  className="w-full h-12 rounded-xl bg-[#1e3a8a] hover:bg-[#1d4ed8] text-white font-semibold text-sm shadow-md transition-all duration-300 cursor-pointer"
                >
                  Kembali ke Halaman Login
                </button>
              </div>
            )}

            {/* Back link for stage 1 & 2 */}
            {step !== 3 && (
              <div className="mt-6 text-center text-xs text-slate-500">
                Kembali ke{" "}
                <button
                  onClick={() => navigate("/login")}
                  type="button"
                  className="font-bold text-blue-700 hover:text-blue-800 cursor-pointer"
                >
                  Halaman Login
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
