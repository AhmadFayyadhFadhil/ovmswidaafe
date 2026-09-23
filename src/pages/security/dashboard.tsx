import { useState, useRef, useEffect } from "react";
import { Layout } from "@/components/layout/RoleLayout";
import { Icon } from "@/components/ui/Icon";
import { apiClient } from "@/services/api/api";
import jsQR from "jsqr";

// Parse time from datetime string directly (no JS timezone conversion)
const parseTimeStr = (dtStr: string | null | undefined): string => {
  if (!dtStr) return "";
  // Remove Z suffix to prevent UTC interpretation, then take HH:mm
  const clean = String(dtStr).replace('Z', '').replace('T', ' ');
  const timePart = clean.split(' ')[1];
  if (timePart) {
    const parts = timePart.split(':');
    if (parts.length >= 2) return `${parts[0]}.${parts[1]}`;
  }
  return dtStr;
};

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
  const [selectedItineraryId, setSelectedItineraryId] = useState<number | null>(null);
  const [selectedSession, setSelectedSession] = useState<'morning' | 'afternoon' | null>(null);
  const [activeItineraryIndex, setActiveItineraryIndex] = useState<number>(0);
  const [odometerKm, setOdometerKm] = useState<string>("");

  const getActiveStartKm = (): number | null => {
    if (selectedTripId && scannedRequest?.operational_trips) {
      const trip = scannedRequest.operational_trips.find((t: any) => t.id === selectedTripId);
      if (trip && typeof trip.start_km === 'number' && trip.start_km > 0) return trip.start_km;
    }
    if (selectedItineraryId && scannedRequest?.itineraries) {
      const it = scannedRequest.itineraries.find((i: any) => i.id === selectedItineraryId);
      if (it && typeof it.start_km === 'number' && it.start_km > 0) return it.start_km;
    }
    if (typeof scannedRequest?.start_km === 'number' && scannedRequest.start_km > 0) return scannedRequest.start_km;
    return null;
  };

  const getActiveVehicleLastOdometer = (): number | null => {
    if (selectedTripId && scannedRequest?.operational_trips) {
      const trip = scannedRequest.operational_trips.find((t: any) => t.id === selectedTripId);
      if (trip?.vehicle?.odometer) return trip.vehicle.odometer;
    }
    if (scannedRequest?.vehicle?.odometer) return scannedRequest.vehicle.odometer;
    return null;
  };

  const handleConfirmTripScanClick = (tripId: number, type: "checkout" | "checkin") => {
    setSelectedTripId(tripId);
    setSelectedItineraryId(null);
    setSelectedSession(null);
    setConfirmingType(type);
    setOdometerKm("");
    setShowNameModal(true);
  };

  const handleConfirmScanClick = (type: "checkout" | "checkin", itId?: number, session?: 'morning' | 'afternoon') => {
    setSelectedTripId(null);
    setConfirmingType(type);
    setSelectedItineraryId(itId ?? null);
    setSelectedSession(session ?? null);
    setOdometerKm("");
    setShowNameModal(true);
  };

  useEffect(() => {
    if (showNameModal) {
      if (guardName) {
        if (predefinedGuards.length > 0 && predefinedGuards.includes(guardName)) {
          setSelectedGuardOption(guardName);
        } else {
          setSelectedGuardOption("custom");
        }
      } else if (predefinedGuards.length > 0) {
        setSelectedGuardOption(predefinedGuards[0]);
        setGuardName(predefinedGuards[0]);
      } else {
        setSelectedGuardOption("custom");
      }
    }
  }, [showNameModal, predefinedGuards]);

  // Camera and Photo Scan states
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isCameraManuallyOff, setIsCameraManuallyOff] = useState(false);

  // Request search logic
  const handleSearchRequest = async (e?: React.FormEvent, manualValue?: string) => {
    if (e) e.preventDefault();
    
    let finalId = manualValue ? manualValue.trim() : undefined;

    if (finalId && (finalId.startsWith("http://") || finalId.startsWith("https://") || finalId.includes("?token="))) {
      try {
        const urlObj = new URL(finalId);
        const tokenParam = urlObj.searchParams.get("token");
        if (tokenParam) {
          finalId = tokenParam.trim();
        }
      } catch (err) {
        const match = finalId.match(/[?&]token=([^&]+)/);
        if (match) {
          finalId = match[1].trim();
        }
      }
    }

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

    // Build candidate tokens list (primary token + fallback candidate IDs)
    const candidatesToTry: string[] = finalId ? [finalId] : [];

    if (finalId) {
      // Extract REQ-{ID} pattern (e.g. REQ-17 from REQ-1786023277...)
      const reqMatch = finalId.match(/REQ-(\d+)/i);
      if (reqMatch && reqMatch[1]) {
        const extractedId = reqMatch[1];
        if (!candidatesToTry.includes(extractedId)) {
          candidatesToTry.push(extractedId);
        }
        const reqPref = `REQ-${extractedId}`;
        if (!candidatesToTry.includes(reqPref)) {
          candidatesToTry.push(reqPref);
        }
      }

      // Extract short digits sequence if reasonable length
      const digitsOnly = finalId.replace(/[^0-9]/g, '');
      if (digitsOnly && digitsOnly.length > 0 && digitsOnly.length <= 6 && !candidatesToTry.includes(digitsOnly)) {
        candidatesToTry.push(digitsOnly);
      }
    }

    let lastErrorMsg = "Permintaan kendaraan tidak ditemukan. Periksa kembali format kode.";
    let successData: any = null;

    for (const candToken of candidatesToTry) {
      try {
        const res = await apiClient.get('/security/lookup', {
          params: { qr_code_token: candToken }
        });

        if (res.data && res.data.status === "success" && res.data.data) {
          successData = res.data.data;
          break;
        }
      } catch (err: any) {
        if (err.response?.data?.message) {
          lastErrorMsg = err.response.data.message;
        }
      }
    }

    if (successData) {
      setScannedRequest(successData);
    } else {
      setError(lastErrorMsg);
    }

    setActionLoading(false);
  };

  // Real-time polling auto-refresh every 5 seconds for active scanned request
  useEffect(() => {
    if (!scannedRequest?.qr_code_token && !scannedRequest?.id) return;
    
    const token = scannedRequest.qr_code_token || `REQ-${scannedRequest.id}`;
    const interval = setInterval(async () => {
      try {
        const res = await apiClient.get('/security/lookup', {
          params: { qr_code_token: token }
        });
        if (res.data && res.data.status === "success") {
          setScannedRequest(res.data.data);
        }
      } catch (err) {
        // silent catch for background polling
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [scannedRequest?.qr_code_token, scannedRequest?.id]);

  // Camera controls
  const startCamera = async () => {
    try {
      setError(null);
      let mediaStream: MediaStream;
      try {
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" }
        });
      } catch (e) {
        // Fallback if environment camera constraint is overconstrained or not found
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: true
        });
      }
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
      setError("Kamera tidak dapat diakses. Silakan periksa izin kamera di pengaturan browser Anda, atau gunakan opsi upload foto.");
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

  const handleScanUlang = () => {
    setError(null);
    setSuccessMsg(null);
    setScannedRequest(null);
    setCapturedPhoto(null);
    setIsScanning(false);
    setIsCameraManuallyOff(false);
    startCamera();
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
    if (!scannedRequest && !isCameraManuallyOff) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [scannedRequest, isCameraManuallyOff]);

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
          canvas.width = video.videoWidth || 640;
          canvas.height = video.videoHeight || 480;
          const ctx = canvas.getContext("2d", { willReadFrequently: true });
          if (ctx) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            
            // Attempt to decode QR code using jsQR with attemptBoth for inverted & mirrored QR codes
            let code = jsQR(imageData.data, imageData.width, imageData.height, {
              inversionAttempts: "attemptBoth",
            });
            
            let finalPhotoUrl = "";
            
            if (code && code.data) {
              finalPhotoUrl = canvas.toDataURL("image/jpeg");
            } else {
              // Try with horizontally flipped image (for mirrored webcams / screens)
              ctx.clearRect(0, 0, canvas.width, canvas.height);
              ctx.translate(canvas.width, 0);
              ctx.scale(-1, 1);
              ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
              
              const flippedData = ctx.getImageData(0, 0, canvas.width, canvas.height);
              code = jsQR(flippedData.data, flippedData.width, flippedData.height, {
                inversionAttempts: "attemptBoth",
              });
              
              if (code && code.data) {
                finalPhotoUrl = canvas.toDataURL("image/jpeg");
              }
              
              // Restore canvas transform context
              ctx.setTransform(1, 0, 0, 1, 0, 0);
            }
            
            if (code && code.data) {
              console.log("QR Code detected in real-time:", code.data);
              active = false;
              
              // Capture photo scan proof (either normal or flipped correctly)
              setCapturedPhoto(finalPhotoUrl || canvas.toDataURL("image/jpeg"));
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
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        
        // Check if QR code exists in frame
        let code = jsQR(imageData.data, imageData.width, imageData.height);
        let finalPhotoUrl = "";
        
        if (code && code.data) {
          finalPhotoUrl = canvas.toDataURL("image/jpeg");
        } else {
          // Try with horizontally flipped image (for mirrored webcams)
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.translate(canvas.width, 0);
          ctx.scale(-1, 1);
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          
          const flippedData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          code = jsQR(flippedData.data, flippedData.width, flippedData.height);
          
          if (code && code.data) {
            finalPhotoUrl = canvas.toDataURL("image/jpeg");
          }
          
          // Restore canvas transform context
          ctx.setTransform(1, 0, 0, 1, 0, 0);
        }

        if (code && code.data) {
          setCapturedPhoto(finalPhotoUrl || canvas.toDataURL("image/jpeg"));
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
            const ctx = canvas.getContext("2d", { willReadFrequently: true });
            if (ctx) {
              ctx.drawImage(img, 0, 0);
              const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
              let code = jsQR(imageData.data, imageData.width, imageData.height, {
                inversionAttempts: "attemptBoth",
              });
              
              if (!code || !code.data) {
                // Try horizontally flipped canvas if normal decoding failed (e.g. mirrored photo)
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.translate(canvas.width, 0);
                ctx.scale(-1, 1);
                ctx.drawImage(img, 0, 0);
                const flippedData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                code = jsQR(flippedData.data, flippedData.width, flippedData.height, {
                  inversionAttempts: "attemptBoth",
                });
                ctx.setTransform(1, 0, 0, 1, 0, 0);
              }
              
              setIsScanning(true);
              stopCamera();
              setTimeout(() => {
                setIsScanning(false);
                if (code && code.data) {
                  handleSearchRequest(undefined, code.data);
                } else {
                  setError("QR Code tidak terdeteksi pada berkas gambar yang diunggah. Anda dapat menginput ID Request secara manual di bawah.");
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



  const handleSaveScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guardName.trim() || !confirmingType || !scannedRequest) return;

    if (!odometerKm.trim()) {
      alert("Kilometer Odometer wajib diisi!");
      return;
    }

    const kmNum = Number(odometerKm);
    if (isNaN(kmNum) || kmNum < 0) {
      alert("Masukkan angka kilometer yang valid!");
      return;
    }

    const currentStartKm = getActiveStartKm();
    if (confirmingType === "checkin" && currentStartKm !== null && kmNum < currentStartKm) {
      alert(`KM Kembali (${kmNum.toLocaleString('id-ID')}) tidak boleh lebih kecil dari KM Berangkat (${currentStartKm.toLocaleString('id-ID')})!`);
      return;
    }

    localStorage.setItem("ovms_security_guard_name", guardName.trim());

    setActionLoading(true);
    setError(null);
    setSuccessMsg(null);
    setShowNameModal(false);

    try {
      const nowDevice = new Date();
      const pad = (n: number) => String(n).padStart(2, '0');
      const scannedAtStr = `${nowDevice.getFullYear()}-${pad(nowDevice.getMonth() + 1)}-${pad(nowDevice.getDate())} ${pad(nowDevice.getHours())}:${pad(nowDevice.getMinutes())}:${pad(nowDevice.getSeconds())}`;

      const payload: any = {
        qr_code_token: scannedRequest.qr_code_token || `REQ-${scannedRequest.id}`,
        security_name: guardName.trim(),
        type: confirmingType,
        notes: securityNotes,
        scanned_at: scannedAtStr,
        start_km: confirmingType === "checkout" ? kmNum : undefined,
        end_km: confirmingType === "checkin" ? kmNum : undefined,
      };

      if (selectedTripId) {
        payload.trip_id = selectedTripId;
      }
      if (selectedItineraryId) {
        payload.itinerary_id = selectedItineraryId;
      }
      if (selectedSession) {
        payload.session = selectedSession;
      }

      const res = await apiClient.post("/security/scan", payload);

      if (res.data && res.data.status === "success") {
        const successMessage = res.data.message;
        setSecurityNotes("");
        setOdometerKm("");
        setConfirmingType(null);
        setCapturedPhoto(null);

        // Refresh request data so security sees updated status
        try {
          const refreshRes = await apiClient.get('/security/lookup', {
            params: { qr_code_token: scannedRequest.qr_code_token || `REQ-${scannedRequest.id}` }
          });
          if (refreshRes.data && refreshRes.data.status === "success") {
            // Always show refreshed data (including completed status) so user can see updated scan log
            setScannedRequest(refreshRes.data.data);
          }
        } catch (e) {
          // silently ignore refresh errors, keep showing current data
        }
        // Set success message after data is refreshed
        setSuccessMsg(successMessage);
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
    <Layout activeNav="Dashboard" topbarTitle="Portal Keamanan">
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
                Pindai kode QR tiket perjalanan karyawan menggunakan kamera.
              </p>

              {/* Kamera Live Scanner / Captured Photo Container */}
              <div className="relative w-64 h-64 bg-slate-950 rounded-2xl border-4 border-slate-800 shadow-inner my-6 overflow-hidden flex flex-col justify-center items-center">
                
                {/* 1. Live Camera Stream */}
                {cameraActive && !capturedPhoto && (
                  <video 
                    ref={videoRef} 
                    autoPlay 
                    playsInline 
                    className="w-full h-full object-cover scale-x-[-1]" 
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
                    {isCameraManuallyOff ? (
                      <>
                        <div className="w-10 h-10 bg-slate-900 text-slate-400 rounded-full flex items-center justify-center mb-1">
                          <Icon name="videocam_off" className="text-xl" />
                        </div>
                        <div>
                          <span className="text-xs text-slate-300 font-semibold block">Kamera Dinonaktifkan</span>
                          <span className="text-[10px] text-slate-500 block mt-1">Aktifkan kembali untuk mulai memindai</span>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                        <div>
                          <span className="text-xs text-slate-300 font-semibold block">Menginisialisasi Kamera...</span>
                          <span className="text-[10px] text-slate-500 block mt-1">Harap izinkan akses kamera di browser Anda</span>
                        </div>
                      </>
                    )}
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
                  <>
                    <button
                      type="button"
                      onClick={handleTriggerScan}
                      className="flex-1 h-12 bg-[#059669] hover:bg-[#047857] text-white text-xs font-bold rounded-xl shadow transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Icon name="photo_camera" className="text-base" /> Ambil Foto Scan
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsCameraManuallyOff(true)}
                      className="flex-1 h-12 bg-[#e11d48] hover:bg-[#be123c] text-white text-xs font-bold rounded-xl shadow transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Icon name="videocam_off" className="text-base" /> Matikan Kamera
                    </button>
                  </>
                )}
                {!cameraActive && !capturedPhoto && isCameraManuallyOff && (
                  <button
                    type="button"
                    onClick={() => setIsCameraManuallyOff(false)}
                    className="flex-1 h-12 bg-[#059669] hover:bg-[#047857] text-white text-xs font-bold rounded-xl shadow transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Icon name="videocam" className="text-base" /> Nyalakan Kamera
                  </button>
                )}
                {capturedPhoto && (
                  <button
                    type="button"
                    onClick={handleScanUlang}
                    className="flex-1 h-12 bg-[#1e3a8a] hover:bg-[#1e40af] text-white text-xs font-bold rounded-xl shadow transition-all flex items-center justify-center gap-1.5 cursor-pointer animate-fadein"
                  >
                    <Icon name="refresh" className="text-base" /> Pindai Ulang
                  </button>
                )}
              </div>

              {/* Manual Request Search Input Form */}
              <form onSubmit={(e) => { e.preventDefault(); const form = e.target as HTMLFormElement; const inputEl = form.elements.namedItem('manualCode') as HTMLInputElement; if (inputEl?.value) handleSearchRequest(e, inputEl.value); }} className="w-full mt-2 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center gap-2">
                <div className="relative flex-1 w-full">
                  <Icon name="search" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
                  <input
                    name="manualCode"
                    type="text"
                    placeholder="Atau ketik ID Request / Kode Tiket (cth: 18 atau REQ-18)..."
                    className="w-full h-11 pl-10 pr-3 border border-slate-200 rounded-xl text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]/20 font-semibold"
                  />
                </div>
                <button type="submit" disabled={actionLoading} className="w-full sm:w-auto h-11 px-5 bg-[#1e3a8a] hover:bg-[#1e40af] text-white text-xs font-bold rounded-xl shadow transition-all flex items-center justify-center gap-1.5 shrink-0 cursor-pointer">
                  <Icon name="arrow_forward" className="text-sm" /> Cari Request
                </button>
              </form>



               {error && (
                <div className="w-full mt-4 p-3.5 bg-red-50 text-red-700 text-xs rounded-xl flex flex-col gap-2.5 text-left animate-fadein">
                  <div className="flex items-center gap-2">
                    <Icon name="error" className="text-base flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                  {capturedPhoto && (
                    <button
                      type="button"
                      onClick={handleScanUlang}
                      className="self-start px-3.5 py-1.5 bg-[#dc2626] hover:bg-[#b91c1c] text-white text-[11px] font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <Icon name="refresh" className="text-[13px]" /> Pindai Ulang
                    </button>
                  )}
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
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm font-bold rounded-2xl flex items-center justify-between gap-3 animate-fadein shadow-xs">
                <div className="flex items-center gap-2">
                  <Icon name="error" className="text-lg flex-shrink-0 text-red-600" />
                  <span>{error}</span>
                </div>
                <button type="button" onClick={() => setError(null)} className="text-red-500 hover:text-red-700 font-bold text-xs cursor-pointer">✕</button>
              </div>
            )}

            {successMsg && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm font-bold rounded-2xl flex items-center justify-between gap-3 animate-fadein shadow-xs">
                <div className="flex items-center gap-2">
                  <Icon name="check_circle" className="text-lg flex-shrink-0 text-emerald-600" />
                  <span>{successMsg}</span>
                </div>
                <button type="button" onClick={() => setSuccessMsg(null)} className="text-emerald-700 hover:text-emerald-900 font-bold text-xs cursor-pointer">✕</button>
              </div>
            )}

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
                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <span className={`px-4 py-1.5 rounded-full text-xs font-bold capitalize ${
                    scannedRequest.status === "on_going" ? "bg-amber-100 text-amber-800 animate-pulse" :
                    scannedRequest.status === "completed" ? "bg-emerald-100 text-emerald-800" :
                    "bg-blue-100 text-blue-800"
                  }`}>
                    {scannedRequest.status === "driver_assigned" ? "Siap Berangkat" :
                     scannedRequest.status === "on_going" ? "Sedang Jalan" :
                     scannedRequest.status === "completed" ? "Selesai" : scannedRequest.status}
                  </span>

                  <button
                    type="button"
                    onClick={() => handleSearchRequest(undefined, scannedRequest.qr_code_token || `REQ-${scannedRequest.id}`)}
                    disabled={actionLoading}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer border border-slate-200 active:scale-95"
                    title="Refresh data real-time"
                  >
                    <Icon name="refresh" className={`text-sm ${actionLoading ? 'animate-spin text-blue-600' : ''}`} />
                    Refresh
                  </button>
                </div>
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
                        {/* Multi-Day Itinerary Today Segment Highlight & Security Scan Actions */}
                        {Array.isArray(scannedRequest.itineraries) && scannedRequest.itineraries.length > 0 && (() => {
                          const currentItinerary = scannedRequest.itineraries[activeItineraryIndex] || scannedRequest.itineraries[0];
                          
                          const isReqCompleted = scannedRequest.status === 'completed';
                          const morningCompleted = currentItinerary.morning_status === 'completed' || isReqCompleted;
                          const morningOngoing = currentItinerary.morning_status === 'on_going' && !isReqCompleted;
                          const afternoonCompleted = currentItinerary.afternoon_status === 'completed' || isReqCompleted;
                          const afternoonOngoing = currentItinerary.afternoon_status === 'on_going' && !isReqCompleted;
                          const hasAfternoon = !!currentItinerary.afternoon_destination;
                          const hasMorning = !!currentItinerary.morning_destination;

                          const isPreviousDayPending = scannedRequest.itineraries.slice(0, activeItineraryIndex).some((prevIt: any) => {
                            const prevMorningDone = !prevIt.morning_destination || prevIt.morning_status === 'completed';
                            const prevAfternoonDone = !prevIt.afternoon_destination || prevIt.afternoon_status === 'completed';
                            return prevIt.status !== 'completed' && (!prevMorningDone || !prevAfternoonDone);
                          });

                          const isMorningIncomplete = hasMorning && !morningCompleted;

                          return (
                            <div className="space-y-3">
                              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                                Daftar Unit Armada (Request Istimewa Multi-Hari - {scannedRequest.itineraries.length} Hari)
                              </div>

                              {/* Day Selector Tabs - Horizontal Scrollable Row */}
                              <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 pt-0.5 no-scrollbar scroll-smooth">
                                {scannedRequest.itineraries.map((it: any, idx: number) => {
                                  const isSelected = idx === activeItineraryIndex;
                                  const isDone = it.status === 'completed' || (it.morning_status === 'completed' && (!it.afternoon_destination || it.afternoon_status === 'completed'));
                                  const isOngoing = it.morning_status === 'on_going' || it.afternoon_status === 'on_going';

                                  return (
                                    <button
                                      key={it.id || idx}
                                      type="button"
                                      onClick={() => setActiveItineraryIndex(idx)}
                                      className={`px-3 py-1.5 rounded-xl text-[11px] sm:text-xs font-bold whitespace-nowrap transition-all border cursor-pointer flex items-center gap-1 shrink-0 ${
                                        isSelected
                                          ? 'bg-[#1e3a8a] text-white border-[#1e3a8a] shadow-md scale-[1.02]'
                                          : isDone
                                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                                          : isOngoing
                                          ? 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100 animate-pulse'
                                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                                      }`}
                                    >
                                      <span>Hari {idx + 1} ({it.date})</span>
                                      {isDone ? <span className="text-emerald-600 font-black">✓</span> : isOngoing ? <span className="text-amber-600 font-black">⚡</span> : null}
                                    </button>
                                  );
                                })}
                              </div>

                              {/* Active Day Card - Stacked layout for full width */}
                              <div className="p-3.5 sm:p-4 bg-blue-50/70 border border-blue-200/80 rounded-2xl space-y-3 shadow-xs">
                                <div className="flex items-center justify-between border-b border-blue-200 pb-2">
                                  <span className="font-extrabold text-[#00236f] text-xs sm:text-sm flex items-center gap-1.5">
                                    <span>📅</span> Schedule Hari ke-{activeItineraryIndex + 1} ({currentItinerary.date})
                                  </span>
                                  {currentItinerary.is_overtime && (
                                    <span className="text-[9px] bg-red-600 text-white font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
                                      Lembur {currentItinerary.overtime_formatted}
                                    </span>
                                  )}
                                </div>

                                {/* Sessions - Stacked full width rows for clean button layout */}
                                <div className="flex flex-col gap-2.5 text-[11.5px]">
                                  {/* Sesi 1 (Pagi) */}
                                  <div className="bg-white p-3 rounded-xl border border-blue-100/80 shadow-2xs space-y-2">
                                    <div className="flex justify-between items-center border-b border-slate-100 pb-1.5">
                                      <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
                                        <span>🌅</span> Sesi 1 (Pagi)
                                      </div>
                                      <span className={`text-[9.5px] font-extrabold px-2 py-0.5 rounded-md ${
                                        morningCompleted ? 'bg-emerald-100 text-emerald-800' :
                                        morningOngoing ? 'bg-amber-100 text-amber-800 animate-pulse' :
                                        'bg-slate-100 text-slate-600'
                                      }`}>
                                        {morningCompleted ? 'Selesai' : morningOngoing ? 'Sedang Berjalan' : 'Terjadwal'}
                                      </span>
                                    </div>
                                    <div className="font-bold text-slate-800 text-xs sm:text-sm">
                                      {currentItinerary.morning_time || "08:00"} <span className="text-slate-400 font-normal">➔</span> {currentItinerary.morning_destination || "Tujuan Pagi"}
                                    </div>
                                    
                                    <div className="pt-1">
                                      {!morningCompleted && !morningOngoing && (
                                        isPreviousDayPending ? (
                                          <div className="p-2 bg-slate-100 border border-slate-200 text-slate-500 rounded-xl text-center text-[11px] font-bold flex items-center justify-center gap-1.5">
                                            <Icon name="lock" className="text-sm text-slate-400" />
                                            <span>⚠️ Perjalanan Hari Sebelumnya Belum Selesai</span>
                                          </div>
                                        ) : (
                                          <button
                                            type="button"
                                            onClick={() => handleConfirmScanClick("checkout", currentItinerary.id, "morning")}
                                            className="w-full py-2 px-3 bg-amber-600 hover:bg-amber-700 active:scale-[0.99] text-white font-bold rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer text-xs"
                                          >
                                            <Icon name="done_all" className="text-base" />
                                            <span>Berangkat (Checkout Sesi 1)</span>
                                          </button>
                                        )
                                      )}
                                      {morningOngoing && (
                                        <button
                                          type="button"
                                          onClick={() => handleConfirmScanClick("checkin", currentItinerary.id, "morning")}
                                          className="w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-bold rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer text-xs"
                                        >
                                          <Icon name="done_all" className="text-base" />
                                          <span>Kembali (Checkin Sesi 1)</span>
                                        </button>
                                      )}
                                      {morningCompleted && (
                                        <div className="p-1.5 bg-emerald-50 text-emerald-800 rounded-lg text-center text-[10.5px] font-bold border border-emerald-200/60 flex items-center justify-center gap-1">
                                          <span>✓ Sesi 1 Selesai</span>
                                          <span className="font-semibold text-slate-500">
                                            ({parseTimeStr(currentItinerary.morning_checked_in_at || currentItinerary.security_checked_in_at || scannedRequest.completed_at) || "--"})
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  {/* Sesi 2 (Sore) */}
                                  <div className="bg-white p-3 rounded-xl border border-blue-100/80 shadow-2xs space-y-2">
                                    <div className="flex justify-between items-center border-b border-slate-100 pb-1.5">
                                      <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
                                        <span>🌇</span> Sesi 2 (Sore)
                                      </div>
                                      {hasAfternoon ? (
                                        <span className={`text-[9.5px] font-extrabold px-2 py-0.5 rounded-md ${
                                          afternoonCompleted ? 'bg-emerald-100 text-emerald-800' :
                                          afternoonOngoing ? 'bg-amber-100 text-amber-800 animate-pulse' :
                                          'bg-slate-100 text-slate-600'
                                        }`}>
                                          {afternoonCompleted ? 'Selesai' : afternoonOngoing ? 'Sedang Berjalan' : 'Terjadwal'}
                                        </span>
                                      ) : (
                                        <span className="text-[9.5px] text-slate-400 italic">N/A</span>
                                      )}
                                    </div>
                                    <div className="font-bold text-slate-800 text-xs sm:text-sm">
                                      {currentItinerary.afternoon_time || "-"} <span className="text-slate-400 font-normal">➔</span> {currentItinerary.afternoon_destination || "-"}
                                    </div>

                                    <div className="pt-1">
                                      {hasAfternoon && !afternoonCompleted && !afternoonOngoing && (
                                        (isPreviousDayPending || isMorningIncomplete) ? (
                                          <div className="p-2 bg-slate-100 border border-slate-200 text-slate-500 rounded-xl text-center text-[11px] font-bold flex items-center justify-center gap-1.5">
                                            <Icon name="lock" className="text-sm text-slate-400" />
                                            <span>
                                              {isPreviousDayPending 
                                                ? "⚠️ Perjalanan Hari Sebelumnya Belum Selesai" 
                                                : "⚠️ Sesi 1 (Pagi) Harus Selesai Terlebih Dahulu"}
                                            </span>
                                          </div>
                                        ) : (
                                          <button
                                            type="button"
                                            onClick={() => handleConfirmScanClick("checkout", currentItinerary.id, "afternoon")}
                                            className="w-full py-2 px-3 bg-amber-600 hover:bg-amber-700 active:scale-[0.99] text-white font-bold rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer text-xs"
                                          >
                                            <Icon name="done_all" className="text-base" />
                                            <span>Berangkat (Checkout Sesi 2)</span>
                                          </button>
                                        )
                                      )}
                                      {hasAfternoon && afternoonOngoing && (
                                        <button
                                          type="button"
                                          onClick={() => handleConfirmScanClick("checkin", currentItinerary.id, "afternoon")}
                                          className="w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-bold rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer text-xs"
                                        >
                                          <Icon name="done_all" className="text-base" />
                                          <span>Kembali (Checkin Sesi 2)</span>
                                        </button>
                                      )}
                                      {hasAfternoon && afternoonCompleted && (
                                        <div className="p-1.5 bg-emerald-50 text-emerald-800 rounded-lg text-center text-[10.5px] font-bold border border-emerald-200/60 flex items-center justify-center gap-1">
                                          <span>✓ Sesi 2 Selesai</span>
                                          <span className="font-semibold text-slate-500">
                                            ({parseTimeStr(currentItinerary.afternoon_checked_in_at || currentItinerary.security_checked_in_at || scannedRequest.completed_at) || "--"})
                                          </span>
                                        </div>
                                      )}
                                      {!hasAfternoon && (
                                        <div className="text-[10.5px] text-slate-400 italic py-1">Hanya 1 Sesi permohonan</div>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                {/* Armada Info */}
                                <div className="bg-white p-3 rounded-xl border border-blue-100/80 text-[11.5px] font-semibold text-slate-700 flex items-center gap-2">
                                  <span className="text-base">🚘</span>
                                  <div>
                                    {currentItinerary.is_external ? (
                                      <span className="text-purple-700 font-bold">Armada Pihak Ke-3: {currentItinerary.external_driver_name || "Driver Sewa"}{currentItinerary.external_license_plate ? ` (${currentItinerary.external_license_plate})` : ""}</span>
                                    ) : currentItinerary.driver_name ? (
                                      <span className="text-blue-900 font-bold">Armada Internal: {currentItinerary.driver_name} {currentItinerary.vehicle_name && currentItinerary.vehicle_name.replace(/\s*\(\s*\)/g, '').trim() ? `- ${currentItinerary.vehicle_name.replace(/\s*\(\s*\)/g, '').trim()}` : ""}</span>
                                    ) : (
                                      <span className="italic text-slate-400">Belum Ditugaskan GA</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })()}

                        {(!Array.isArray(scannedRequest.itineraries) || scannedRequest.itineraries.length === 0) && (
                          <div className="space-y-3">
                            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                              Daftar Unit Armada ({scannedRequest.operational_trips?.length || 0} Kendaraan)
                            </div>
                            {scannedRequest.operational_trips && scannedRequest.operational_trips.length > 0 ? (
                              scannedRequest.operational_trips.map((trip: any) => {
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
                                        {hasCheckin ? "Selesai" : hasCheckout ? "Sedang Jalan" : "Terjadwal"}
                                      </span>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2 text-[10px]">
                                      <div className="bg-white p-2 rounded-lg border border-slate-100">
                                        <span className="font-bold text-slate-400 block mb-0.5">Berangkat</span>
                                        {hasCheckout ? (
                                          <div className="text-slate-600">
                                            <span className="font-semibold">{parseTimeStr(trip.security_checked_out_at)}</span>
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
                                            <span className="font-semibold">{parseTimeStr(trip.security_checked_in_at)}</span>
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
                              })
                            ) : (
                              !scannedRequest.is_external && (
                                <div className="pt-1">
                                  {!scannedRequest.security_checked_out_at ? (
                                    <button
                                      onClick={() => handleConfirmScanClick("checkout")}
                                      className="w-full py-2.5 px-4 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl transition-colors shadow-sm flex items-center justify-center gap-1.5 cursor-pointer text-xs"
                                    >
                                      <Icon name="done_all" className="text-base" />
                                      Berangkat (Checkout)
                                    </button>
                                  ) : !scannedRequest.security_checked_in_at ? (
                                    <button
                                      onClick={() => handleConfirmScanClick("checkin")}
                                      className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-colors shadow-sm flex items-center justify-center gap-1.5 cursor-pointer text-xs"
                                    >
                                      <Icon name="done_all" className="text-base" />
                                      Kembali (Checkin)
                                    </button>
                                  ) : (
                                    <div className="p-2.5 bg-emerald-100 text-emerald-800 rounded-xl text-center text-xs font-bold border border-emerald-200">
                                      Perjalanan Ini Telah Selesai (Completed)
                                    </div>
                                  )}
                                </div>
                              )
                            )}
                          </div>
                        )}
                      </div>
                    )}
 
                    <div>
                      <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Jumlah Penumpang</div>
                      <div className="text-sm text-slate-700 mt-0.5">
                        {scannedRequest.passenger_count} Orang
                      </div>
                    </div>

                    {(scannedRequest.start_km || scannedRequest.end_km) && (
                      <div className="p-3.5 bg-blue-50/70 border border-blue-200/80 rounded-2xl space-y-2">
                        <div className="text-[11px] font-extrabold text-[#00236f] uppercase tracking-wider flex items-center justify-between">
                          <span className="flex items-center gap-1.5">
                            <Icon name="speed" className="text-sm text-blue-600" />
                            Data Odometer Perjalanan
                          </span>
                          {scannedRequest.total_km ? (
                            <span className="text-[10px] bg-emerald-600 text-white font-extrabold px-2 py-0.5 rounded-full">
                              Total: {Number(scannedRequest.total_km).toLocaleString('id-ID')} KM
                            </span>
                          ) : null}
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs text-center">
                          <div className="bg-white p-2 rounded-xl border border-blue-100">
                            <span className="text-[10px] text-slate-400 font-bold block uppercase">KM Keluar (Awal)</span>
                            <span className="font-extrabold text-slate-800 mt-0.5 block">
                              {scannedRequest.start_km ? `${Number(scannedRequest.start_km).toLocaleString('id-ID')} km` : "-"}
                            </span>
                          </div>
                          <div className="bg-white p-2 rounded-xl border border-blue-100">
                            <span className="text-[10px] text-slate-400 font-bold block uppercase">KM Masuk (Akhir)</span>
                            <span className="font-extrabold text-slate-800 mt-0.5 block">
                              {scannedRequest.end_km ? `${Number(scannedRequest.end_km).toLocaleString('id-ID')} km` : "-"}
                            </span>
                          </div>
                          <div className="bg-white p-2 rounded-xl border border-blue-100 col-span-2 sm:col-span-1">
                            <span className="text-[10px] text-slate-400 font-bold block uppercase">Jarak Tempuh</span>
                            <span className="font-extrabold text-blue-700 mt-0.5 block">
                              {scannedRequest.total_km ? `${Number(scannedRequest.total_km).toLocaleString('id-ID')} km` : "-"}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
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

        {/* State 3: Modal Input Nama Petugas Jaga & Kilometer Odometer */}
        {showNameModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fadein p-4">
            <div className="bg-white rounded-3xl border border-slate-100 p-5 sm:p-7 w-full max-w-md shadow-2xl relative max-h-[90vh] overflow-y-auto">
              <button 
                onClick={() => setShowNameModal(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
              >
                <Icon name="close" className="text-xl" />
              </button>
              
              <div className="text-center mb-5">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-2.5 ${
                  confirmingType === 'checkout' ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'
                }`}>
                  <Icon name={confirmingType === 'checkout' ? "flight_takeoff" : "flight_land"} className="text-2xl" />
                </div>
                <div className={`inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider mb-1 ${
                  confirmingType === 'checkout' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                }`}>
                  {confirmingType === 'checkout' ? 'Pemberangkatan (Check-Out)' : 'Pengembalian (Check-In)'}
                </div>
                <h3 className="text-lg font-extrabold text-slate-800">
                  {confirmingType === 'checkout' ? 'Konfirmasi Berangkat Gate' : 'Konfirmasi Kembali Gate'}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Isi kilometer spedometer kendaraan dan nama petugas jaga.
                </p>
              </div>

              <form onSubmit={handleSaveScan} className="space-y-4">
                {/* Petugas Security */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">
                    Petugas Security Jaga <span className="text-red-500">*</span>
                  </label>
                  <div className="space-y-2">
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
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-semibold text-xs sm:text-sm"
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
                          className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-semibold text-xs sm:text-sm"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Kilometer Odometer Mandatory Section */}
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2.5">
                  {confirmingType === 'checkin' && (
                    <div className="flex items-center justify-between pb-2 border-b border-slate-200 text-xs">
                      <span className="text-slate-500 font-semibold">KM Berangkat (Keluar):</span>
                      <span className="font-extrabold text-slate-800 bg-white px-2.5 py-0.5 rounded-lg border border-slate-200">
                        {getActiveStartKm() !== null ? `${getActiveStartKm()?.toLocaleString('id-ID')} km` : 'Belum tercatat'}
                      </span>
                    </div>
                  )}

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-slate-700 uppercase">
                        {confirmingType === 'checkout' ? 'KM Odometer Keluar (Awal)' : 'KM Odometer Masuk (Akhir)'}
                        <span className="text-red-500 ml-0.5">*</span>
                      </label>
                      {confirmingType === 'checkout' && getActiveVehicleLastOdometer() ? (
                        <button
                          type="button"
                          onClick={() => setOdometerKm(String(getActiveVehicleLastOdometer()))}
                          className="text-[10px] text-blue-700 font-bold hover:underline cursor-pointer"
                        >
                          Gunakan Terakhir ({getActiveVehicleLastOdometer()?.toLocaleString('id-ID')} km)
                        </button>
                      ) : null}
                    </div>

                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                        <Icon name="speed" className="text-lg" />
                      </span>
                      <input
                        type="number"
                        required
                        min="0"
                        step="1"
                        value={odometerKm}
                        onChange={(e) => setOdometerKm(e.target.value)}
                        placeholder={confirmingType === 'checkout' ? "Contoh: 45230" : "Contoh: 45315"}
                        className="w-full pl-10 pr-12 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-bold text-sm"
                      />
                      <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-xs font-bold text-slate-400">
                        KM
                      </span>
                    </div>
                  </div>

                  {/* Real-time Calculation for Check-in */}
                  {confirmingType === 'checkin' && odometerKm && (
                    <div className="pt-1">
                      {(() => {
                        const startKm = getActiveStartKm();
                        const currentKm = Number(odometerKm);
                        if (startKm !== null && currentKm < startKm) {
                          return (
                            <div className="p-2 bg-red-50 text-red-700 border border-red-200 rounded-xl text-xs font-semibold flex items-center gap-1.5">
                              <Icon name="error" className="text-sm shrink-0" />
                              <span>KM Masuk ({currentKm.toLocaleString('id-ID')}) tidak boleh lebih kecil dari KM Berangkat ({startKm.toLocaleString('id-ID')})</span>
                            </div>
                          );
                        } else if (startKm !== null && currentKm >= startKm) {
                          const diff = currentKm - startKm;
                          return (
                            <div className="p-2 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold flex items-center justify-between">
                              <span className="flex items-center gap-1">
                                <Icon name="check_circle" className="text-sm text-emerald-600" />
                                Estimasi Jarak Tempuh:
                              </span>
                              <span className="text-emerald-700 text-sm font-extrabold">{diff.toLocaleString('id-ID')} km</span>
                            </div>
                          );
                        }
                        return null;
                      })()}
                    </div>
                  )}
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
                    disabled={
                      actionLoading || 
                      !odometerKm.trim() || 
                      (confirmingType === 'checkin' && getActiveStartKm() !== null && Number(odometerKm) < (getActiveStartKm() || 0))
                    }
                    className={`flex-1 py-3 text-white rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                      confirmingType === 'checkout' 
                        ? 'bg-amber-600 hover:bg-amber-700' 
                        : 'bg-emerald-600 hover:bg-emerald-700'
                    }`}
                  >
                    {actionLoading ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Icon name="done_all" className="text-base" />
                        <span>{confirmingType === 'checkout' ? 'Berangkatkan' : 'Konfirmasi Masuk'}</span>
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
