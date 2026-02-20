import React, { useRef, useState, useEffect } from 'react';
import { Camera, Search, Mic, ScanLine, X, Loader2, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001';

interface Part {
  id: number;
  part_number: string;
  name_ko: string;
  price_parts: number;
  price_labor?: number;
  compatible_models?: string[];
  description?: string;
}

export default function PartsScanner() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [, setStream] = useState<MediaStream | null>(null);
  const [mode, setMode] = useState<'camera' | 'search' | 'vin'>('camera');
  const [query, setQuery] = useState('');
  const [vinInput, setVinInput] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<{ parts: Part[], analysis?: any } | null>(null);
  const [vinResult, setVinResult] = useState<{ car_info: { make: string; model: string; year: string; full_name: string }; compatible_parts: Part[] } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [needsTap, setNeedsTap] = useState(false);

  // Camera Setup
  useEffect(() => {
    let isActive = true;
    let playInterval: number;
    let fallbackTimeout: number;

    const initCamera = async () => {
      try {
        let mediaStream: MediaStream;
        try {
          mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        } catch (e) {
          console.warn("Back camera failed, trying any available camera...", e);
          mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
        }
        
        if (!isActive) {
          mediaStream.getTracks().forEach(track => track.stop());
          return;
        }

        setStream(mediaStream);

        if (videoRef.current) {
          const video = videoRef.current;
          video.srcObject = mediaStream;
          video.setAttribute('autoplay', '');
          video.setAttribute('muted', '');
          video.setAttribute('playsinline', '');
          video.muted = true;

          const attemptPlay = async () => {
            try {
              if (video.paused) {
                await video.play();
              }
              if (video.style) {
                video.style.transform = 'scale(1.0001)';
                fallbackTimeout = window.setTimeout(() => {
                  if (video.style) video.style.transform = 'scale(1)';
                }, 50);
              }
            } catch (err: any) {
              console.error('Autoplay prevented:', err);
              if (err?.name === 'NotAllowedError' || err?.message?.includes('allowed')) {
                setNeedsTap(true);
              }
            }
          };

          video.onloadedmetadata = attemptPlay;
          
          playInterval = window.setInterval(() => {
            if (!video.paused) {
              clearInterval(playInterval);
            } else {
              attemptPlay();
            }
          }, 500);
        }
      } catch (err: any) {
        console.error('Camera Error:', err);
        setError(`카메라 오류: ${err?.message || '권한을 설정해주세요.'}`);
      }
    };

    if (mode === 'camera') {
      initCamera();
    }

    return () => {
      isActive = false;
      setStream(prev => {
        if (prev) prev.getTracks().forEach(track => track.stop());
        return null;
      });
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      if (playInterval) window.clearInterval(playInterval);
      if (fallbackTimeout) window.clearTimeout(fallbackTimeout);
    };
  }, [mode]);

  // Capture & Analyze
  const captureAndAnalyze = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    setIsAnalyzing(true);
    setError(null);

    try {
      // Draw video frame to canvas
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Get base64
      const imageBase64 = canvas.toDataURL('image/jpeg', 0.8);

      // Call API
      const res = await fetch(`${SERVER_URL}/api/parts/analyze-image`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64 })
      });
      
      if (!res.ok) throw new Error('Analysis failed');
      
      const data = await res.json();
      setResult({ parts: data.results || [], analysis: data.analysis });
      setMode('search'); // Switch to view results
      
    } catch (err) {
      console.error(err);
      setError('부품 분석에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Text/Voice Search
  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!query.trim()) return;
    
    setIsAnalyzing(true);
    setResult(null);
    try {
      const res = await fetch(`${SERVER_URL}/api/parts/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setResult({ parts: data.results || [], analysis: data.analysis });
    } catch (err) {
      setError('검색 중 오류가 발생했습니다.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // VIN Search
  const handleVinSearch = async () => {
    const vin = vinInput.trim().toUpperCase();
    if (vin.length !== 17) {
      setError('VIN은 반드시 17자리여야 합니다.');
      return;
    }
    setIsAnalyzing(true);
    setVinResult(null);
    setError(null);
    try {
      const res = await fetch(`${SERVER_URL}/api/parts/vin?vin=${encodeURIComponent(vin)}`);
      if (!res.ok) throw new Error('VIN decode failed');
      const data = await res.json();
      if (data.error) {
        setError('차량 정보를 찾을 수 없습니다. VIN을 다시 확인해주세요.');
      } else {
        setVinResult(data);
      }
    } catch {
      setError('VIN 조회 중 오류가 발생했습니다.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Voice Input (Web Speech API)
  const startListening = () => {
    if (!('webkitSpeechRecognition' in window)) {
      alert('이 브라우저는 음성 인식을 지원하지 않습니다. (Chrome 권장)');
      return;
    }
    const recognition = new (window as any).webkitSpeechRecognition();
    recognition.lang = 'ko-KR';
    recognition.start();
    recognition.onresult = (event: any) => {
      const text = event.results[0][0].transcript;
      setQuery(text);
      handleSearch(); // Auto search on voice end
    };
  };

  return (
    <div className="absolute inset-0 flex flex-col bg-black text-white overflow-hidden">
      {/* Premium Glassmorphic Header Tabs */}
      <div className="flex justify-around p-4 z-20 bg-black/60 backdrop-blur-xl border-b border-white/10">
        <button 
          onClick={() => setMode('camera')}
          className={`flex-1 flex flex-col items-center py-2 transition-all duration-300 ${mode === 'camera' ? 'text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.6)]' : 'text-gray-500 hover:text-gray-300'}`}
        >
          <Camera className="w-6 h-6 mb-1" />
          <span className="text-[11px] font-semibold tracking-wider uppercase">AR Scan</span>
          {mode === 'camera' && <div className="absolute bottom-0 w-12 h-0.5 bg-cyan-400 rounded-full shadow-[0_0_8px_rgba(34,211,238,0.8)]" />}
        </button>
        <button 
          onClick={() => setMode('vin')} 
          className={`flex-1 flex flex-col items-center py-2 transition-all duration-300 ${mode === 'vin' ? 'text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.6)]' : 'text-gray-500 hover:text-gray-300'}`}
        >
          <ScanLine className="w-6 h-6 mb-1" />
          <span className="text-[11px] font-semibold tracking-wider uppercase">VIN</span>
          {mode === 'vin' && <div className="absolute bottom-0 w-12 h-0.5 bg-cyan-400 rounded-full shadow-[0_0_8px_rgba(34,211,238,0.8)]" />}
        </button>
        <button 
          onClick={() => setMode('search')}
          className={`flex-1 flex flex-col items-center py-2 transition-all duration-300 ${mode === 'search' ? 'text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.6)]' : 'text-gray-500 hover:text-gray-300'}`}
        >
          <Search className="w-6 h-6 mb-1" />
          <span className="text-[11px] font-semibold tracking-wider uppercase">Search</span>
          {mode === 'search' && <div className="absolute bottom-0 w-12 h-0.5 bg-cyan-400 rounded-full shadow-[0_0_8px_rgba(34,211,238,0.8)]" />}
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 relative">
        {mode === 'camera' && (
          <div className="absolute inset-0 bg-black">
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              muted
              className="w-full h-full object-cover"
            />
            <canvas ref={canvasRef} className="hidden" />
            
            {/* Premium Overlay: Sci-fi HUD Style */}
            <div className="absolute inset-0 flex flex-col z-10 pb-20">
              {/* Subtle Scanning Grid/Lines Background Overlay */}
              <div className="absolute inset-0 pointer-events-none opacity-20 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:40px_40px]"></div>

              {/* Top spacer */}
              <div className="flex-[1] min-h-0" />

              {/* Center Frame Container */}
              <div className="flex flex-col items-center shrink-0 w-full px-8 relative">
                {/* HUD Viewfinder */}
                <div className="w-full aspect-square max-w-[320px] rounded-2xl relative pointer-events-none border border-white/10 shadow-[inset_0_0_50px_rgba(0,0,0,0.5)] bg-black/10 backdrop-blur-[2px]">
                  {/* Neon Cyan Corner Brackets */}
                  <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-cyan-400 rounded-tl-xl drop-shadow-[0_0_6px_rgba(34,211,238,0.8)] transition-all duration-700"></div>
                  <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-cyan-400 rounded-tr-xl drop-shadow-[0_0_6px_rgba(34,211,238,0.8)] transition-all duration-700"></div>
                  <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-cyan-400 rounded-bl-xl drop-shadow-[0_0_6px_rgba(34,211,238,0.8)] transition-all duration-700"></div>
                  <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-cyan-400 rounded-br-xl drop-shadow-[0_0_6px_rgba(34,211,238,0.8)] transition-all duration-700"></div>
                  
                  {/* Subtle center crosshair */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-30">
                    <div className="w-6 h-px bg-cyan-400"></div>
                    <div className="absolute h-6 w-px bg-cyan-400"></div>
                  </div>
                </div>
                
                {/* Helper text - Glassmorphic Pill */}
                <p className="mt-6 text-white text-sm font-medium tracking-wide bg-black/40 backdrop-blur-md border border-white/20 px-5 py-2.5 rounded-full pointer-events-none shadow-[0_4px_12px_rgba(0,0,0,0.3)]">
                  부품을 사각형 안에 맞춰주세요
                </p>
              </div>

              {/* Bottom container: Premium glowing capture button */}
              <div className="flex-[1] min-h-0 flex items-center justify-center relative">
                <button 
                  onClick={captureAndAnalyze}
                  disabled={isAnalyzing}
                  className="relative group w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 active:scale-95 disabled:opacity-50"
                  aria-label="Capture part"
                >
                  {/* Frosted Glass Outer Ring */}
                  <div className="absolute inset-x-0 inset-y-0 rounded-full border-[3px] border-white/80 bg-white/10 backdrop-blur-xl shadow-[0_0_15px_rgba(255,255,255,0.15)] group-hover:border-white transition-colors duration-300"></div>
                  
                  {isAnalyzing ? (
                    <Loader2 className="w-8 h-8 animate-spin text-red-500 relative z-10" />
                  ) : (
                    /* Glowing Inner Ruby */
                    <div className="w-14 h-14 bg-red-600 rounded-full relative z-10 transition-all duration-300 group-hover:bg-red-500 group-active:bg-red-700 shadow-[0_0_15px_rgba(220,38,38,0.8)] inset-shadow-sm"></div>
                  )}
                </button>
              </div>
            </div>

            {/* Tap to Start Overlay (for strict mobile autoplay block) */}
            {needsTap && (
              <div 
                className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm"
                onClick={() => {
                  videoRef.current?.play().catch(() => {});
                  setNeedsTap(false);
                }}
              >
                <Camera className="w-16 h-16 text-blue-400 mb-4 animate-bounce" />
                <p className="text-xl font-bold text-white mb-2">화면을 터치해주세요</p>
                <p className="text-sm text-gray-400 text-center px-6">
                  브라우저 정책에 의해 카메라 화면을<br/>표시하려면 터치가 필요합니다.
                </p>
              </div>
            )}
          </div>
        )}

        {mode === 'search' && (
          <div className="p-4 h-full overflow-y-auto">
            <div className="flex gap-2 mb-6">
              <Input 
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="부품명, 품번 검색..."
                className="bg-gray-800 border-gray-700 text-white"
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
              <Button onClick={() => handleSearch()} className="bg-blue-600">
                <Search className="w-4 h-4" />
              </Button>
              <Button onClick={startListening} variant="outline" className="border-gray-700 text-gray-300">
                <Mic className="w-4 h-4" />
              </Button>
            </div>

            {isAnalyzing && (
              <div className="text-center py-10">
                <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-500 mb-2" />
                <p className="text-gray-400">분석 중...</p>
              </div>
            )}

            {result && (
              <div className="space-y-4">
                {result.analysis && (
                  <div className="bg-blue-900/30 border border-blue-800 p-4 rounded-lg">
                    <h3 className="text-blue-400 font-semibold mb-1 flex items-center gap-2">
                       <Info className="w-4 h-4" /> AI 분석
                    </h3>
                    <p className="text-sm text-gray-300">
                      {result.analysis.part_name_ko || result.analysis.description || result.analysis}
                    </p>
                  </div>
                )}

                <h3 className="text-lg font-semibold mt-4">검색 결과 ({result.parts.length})</h3>
                {result.parts.map(part => (
                  <div key={part.id} className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-bold text-white">{part.name_ko}</h4>
                        <p className="text-sm text-gray-400">{part.part_number}</p>
                      </div>
                      <span className="bg-green-900/50 text-green-400 text-xs px-2 py-1 rounded">
                        재고 있음
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm mt-3">
                      <div>
                        <span className="text-gray-500 block">부품가</span>
                        <span className="text-white font-medium">{part.price_parts.toLocaleString()}원</span>
                      </div>
                      <div>
                        <span className="text-gray-500 block">예상 공임</span>
                        <span className="text-white font-medium">{part.price_labor?.toLocaleString()}원</span>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-gray-700 flex justify-between items-center">
                      <p className="text-xs text-gray-500 truncate max-w-[60%]">
                        {part.compatible_models?.join(', ')}
                      </p>
                      <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                        발주 담기
                      </Button>
                    </div>
                  </div>
                ))}
                
                {result.parts.length === 0 && !isAnalyzing && (
                  <p className="text-center text-gray-500 py-10">검색 결과가 없습니다.</p>
                )}
              </div>
            )}
          </div>
        )}
        
        {mode === 'vin' && (
          <div className="p-4 h-full overflow-y-auto">
            {/* VIN Input */}
            <div className="mb-6">
              <p className="text-gray-400 text-sm mb-3">차대번호(VIN) 17자리를 입력하면 차량 정보와 호환 부품을 조회합니다.</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={vinInput}
                  maxLength={17}
                  onChange={(e) => setVinInput(e.target.value.toUpperCase().replace(/[^A-HJ-NPR-Z0-9]/g, ''))}
                  onKeyDown={(e) => e.key === 'Enter' && handleVinSearch()}
                  placeholder="예: 1HGBH41JXMN109186"
                  className="flex-1 bg-gray-800 border border-gray-700 text-white rounded-md px-3 py-2 text-sm font-mono tracking-widest focus:outline-none focus:border-blue-500"
                />
                <Button
                  onClick={handleVinSearch}
                  disabled={isAnalyzing || vinInput.length !== 17}
                  className="bg-blue-600 hover:bg-blue-700 disabled:opacity-40"
                >
                  {isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                </Button>
              </div>
              {/* Character count */}
              <div className="flex justify-between mt-1">
                <span className="text-xs text-gray-600">O, I, Q 제외 영문/숫자만 입력</span>
                <span className={`text-xs font-mono ${vinInput.length === 17 ? 'text-green-400' : 'text-gray-500'}`}>
                  {vinInput.length}/17
                </span>
              </div>
            </div>

            {/* Loading */}
            {isAnalyzing && (
              <div className="text-center py-10">
                <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-500 mb-2" />
                <p className="text-gray-400 text-sm">NHTSA 데이터베이스 조회 중...</p>
              </div>
            )}

            {/* VIN Result */}
            {vinResult && (
              <div className="space-y-4">
                {/* Car Info Card */}
                <div className="bg-blue-900/30 border border-blue-700 p-4 rounded-lg">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-blue-600/30 flex items-center justify-center">
                      <ScanLine className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-lg">{vinResult.car_info.full_name}</h3>
                      <p className="text-xs text-gray-400">VIN: {vinInput}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-gray-800/50 rounded p-2">
                      <p className="text-xs text-gray-500">제조사</p>
                      <p className="text-sm font-semibold text-white">{vinResult.car_info.make}</p>
                    </div>
                    <div className="bg-gray-800/50 rounded p-2">
                      <p className="text-xs text-gray-500">모델</p>
                      <p className="text-sm font-semibold text-white">{vinResult.car_info.model}</p>
                    </div>
                    <div className="bg-gray-800/50 rounded p-2">
                      <p className="text-xs text-gray-500">연식</p>
                      <p className="text-sm font-semibold text-white">{vinResult.car_info.year}</p>
                    </div>
                  </div>
                </div>

                {/* Compatible Parts */}
                <h3 className="text-base font-semibold text-gray-300">
                  호환 부품 ({vinResult.compatible_parts.length}종)
                </h3>
                {vinResult.compatible_parts.length === 0 ? (
                  <p className="text-center text-gray-500 py-6 text-sm">DB에 등록된 호환 부품이 없습니다.</p>
                ) : (
                  vinResult.compatible_parts.map(part => (
                    <div key={part.id} className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-bold text-white">{part.name_ko}</h4>
                          <p className="text-xs text-gray-500 font-mono">{part.part_number}</p>
                        </div>
                        <span className="text-xs bg-green-900/50 text-green-400 px-2 py-0.5 rounded">재고 있음</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm mt-2">
                        <div>
                          <span className="text-gray-500 block text-xs">부품가</span>
                          <span className="text-white font-medium">{part.price_parts.toLocaleString()}원</span>
                        </div>
                        <div>
                          <span className="text-gray-500 block text-xs">예상 공임</span>
                          <span className="text-white font-medium">{part.price_labor ? `${part.price_labor.toLocaleString()}원` : '-'}</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Empty state */}
            {!isAnalyzing && !vinResult && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <ScanLine className="w-16 h-16 text-gray-700 mb-4" />
                <p className="text-gray-500 text-sm">VIN을 입력하고 조회 버튼을 누르세요.</p>
                <p className="text-gray-600 text-xs mt-2">VIN은 차량 등록증 또는 앞유리(운전석 하단)에서 확인할 수 있습니다.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {error && (
        <div className="absolute top-20 left-4 right-4 bg-red-900/90 text-white p-3 rounded-lg flex justify-between items-center animate-in fade-in slide-in-from-top-2 z-50">
          <span className="text-sm">{error}</span>
          <button onClick={() => setError(null)}><X className="w-4 h-4" /></button>
        </div>
      )}
    </div>
  );
}
