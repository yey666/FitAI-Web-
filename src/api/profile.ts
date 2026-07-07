import apiClient, { USE_MOCK, mockSuccess, mockDelay } from './client';

interface ProfileData {
  id: number;
  username: string;
  email: string;
  avatar?: string;
  nickname?: string;
  gender?: string;
  bio?: string;
  height: number;
  weight: number;
  goal: string;
  totalWorkouts: number;
  totalDuration: number;
  totalCalories: number;
}

interface CheckinItem {
  id: number;
  content: string;
  time: string;
}

// ===== Mock 数据 =====
const mockProfile: ProfileData = {
  id: 1,
  username: 'kkk',
  email: '3969886822@qq.com',
  avatar: '',
  nickname: '三K党',
  gender: '保密',
  bio: '保持运动，遇见更好的自己',
  height: 175,
  weight: 72.5,
  goal: '增肌',
  totalWorkouts: 42,
  totalDuration: 186,
  totalCalories: 2840,
};

const mockCheckins: CheckinItem[] = [
  { id: 1, content: '今天深蹲突破100kg！', time: '2小时前' },
  { id: 2, content: '晨跑打卡5公里', time: '昨天' },
];

// ===== 1. 个人主页数据 =====
export const getProfile = async (userId?: number): Promise<ProfileData> => {
  if (USE_MOCK) {
    await mockDelay(300);
    return { ...mockProfile };
  }
  const id = userId || 1;
  return apiClient.get(`/api/profile/${id}`);
};

// ===== 2. 头像上传 =====
export const uploadAvatar = async (file: File): Promise<string> => {
  if (USE_MOCK) {
    await mockDelay(600);
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        resolve(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    });
  }
  const formData = new FormData();
  formData.append('file', file);
  return apiClient.post('/api/profile/avatar', formData);
};

// ===== 3. 个人资料更新 =====
export const updateProfile = async (data: {
  nickname?: string;
  gender?: string;
  bio?: string;
  height: number;
  weight: number;
  goal: string;
  avatar?: string;
}) => {
  if (USE_MOCK) {
    await mockDelay(400);
    Object.assign(mockProfile, data);
    return mockSuccess(null);
  }
  return apiClient.put('/api/profile', data);
};

// ===== 4. 个人打卡列表 =====
export const getUserCheckins = async (userId?: number): Promise<CheckinItem[]> => {
  if (USE_MOCK) {
    await mockDelay(300);
    return [...mockCheckins];
  }
  const id = userId || 1;
  return apiClient.get(`/api/profile/${id}/checkins`);
};