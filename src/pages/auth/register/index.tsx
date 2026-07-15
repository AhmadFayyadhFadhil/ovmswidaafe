import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { apiClient } from "@/services/api/api";
import { departmentService } from "@/services/modules/departmentService";
import type { Department } from "@/services/modules/departmentService";

export default function RegisterPage() {
  const [nik, setNik] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [departmentId, setDepartmentId] = useState<string | number>("");
  const [departments, setDepartments] = useState<Department[]>([]);

  useEffect(() => {
    departmentService.getAll().then(res => {
      if (res.data) {
        setDepartments(res.data);
        if (res.data.length > 0) {
          setDepartmentId(res.data[0].id);
        }
      }
    }).catch(err => console.error("Failed to load departments", err));
  }, []);
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    if (password !== passwordConfirmation) {
      setError("Konfirmasi password tidak cocok.");
      return;
    }

    setIsLoading(true);

    try {
      // Send register request to Laravel backend
      const response = await apiClient.post("/register", {
        nik,
        name,
        email,
        password,
        password_confirmation: passwordConfirmation,
        department_id: departmentId,
      });

      if (response.data?.status === "success" || response.status === 201) {
        setIsSuccess(true);
      } else {
        setError("Pendaftaran gagal. Silakan periksa kembali data Anda.");
      }
    } catch (err: any) {
      console.error(err);
      setError(
        err.response?.data?.message ||
        "Gagal mendaftarkan akun. Pastikan email belum terdaftar."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f7fb] flex overflow-hidden">
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
              Join the Fleet Network
            </h2>
            <p className="text-lg text-blue-100 leading-relaxed">
              Create an employee account to easily request operational vehicles, monitor approvals, and coordinate trips.
            </p>
          </div>

          {/* Footer */}
          <div className="text-sm text-blue-100">
            © 2026 OVMS Enterprise System
          </div>
        </div>
      </div>

      {/* RIGHT SIDE (Form) */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 overflow-y-auto">
        <div className="w-full max-w-[480px] my-8">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-[#1e3a8a] flex items-center justify-center">
              <span className="text-white text-xl">🚘</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">OVMS</h1>
              <p className="text-sm text-slate-500">Operational Vehicle Management</p>
            </div>
          </div>

          {/* Card */}
          <div className="bg-white rounded-[32px] shadow-[0_20px_50px_rgba(15,23,42,0.08)] border border-slate-200/70 p-8 lg:p-10">
            {isSuccess ? (
              <div className="text-center py-4 space-y-4 animate-fadein">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto text-green-600 text-3xl">
                  ✓
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">Pendaftaran Berhasil!</h2>
                  <p className="text-slate-500 mt-2 text-sm leading-relaxed">
                    Akun Anda dengan email <strong>{email}</strong> telah sukses dibuat. Silakan masuk menggunakan kata sandi Anda.
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
            ) : (
              <>
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-slate-900">Buat Akun Baru</h2>
                  <p className="text-slate-500 mt-1.5 text-sm">
                    Daftarkan diri Anda untuk mengakses pemesanan kendaraan operasional.
                  </p>
                </div>

                {/* FORM */}
                <form className="space-y-4" onSubmit={handleRegister}>
                  {/* NIK */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      NIK (Nomor Induk Karyawan)
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Masukkan NIK Anda"
                      value={nik}
                      onChange={(e) => setNik(e.target.value)}
                      className="w-full h-11 rounded-xl border border-slate-200 px-4 outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 text-sm transition-all"
                    />
                  </div>
                  {/* Full Name */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Nama Lengkap
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Masukkan nama lengkap Anda"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full h-11 rounded-xl border border-slate-200 px-4 outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 text-sm transition-all"
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Alamat Email
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="Masukkan email korporat Anda"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full h-11 rounded-xl border border-slate-200 px-4 outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 text-sm transition-all"
                    />
                  </div>

                  {/* Department */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Departemen
                    </label>
                    <select
                      value={departmentId}
                      onChange={(e) => setDepartmentId(e.target.value)}
                      className="w-full h-11 rounded-xl border border-slate-200 px-4 outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 text-sm bg-white transition-all"
                    >
                      {departments.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Password */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Kata Sandi
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
                      Konfirmasi Kata Sandi
                    </label>
                    <input
                      type="password"
                      required
                      placeholder="Ulangi kata sandi"
                      value={passwordConfirmation}
                      onChange={(e) => setPasswordConfirmation(e.target.value)}
                      className="w-full h-11 rounded-xl border border-slate-200 px-4 outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 text-sm transition-all"
                    />
                  </div>

                  {/* Error Message */}
                  {error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600">
                      {error}
                    </div>
                  )}

                  {/* SUBMIT BUTTON */}
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full h-12 rounded-xl bg-[#1e3a8a] hover:bg-[#1d4ed8] disabled:bg-slate-400 text-white font-semibold text-sm shadow-md transition-all duration-300 hover:-translate-y-0.5 disabled:hover:translate-y-0 cursor-pointer"
                  >
                    {isLoading ? "Mendaftarkan..." : "Daftar Akun"}
                  </button>
                </form>

                {/* Link to login */}
                <div className="mt-6 text-center text-xs text-slate-500">
                  Sudah memiliki akun?{" "}
                  <button
                    onClick={() => navigate("/login")}
                    type="button"
                    className="font-bold text-blue-700 hover:text-blue-800 cursor-pointer"
                  >
                    Login di sini
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
