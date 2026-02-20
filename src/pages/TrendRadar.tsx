import { useState } from 'react';
import { Lock, TrendingUp, ExternalLink, AlertTriangle, Crown, ChevronDown, ChevronUp, Star, ShieldAlert, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useTrends, type TrendProduct } from '@/hooks/useTrends';

// ── Helpers ──────────────────────────────────────────────────────────────────

function trendIcon(score: number) {
  if (score >= 90) return '☄️';
  if (score >= 70) return '🔥';
  if (score >= 50) return '✨';
  return '📊';
}

function trendLabel(score: number) {
  if (score >= 90) return '폭발적';
  if (score >= 70) return '급상승';
  if (score >= 50) return '관심 상승';
  return '관찰 중';
}

function scoreColor(score: number) {
  if (score >= 90) return 'from-rose-500 to-orange-500';
  if (score >= 70) return 'from-amber-500 to-yellow-500';
  if (score >= 50) return 'from-blue-500 to-cyan-500';
  return 'from-gray-400 to-gray-500';
}

function urgencyBg(score: number) {
  if (score >= 90) return 'bg-rose-500/10 border-rose-500/20 text-rose-400';
  if (score >= 70) return 'bg-amber-500/10 border-amber-500/20 text-amber-400';
  if (score >= 50) return 'bg-blue-500/10 border-blue-500/20 text-blue-400';
  return 'bg-gray-500/10 border-gray-500/20 text-gray-400';
}

// ── Trend Card ───────────────────────────────────────────────────────────────

