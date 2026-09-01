import apiClient, { USE_MOCK, mockSuccess, mockDelay } from './client';

// ===== 类型定义 =====
export interface WorkoutRecord {
  id: number;
  exerciseId: number;
  exerciseName: string;
  weight: number;
  sets: number;
  reps: number;
  duration: number;
  workoutDate: string;
}

export interface Stats {
  totalWorkouts: number;
  totalDuration: number;
  totalCalories: number;
  streakDays: number;
}

export interface WeeklyProgressItem {
  day: string;
  count: number;
  duration: number;
}

export interface WeeklyCount {
  total: number;
  days: WeeklyProgressItem[];
}

// ===== Mock 数据 =====
let mockRecords: WorkoutRecord[] = [
  { id: 1, exerciseId: 1, exerciseName: '深蹲', weight: 60, sets: 4, reps: 10, duration: 20, workoutDate: '2026-06-29' },
  { id: 2, exerciseId: 2, exerciseName: '卧推', weight: 50, sets: 4, reps: 8, duration: 15, workoutDate: '2026-06-28' },
  { id: 3, exerciseId: 3, exerciseName: '硬拉', weight: 80, sets: 3, reps: 6, duration: 18, workoutDate: '2026-06-27' },
];
let nextId = 4;

const mockStats: Stats = {
  totalWorkouts: 42,
  totalDuration: 186,
  totalCalories: 2840,
  streakDays: 7,
};

// ============================================================
//  1. 首页 - 统计数据
// ============================================================
export const getStats = async (): Promise<Stats> => {
  if (USE_MOCK) {
    await mockDelay(300);
    return mockStats;
  }
  return apiClient.get('/api/workout/stats');
};

// ============================================================
//  2. 训练记录 - 获取列表
// ============================================================
export const getWorkoutList = async (): Promise<WorkoutRecord[]> => {
  if (USE_MOCK) {
    await mockDelay(300);
    return [...mockRecords];
  }
  const res = await apiClient.get('/api/workout/list');
  return res?.records || [];
};

// ============================================================
//  3. 训练记录 - 保存
// ============================================================
export const saveWorkout = async (data: Omit<WorkoutRecord, 'id'>) => {
  if (USE_MOCK) {
    await mockDelay(500);
    const newRecord = { ...data, id: nextId++ };
    mockRecords = [newRecord, ...mockRecords];
    return mockSuccess(newRecord);
  }
  return apiClient.post('/api/workout', data);
};

// ============================================================
//  4. 训练记录 - 获取详情
// ============================================================
export const getWorkoutDetail = async (id: number): Promise<WorkoutRecord> => {
  if (USE_MOCK) {
    await mockDelay(300);
    const record = mockRecords.find((r) => r.id === id);
    if (!record) return Promise.reject(new Error('记录不存在'));
    return { ...record };
  }
  return apiClient.get(`/api/workout/${id}`);
};

// ============================================================
//  5. 训练记录 - 更新
// ============================================================
export const updateWorkout = async (id: number, data: Omit<WorkoutRecord, 'id'>) => {
  if (USE_MOCK) {
    await mockDelay(400);
    const index = mockRecords.findIndex((r) => r.id === id);
    if (index !== -1) {
      mockRecords[index] = { ...mockRecords[index], ...data };
    }
    return mockSuccess(null);
  }
  return apiClient.put(`/api/workout/${id}`, data);
};

// ============================================================
//  6. 训练记录 - 删除
// ============================================================
export const deleteWorkout = async (id: number) => {
  if (USE_MOCK) {
    await mockDelay(300);
    mockRecords = mockRecords.filter((r) => r.id !== id);
    return mockSuccess(null);
  }
  return apiClient.delete(`/api/workout/${id}`);
};

// ============================================================
//  7. 首页 - 日历热力图
// ============================================================
export const getWorkoutCalendar = async (yearMonth?: string) => {
  if (USE_MOCK) {
    await mockDelay(300);
    const map: Record<string, number> = {};
    mockRecords.forEach((r) => {
      map[r.workoutDate] = (map[r.workoutDate] || 0) + 1;
    });
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const daysInMonth = new Date(year, month, 0).getDate();
    const result = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      result.push({ date: dateStr, count: map[dateStr] || 0 });
    }
    return result;
  }
  try {
    const res: any = await apiClient.get('/api/workout/calendar', { params: { yearMonth } });
    // 拦截器解包后 res 为 { data: { "2026-09-01": 4, ... }, totalDays: 5 }
    const dayMap = res?.data;

    // 1) 对象格式（key=日期, value=次数）→ 转成 [{ date, count }]
    if (dayMap && typeof dayMap === 'object' && !Array.isArray(dayMap)) {
      return Object.entries(dayMap).map(([date, count]) => ({
        date,
        count: Number(count) || 0,
      }));
    }

    // 2) 兼容后端直接返回数组的情况
    if (Array.isArray(res)) return res;
    if (Array.isArray(dayMap)) return dayMap;
    return [];
  } catch (error) {
    console.error('获取日历数据失败:', error);
    return [];
  }
};
// ============================================================
//  8. 首页 - 本周进度
// ============================================================
export const getWeeklyProgress = async (): Promise<WeeklyProgressItem[]> => {
  if (USE_MOCK) {
    await mockDelay(300);
    const weekDays = ['日', '一', '二', '三', '四', '五', '六'];
    const now = new Date();
    const result: WeeklyProgressItem[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr =
        `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const dayRecords = mockRecords.filter((r) => r.workoutDate === dateStr);
      result.push({
        day: weekDays[d.getDay()],
        count: dayRecords.length,
        duration: dayRecords.reduce((sum, r) => sum + r.duration, 0),
      });
    }
    return result;
  }
  return apiClient.get('/api/workout/weekly-progress');
};

// ============================================================
//  9. 首页 - 本周训练次数
// ============================================================
export const getWeeklyCount = async (): Promise<WeeklyCount> => {
  if (USE_MOCK) {
    await mockDelay(300);
    const days = await getWeeklyProgress();
    const total = days.reduce((sum, d) => sum + d.count, 0);
    return { total, days };
  }
  return apiClient.get('/api/workout/weekly-count');
};