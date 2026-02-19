CREATE TABLE IF NOT EXISTS parts (
  id BIGSERIAL PRIMARY KEY,
  part_number TEXT NOT NULL UNIQUE,
  name_ko TEXT NOT NULL,
  name_en TEXT,
  description TEXT,
  price_parts INTEGER NOT NULL DEFAULT 0,
  price_labor INTEGER DEFAULT 0,
  compatible_models TEXT[] DEFAULT '{}',
  category TEXT DEFAULT 'general',
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  embedding vector(1536) -- Optional: for semantic search later
);

-- Index for faster search
CREATE INDEX IF NOT EXISTS parts_name_ko_idx ON parts USING gin(to_tsvector('korean', name_ko));
CREATE INDEX IF NOT EXISTS parts_part_number_idx ON parts (part_number);

-- Seed Data (Example)
INSERT INTO parts (part_number, name_ko, name_en, description, price_parts, price_labor, compatible_models, category)
VALUES
('58101-3ZA00', '불스원 프리미엄 에어컨 필터', 'Cabin Air Filter', '미세먼지 제거 및 향균 기능 포함', 15000, 5000, ARRAY['Avante', 'Sonata', 'Grandeur'], 'filter'),
('26300-35505', '오일 필터', 'Oil Filter', '엔진오일 교체 시 필수 교환 품목', 6000, 15000, ARRAY['Morning', 'Ray', 'Avante', 'Sonata'], 'filter'),
('58101-C1A00', '브레이크 패드 (전륜)', 'Front Brake Pad', '제동 성능이 우수한 순정 패드', 45000, 30000, ARRAY['Sonata LF', 'Tucson TL'], 'brake'),
('97133-C1000', '히터 블로어 모터', 'Blower Motor', '공조기 소음 발생 시 교체 권장', 85000, 40000, ARRAY['Sonata LF'], 'hvac'),
('18846-10060', '점화 플러그 (이리듐)', 'Spark Plug', '10만km 교체 주기 권장', 8000, 20000, ARRAY['Grandeur HG', 'K7'], 'engine'),
('37210-2G000', '배터리 터미널 (+)단자', 'Battery Terminal Positive', '부식 시 시동 불량 발생 가능', 12000, 10000, ARRAY['YF Sonata', 'K5'], 'electrical'),
('98350-3N000', '와이퍼 블레이드 (운전석)', 'Wiper Blade (Driver)', '650mm 운전석 전용', 9500, 0, ARRAY['Equus', 'Genesis'], 'wiper')
ON CONFLICT (part_number) DO NOTHING;
