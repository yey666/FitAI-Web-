import apiClient, { USE_MOCK, mockDelay } from './client';

// ===== 类型定义 =====
// 视频/图片分析接口统一返回结构
export interface AnalyzeResult {
  score: number;
  issues: string[];
  suggestions: string[];
}

// 单条纠正记录（历史/详情）
export interface CorrectRecord {
  id: number;
  exerciseName: string;
  mediaUrl: string;
  score: number;
  issues: string[];
  suggestions: string[];
  createdAt: string;
}

// 历史列表项
export interface HistoryItem {
  id: number;
  exerciseName: string;
  score: number;
  issues: string[];
  suggestions: string[];
  createdAt: string;
}

// ===== Mock 数据 =====
let mockHistory: HistoryItem[] = [
  { id: 1, exerciseName: '深蹲', score: 87, issues: ['膝盖过度前倾'], suggestions: ['保持膝盖与脚尖同向'], createdAt: '2026-06-29' },
  { id: 2, exerciseName: '卧推', score: 72, issues: ['手肘外展过大'], suggestions: ['手肘与身体夹角约 45 度'], createdAt: '2026-06-27' },
  { id: 3, exerciseName: '硬拉', score: 65, issues: ['背部拱起'], suggestions: ['收紧核心，保持背部挺直'], createdAt: '2026-06-25' },
];

// ===== 工具：解析后端返回的 JSON 字符串 =====
// 后端部分接口的 data 是 JSON 字符串（如 '{"score":85,...}'），需要解析成对象
// 兼容：对象、字符串、带换行/空白的字符串
const parseData = <T,>(data: T | string): T => {
  // 非字符串（对象/数组等）直接返回
  if (typeof data !== 'string') {
    return data as T;
  }
  // 字符串：去掉首尾空白与换行后再解析
  const trimmed = data.trim();
  if (!trimmed) {
    return data as unknown as T;
  }
  try {
    return JSON.parse(trimmed) as T;
  } catch {
    // 不是合法 JSON，原样返回
    return data as unknown as T;
  }
};

// ===== 工具：解析后端返回并强制转换为数组（列表接口兜底） =====
// 后端列表接口实际返回格式可能不稳定，这里统一兜底成数组，永不抛错
const parseArray = <T,>(data: unknown): T[] => {
  try {
    // 1. JSON 字符串 → 解析
    let parsed = data;
    if (typeof data === 'string') {
      const trimmed = data.trim();
      if (!trimmed) {
        return [];
      }
      try {
        parsed = JSON.parse(trimmed);
      } catch {
        return [];
      }
    }
    // 2. 数组 → 直接返回
    if (Array.isArray(parsed)) {
      return parsed as T[];
    }
    // 3. null/undefined → 空数组
    if (parsed == null) {
      return [];
    }
    // 4. 对象 → 提取第一个数组字段，否则用 Object.values 转数组
    if (typeof parsed === 'object') {
      const obj = parsed as Record<string, unknown>;
      // 4a. 优先匹配常见数组字段
      const arrayKeys = ['records', 'list', 'items', 'data', 'history', 'result', 'content'];
      for (const key of arrayKeys) {
        if (Array.isArray(obj[key])) {
          return obj[key] as T[];
        }
      }
      // 4b. 提取第一个数组字段
      for (const key of Object.keys(obj)) {
        const value = obj[key];
        if (Array.isArray(value)) {
          return value as T[];
        }
      }
      // 4c. 没有任何数组字段 → Object.values 转成数组
      const values = Object.values(obj);
      return values as T[];
    }
    // 5. 其它类型（数字、布尔等）→ 空数组
    return [];
  } catch {
    return [];
  }
};

// ===== 1. 上传媒体文件 =====
// POST /api/correct/upload，FormData 字段名为 file，返回 data: "https://oss.xxx.jpg"（媒体地址）
export const uploadVideo = async (file: File): Promise<string> => {
  if (USE_MOCK) {
    await mockDelay(1000);
    return 'https://example.com/mock-video-url.mp4';
  }
  console.log('[上传视频] 文件信息:', { name: file.name, size: file.size, type: file.type });
  const formData = new FormData();
  formData.append('file', file);
  const res: any = await apiClient.post('/api/correct/upload', formData);
  // 拦截器已解包，res 即后端 data，为一个媒体地址字符串
  return res || '';
};

