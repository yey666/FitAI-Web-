import apiClient, { USE_MOCK, mockSuccess, mockDelay } from './client';

export interface MetricsRecord {
  id: number;
  weight: number;
  height: number;
  bodyFat: number;
  muscleMass: number;
  chest: number;
  waist: number;
  hip: number;
  arm: number;
  date: string;
}

export interface TrendData {
  date: string;
  weight: number;
  bodyFat: number;
  muscleMass: number;
}

// ===== 生成 90 天的 Mock 数据 =====
const generateMockData = (): MetricsRecord[] => {
  const data: MetricsRecord[] = [];
  const startDate = new Date('2026-04-01');
  const endDate = new Date('2026-06-30');
  let id = 1;
  let weight = 74.5;
  let bodyFat = 20.5;
  let muscleMass = 30.5;

  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 3)) {
    const dateStr = d.toISOString().split('T')[0];
    weight += (Math.random() - 0.5) * 0.6;
    weight = Math.round(Math.max(68, Math.min(78, weight)) * 10) / 10;
    bodyFat += (Math.random() - 0.5) * 0.5;
    bodyFat = Math.round(Math.max(15, Math.min(25, bodyFat)) * 10) / 10;
    muscleMass += (Math.random() - 0.5) * 0.3;
    muscleMass = Math.round(Math.max(28, Math.min(34, muscleMass)) * 10) / 10;
    data.push({
      id: id++,
      weight,
      height: 175,
      bodyFat,
      muscleMass,
      chest: Math.round(96 + Math.random() * 4),
      waist: Math.round(76 + Math.random() * 4),
      hip: Math.round(98 + Math.random() * 4),
      arm: Math.round(32 + Math.random() * 3),
      date: dateStr,
    });
  }
  return data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

let mockMetrics: MetricsRecord[] = generateMockData();
let nextId = mockMetrics.length + 1;

// ===== 1. 录入身体数据 =====
export const saveMetrics = async (data: Omit<MetricsRecord, 'id'>) => {
  if (USE_MOCK) {
    await mockDelay(500);
    const newRecord = { ...data, id: nextId++ };
    mockMetrics = [newRecord, ...mockMetrics];
    return mockSuccess(newRecord);
  }
  return apiClient.post('/api/metrics', data);
};

// ===== 2. 历史列表 =====
export const getMetricsList = async (): Promise<MetricsRecord[]> => {
  if (USE_MOCK) {
    await mockDelay(300);
    return [...mockMetrics];
  }
  const res = await apiClient.get('/api/metrics/list');
  // 后端返回分页格式：{ records: [], total, size, current, pages }
  return res?.records || [];
};

// ===== 3. 趋势数据 =====
type RangeType = '7days' | 'month' | '3months';
export const getMetricsTrend = async (range: RangeType = 'month'): Promise<TrendData[]> => {
  if (USE_MOCK) {
    await mockDelay(300);
    const today = new Date();
    const sorted = [...mockMetrics].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    let filtered = sorted;
    if (range === '7days') {
      const cutoff = new Date(today);
      cutoff.setDate(today.getDate() - 7);
      filtered = sorted.filter(r => new Date(r.date) >= cutoff);
    } else if (range === 'month') {
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
      filtered = sorted.filter(r => new Date(r.date) >= monthStart);
    } else if (range === '3months') {
      const threeMonthsAgo = new Date(today);
      threeMonthsAgo.setMonth(today.getMonth() - 2);
      threeMonthsAgo.setDate(1);
      filtered = sorted.filter(r => new Date(r.date) >= threeMonthsAgo);
    }
    if (filtered.length < 2 && sorted.length >= 2) {
      filtered = sorted.slice(-Math.min(sorted.length, 5));
    }
    return filtered.map(r => ({
      date: r.date,
      weight: r.weight,
      bodyFat: r.bodyFat,
      muscleMass: r.muscleMass,
    }));
  }
  return apiClient.get(`/api/metrics/trend?range=${range}`);
};

// ===== 4. 最新数据 =====
export const getLatestMetrics = async (): Promise<MetricsRecord | null> => {
  if (USE_MOCK) {
    await mockDelay(200);
    return mockMetrics.length > 0 ? { ...mockMetrics[0] } : null;
  }
  return apiClient.get('/api/metrics/latest');
};