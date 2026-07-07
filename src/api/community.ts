import apiClient, { USE_MOCK, mockSuccess, mockDelay } from './client';

interface Comment {
  id: number;
  userId: number;
  username: string;
  content: string;
  time: string;
}

interface Checkin {
  id: number;
  userId: number;
  username: string;
  avatar: string;
  content: string;
  images: string[];
  likes: number;
  isLiked: boolean;
  commentCount: number;
  comments: Comment[];
  time: string;
}

// ===== Mock 数据 =====
let mockComments: Record<number, Comment[]> = {
  1: [
    { id: 1, userId: 2, username: 'Sarah', content: '太强了！', time: '1小时前' },
    { id: 2, userId: 3, username: 'Mike', content: '向你学习！', time: '30分钟前' },
  ],
  2: [{ id: 3, userId: 1, username: 'Alex', content: '配速很稳！', time: '昨天' }],
  3: [],
};
let nextCommentId = 4;

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
    commentCount: 2,
    comments: mockComments[1] || [],
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
    commentCount: 1,
    comments: mockComments[2] || [],
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
    commentCount: 0,
    comments: mockComments[3] || [],
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
      commentCount: 0,
      comments: [],
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
  return apiClient.get('/api/community/feed');
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
export const toggleLike = async (checkinId: number) => {
  if (USE_MOCK) {
    await mockDelay(300);
    const item = mockFeed.find(f => f.id === checkinId);
    if (item) {
      item.isLiked = !item.isLiked;
      item.likes += item.isLiked ? 1 : -1;
    }
    return mockSuccess(null);
  }
  const item = mockFeed.find(f => f.id === checkinId);
  if (item?.isLiked) {
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

// ===== 6. 发表评论 =====
export const addComment = async (checkinId: number, content: string) => {
  if (USE_MOCK) {
    await mockDelay(400);
    const newComment: Comment = {
      id: nextCommentId++,
      userId: 1,
      username: '我',
      content,
      time: '刚刚',
    };
    if (!mockComments[checkinId]) mockComments[checkinId] = [];
    mockComments[checkinId].push(newComment);
    const item = mockFeed.find(f => f.id === checkinId);
    if (item) {
      item.commentCount = (item.commentCount || 0) + 1;
      item.comments = mockComments[checkinId];
    }
    return mockSuccess(newComment);
  }
  return apiClient.post(`/api/community/comment/${checkinId}`, { content });
};