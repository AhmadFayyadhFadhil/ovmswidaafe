import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { useAuthContext } from "@/auth/authContext";
import { apiClient } from "@/services/api/api";
import { canAccessRoute } from "@/auth/roleGuard";
import buildingHeroImg from "@/assets/images/widatra-building.jpg";

export default function LoginPage() {
  const [nik, setNik] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [logoError, setLogoError] = useState(false);
  const [heroImageError, setHeroImageError] = useState(false);
  const [stats, setStats] = useState({
    activeVehicles: 0,
    dailyRequests: 0,
    activeDrivers: 0,
    systemName: "",
    companyName: "",
    companyLogo: "",
    loginHeroImage: "",
  });

  const navigate = useNavigate();
  const { login } = useAuthContext();

  const getValidLogoUrl = (url: string | undefined | null) => {
    if (!url) return "";
    if (url.startsWith("data:")) return url;
    const slashIdx = url.indexOf("/storage/");
    if (slashIdx !== -1) {
      return `${window.location.origin}${url.substring(slashIdx)}`;
    }
    if (url.startsWith("https://")) {
      return url;
    }
    if (url.startsWith("http://")) {
      return url.replace(/^http:\/\//i, "https://");
    }
    if (url.startsWith("/")) {
      return `${window.location.origin}${url}`;
    }
    return `${window.location.origin}/${url}`;
  };

  useEffect(() => {
    // 1. Check remembered NIK
    const savedNik = localStorage.getItem("ovms_remembered_nik");
    if (savedNik) {
      setNik(savedNik);
      setRememberMe(true);
    }

    // 2. Load local branding cache for instant rendering
    const cached = localStorage.getItem("ovms_branding_config");
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        setStats((prev) => ({
          ...prev,
          systemName: parsed.systemName || prev.systemName,
          companyName: parsed.companyName || prev.companyName,
          companyLogo: parsed.companyLogo || prev.companyLogo,
          loginHeroImage: parsed.loginHeroImage || prev.loginHeroImage,
        }));
      } catch (e) {
        // ignore parse error
      }
    }

    // 3. Fetch live public stats & branding from backend master
    apiClient
      .get("/public-stats")
      .then((res) => {
        if (res.data?.status === "success" && res.data?.data) {
          const d = res.data.data;
          setStats({
            activeVehicles: d.active_vehicles ?? 0,
            dailyRequests: d.daily_requests ?? 0,
            activeDrivers: d.active_drivers ?? 0,
            systemName: d.system_name || "OVMS",
            companyName: d.company_name || "PT Widatra Bhakti",
            companyLogo: d.company_logo ?? "",
            loginHeroImage: d.login_hero_image || d.loginHeroImage || "",
          });
          setLogoError(false);
          setHeroImageError(false);
          // Sync branding cache
          localStorage.setItem(
            "ovms_branding_config",
            JSON.stringify({
              systemName: d.system_name || "OVMS",
              companyName: d.company_name || "PT Widatra Bhakti",
              companyLogo: d.company_logo ?? "",
              loginHeroImage: d.login_hero_image || d.loginHeroImage || "",
            })
          );
        }
      })
      .catch((err) => {
        console.error("Failed to load public stats", err);
      });
  }, []);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const userRole = await login(nik.trim(), password);

      // Handle remember me persistence
      if (rememberMe) {
        localStorage.setItem("ovms_remembered_nik", nik.trim());
      } else {
        localStorage.removeItem("ovms_remembered_nik");
      }

      const dashboards: Record<string, string> = {
        employee: "/employee/dashboard",
        admin: "/admin/dashboard",
        approver: "/approver/dashboard",
        driver: "/driver/dashboard",
        gahrd: "/gahrd/dashboard",
        security: "/security/dashboard",
      };

      const defaultRoute = dashboards[userRole] || "/employee/dashboard";

      // Check for redirect URL in query parameters
      const params = new URLSearchParams(window.location.search);
      const redirectUrl = params.get("redirect");

      if (redirectUrl) {
        // Validate if the newly logged-in user role is allowed to access the redirectUrl
        const mockUser = { id: "1", name: "", email: "", role: userRole };
        const accessCheck = canAccessRoute(mockUser as any, redirectUrl);
        if (accessCheck === "allowed") {
          window.location.href = redirectUrl;
        } else {
          // If not allowed, fallback safely to default role dashboard
          window.location.href = defaultRoute;
        }
      } else {
        window.location.href = defaultRoute;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login gagal, silakan periksa NIK dan Password.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen w-full bg-[#f8fafc] lg:bg-white flex flex-col lg:flex-row overflow-hidden selection:bg-blue-100 selection:text-blue-900">
      {/* LEFT COLUMN: AUTHENTICATION FORM */}
      <div className="w-full lg:w-[45%] xl:w-[42%] 2xl:w-[40%] h-full flex flex-col justify-between p-6 sm:p-8 lg:p-10 xl:p-12 bg-white shadow-sm lg:shadow-none z-10 overflow-y-auto">
        <div className="w-full max-w-[360px] mx-auto flex flex-col justify-between h-full py-1">
          {/* Top Header: Master Company Logo (Mengikuti Master & Sejajar Rata Kiri dengan Form) */}
          <div className="pt-1 pb-2 flex items-center min-h-[52px]">
            {stats.companyLogo && !logoError ? (
              <div className="flex items-center gap-2.5 select-none">
                <img
                  src={getValidLogoUrl(stats.companyLogo)}
                  alt="PT WIDATRA BHAKTI"
                  className="h-9 sm:h-10 w-auto max-w-[100px] object-contain object-left"
                  onError={() => setLogoError(true)}
                />
                <span className="font-extrabold text-[15px] sm:text-[16px] text-[#002f6c] tracking-tight leading-none uppercase">
                  PT WIDATRA BHAKTI
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-3 select-none">
                {/* Fallback Official Otsuka Loops Symbol */}
                <svg
                  className="w-9 h-9 shrink-0"
                  viewBox="0 0 100 100"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  {/* Left Blue Loop */}
                  <path
                    d="M42 16 C26 16 14 31 14 50 C14 69 26 84 42 84 C32 80 24 67 24 50 C24 33 32 20 42 16 Z"
                    fill="#004B93"
                  />
                  <path
                    d="M42 16 C48 16 53 22 55 31 C50 33 45 37 42 43 C39 33 40 22 42 16 Z"
                    fill="#004B93"
                  />
                  <path
                    d="M42 84 C48 84 53 78 55 69 C50 67 45 63 42 57 C39 67 40 78 42 84 Z"
                    fill="#004B93"
                  />
                  {/* Right Red Loop */}
                  <path
                    d="M58 84 C74 84 86 69 86 50 C86 31 74 16 58 16 C68 20 76 33 76 50 C76 67 68 80 58 84 Z"
                    fill="#E50012"
                  />
                  <path
                    d="M58 16 C52 16 47 22 45 31 C50 33 55 37 58 43 C61 33 60 22 58 16 Z"
                    fill="#E50012"
                  />
                  <path
                    d="M58 84 C52 84 47 78 45 69 C50 67 55 63 58 57 C61 67 60 78 58 84 Z"
                    fill="#E50012"
                  />
                </svg>
                <div className="flex flex-col justify-center">
                  <span className="font-extrabold text-[15px] sm:text-[16px] text-[#002f6c] tracking-tight leading-none">
                    {stats.companyName || "PT WIDATRA BHAKTI"}
                  </span>
                  <span className="text-[10px] text-[#e50012] font-bold tracking-wider leading-none mt-1">
                    Otsuka
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Centered Form Area (Aligned with the logo above) */}
          <div className="my-auto py-2 sm:py-3">
            {/* Welcome Heading */}
            <div className="mb-4 sm:mb-5">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight leading-tight">
                Hallo
              </h2>
              <h1 className="text-2xl sm:text-3xl lg:text-[32px] font-extrabold text-slate-900 tracking-tight leading-none mt-1">
                Welcome Back
              </h1>
              <p className="text-xs text-slate-400 mt-1.5 font-normal">
                Hey, welcome back to your special place
              </p>
            </div>

            {/* Form */}
            <form className="space-y-3" onSubmit={handleLogin}>
              {/* NIK / Username / Email */}
              <div>
                <label
                  htmlFor="nik-input"
                  className="block text-[11px] font-semibold text-slate-600 mb-1 uppercase tracking-wider"
                >
                  NIK
                </label>
                <input
                  id="nik-input"
                  type="text"
                  placeholder="Masukkan NIK Anda (16 digit)"
                  value={nik}
                  onChange={(e) => setNik(e.target.value)}
                  disabled={isLoading}
                  required
                  className="w-full h-[38px] px-3 text-xs sm:text-sm rounded-lg border border-slate-200 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all disabled:bg-slate-50 disabled:opacity-60"
                />
              </div>

              {/* Password */}
              <div>
                <label
                  htmlFor="password-input"
                  className="block text-[11px] font-semibold text-slate-600 mb-1 uppercase tracking-wider"
                >
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password-input"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                    required
                    className="w-full h-[38px] pl-3 pr-9 text-xs sm:text-sm rounded-lg border border-slate-200 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all disabled:bg-slate-50 disabled:opacity-60"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none transition-colors p-1"
                    aria-label={showPassword ? "Sembunyikan password" : "Lihat password"}
                  >
                    {showPassword ? (
                      <EyeOff className="w-3.5 h-3.5" />
                    ) : (
                      <Eye className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>

                {/* Forgot Password Right Aligned */}
                <div className="flex justify-end mt-1">
                  <button
                    type="button"
                    onClick={() => navigate("/forgot-password")}
                    className="text-[11px] text-blue-600 hover:text-blue-700 font-medium hover:underline focus:outline-none cursor-pointer"
                  >
                    Forgot Password?
                  </button>
                </div>
              </div>

              {/* Error Message Alert */}
              {error && (
                <div className="p-2.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600 flex items-start gap-2">
                  <span className="font-semibold shrink-0">Peringatan:</span>
                  <span>{error}</span>
                </div>
              )}

              {/* Remember Me Checkbox */}
              <div className="flex items-center gap-2 pt-0.5">
                <input
                  id="remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  disabled={isLoading}
                  className="w-3.5 h-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 focus:ring-offset-0 cursor-pointer"
                />
                <label
                  htmlFor="remember-me"
                  className="text-[11px] text-slate-500 cursor-pointer select-none"
                >
                  Remember me
                </label>
              </div>

              {/* Sign In Button */}
              <div className="pt-1">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-[38px] rounded-lg bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:bg-blue-400 text-white font-semibold text-xs sm:text-sm shadow-sm transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <svg
                        className="animate-spin h-3.5 w-3.5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8v8H4z"
                        />
                      </svg>
                      <span>Signing In...</span>
                    </>
                  ) : (
                    "Sign In"
                  )}
                </button>
              </div>
            </form>

            {/* Help Support Link */}
            <div className="mt-3 text-center text-[11px] text-slate-500">
              Don't have an account?{" "}
              <button
                type="button"
                onClick={() => navigate("/register")}
                className="text-blue-600 hover:text-blue-700 font-semibold hover:underline cursor-pointer"
              >
                Report to IT Department
              </button>
            </div>
          </div>

          {/* Footer Copyright */}
          <div className="text-center text-[10px] text-slate-400 pt-2 pb-1">
            © 2026 PT Widatra Bhakti. All rights reserved.
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: HERO BUILDING IMAGE (CMMS STYLE) */}
      <div className="hidden lg:flex lg:w-[55%] xl:w-[58%] 2xl:w-[60%] h-full p-3 sm:p-4 lg:p-5 bg-[#f8fafc] items-center justify-center">
        <div className="relative w-full h-full rounded-2xl xl:rounded-3xl overflow-hidden shadow-sm border border-slate-200/80 bg-slate-100">
          <img
            src={
              stats.loginHeroImage && !heroImageError
                ? getValidLogoUrl(stats.loginHeroImage)
                : buildingHeroImg
            }
            alt="PT Widatra Bhakti Plant & Head Office"
            className="w-full h-full object-cover object-center"
            loading="eager"
            onError={() => setHeroImageError(true)}
          />
        </div>
      </div>
    </div>
  );
}