// ===== 2. AI 分析（视频） =====
// POST /api/correct/analyze-video，Query 参数: { videoUrl, exerciseName }
// 返回 data: '{"score":85,"issues":[...],"suggestions":[...]}'（JSON 字符串）
export const analyzeVideo = async (data: { videoUrl: string; exerciseName: string }): Promise<AnalyzeResult> => {
  if (USE_MOCK) {
    await mockDelay(1500);
    return {
      score: 85,
      issues: [
        '膝盖过度前倾，超过脚尖位置',
        '下蹲时躯干前倾角度偏大',
        '髋部下落深度不足',
      ],
      suggestions: [
        '注意膝盖不要过度前倾，保持与脚尖方向一致',
        '保持躯干稳定，避免过度前倾',
        '下蹲至大腿与地面平行即可',
      ],
    };
  }
  const res: any = await apiClient.post('/api/correct/analyze-video', null, {
    params: { videoUrl: data.videoUrl, exerciseName: data.exerciseName },
  });
  return parseData<AnalyzeResult>(res);
};

// ===== 3. AI 分析（图片） =====
// POST /api/correct/analyze-by-ai，Query 参数: { mediaUrl, exerciseName, mediaType }
// 返回 data: '{"score":85,"issues":[...],"suggestions":[...]}'（JSON 字符串）
export const analyzeImage = async (data: { mediaUrl: string; exerciseName: string }): Promise<AnalyzeResult> => {
  if (USE_MOCK) {
    await mockDelay(1500);
    return {
      score: 78,
      issues: ['背部未保持挺直'],
      suggestions: ['收紧核心，保持背部自然挺直'],
    };
  }
  const res: any = await apiClient.post('/api/correct/analyze-by-ai', null, {
    params: { mediaUrl: data.mediaUrl, exerciseName: data.exerciseName, mediaType: 'image' },
  });
  return parseData<AnalyzeResult>(res);
};

// ===== 工具：把后端历史记录项规整为前端可用结构 =====
// 后端 history 中 suggestions 字段是 JSON 字符串（如 '{"score":85,"issues":[...],"suggestions":[...]}'），
// 需要先 JSON.parse，再把 score / issues / suggestions 摊平到 item 上。
const normalizeHistoryItem = (item: any): HistoryItem => {
  let score = 0;
  let issues: string[] = [];
  let suggestions: string[] = [];

  const raw = item?.suggestions;
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        if (typeof parsed.score === 'number') score = parsed.score;
        if (Array.isArray(parsed.issues)) issues = parsed.issues;
        if (Array.isArray(parsed.suggestions)) suggestions = parsed.suggestions;
      }
    } catch {
      // 解析失败，保持默认值
    }
  } else if (raw && typeof raw === 'object') {
    // 已经解析过的对象，直接取字段
    if (typeof raw.score === 'number') score = raw.score;
    if (Array.isArray(raw.issues)) issues = raw.issues;
    if (Array.isArray(raw.suggestions)) suggestions = raw.suggestions;
  }

  return {
    id: item?.id,
    exerciseName: item?.exerciseName ?? '',
    score,
    issues,
    suggestions,
    createdAt: item?.createdAt ?? '',
  };
};

// ===== 4. 纠正历史列表 =====
// GET /api/correct/history，返回所有历史纠正记录
// 兜底：无论后端返回什么、无论发生什么错误，都保证返回数组
export const getCorrectHistory = async (): Promise<HistoryItem[]> => {
  try {
    if (USE_MOCK) {
      await mockDelay(300);
      return [...mockHistory];
    }
    const res: any = await apiClient.get('/api/correct/history');
    const list = parseArray<any>(res);
    return list.map(normalizeHistoryItem);
  } catch {
    // 接口失败、网络错误、解析失败等一切异常 → 安静返回空数组
    return [];
  }
};

// ===== 5. 单条纠正详情 =====
// GET /api/correct/{id}，返回单条纠正记录详情
export const getCorrectDetail = async (id: number): Promise<CorrectRecord> => {
  if (USE_MOCK) {
    await mockDelay(300);
    const item = mockHistory.find((h) => h.id === id);
    if (!item) return Promise.reject(new Error('记录不存在'));
    return { ...item, mediaUrl: '', issues: [], suggestions: [] };
  }
  const res: any = await apiClient.get(`/api/correct/${id}`);
  return parseData<CorrectRecord>(res);
};
