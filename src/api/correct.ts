import apiClient, { USE_MOCK, mockSuccess, mockDelay } from './client';

export interface AnalyzeResult {
  score: number;
  feedback: string;
  details: { joint: string; angle: number; standard: number; diff: number }[];
}

export interface HistoryItem {
  id: number;
  exerciseType: string;
  score: number;
  date: string;
}

// ===== Mock 数据 =====
let mockHistory: HistoryItem[] = [
  { id: 1, exerciseType: '深蹲', score: 87, date: '2026-06-29' },
  { id: 2, exerciseType: '卧推', score: 72, date: '2026-06-27' },
  { id: 3, exerciseType: '硬拉', score: 65, date: '2026-06-25' },
];
let nextId = 4;

// ===== 1. 上传视频 =====
export const uploadVideo = async (file: File): Promise<string> => {
  if (USE_MOCK) {
    await mockDelay(1000);
    return 'https://example.com/mock-video-url.mp4';
  }
  const formData = new FormData();
  formData.append('file', file);
  return apiClient.post('/api/correct/upload', formData);
};

// ===== 2. AI 分析 =====
export const analyzePose = async (data: {
  videoUrl: string;
  exerciseType: string;
}): Promise<AnalyzeResult> => {
  if (USE_MOCK) {
    await mockDelay(1500);
    return {
      score: 87,
      feedback: '动作整体标准，注意膝盖不要过度前倾，保持躯干稳定。',
      details: [
        { joint: '左膝角度', angle: 92, standard: 90, diff: 2 },
        { joint: '右膝角度', angle: 88, standard: 90, diff: -2 },
        { joint: '躯干倾斜', angle: 15, standard: 10, diff: 5 },
        { joint: '髋部高度', angle: 45, standard: 45, diff: 0 },
      ],
    };
  }
  return apiClient.post('/api/correct/analyze', data);
};

// ===== 3. 纠正历史列表 =====
export const getCorrectHistory = async (): Promise<HistoryItem[]> => {
  if (USE_MOCK) {
    await mockDelay(300);
    return [...mockHistory];
  }
  return apiClient.get('/api/correct/history');
};

// ===== 4. 单条纠正详情 =====
export const getCorrectDetail = async (id: number): Promise<HistoryItem> => {
  if (USE_MOCK) {
    await mockDelay(300);
    const item = mockHistory.find(h => h.id === id);
    if (!item) return Promise.reject(new Error('记录不存在'));
    return { ...item };
  }
  return apiClient.get(`/api/correct/${id}`);
};