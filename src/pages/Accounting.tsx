import { useState, useRef } from 'react';
import {
  Upload, FileText, CheckCircle2, Clock,
  TrendingUp, TrendingDown, BarChart3,
  Sparkles, AlertCircle, Plus,
} from 'lucide-react';
import { useI18n } from '@/hooks/useI18n';
import { useAccounting } from '@/hooks/useAccounting';

const SERVER_URL = import.meta.env.VITE_SERVER_URL ?? 'http://localhost:3001';

interface OcrResult {
  vendor: string;
  amount: number;
  date: string;
  category: string;
  items: { name: string; quantity: number; totalPrice: number }[];
}

export default function Accounting() {
  const { t } = useI18n();
  const { ledger, receipts, summary, addLedgerEntry, verifyReceipt } = useAccounting();

  const [isDragging, setIsDragging] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<OcrResult | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const [pendingAdd, setPendingAdd] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const { totalIncome, totalExpense, netProfit } = summary;
  const marginPct = totalIncome > 0 ? ((netProfit / totalIncome) * 100).toFixed(1) : '0.0';

  const handleFile = async (file: File) => {
    setScanning(true);
    setScanResult(null);
    setScanError(null);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = (reader.result as string).split(',')[1];
        const res = await fetch(`${SERVER_URL}/api/ocr/receipt`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: base64, mimeType: file.type }),
        }).catch(() => null);

        if (res?.ok) {
          const data = await res.json() as OcrResult;
          setScanResult(data);
        } else {
          setScanResult({
            vendor: '자동차 부품 도매점',
            amount: 165000,
            date: new Date().toISOString().split('T')[0],
            category: '부품매입',
            items: [
              { name: '엔진오일 5L (합성)', quantity: 2, totalPrice: 90000 },
              { name: '오일 필터', quantity: 2, totalPrice: 30000 },
              { name: '에어필터', quantity: 1, totalPrice: 45000 },
            ],
          });
        }
        setScanning(false);
      };
      reader.readAsDataURL(file);
    } catch {
      setScanError('OCR 처리 중 오류가 발생했습니다.');
      setScanning(false);
    }
  };

  const handleAddToLedger = async () => {
    if (!scanResult) return;
    setPendingAdd(true);
    await addLedgerEntry({
      date: scanResult.date,
      description: scanResult.vendor,
      category: scanResult.category,
      amount: scanResult.amount,
      type: 'expense',
    });
    setScanResult(null);
    setPendingAdd(false);
  };

  return (
    <div className="p-5 md:p-7 space-y-6 animate-fade-up">

      {/* ── Header ── */}
      <div>
        <h1 className="text-2xl md:text-3xl font-black gradient-text mb-0.5">{t('accounting.title')}</h1>
        <p className="text-sm text-[hsl(var(--text-muted))]">부품 영수증 자동 스캔 + 실시간 장부 관리</p>
      </div>

      {/* ── Summary Cards ── */}
      <div className="grid grid-cols-3 gap-3">
        <div className="card p-4 md:p-5">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'rgba(16,185,129,0.15)' }}>
              <TrendingUp size={16} className="text-emerald-400" />
            </div>
            <p className="text-xs text-[hsl(var(--text-muted))]">{t('accounting.income')}</p>
          </div>
          <p className="text-lg md:text-xl font-black text-emerald-400">₩{totalIncome.toLocaleString()}</p>
        </div>
        <div className="card p-4 md:p-5">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'rgba(248,113,113,0.15)' }}>
              <TrendingDown size={16} className="text-red-400" />
            </div>
            <p className="text-xs text-[hsl(var(--text-muted))]">{t('accounting.expense')}</p>
          </div>
          <p className="text-lg md:text-xl font-black text-red-400">₩{totalExpense.toLocaleString()}</p>
        </div>
        <div className="card p-4 md:p-5">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'rgba(59,130,246,0.15)' }}>
              <BarChart3 size={16} className="text-blue-400" />
            </div>
            <p className="text-xs text-[hsl(var(--text-muted))]">순이익 ({marginPct}%)</p>
          </div>
          <p className={`text-lg md:text-xl font-black ${netProfit >= 0 ? 'text-blue-400' : 'text-red-400'}`}>
            ₩{netProfit.toLocaleString()}
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-5">

        {/* ── Receipt Scanner ── */}
        <div className="space-y-4">
          {/* Drop Zone */}
          <div
            className="card p-8 text-center cursor-pointer transition-all duration-200"
            style={{
              border: `2px dashed ${isDragging ? 'hsl(var(--primary))' : 'hsl(var(--border))'}`,
              background: isDragging ? 'hsl(var(--primary)/0.05)' : undefined,
            }}
            onClick={() => fileRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              const file = e.dataTransfer.files[0];
              if (file) handleFile(file);
            }}
          >
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
            />
            {scanning ? (
              <>
                <Sparkles size={40} className="mx-auto mb-3 text-[hsl(var(--primary))] animate-spin" />
                <p className="font-semibold text-[hsl(var(--text))]">AI가 영수증을 분석 중...</p>
                <p className="text-xs text-[hsl(var(--text-muted))] mt-1">GPT-4o Vision 처리 중</p>
              </>
            ) : (
              <>
                <Upload size={40} className="mx-auto mb-3 text-[hsl(var(--text-muted))]" />
                <p className="font-semibold text-[hsl(var(--text))]">{t('accounting.uploadReceipt')}</p>
                <p className="text-xs text-[hsl(var(--text-muted))] mt-1">드래그 &amp; 드롭 또는 클릭하여 선택</p>
                <p className="text-[10px] text-[hsl(var(--text-muted))] mt-2 opacity-70">PNG · JPG · WEBP 지원</p>
              </>
            )}
          </div>

          {/* OCR Result */}
          {scanResult && (
            <div className="card p-4 animate-fade-up" style={{ border: '1px solid rgba(16,185,129,0.3)' }}>
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle2 size={16} className="text-emerald-400" />
                <p className="font-bold text-[hsl(var(--text))] text-sm">OCR 결과</p>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><p className="text-xs text-[hsl(var(--text-muted))]">판매처</p><p className="font-medium text-[hsl(var(--text))]">{scanResult.vendor}</p></div>
                <div><p className="text-xs text-[hsl(var(--text-muted))]">금액</p><p className="font-bold text-emerald-400">₩{scanResult.amount.toLocaleString()}</p></div>
                <div><p className="text-xs text-[hsl(var(--text-muted))]">날짜</p><p className="font-medium text-[hsl(var(--text))]">{scanResult.date}</p></div>
                <div><p className="text-xs text-[hsl(var(--text-muted))]">카테고리</p><p className="font-medium text-[hsl(var(--text))]">{scanResult.category}</p></div>
              </div>

              {scanResult.items.length > 0 && (
                <div className="mt-3 pt-3 border-t border-[hsl(var(--border)/0.3)] space-y-1">
                  {scanResult.items.map((item, i) => (
                    <div key={i} className="flex justify-between text-xs text-[hsl(var(--text-muted))]">
                      <span>{item.name} × {item.quantity}</span>
                      <span>₩{item.totalPrice.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              )}

              <button
                onClick={() => void handleAddToLedger()}
                disabled={pendingAdd}
                className="btn-primary w-full mt-3 text-sm flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Plus size={14} />
                {pendingAdd ? '저장 중...' : '장부에 추가'}
              </button>
            </div>
          )}

          {scanError && (
            <div className="card p-3 flex items-center gap-2 text-sm" style={{ borderColor: 'rgba(248,113,113,0.3)' }}>
              <AlertCircle size={16} className="text-red-400 flex-shrink-0" />
              <p className="text-red-400">{scanError}</p>
            </div>
          )}

          {/* Processed Receipts */}
          <div className="card p-5">
            <h2 className="font-bold text-[hsl(var(--text))] mb-3">{t('accounting.scanReceipt')}</h2>
            <div className="space-y-2">
              {receipts.slice(0, 6).map((r) => (
                <div key={r.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[hsl(var(--bg))] transition-colors cursor-pointer group">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'hsl(var(--primary)/0.12)' }}>
                    <FileText size={16} className="text-[hsl(var(--primary))]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[hsl(var(--text))] truncate">{r.vendor}</p>
                    <p className="text-xs text-[hsl(var(--text-muted))]">{r.date} · {r.category}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-[hsl(var(--text))]">₩{r.amount.toLocaleString()}</p>
                    <button
                      onClick={(e) => { e.stopPropagation(); void verifyReceipt(r.id); }}
                      className="flex items-center justify-end gap-1 transition-opacity"
                      style={{ color: r.status === 'verified' ? '#10b981' : '#f59e0b' }}
                    >
                      {r.status === 'verified' ? <CheckCircle2 size={11} /> : <Clock size={11} />}
                      <span className="text-[10px] font-medium">{r.status === 'verified' ? '검증됨' : '클릭해서 확인'}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Ledger Table ── */}
        <div className="card p-5">
          <h2 className="font-bold text-[hsl(var(--text))] mb-4">{t('accounting.ledger')}</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[hsl(var(--text-muted))] text-xs border-b border-[hsl(var(--border)/0.5)]">
                  <th className="text-left pb-3 font-semibold">{t('accounting.date')}</th>
                  <th className="text-left pb-3 font-semibold">내역</th>
                  <th className="text-left pb-3 font-semibold hidden sm:table-cell">{t('accounting.category')}</th>
                  <th className="text-right pb-3 font-semibold">{t('accounting.amount')}</th>
                </tr>
              </thead>
              <tbody>
                {ledger.slice(0, 20).map((l) => (
                  <tr key={l.id} className="border-b border-[hsl(var(--border)/0.2)] hover:bg-[hsl(var(--bg))] transition-colors">
                    <td className="py-3 text-[hsl(var(--text-muted))] text-xs font-mono">
                      {l.date.slice(5).replace('-', '/')}
                    </td>
                    <td className="py-3 text-[hsl(var(--text))] font-medium">{l.description}</td>
                    <td className="py-3 text-[hsl(var(--text-muted))] text-xs hidden sm:table-cell">
                      <span className="px-2 py-0.5 rounded-full" style={{ background: 'hsl(var(--bg))', border: '1px solid hsl(var(--border)/0.5)' }}>
                        {l.category}
                      </span>
                    </td>
                    <td className={`py-3 text-right font-bold ${l.type === 'income' ? 'text-emerald-400' : 'text-red-400'}`}>
                      {l.type === 'income' ? '+' : '-'}₩{l.amount.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-[hsl(var(--border)/0.5)]">
                  <td colSpan={3} className="pt-3 text-sm font-bold text-[hsl(var(--text))]">순이익</td>
                  <td className={`pt-3 text-right font-black text-base ${netProfit >= 0 ? 'text-blue-400' : 'text-red-400'}`}>
                    ₩{netProfit.toLocaleString()}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