function TrendCard({ product, index }: { product: TrendProduct; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const isLocked = product.locked;

  return (
    <div
      className={cn(
        'v0-glass rounded-2xl p-5 border transition-all duration-300 relative overflow-hidden group',
        isLocked
          ? 'border-[hsl(var(--border))/0.2] opacity-60'
          : product.warning
            ? 'border-amber-500/30 hover:border-amber-500/50'
            : 'border-[hsl(var(--border))/0.3] hover:border-[hsl(var(--primary))/0.4]',
      )}
      style={{ animationDelay: `${index * 80}ms` }}
    >
      {/* Subtle gradient glow on hover */}
      {!isLocked && (
        <div className={cn(
          'absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none',
          product.warning
            ? 'bg-gradient-to-br from-amber-500/5 to-transparent'
            : 'bg-gradient-to-br from-[hsl(var(--primary))/0.05] to-transparent'
        )} />
      )}

      {/* Locked overlay */}
      {isLocked && (
        <div className="absolute inset-0 z-10 backdrop-blur-sm bg-[hsl(var(--bg))/0.4] flex flex-col items-center justify-center gap-3 rounded-2xl">
          <div className="w-12 h-12 rounded-full bg-[hsl(var(--primary))/0.15] flex items-center justify-center">
            <Lock className="w-6 h-6 text-[hsl(var(--primary))]" />
          </div>
          <p className="text-base font-bold text-[hsl(var(--text))]">프리미엄 전용 콘텐츠</p>
          <p className="text-sm text-[hsl(var(--text-muted))]">구독하여 트렌드를 선점하세요</p>
        </div>
      )}

      <div className="relative z-0">
        {/* Header Row */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{product.imageEmoji}</span>
            <div>
              <h3 className="text-base font-bold text-[hsl(var(--text))] leading-tight">{product.name}</h3>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm px-2 py-0.5 rounded-full font-semibold bg-[hsl(var(--primary))/0.1] text-[hsl(var(--primary))] border border-[hsl(var(--primary))/0.2]">
                  {product.category}
                </span>
                <span className="text-sm text-[hsl(var(--text-muted))]">{product.updatedAt}</span>
              </div>
            </div>
          </div>

          {/* Trend Score Badge */}
          <div className="flex flex-col items-center">
            <span className="text-lg">{trendIcon(product.trendScore)}</span>
            <div className={cn('text-sm px-2 py-0.5 rounded-full font-bold border mt-1', urgencyBg(product.trendScore))}>
              {product.trendScore}점
            </div>
          </div>
        </div>

        {/* Trend Score Bar */}
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm text-[hsl(var(--text-muted))] uppercase tracking-wider font-semibold">트렌드 지수</span>
            <span className="text-sm font-bold text-[hsl(var(--text))]">{trendLabel(product.trendScore)}</span>
          </div>
          <div className="w-full h-2 bg-[hsl(var(--bg-card))] rounded-full overflow-hidden">
            <div
              className={cn('h-full rounded-full bg-gradient-to-r transition-all duration-1000', scoreColor(product.trendScore))}
              style={{ width: `${product.trendScore}%`, transitionDelay: `${index * 100}ms` }}
            />
          </div>
        </div>

        {/* Warning Banner */}
        {product.warning && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 mb-3">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <p className="text-sm text-amber-300 leading-relaxed">{product.warning}</p>
          </div>
        )}

        {/* Reason — "왜 뜨고 있나?" */}
        <div className="mb-3">
          <div className="flex items-center gap-1.5 mb-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-[hsl(var(--primary))]" />
            <span className="text-sm font-bold text-[hsl(var(--text))] uppercase tracking-wider">왜 뜨고 있나?</span>
          </div>
          <p className="text-sm text-[hsl(var(--text))/0.8] leading-relaxed">{product.reason}</p>
        </div>

        {/* Expandable Details */}
        {!isLocked && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-sm font-semibold text-[hsl(var(--primary))] hover:text-[hsl(var(--accent))] transition-colors"
          >
            {expanded ? '접기' : '수익 기회 & 상세 보기'}
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        )}

        {expanded && !isLocked && (
          <div className="mt-3 flex flex-col gap-2.5 animate-in slide-in-from-top-2 duration-300">
            {/* Source */}
            <div className="flex items-start gap-2">
              <ExternalLink className="w-3.5 h-3.5 text-[hsl(var(--text-muted))] shrink-0 mt-0.5" />
              <div>
                <span className="text-sm text-[hsl(var(--text-muted))] uppercase tracking-wider">출처</span>
                <p className="text-sm text-[hsl(var(--text))]">{product.source}</p>
              </div>
            </div>

            {/* Price */}
            <div className="flex items-start gap-2">
              <DollarSign className="w-3.5 h-3.5 text-[hsl(var(--text-muted))] shrink-0 mt-0.5" />
              <div>
                <span className="text-sm text-[hsl(var(--text-muted))] uppercase tracking-wider">가격 범위</span>
                <p className="text-sm font-semibold text-[hsl(var(--text))]">{product.priceRange}</p>
              </div>
            </div>

            {/* Recommendation */}
            <div className="flex items-start gap-2">
              <Star className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-sm text-[hsl(var(--text-muted))] uppercase tracking-wider">💰 수익 기회</span>
                <p className="text-sm text-emerald-400 font-medium leading-relaxed">{product.recommendation}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Subscription CTA ─────────────────────────────────────────────────────────

function SubscriptionCTA({ isPremium, onToggle }: { isPremium: boolean; onToggle: () => void }) {
  if (isPremium) {
    return (
      <div className="v0-glass rounded-2xl p-5 border border-emerald-500/20 relative overflow-hidden shrink-0">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent pointer-events-none" />
        <div className="relative flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shrink-0">
              <Crown className="w-6 h-6 text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-lg font-bold text-emerald-400">프리미엄 구독 활성화됨</p>
              <p className="text-base text-[hsl(var(--text-muted))]">모든 트렌드 인사이트를 확인할 수 있습니다</p>
            </div>
          </div>
          <button
            onClick={onToggle}
            className="text-sm px-4 py-2 rounded-lg bg-[hsl(var(--bg-card))] text-[hsl(var(--text-muted))] hover:text-[hsl(var(--text))] transition-colors shrink-0 whitespace-nowrap"
          >
            비구독 미리보기
          </button>
        </div>
      </div>
    );
  }


  return (
    <div className="v0-glass rounded-2xl p-6 border border-[hsl(var(--primary))/0.3] relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-[hsl(var(--primary))/0.08] via-transparent to-[hsl(var(--accent))/0.08] pointer-events-none" />
      <div className="relative text-center">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(var(--accent))] flex items-center justify-center shadow-xl mx-auto mb-4">
          <Crown className="w-8 h-8 text-white" />
        </div>
        <h3 className="text-lg font-black text-[hsl(var(--text))] mb-2">트렌드를 선점하세요</h3>
        <p className="text-base text-[hsl(var(--text-muted))] mb-4 max-w-md mx-auto">
          프리미엄 구독으로 정비 업계 바이럴 제품을 누구보다 빨리 파악하고,<br />
          매출 기회를 선점하세요. <span className="text-amber-400 font-semibold">두쫀쿠를 몰랐던 빵집이 되지 마세요.</span>
        </p>
        <div className="flex items-center justify-center gap-4 mb-4">
          <div className="text-center">
            <p className="text-2xl font-black text-[hsl(var(--text))]">₩29,900</p>
            <p className="text-sm text-[hsl(var(--text-muted))]">/월</p>
          </div>
          <div className="w-px h-10 bg-[hsl(var(--border))/0.3]" />
          <div className="flex flex-col gap-1 text-left">
            <p className="text-sm text-[hsl(var(--text))]">✅ 주간 트렌드 리포트</p>
            <p className="text-sm text-[hsl(var(--text))]">✅ 수익 기회 분석</p>
            <p className="text-sm text-[hsl(var(--text))]">✅ 과장광고 경고</p>
          </div>
        </div>
        <Button
          onClick={onToggle}
          className="gap-2 bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--accent))] hover:opacity-90 shadow-lg text-white font-bold px-8"
        >
          <Crown className="w-4 h-4" /> 프리미엄 구독 시작
        </Button>
      </div>
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────

export default function TrendRadar() {
  const { trends, isPremium, togglePremium, totalCount } = useTrends();

  return (
    <div className="p-4 lg:p-6 flex flex-col gap-5 h-screen overflow-y-auto pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl lg:text-2xl font-bold text-[hsl(var(--text))] tracking-tight">
              🔥 Trend Radar
            </h2>
            <span className="text-sm px-2.5 py-1 rounded-full font-bold bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--accent))] text-white shadow-sm">
              PRO
            </span>
          </div>
          <p className="text-base text-[hsl(var(--text-muted))] mt-0.5">
            정비 업계 바이럴 제품 · 트렌드를 선점하여 매출 기회를 잡으세요
          </p>
        </div>
        <div className="text-right hidden sm:block">
          <p className="text-sm text-[hsl(var(--text-muted))]">추적 중인 트렌드</p>
          <p className="text-2xl font-black text-[hsl(var(--text))]">{totalCount}<span className="text-base font-normal text-[hsl(var(--text-muted))]">개</span></p>
        </div>
      </div>

      {/* Info Banner */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-[hsl(var(--bg-elevated))/0.5] border border-[hsl(var(--border))/0.2]">
        <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-[hsl(var(--text))]">BizPilot 트렌드 품질 보증</p>
          <p className="text-sm text-[hsl(var(--text-muted))] leading-relaxed mt-0.5">
            쇼츠·릴스의 저가 과장광고에 유혹되지 마세요. BizPilot은 <span className="text-amber-400 font-semibold">검증된 출처</span>(유튜브 채널, 공식 판매 데이터, 정비사 커뮤니티)만을 기반으로 트렌드를 분석합니다.
            미인증·미검증 제품에는 <span className="text-amber-400 font-semibold">⚠️ 경고</span>가 표시됩니다.
          </p>
        </div>
      </div>

      {/* Subscription CTA */}
      <SubscriptionCTA isPremium={isPremium} onToggle={togglePremium} />

      {/* Trend Cards Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {trends.map((product, i) => (
          <TrendCard key={product.id} product={product} index={i} />
        ))}
      </div>
    </div>
  );
}
