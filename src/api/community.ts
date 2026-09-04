import apiClient, { USE_MOCK, mockSuccess, mockDelay } from './client';

interface Checkin {
  id: number;
  userId: number;
  username: string;
  avatar: string;
  content: string;
  images: string[];
  likes: number;
  isLiked: boolean;
  time: string;
}

// ===== Mock 数据 =====
let mockFeed: Checkin[] = [
  {
    id: 1,
    userId: 1,
    username: 'Alex Chen',
    avatar: '',
    content: '今天深蹲突破 100kg！坚持就是胜利，记录一下这个里程碑。',
    images: [],
    likes: 12,
    isLiked: false,
    time: '2小时前',
  },
  {
    id: 2,
    userId: 2,
    username: 'Sarah Wang',
    avatar: '',
    content: '晨跑打卡 5km，配速 5:30，感觉状态不错',
    images: [],
    likes: 8,
    isLiked: true,
    time: '昨天',
  },
  {
    id: 3,
    userId: 3,
    username: 'Mike Zhang',
    avatar: '',
    content: '第一次完成引体向上 10 个！从 0 到 10 用了两个月，坚持真的有用',
    images: [],
    likes: 5,
    isLiked: false,
    time: '昨天',
  },
];
let nextId = 4;

// ===== 1. 发布打卡 =====
export const createCheckin = async (data: { content: string; images: string[] }) => {
  if (USE_MOCK) {
    await mockDelay(500);
    const newItem: Checkin = {
      id: nextId++,
      userId: 1,
      username: '我',
      avatar: '',
      content: data.content,
      images: data.images || [],
      likes: 0,
      isLiked: false,
      time: '刚刚',
    };
    mockFeed = [newItem, ...mockFeed];
    return mockSuccess(newItem);
  }
  return apiClient.post('/api/community/checkin', data);
};

// ===== 2. Feed 流列表 =====
export const getFeed = async (): Promise<Checkin[]> => {
  if (USE_MOCK) {
    await mockDelay(400);
    return [...mockFeed];
  }
  const res = await apiClient.get('/api/community/feed');
  // 后端返回的是 { records: [], total: 0, size: 10, current: 1, pages: 0 }
  return res?.records || [];
};

// ===== 3. 个人打卡列表 =====
export const getUserCheckins = async (userId?: number): Promise<Checkin[]> => {
  if (USE_MOCK) {
    await mockDelay(300);
    const result = mockFeed.filter(f => f.userId === (userId || 1));
    return result;
  }
  const id = userId || 1;
  return apiClient.get(`/api/community/user/${id}`);
};

// ===== 4. 点赞/取消点赞 =====
// isLiked 为当前是否已点赞：已点赞则取消（DELETE），未点赞则点赞（POST）
export const toggleLike = async (checkinId: number, isLiked: boolean) => {
  if (USE_MOCK) {
    await mockDelay(300);
    const item = mockFeed.find(f => f.id === checkinId);
    if (item) {
      item.isLiked = !isLiked;
      item.likes += item.isLiked ? 1 : -1;
    }
    return mockSuccess(null);
  }
  if (isLiked) {
    return apiClient.delete(`/api/community/like/${checkinId}`);
  }
  return apiClient.post(`/api/community/like/${checkinId}`);
};

// ===== 5. 检查是否点赞 =====
export const getLikeStatus = async (checkinId: number): Promise<boolean> => {
  if (USE_MOCK) {
    await mockDelay(200);
    const item = mockFeed.find(f => f.id === checkinId);
    return item?.isLiked || false;
  }
  return apiClient.get(`/api/community/like/status/${checkinId}`);
};

// 删除打卡（管理员专用）
export const deleteCheckin = async (checkinId: number) => {
  if (USE_MOCK) {
    await mockDelay(300);
    return mockSuccess(null);
  }
  return apiClient.delete(`/api/admin/checkins/${checkinId}`);
};