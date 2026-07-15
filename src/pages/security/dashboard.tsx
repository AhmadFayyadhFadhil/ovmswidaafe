import { useState, useRef, useEffect } from "react";
import { Layout } from "@/components/layout/RoleLayout";
import { Icon } from "@/components/ui/Icon";
import { apiClient } from "@/services/api/api";
import jsQR from "jsqr";

export default function SecurityDashboard() {
  const [guardName, setGuardName] = useState(() => {
    return localStorage.getItem("ovms_security_guard_name") || "";
  });

  const [predefinedGuards, setPredefinedGuards] = useState<string[]>([]);
  const [selectedGuardOption, setSelectedGuardOption] = useState<string>("");

  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [scannedRequest, setScannedRequest] = useState<any>(null);
  const [securityNotes, setSecurityNotes] = useState("");

  // Modal confirmation states
  const [showNameModal, setShowNameModal] = useState(false);
  const [confirmingType, setConfirmingType] = useState<"checkout" | "checkin" | null>(null);
  const [selectedTripId, setSelectedTripId] = useState<number | null>(null);

  const handleConfirmTripScanClick = (tripId: number, type: "checkout" | "checkin") => {
    setSelectedTripId(tripId);
    setConfirmingType(type);
    setShowNameModal(true);
  };

  // Camera and Photo Scan states
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);

  // Request search logic
  const handleSearchRequest = async (e?: React.FormEvent, manualValue?: string) => {
    if (e) e.preventDefault();
    
    let finalId = manualValue;

    setActionLoading(true);
    setError(null);
    setSuccessMsg(null);
    setScannedRequest(null);

    if (!finalId) {
      try {
        const res = await apiClient.get('/requests', { params: { per_page: 1 } });
        const latestReq = res.data?.data?.[0];
        if (latestReq) {
          finalId = latestReq.qr_code_token || `REQ-${latestReq.id}`;
        } else {
          setError("Tidak ada data request di sistem.");
          setActionLoading(false);
          return;
        }
      } catch (err) {
        setError("Gagal memuat data request terbaru.");
        setActionLoading(false);
        return;
      }
    }

    try {
      const res = await apiClient.get('/security/lookup', {
        params: { qr_code_token: finalId }
      });

      if (res.data && res.data.status === "success") {
        setScannedRequest(res.data.data);
      } else {
        setError("Permintaan tidak ditemukan.");
      }
    } catch (err: any) {
      console.error(err);
      setError(
        err.response?.data?.message || 
        "Permintaan kendaraan tidak ditemukan. Periksa kembali format kode."
      );
    } finally {
      setActionLoading(false);
    }
  };

  // Camera controls
  const startCamera = async () => {
    try {
      setError(null);
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }
      });
      setStream(mediaStream);
      setCameraActive(true);
      setCapturedPhoto(null);
      
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      }, 100);
    } catch (err) {
      console.error("Gagal mengakses kamera:", err);
      setError("Kamera tidak dapat diakses. Silakan gunakan opsi upload foto atau input manual.");
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setCameraActive(false);
  };

  // Load security guards list from database on mount
  useEffect(() => {
    const fetchGuards = async () => {
      try {
        const res = await apiClient.get('/security-guards');
        if (res.data && res.data.status === "success") {
          const names = (res.data.data || []).map((g: any) => g.name);
          setPredefinedGuards(names);
          
          const saved = localStorage.getItem("ovms_security_guard_name") || "";
          if (names.includes(saved)) {
            setSelectedGuardOption(saved);
          } else if (saved) {
            setSelectedGuardOption("custom");
          } else {
            setSelectedGuardOption("");
          }
        }
      } catch (err) {
        console.error("Gagal memuat petugas security:", err);
      }
    };
    fetchGuards();
  }, []);

  // Check for auto-scanned token in query params on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tokenParam = params.get("token");
    if (tokenParam) {
      handleSearchRequest(undefined, tokenParam);
    }
  }, []);

  // Auto start/stop camera on mount and state changes
  useEffect(() => {
    if (!scannedRequest) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [scannedRequest]);

  // Real-time scan loop using jsQR
  useEffect(() => {
    let active = true;
    let animationFrameId: number;

    const scanFrame = () => {
      if (!active) return;
      
      if (cameraActive && videoRef.current && canvasRef.current) {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        
        if (video.readyState === video.HAVE_ENOUGH_DATA) {
          canvas.width = 300;
          canvas.height = 300;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            
            // Attempt to decode QR code using jsQR
            const code = jsQR(imageData.data, imageData.width, imageData.height, {
              inversionAttempts: "dontInvert",
            });
            
            if (code && code.data) {
              console.log("QR Code detected in real-time:", code.data);
              active = false;
              
              // Capture photo scan proof
              const photoUrl = canvas.toDataURL("image/jpeg");
              setCapturedPhoto(photoUrl);
              setIsScanning(true);
              
              // Stop camera
              stopCamera();
              
              // Load details
              setTimeout(() => {
                setIsScanning(false);
                handleSearchRequest(undefined, code.data);
              }, 1200);
              return;
            }
          }
        }
      }
      
      animationFrameId = requestAnimationFrame(scanFrame);
    };

    if (cameraActive && !capturedPhoto && !isScanning) {
      animationFrameId = requestAnimationFrame(scanFrame);
    }

    return () => {
      active = false;
      cancelAnimationFrame(animationFrameId);
    };
  }, [cameraActive, capturedPhoto, isScanning]);

  // Manual Trigger snapshot / click scan
  const handleTriggerScan = () => {
    setError(null);
    if (cameraActive && videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        
        // Check if QR code exists in frame
        const code = jsQR(imageData.data, imageData.width, imageData.height);
        if (code && code.data) {
          const photoUrl = canvas.toDataURL("image/jpeg");
          setCapturedPhoto(photoUrl);
          setIsScanning(true);
          stopCamera();
          setTimeout(() => {
            setIsScanning(false);
            handleSearchRequest(undefined, code.data);
          }, 1200);
        } else {
          setError("QR Code tidak terdeteksi pada tangkapan kamera. Silakan posisikan QR Code tiket di depan kamera dengan jelas.");
        }
      }
    } else {
      // Simulation mode fallback (if camera not allowed)
      const photoUrl = "https://images.unsplash.com/photo-1614741118887-7a4ee193a5fa?q=80&w=400&auto=format&fit=crop";
      setCapturedPhoto(photoUrl);
      setIsScanning(true);
      setTimeout(() => {
        setIsScanning(false);
        handleSearchRequest(undefined, "");
      }, 1200);
    }
  };

  // Upload photo scan from gallery
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const photoUrl = event.target?.result as string;
        setCapturedPhoto(photoUrl);
        
        // Try decoding QR code from uploaded image
        const img = new Image();
        img.onload = () => {
          const canvas = canvasRef.current;
          if (canvas) {
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext("2d");
            if (ctx) {
              ctx.drawImage(img, 0, 0);
              const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
              const code = jsQR(imageData.data, imageData.width, imageData.height);
              
              setIsScanning(true);
              stopCamera();
              setTimeout(() => {
                setIsScanning(false);
                if (code && code.data) {
                  handleSearchRequest(undefined, code.data);
                } else {
                  setError("QR Code tidak terdeteksi pada berkas gambar yang diunggah.");
                  setCapturedPhoto(null);
                }
              }, 1200);
            }
          }
        };
        img.src = photoUrl;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleConfirmScanClick = (type: "checkout" | "checkin") => {
    setConfirmingType(type);
    setShowNameModal(true);
  };

  const handleSaveScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guardName.trim() || !confirmingType || !scannedRequest) return;

    localStorage.setItem("ovms_security_guard_name", guardName.trim());

    setActionLoading(true);
    setError(null);
    setSuccessMsg(null);
    setShowNameModal(false);

    try {
      const payload: any = {
        qr_code_token: scannedRequest.qr_code_token || `REQ-${scannedRequest.id}`,
        security_name: guardName.trim(),
        type: confirmingType,
        notes: securityNotes
      };

      if (selectedTripId) {
        payload.trip_id = selectedTripId;
      }

      const res = await apiClient.post("/security/scan", payload);

      if (res.data && res.data.status === "success") {
        setSuccessMsg(res.data.message);
        setSecurityNotes("");
        setConfirmingType(null);
        setCapturedPhoto(null);

        // If scanning a specific trip, refresh request data so they can scan the other trip on the same screen
        if (selectedTripId) {
          setSelectedTripId(null);
          const refreshRes = await apiClient.get('/security/lookup', {
            params: { qr_code_token: scannedRequest.qr_code_token || `REQ-${scannedRequest.id}` }
          });
          if (refreshRes.data && refreshRes.data.status === "success") {
            setScannedRequest(refreshRes.data.data);
          } else {
            setScannedRequest(null);
          }
        } else {
          setScannedRequest(null); // Reset back to scan page
        }
      } else {
        setError("Gagal mengonfirmasi scan.");
      }
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || "Gagal melakukan scan security.");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <Layout activeNav="Dashboard" topbarTitle="Security Portal">
      <div className="max-w-4xl mx-auto px-2 sm:px-4 py-4 sm:py-8">
        
        {/* Hidden Canvas for Frame Capture */}
        <canvas ref={canvasRef} className="hidden" />
        
        {/* Hidden File Input for Gallery Photo Scan */}
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handlePhotoUpload} 
          accept="image/*" 
          className="hidden" 
        />

        {/* State 1: Scan QR / Photo Scan Screen (Default) */}
        {!scannedRequest && (
          <div className="space-y-6 max-w-lg mx-auto animate-fadein">
            <div className="bg-white rounded-3xl border border-slate-100 p-5 sm:p-8 shadow-md text-center flex flex-col items-center">
              <div className="w-14 h-14 bg-blue-50 text-[#1e3a8a] rounded-2xl flex items-center justify-center mb-6">
                <Icon name="qr_code_scanner" className="text-3xl" />
              </div>
              <h2 className="text-[20px] sm:text-[22px] font-extrabold text-slate-800 tracking-tight">
                SCAN QR DISINI
              </h2>
              <p className="text-sm text-slate-400 mt-1 max-w-xs leading-relaxed">
                Pindai kode QR tiket perjalanan karyawan menggunakan kamera atau unggah foto scan tiket.
              </p>

              {/* Kamera Live Scanner / Captured Photo Container */}
              <div className="relative w-64 h-64 bg-slate-950 rounded-2xl border-4 border-slate-800 shadow-inner my-6 overflow-hidden flex flex-col justify-center items-center">
                
                {/* 1. Live Camera Stream */}
                {cameraActive && !capturedPhoto && (
                  <video 
                    ref={videoRef} 
                    autoPlay 
                    playsInline 
                    className="w-full h-full object-cover" 
                  />
                )}

                {/* 2. Display Scanned Photo (Webcam snapshot or File Upload) */}
                {capturedPhoto && (
                  <img 
                    src={capturedPhoto} 
                    alt="Foto Scan" 
                    className="w-full h-full object-cover" 
                  />
                )}

                {/* 3. Camera Off Placeholder / Loading Camera */}
                {!cameraActive && !capturedPhoto && (
                  <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center gap-3">
                    <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                    <div>
                      <span className="text-xs text-slate-300 font-semibold block">Menginisialisasi Kamera...</span>
                      <span className="text-[10px] text-slate-500 block mt-1">Harap izinkan akses kamera di browser Anda</span>
                    </div>
                  </div>
                )}

                {/* Scanner Frame Corners */}
                <div className="absolute top-4 left-4 w-6 h-6 border-t-4 border-l-4 border-emerald-500 rounded-tl-sm z-10"></div>
                <div className="absolute top-4 right-4 w-6 h-6 border-t-4 border-r-4 border-emerald-500 rounded-tr-sm z-10"></div>
                <div className="absolute bottom-4 left-4 w-6 h-6 border-b-4 border-l-4 border-emerald-500 rounded-bl-sm z-10"></div>
                <div className="absolute bottom-4 right-4 w-6 h-6 border-b-4 border-r-4 border-emerald-500 rounded-br-sm z-10"></div>
                
                {/* Laser scan line animation (visible when camera or scanning is active) */}
                {(cameraActive || isScanning) && (
                  <div className="absolute left-0 w-full h-1 bg-emerald-500/80 shadow-[0_0_12px_#10b981] scanner-laser z-10"></div>
                )}

                {/* Scanning Text Overlay */}
                {isScanning && (
                  <div className="absolute inset-0 bg-black/60 z-20 flex flex-col items-center justify-center gap-2">
                    <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                    <span className="text-xs font-bold text-emerald-400 tracking-wider">MENGANALISIS FOTO...</span>
                  </div>
                )}
              </div>

              {/* Action Buttons for Scan Input */}
              <div className="flex flex-col sm:flex-row gap-2.5 w-full mb-6">
                {cameraActive && !capturedPhoto && (
                  <button
                    type="button"
                    onClick={handleTriggerScan}
                    className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Icon name="photo_camera" className="text-base" /> Pindai Sekarang (Ambil Foto)
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Icon name="image" className="text-base" /> Upload Foto Scan
                </button>
              </div>



              {error && (
                <div className="w-full mt-4 p-3.5 bg-red-50 text-red-700 text-xs rounded-xl flex items-center gap-2 text-left">
                  <Icon name="error" className="text-base flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {successMsg && (
                <div className="w-full mt-4 p-3.5 bg-emerald-50 text-emerald-700 text-xs rounded-xl flex items-center gap-2 text-left">
                  <Icon name="check_circle" className="text-base flex-shrink-0" />
                  <span>{successMsg}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* State 2: Request Detail Check Screen */}
        {scannedRequest && (
          <div className="space-y-6 animate-fadein">
            <div className="bg-white rounded-3xl border border-slate-100 shadow-md p-4 sm:p-8 space-y-6">
              
              {/* Header Info */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                <div>
                  <button 
                    onClick={() => { setScannedRequest(null); setError(null); }}
                    className="text-xs font-semibold text-slate-400 hover:text-slate-600 flex items-center gap-1 mb-2"
                  >
                    <Icon name="arrow_back" className="text-sm" /> Kembali ke Scan
                  </button>
                  <span className="px-2.5 py-1 text-xs font-bold uppercase rounded-md bg-blue-50 text-blue-800">
                    ID Request: #{scannedRequest.id}
                  </span>
                  <h4 className="text-xl font-extrabold text-slate-800 mt-2">
                    {scannedRequest.destination_city} - {scannedRequest.destination_place}
                  </h4>
                </div>
                <span className={`px-4 py-1.5 rounded-full text-xs font-bold capitalize self-start sm:self-auto ${
                  scannedRequest.status === "on_going" ? "bg-amber-100 text-amber-800 animate-pulse" :
                  scannedRequest.status === "completed" ? "bg-emerald-100 text-emerald-800" :
                  "bg-blue-100 text-blue-800"
                }`}>
                  {scannedRequest.status === "driver_assigned" ? "Siap Berangkat" :
                   scannedRequest.status === "on_going" ? "Sedang Jalan" :
                   scannedRequest.status === "completed" ? "Selesai" : scannedRequest.status}
                </span>
              </div>

              {/* Data Detail Perjalanan & Scanned Proof */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Captured Photo Scan Proof */}
                {capturedPhoto && (
                  <div className="md:col-span-1 space-y-2">
                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Foto Scan Terlampir</div>
                    <div className="relative w-full h-48 bg-slate-100 rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                      <img 
                        src={capturedPhoto} 
                        alt="Bukti Scan" 
                        className="w-full h-full object-cover" 
                      />
                      <div className="absolute bottom-2 right-2 bg-black/60 px-2.5 py-1 rounded-md text-[10px] font-bold text-white flex items-center gap-1">
                        <Icon name="check" className="text-xs" /> Verified
                      </div>
                    </div>
                  </div>
                )}

                <div className={`${capturedPhoto ? 'md:col-span-2' : 'md:col-span-3'} grid grid-cols-1 sm:grid-cols-2 gap-4`}>
                  <div className="space-y-4">
                    <div>
                      <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Pemohon</div>
                      <div className="text-sm font-semibold text-slate-800 mt-0.5">{scannedRequest.requested_by?.name}</div>
                      <div className="text-[10px] font-bold uppercase text-slate-400 tracking-wider mt-0.5">
                        {scannedRequest.department_name || scannedRequest.department_id || "-"}
                      </div>
                    </div>

                    <div>
                      <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Tujuan / Keperluan</div>
                      <div className="text-sm text-slate-800 mt-0.5">{scannedRequest.purpose}</div>
                    </div>

                    <div>
                      <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Estimasi Kembali</div>
                      <div className="text-sm font-semibold text-[#1e3a8a] flex items-center gap-1.5 mt-1">
                        <Icon name="timer" className="text-base" />
                        {scannedRequest.estimated_duration ? `${scannedRequest.estimated_duration} Jam (Pulang Pergi)` : "-"}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {scannedRequest.is_external ? (
                      <div className="p-3 bg-amber-50/50 border border-amber-100 rounded-2xl">
                        <div className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">ARMADA EKSTERNAL</div>
                        <div className="text-sm font-semibold text-amber-900 mt-1">Sewa Pihak Ketiga</div>
                        <div className="text-xs text-amber-700 mt-0.5">Penugasan eksternal tidak memerlukan driver internal.</div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                          Daftar Unit Armada ({scannedRequest.operational_trips?.length || 0} Kendaraan)
                        </div>
                        {scannedRequest.operational_trips?.map((trip: any) => {
                          const hasCheckout = !!trip.security_checked_out_at;
                          const hasCheckin = !!trip.security_checked_in_at;
                          return (
                            <div key={trip.id} className="bg-slate-50 p-4 rounded-xl border border-slate-200/60 space-y-3">
                              <div className="flex justify-between items-start">
                                <div>
                                  <div className="font-bold text-slate-800 text-xs flex items-center gap-1">
                                    <span>🚙</span> {trip.vehicle?.name || "Kendaraan"} ({trip.vehicle?.plate_number || ""})
                                  </div>
                                  <div className="text-[11px] text-slate-500 font-medium mt-0.5">
                                    Driver: {trip.driver?.name || "Driver"}
                                  </div>
                                </div>
                                <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                                  hasCheckin ? "bg-emerald-100 text-emerald-800" :
                                  hasCheckout ? "bg-amber-100 text-amber-800 animate-pulse" :
                                  "bg-blue-100 text-blue-800"
                                }`}>
                                  {hasCheckin ? "Selesai" : hasCheckout ? "Sedang Jalan" : "Scheduled"}
                                </span>
                              </div>

                              <div className="grid grid-cols-2 gap-2 text-[10px]">
                                <div className="bg-white p-2 rounded-lg border border-slate-100">
                                  <span className="font-bold text-slate-400 block mb-0.5">Berangkat</span>
                                  {hasCheckout ? (
                                    <div className="text-slate-600">
                                      <span className="font-semibold">{new Date(trip.security_checked_out_at).toLocaleTimeString('id-ID', {hour: '2-digit', minute: '2-digit'})}</span>
                                      <span className="text-slate-400 text-[9px] block">Oleh: {trip.security_checkout_by}</span>
                                      {trip.security_checkout_notes && <span className="text-slate-500 italic block mt-0.5">"{trip.security_checkout_notes}"</span>}
                                    </div>
                                  ) : (
                                    <span className="text-slate-400 italic">Belum berangkat</span>
                                  )}
                                </div>
                                <div className="bg-white p-2 rounded-lg border border-slate-100">
                                  <span className="font-bold text-slate-400 block mb-0.5">Kembali</span>
                                  {hasCheckin ? (
                                    <div className="text-slate-600">
                                      <span className="font-semibold">{new Date(trip.security_checked_in_at).toLocaleTimeString('id-ID', {hour: '2-digit', minute: '2-digit'})}</span>
                                      <span className="text-slate-400 text-[9px] block">Oleh: {trip.security_checkin_by}</span>
                                      {trip.security_checkin_notes && <span className="text-slate-500 italic block mt-0.5">"{trip.security_checkin_notes}"</span>}
                                    </div>
                                  ) : (
                                    <span className="text-slate-400 italic">Belum kembali</span>
                                  )}
                                </div>
                              </div>

                              {(!hasCheckout || !hasCheckin) && (
                                <div className="flex gap-2">
                                  {!hasCheckout ? (
                                    <button
                                      onClick={() => handleConfirmTripScanClick(trip.id, "checkout")}
                                      className="flex-1 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-[10px] font-bold rounded-lg transition-colors flex items-center justify-center gap-1 cursor-pointer"
                                    >
                                      <Icon name="done_all" className="text-xs" /> Berangkat
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() => handleConfirmTripScanClick(trip.id, "checkin")}
                                      className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold rounded-lg transition-colors flex items-center justify-center gap-1 cursor-pointer"
                                    >
                                      <Icon name="done_all" className="text-xs" /> Kembali
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
 
                    <div>
                      <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Jumlah Penumpang</div>
                      <div className="text-sm text-slate-700 mt-0.5">
                        {scannedRequest.passenger_count} Orang
                      </div>
                    </div>
                  </div>
                </div>
              </div>
 
              {/* Form Input Catatan Notebook Security */}
              <div className="border-t border-slate-100 pt-6 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Catatan Notebook Security (KM awal/akhir, barang bawaan, dll)
                  </label>
                  <textarea
                    rows={2}
                    value={securityNotes}
                    onChange={(e) => setSecurityNotes(e.target.value)}
                    placeholder="Tulis catatan (Opsional)..."
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-slate-400"
                  />
                  {!scannedRequest.is_external && (
                    <span className="text-[10px] text-slate-400 italic mt-1 block">
                      *Tulis catatan di atas sebelum menekan tombol "Berangkat" atau "Kembali" pada unit kendaraan pilihan.
                    </span>
                  )}
                </div>

                {scannedRequest.is_external && (
                  <div className="w-full">
                    {!scannedRequest.security_checked_out_at ? (
                      <button
                        onClick={() => handleConfirmScanClick("checkout")}
                        className="w-full py-3.5 px-4 bg-amber-600 text-white font-bold rounded-xl hover:bg-amber-700 transition-colors shadow-sm flex items-center justify-center gap-2 cursor-pointer text-xs sm:text-sm"
                      >
                        <Icon name="done_all" className="text-lg" />
                        OKE - Konfirmasi Berangkat
                      </button>
                    ) : !scannedRequest.security_checked_in_at ? (
                      <button
                        onClick={() => handleConfirmScanClick("checkin")}
                        className="w-full py-3.5 px-4 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-colors shadow-sm flex items-center justify-center gap-2 cursor-pointer text-xs sm:text-sm"
                      >
                        <Icon name="done_all" className="text-lg" />
                        OKE - Konfirmasi Kembali
                      </button>
                    ) : (
                      <div className="p-4 bg-emerald-50 text-emerald-800 rounded-xl text-sm font-semibold text-center">
                        Perjalanan ini telah selesai diberangkatkan dan dikembalikan oleh Security.
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* State 3: Modal Input Nama Petugas Jaga ("Siapa yang bertugas") */}
        {showNameModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fadein p-4">
            <div className="bg-white rounded-3xl border border-slate-100 p-5 sm:p-8 w-full max-w-md shadow-2xl relative">
              <button 
                onClick={() => setShowNameModal(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
              >
                <Icon name="close" className="text-xl" />
              </button>
              
              <div className="text-center mb-6">
                <div className="w-12 h-12 bg-blue-50 text-[#1e3a8a] rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Icon name="badge" className="text-2xl" />
                </div>
                <h3 className="text-lg font-bold text-slate-800">Siapa Yang Bertugas?</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Masukkan nama petugas jaga yang memverifikasi scan ini untuk disimpan ke buku log.
                </p>
              </div>

              <form onSubmit={handleSaveScan} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-2">
                    Nama Petugas Security
                  </label>
                  <div className="space-y-3">
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                        <Icon name="assignment_ind" className="text-lg" />
                      </span>
                      <select
                        required
                        value={selectedGuardOption}
                        onChange={(e) => {
                          const val = e.target.value;
                          setSelectedGuardOption(val);
                          if (val !== "custom") {
                            setGuardName(val);
                          } else {
                            setGuardName("");
                          }
                        }}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-semibold"
                      >
                        <option value="" disabled>-- Pilih Nama Petugas --</option>
                        {predefinedGuards.map((name) => (
                          <option key={name} value={name}>{name}</option>
                        ))}
                        <option value="custom">Ketik Manual (Nama Lainnya)</option>
                      </select>
                    </div>

                    {selectedGuardOption === "custom" && (
                      <div className="relative animate-fadein">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                          <Icon name="person" className="text-lg" />
                        </span>
                        <input
                          type="text"
                          required
                          value={guardName}
                          onChange={(e) => setGuardName(e.target.value)}
                          placeholder="Ketik Nama Anda (Contoh: Budi)"
                          className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-semibold"
                        />
                      </div>
                    )}
                  </div>
                </div>

                 <div className="flex gap-2.5 pt-2 text-xs sm:text-sm font-semibold">
                  <button
                    type="button"
                    onClick={() => setShowNameModal(false)}
                    className="flex-1 py-3 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="flex-1 py-3 bg-[#1e3a8a] text-white rounded-xl hover:bg-blue-800 transition-colors shadow-sm flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {actionLoading ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Icon name="save" className="text-base" />
                        Simpan Log
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>

      {/* Embedded CSS for Premium scanner laser animation */}
      <style>{`
        @keyframes laser-scan {
          0% { top: 16px; }
          50% { top: calc(100% - 20px); }
          100% { top: 16px; }
        }
        .scanner-laser {
          animation: laser-scan 2.5s ease-in-out infinite;
        }
      `}</style>
    </Layout>
  );
}
