import apiClient, { USE_MOCK, mockDelay } from './client';

// ===== 类型定义 =====
export interface JointAngle {
  joint: string;
  angle: number;
  standard: number;
  status: string;
}

export interface AnalyzeResult {
  id: number;
  exerciseName: string;
  videoUrl: string;
  score: number;
  jointAngles: JointAngle[];
  suggestions: string[];
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

// ===== 1. 上传视频 =====
// POST /api/correct/upload，FormData 字段名为 video，返回 data: { videoUrl }
export const uploadVideo = async (file: File): Promise<string> => {
  if (USE_MOCK) {
    await mockDelay(1000);
    return 'https://example.com/mock-video-url.mp4';
  }
  console.log('[上传视频] 文件信息:', { name: file.name, size: file.size, type: file.type });
  const formData = new FormData();
  formData.append('video', file);
  const res: any = await apiClient.post('/api/correct/upload', formData);
  // 拦截器已解包，res 即后端 data: { videoUrl }
  return res?.videoUrl || '';
};

// ===== 2. AI 分析 =====
// POST /api/correct/analyze，body: { videoUrl, exerciseName }
// 返回 data: { id, exerciseName, videoUrl, score, jointAngles, suggestions }
export const analyzePose = async (data: { videoUrl: string; exerciseName: string }): Promise<AnalyzeResult> => {
  if (USE_MOCK) {
    await mockDelay(1500);
    return {
      id: 1,
      exerciseName: data.exerciseName,
      videoUrl: data.videoUrl,
      score: 87,
      jointAngles: [
        { joint: '左膝角度', angle: 92, standard: 90, status: '标准' },
        { joint: '右膝角度', angle: 88, standard: 90, status: '标准' },
        { joint: '躯干倾斜', angle: 15, standard: 10, status: '偏大' },
        { joint: '髋部高度', angle: 45, standard: 45, status: '标准' },
      ],
      suggestions: [
        '注意膝盖不要过度前倾，保持与脚尖方向一致',
        '保持躯干稳定，避免过度前倾',
        '下蹲至大腿与地面平行即可',
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
    const item = mockHistory.find((h) => h.id === id);
    if (!item) return Promise.reject(new Error('记录不存在'));
    return { ...item };
  }
  return apiClient.get(`/api/correct/${id}`);
};
