import apiClient, { USE_MOCK, mockSuccess, mockDelay } from './client';

export interface MetricsRecord {
  id: number;
  weight: number | null;
  height: number | null;
  bmi: number | null;
  bodyFat: number | null;
  muscle: number | null;
  chest: number | null;
  waist: number | null;
  hip: number | null;
  arm: number | null;
  recordDate: string;
  note: string | null;
}

export interface TrendData {
  recordDate: string;
  weight: number | null;
  bodyFat: number | null;
  muscle: number | null;
}

// ===== 字段归一化：兼容后端返回的 camelCase 与 snake_case，缺失/非法数值统一转 null =====
const toNumber = (v: unknown): number | null => {
  const n = typeof v === 'string' ? Number(v) : v;
  return typeof n === 'number' && Number.isFinite(n) ? n : null;
};

const normalizeMetric = (raw: any): MetricsRecord => ({
  id: raw?.id ?? 0,
  weight: toNumber(raw?.weight),
  height: toNumber(raw?.height),
  bmi: toNumber(raw?.bmi),
  bodyFat: toNumber(raw?.bodyFat ?? raw?.body_fat),
  muscle: toNumber(raw?.muscle ?? raw?.muscle_mass ?? raw?.muscleMass),
  chest: toNumber(raw?.chest),
  waist: toNumber(raw?.waist),
  hip: toNumber(raw?.hip),
  arm: toNumber(raw?.arm),
  recordDate: raw?.recordDate ?? raw?.record_date ?? raw?.date ?? raw?.createdAt ?? raw?.created_at ?? '',
  note: raw?.note ?? null,
});

// ===== 生成 90 天的 Mock 数据 =====
const generateMockData = (): MetricsRecord[] => {
  const data: MetricsRecord[] = [];
  const startDate = new Date('2026-04-01');
  const endDate = new Date('2026-06-30');
  let id = 1;
  let weight = 74.5;
  let bodyFat = 20.5;
  let muscle = 30.5;

  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 3)) {
    const dateStr = d.toISOString().split('T')[0];
    weight += (Math.random() - 0.5) * 0.6;
    weight = Math.round(Math.max(68, Math.min(78, weight)) * 10) / 10;
    bodyFat += (Math.random() - 0.5) * 0.5;
    bodyFat = Math.round(Math.max(15, Math.min(25, bodyFat)) * 10) / 10;
    muscle += (Math.random() - 0.5) * 0.3;
    muscle = Math.round(Math.max(28, Math.min(34, muscle)) * 10) / 10;
    data.push({
      id: id++,
      weight,
      height: 175,
      bmi: Math.round((weight / (1.75 * 1.75)) * 10) / 10,
      bodyFat,
      muscle,
      chest: Math.round(96 + Math.random() * 4),
      waist: Math.round(76 + Math.random() * 4),
      hip: Math.round(98 + Math.random() * 4),
      arm: Math.round(32 + Math.random() * 3),
      recordDate: dateStr,
      note: null,
    });
  }
  return data.sort((a, b) => new Date(b.recordDate).getTime() - new Date(a.recordDate).getTime());
};

let mockMetrics: MetricsRecord[] = generateMockData();
let nextId = mockMetrics.length + 1;

// ===== 1. 录入身体数据 =====
export const saveMetrics = async (data: Omit<MetricsRecord, 'id'>) => {
  // 字段名与后端 BodyMetrics 实体类保持一致
  const payload = {
    weight: data.weight,
    height: data.height,
    bmi: data.bmi,
    bodyFat: data.bodyFat,
    muscle: data.muscle,
    chest: data.chest,
    waist: data.waist,
    hip: data.hip,
    arm: data.arm,
    recordDate: data.recordDate,
    note: data.note,
  };
  if (USE_MOCK) {
    await mockDelay(500);
    const newRecord = { ...payload, id: nextId++ };
    mockMetrics = [newRecord, ...mockMetrics];
    return mockSuccess(newRecord);
  }
  return apiClient.post('/api/metrics', payload);
};

// ===== 2. 历史列表 =====
export const getMetricsList = async (): Promise<MetricsRecord[]> => {
  if (USE_MOCK) {
    await mockDelay(300);
    return [...mockMetrics];
  }
  const res = await apiClient.get('/api/metrics/list');
  // 后端可能返回纯数组，也可能返回分页格式 { records: [], total, size, current, pages }
  const list = Array.isArray(res) ? res : (res?.records ?? []);
  return list.map(normalizeMetric);
};

// ===== 3. 趋势数据 =====
type RangeType = '7days' | 'month' | '3months';
export const getMetricsTrend = async (range: RangeType = 'month'): Promise<TrendData[]> => {
  if (USE_MOCK) {
    await mockDelay(300);
    const today = new Date();
    const sorted = [...mockMetrics].sort(
      (a, b) => new Date(a.recordDate).getTime() - new Date(b.recordDate).getTime()
    );
    let filtered = sorted;
    if (range === '7days') {
      const cutoff = new Date(today);
      cutoff.setDate(today.getDate() - 7);
      filtered = sorted.filter(r => new Date(r.recordDate) >= cutoff);
    } else if (range === 'month') {
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
      filtered = sorted.filter(r => new Date(r.recordDate) >= monthStart);
    } else if (range === '3months') {
      const threeMonthsAgo = new Date(today);
      threeMonthsAgo.setMonth(today.getMonth() - 2);
      threeMonthsAgo.setDate(1);
      filtered = sorted.filter(r => new Date(r.recordDate) >= threeMonthsAgo);
    }
    if (filtered.length < 2 && sorted.length >= 2) {
      filtered = sorted.slice(-Math.min(sorted.length, 5));
    }
    return filtered.map(r => ({
      recordDate: r.recordDate,
      weight: r.weight,
      bodyFat: r.bodyFat,
      muscle: r.muscle,
    }));
  }
  const res = await apiClient.get(`/api/metrics/trend?range=${range}`);
  const list = Array.isArray(res) ? res : (res?.records ?? []);
  return list.map((r: any) => ({
    recordDate: r?.recordDate ?? r?.record_date ?? r?.date ?? r?.createdAt ?? r?.created_at ?? '',
    weight: toNumber(r?.weight),
    bodyFat: toNumber(r?.bodyFat ?? r?.body_fat),
    muscle: toNumber(r?.muscle ?? r?.muscle_mass ?? r?.muscleMass),
  }));
};

// ===== 4. 最新数据 =====
export const getLatestMetrics = async (): Promise<MetricsRecord | null> => {
  if (USE_MOCK) {
    await mockDelay(200);
    return mockMetrics.length > 0 ? { ...mockMetrics[0] } : null;
  }
  const res = await apiClient.get('/api/metrics/latest');
  return res ? normalizeMetric(res) : null;
};