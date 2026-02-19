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
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [mode, setMode] = useState<'camera' | 'search' | 'vin'>('camera');
  const [query, setQuery] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<{ parts: Part[], analysis?: any } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Camera Setup
  useEffect(() => {
    if (mode === 'camera') {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [mode]);

  const startCamera = async () => {
    try {
      const constraints = { 
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } } 
      };
      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error('Camera Error:', err);
      setError('카메라를 실행할 수 없습니다. 권한을 확인해주세요.');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

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
    <div className="h-full flex flex-col bg-gray-900 text-white relative overflow-hidden">
      {/* Header Tabs */}
      <div className="flex justify-around p-4 bg-gray-900 z-10">
        <button 
          onClick={() => setMode('camera')}
          className={`px-4 py-2 ${mode === 'camera' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400'}`}
        >
          <Camera className="w-6 h-6 mx-auto mb-1" />
          <span className="text-xs">AR Scan</span>
        </button>
        <button 
          onClick={() => setMode('vin')} 
          className={`px-4 py-2 ${mode === 'vin' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400'}`}
        >
          <ScanLine className="w-6 h-6 mx-auto mb-1" />
          <span className="text-xs">VIN</span>
        </button>
        <button 
          onClick={() => setMode('search')}
          className={`px-4 py-2 ${mode === 'search' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400'}`}
        >
          <Search className="w-6 h-6 mx-auto mb-1" />
          <span className="text-xs">Search</span>
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
              className="w-full h-full object-cover"
            />
            <canvas ref={canvasRef} className="hidden" />
            
            {/* Overlay UI */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="w-64 h-64 border-2 border-white/50 rounded-lg relative">
                <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-blue-500"></div>
                <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-blue-500"></div>
                <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-blue-500"></div>
                <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-blue-500"></div>
              </div>
              <p className="absolute bottom-32 text-white/80 text-sm bg-black/50 px-3 py-1 rounded-full">
                부품을 사각형 안에 맞춰주세요
              </p>
            </div>

            {/* Capture Button */}
            <div className="absolute bottom-8 w-full flex justify-center z-20">
              <button 
                onClick={captureAndAnalyze}
                disabled={isAnalyzing}
                className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center bg-white/20 active:bg-white/50 transition"
              >
                {isAnalyzing ? <Loader2 className="w-8 h-8 animate-spin" /> : <div className="w-16 h-16 bg-white rounded-full"></div>}
              </button>
            </div>
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
           <div className="p-4 flex flex-col items-center justify-center h-full text-center">
             <ScanLine className="w-16 h-16 text-gray-600 mb-4" />
             <p className="text-gray-400 mb-4">차대번호(VIN) 스캔 기능 준비 중...</p>
             <Button variant="outline" onClick={() => setMode('search')}>검색으로 이동</Button>
           </div>
        )}
      </div>

      {error && (
        <div className="absolute bottom-20 left-4 right-4 bg-red-900/90 text-white p-3 rounded-lg flex justify-between items-center animate-in fade-in slide-in-from-bottom-2">
          <span className="text-sm">{error}</span>
          <button onClick={() => setError(null)}><X className="w-4 h-4" /></button>
        </div>
      )}
    </div>
  );
}
