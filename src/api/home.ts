import apiClient, { USE_MOCK, mockSuccess, mockDelay } from './client';

// ===== 类型定义 =====
export interface Stats {
  totalWorkouts: number;
  totalDuration: number;
  totalCalories: number;
  streakDays: number;
}

export interface Activity {
  id: number;
  type: 'workout' | 'checkin' | 'correct';
  title: string;
  description: string;
  time: string;
}

export interface WeeklyData {
  day: string;
  count: number;
  duration: number;
}

export interface WeeklyCount {
  total: number;
  days: WeeklyData[];
}

export interface WeeklyProgressData {
  total: number;
  goal: number;
  progress: number;
}

export interface Recommendation {
  id: number;
  name: string;
  target: string;
  difficulty: '初级' | '中级' | '高级';
  description: string;
}

// ===== Mock 数据 =====
const mockStats: Stats = {
  totalWorkouts: 42,
  totalDuration: 186,
  totalCalories: 2840,
  streakDays: 7,
};

const mockActivities: Activity[] = [
  { id: 1, type: 'workout', title: '完成胸部训练', description: '卧推 4组×10次，哑铃飞鸟 4组×12次', time: '2小时前' },
  { id: 2, type: 'checkin', title: '打卡签到', description: '连续打卡第 7 天 🔥', time: '3小时前' },
  { id: 3, type: 'correct', title: '深蹲动作分析', description: '得分 92分，动作标准 ✅', time: '昨天' },
];

const mockWeeklyData: WeeklyData[] = [
  { day: '一', count: 2, duration: 45 },
  { day: '二', count: 1, duration: 30 },
  { day: '三', count: 3, duration: 60 },
  { day: '四', count: 0, duration: 0 },
  { day: '五', count: 2, duration: 40 },
  { day: '六', count: 1, duration: 25 },
  { day: '日', count: 0, duration: 0 },
];

const mockRecommendation: Recommendation = {
  id: 1,
  name: '深蹲',
  target: '腿部 / 臀部',
  difficulty: '初级',
  description: '核心力量训练，提升下肢稳定性',
};

// ============================================================
//  1. 首页统计
// ============================================================
export const getStats = async (): Promise<Stats> => {
  if (USE_MOCK) { await mockDelay(300); return mockStats; }
  return apiClient.get('/api/workout/stats');
};

// ============================================================
//  2. 最近动态
// ============================================================
export const getRecentActivities = async (): Promise<Activity[]> => {
  if (USE_MOCK) { await mockDelay(300); return mockActivities; }
  try {
    const res = await apiClient.get('/api/community/feed');
    const list = res?.data?.records || res?.data || res || [];
    return list.map((item: any) => ({
      id: item.id,
      type: item.type || 'checkin',
      title: item.content || item.title || '动态',
      description: item.description || '',
      time: item.createdAt || item.time || '刚刚',
    }));
  } catch (error) {
    console.error('获取最近动态失败:', error);
    return [];
  }
};

// ============================================================
//  3. 周趋势（使用 weekly-count 接口）
// ============================================================
export const getWeeklyTrend = async (): Promise<WeeklyData[]> => {
  if (USE_MOCK) { await mockDelay(300); return mockWeeklyData; }
  try {
    const res = await apiClient.get('/api/workout/weekly-count');
    const days = res?.data?.days || res?.days || res || [];
    return days.map((item: any) => ({
      day: item.day || '一',
      count: item.count || 0,
      duration: item.duration || 0,
    }));
  } catch (error) {
    console.error('获取周趋势失败:', error);
    return [];
  }
};

// ============================================================
//  4. 本周训练次数
// ============================================================
export const getWeeklyCount = async (): Promise<WeeklyCount> => {
  if (USE_MOCK) {
    await mockDelay(300);
    return { total: 9, days: mockWeeklyData };
  }
  return apiClient.get('/api/workout/weekly-count');
};

// ============================================================
//  5. 本周进度
// ============================================================
export const getWeeklyProgress = async (): Promise<WeeklyProgressData> => {
  if (USE_MOCK) {
    await mockDelay(200);
    return { total: 9, goal: 10, progress: 90 };
  }
  return apiClient.get('/api/workout/weekly-progress');
};

// ============================================================
//  6. 今日推荐
// ============================================================
export const getTodayRecommendation = async (): Promise<Recommendation | null> => {
  if (USE_MOCK) { await mockDelay(200); return mockRecommendation; }
  return apiClient.get('/api/exercises/recommend');
};

// ============================================================
//  7. 首页聚合
// ============================================================
export const getHomeData = async () => {
  const [stats, weeklyCount, weeklyProgress, recommendation, recentActivities] = await Promise.all([
    getStats().catch(() => null),
    getWeeklyCount().catch(() => null),
    getWeeklyProgress().catch(() => null),
    getTodayRecommendation().catch(() => null),
    getRecentActivities().catch(() => []),
  ]);

  return {
    stats,
    weeklyCount,
    weeklyProgress,
    recommendation,
    recentActivities,
  };
};