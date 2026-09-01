import apiClient, { USE_MOCK, mockDelay } from './client';

// ===== 类型定义 =====

export interface User {
  id: number;
  username: string;
  email: string;
  role: 'admin' | 'user';
  status: 'ACTIVE' | 'DISABLED';
  createdAt: string;
  lastActive: string;
  workoutCount: number;
  checkinCount: number;
}

export interface Checkin {
  id: number;
  userId: number;
  username: string;
  content: string;
  images: string[];
  likes: number;
  commentCount: number;
  createdAt: string;
}

export interface Exercise {
  id: number;
  name: string;
  nameEn?: string;
  bodyPart: string;
  difficulty: 1 | 2 | 3;
  imageUrl: string;
  description: string;
  tips: string;
  steps?: string[];
  commonMistakes?: string[];
  status: 'published' | 'draft';
  deleted: number;
}

export interface Stats {
  totalUsers: number;
  totalCheckins: number;
  totalExercises: number;
}

export interface TrendData {
  date: string;
  count: number;
}

// ============================================================
//  一、数据统计（2个）
// ============================================================

// 1. 总览统计
export const getAdminStats = async (): Promise<Stats> => {
  if (USE_MOCK) {
    await mockDelay(300);
    return { totalUsers: 8, totalCheckins: 15, totalExercises: 27 };
  }
  return apiClient.get('/api/admin/stats');
};

// 2. 趋势图数据
export const getAdminTrend = async (days: number = 7): Promise<TrendData[]> => {
  if (USE_MOCK) {
    await mockDelay(300);
    return [
      { date: '2026-07-01', count: 2 },
      { date: '2026-07-02', count: 1 },
      { date: '2026-07-03', count: 3 },
      { date: '2026-07-04', count: 0 },
      { date: '2026-07-05', count: 2 },
      { date: '2026-07-06', count: 4 },
      { date: '2026-07-07', count: 1 },
    ];
  }
  return apiClient.get('/api/admin/trend', { params: { days } });
};

// ============================================================
//  二、用户管理（3个）
// ============================================================

// 3. 用户列表
export const getAdminUsers = async (): Promise<User[]> => {
  if (USE_MOCK) {
    await mockDelay(300);
    return [
      { id: 1, username: 'admin', email: 'admin@fitai.com', role: 'admin', status: 'ACTIVE', createdAt: '2026-01-01', lastActive: '2026-07-07 14:32', workoutCount: 156, checkinCount: 42 },
      { id: 2, username: 'testuser', email: 'test@test.com', role: 'user', status: 'ACTIVE', createdAt: '2026-06-01', lastActive: '2026-07-07 10:15', workoutCount: 23, checkinCount: 8 },
      { id: 3, username: 'kkk', email: 'kkk@test.com', role: 'user', status: 'DISABLED', createdAt: '2026-06-15', lastActive: '2026-07-04 09:20', workoutCount: 12, checkinCount: 5 },
    ];
  }
  return apiClient.get('/api/admin/users');
};

// 4. 禁用/启用用户
export const toggleUserStatus = async (userId: number, status: 'ENABLED' | 'DISABLED') => {
  if (USE_MOCK) {
    await mockDelay(300);
    return { code: 200, message: '更新成功' };
  }
  return apiClient.put(`/api/admin/users/${userId}/status`, null, {
    params: { status }
  });
};

// 5. 删除用户
export const deleteAdminUser = async (userId: number) => {
  if (USE_MOCK) {
    await mockDelay(300);
    return { code: 200, message: '删除成功' };
  }
  return apiClient.delete(`/api/admin/users/${userId}`);
};

// ============================================================
//  三、打卡管理（2个）
// ============================================================

// 6. 打卡列表
export const getAdminCheckins = async (): Promise<Checkin[]> => {
  if (USE_MOCK) {
    await mockDelay(300);
    return [
      { id: 1, userId: 2, username: 'testuser', content: '今天深蹲突破 100kg！', images: [], likes: 12, commentCount: 2, createdAt: '2026-07-07 14:32' },
      { id: 2, userId: 3, username: 'kkk', content: '晨跑打卡 5km，配速 5:30', images: [], likes: 8, commentCount: 1, createdAt: '2026-07-06 10:15' },
    ];
  }
  return apiClient.get('/api/admin/checkins');
};

// 7. 删除打卡
export const deleteAdminCheckin = async (checkinId: number) => {
  if (USE_MOCK) {
    await mockDelay(300);
    return { code: 200, message: '删除成功' };
  }
  return apiClient.delete(`/api/admin/checkins/${checkinId}`);
};

// ============================================================
//  四、动作管理（4个）
// ============================================================

// 8. 动作列表（管理用）
export const getAdminExercises = async (): Promise<Exercise[]> => {
  if (USE_MOCK) {
    await mockDelay(300);
    return [
      { id: 1, name: '深蹲', bodyPart: '腿', difficulty: 1, imageUrl: '', description: '锻炼大腿、臀部', tips: '膝盖与脚尖方向一致', status: 'published', deleted: 0 },
      { id: 2, name: '卧推', bodyPart: '胸', difficulty: 2, imageUrl: '', description: '锻炼胸大肌', tips: '肩胛骨收紧', status: 'published', deleted: 0 },
    ];
  }
  return apiClient.get('/api/admin/exercises');
};

// 9. 新增动作
export const createAdminExercise = async (data: Partial<Exercise>) => {
  if (USE_MOCK) {
    await mockDelay(400);
    return { code: 200, message: '新增成功' };
  }
  return apiClient.post('/api/admin/exercises', data);
};

// 10. 编辑动作

export const updateAdminExercise = async (id: number, data: Partial<Exercise>) => {
  if (USE_MOCK) {
    await mockDelay(400);
    return { code: 200, message: '编辑成功' };
  }
  return apiClient.put(`/api/admin/exercises/${id}`, data);
};

// 11. 删除动作
export const deleteAdminExercise = async (id: number) => {
  if (USE_MOCK) {
    await mockDelay(300);
    return { code: 200, message: '删除成功' };
  }
  return apiClient.delete(`/api/admin/exercises/${id}`);
};