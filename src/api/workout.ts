import apiClient, { USE_MOCK, mockSuccess, mockDelay } from './client';

interface WorkoutRecord {
  id: number;
  exerciseName: string;
  weight: number;
  sets: number;
  reps: number;
  duration: number;
  date: string;
}

// ===== Mock 数据 =====
let mockRecords: WorkoutRecord[] = [
  { id: 1, exerciseName: '深蹲', weight: 60, sets: 4, reps: 10, duration: 20, date: '2026-06-29' },
  { id: 2, exerciseName: '卧推', weight: 50, sets: 4, reps: 8, duration: 15, date: '2026-06-28' },
  { id: 3, exerciseName: '硬拉', weight: 80, sets: 3, reps: 6, duration: 18, date: '2026-06-27' },
];
let nextId = 4;

// ===== Day 8: 获取列表（按时间倒序） =====
export const getWorkoutList = async (): Promise<WorkoutRecord[]> => {
  if (USE_MOCK) { await mockDelay(300); return [...mockRecords]; }
  return apiClient.get('/api/workout/list');
};

// ===== Day 8: 保存训练记录 =====
export const saveWorkout = async (data: Omit<WorkoutRecord, 'id'>) => {
  if (USE_MOCK) {
    await mockDelay(500);
    const newRecord = { ...data, id: nextId++ };
    mockRecords = [newRecord, ...mockRecords];
    return mockSuccess(newRecord);
  }
  return apiClient.post('/api/workout', data);
};

// ===== Day 9: 获取单条详情 =====
export const getWorkoutDetail = async (id: number): Promise<WorkoutRecord> => {
  if (USE_MOCK) {
    await mockDelay(300);
    const record = mockRecords.find(r => r.id === id);
    if (!record) return Promise.reject(new Error('记录不存在'));
    return { ...record };
  }
  return apiClient.get(`/api/workout/${id}`);
};

// ===== Day 9: 更新记录 =====
export const updateWorkout = async (id: number, data: Omit<WorkoutRecord, 'id'>) => {
  if (USE_MOCK) {
    await mockDelay(400);
    const index = mockRecords.findIndex(r => r.id === id);
    if (index !== -1) { mockRecords[index] = { ...mockRecords[index], ...data }; }
    return mockSuccess(null);
  }
  return apiClient.put(`/api/workout/${id}`, data);
};

// ===== Day 9: 删除记录 =====
export const deleteWorkout = async (id: number) => {
  if (USE_MOCK) {
    await mockDelay(300);
    mockRecords = mockRecords.filter(r => r.id !== id);
    return mockSuccess(null);
  }
  return apiClient.delete(`/api/workout/${id}`);
};

// ===== Day 9: 日历热力图 =====
export const getWorkoutCalendar = async (yearMonth?: string) => {
  if (USE_MOCK) {
    await mockDelay(300);
    const map: Record<string, number> = {};
    mockRecords.forEach(r => { map[r.date] = (map[r.date] || 0) + 1; });
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
  return apiClient.get('/api/workout/calendar', { params: { yearMonth } });
};