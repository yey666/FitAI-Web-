import apiClient, { USE_MOCK, mockSuccess, mockDelay } from './client';

export interface Exercise {
  id: number;
  name: string;
  target: string;
  difficulty: '初级' | '中级' | '高级';
  imageUrl: string;
  description: string;
  tips: string[];
  videoUrl?: string;
}

export interface ExerciseDetail extends Exercise {
  steps: string[];
  commonMistakes: string[];
}

// ===== Mock 数据 =====
const mockExercises: Exercise[] = [
  { id: 1, name: '深蹲', target: '腿', difficulty: '初级', imageUrl: '', description: '锻炼大腿、臀部和核心力量的基础动作', tips: ['膝盖与脚尖方向一致', '背部保持挺直', '下蹲至大腿与地面平行'], videoUrl: '' },
  { id: 2, name: '卧推', target: '胸', difficulty: '中级', imageUrl: '', description: '锻炼胸大肌、三角肌和肱三头肌的核心动作', tips: ['肩胛骨收紧', '杠铃落在乳头连线位置', '肘关节与身体成75度角'], videoUrl: '' },
  { id: 3, name: '硬拉', target: '背', difficulty: '高级', imageUrl: '', description: '锻炼全身后侧链的复合动作', tips: ['背部保持中立位', '杠铃贴近小腿', '髋部发力驱动上升'], videoUrl: '' },
];

const mockExerciseDetails: Record<number, ExerciseDetail> = {
  1: { ...mockExercises[0], steps: ['站立，双脚与肩同宽', '杠铃置于肩部后侧', '下蹲至大腿与地面平行', '站起回到起始位置'], commonMistakes: ['膝盖内扣', '背部弯曲', '重心前移'] },
  2: { ...mockExercises[1], steps: ['仰卧在卧推凳上', '双手握住杠铃略比肩宽', '将杠铃下放至胸部', '推起杠铃至手臂伸直'], commonMistakes: ['肩部前送', '杠铃下落位置错误', '臀部抬起'] },
  3: { ...mockExercises[2], steps: ['双脚与肩同宽站立', '弯腰握住杠铃', '核心收紧，背部挺直', '髋部发力将杠铃抬起'], commonMistakes: ['背部弓起', '用腰部发力', '杠铃远离身体'] },
};

mockExercises.forEach(ex => {
  if (!mockExerciseDetails[ex.id]) {
    mockExerciseDetails[ex.id] = { ...ex, steps: ['准备姿势', '执行动作', '回到起始位置', '重复完成规定次数'], commonMistakes: ['姿势不正确', '重量过重', '呼吸不规律'] };
  }
});

// ===== 获取动作列表 =====
export const getExercises = async (bodyPart?: string): Promise<Exercise[]> => {
  if (USE_MOCK) {
    await mockDelay(400);
    let result = mockExercises;
    if (bodyPart && bodyPart !== '全部') {
      result = result.filter(ex => ex.target === bodyPart);
    }
    return result;
  }
  try {
    const res: any = await apiClient.get('/api/exercises', { params: { bodyPart } });
    // 后端返回：{ code: 200, message: "success", data: [...] }
    let dataList = [];
    if (Array.isArray(res)) {
      dataList = res;
    } else if (res?.data && Array.isArray(res.data)) {
      dataList = res.data;
    } else if (res?.records && Array.isArray(res.records)) {
      dataList = res.records;
    } else {
      return [];
    }
    // 将后端字段映射到前端期望的字段
    return dataList.map((item: any) => ({
      id: item.id,
      name: item.name,
      target: item.bodyPart || item.target || '未分类',
      difficulty: item.difficulty === 1 ? '初级' : item.difficulty === 2 ? '中级' : '高级',
      imageUrl: item.imageUrl || '',
      description: item.description || '',
      tips: item.tips ? (Array.isArray(item.tips) ? item.tips : [item.tips]) : [],
      videoUrl: item.videoUrl || '',
    }));
  } catch (error) {
    console.error('获取动作列表失败:', error);
    return [];
  }
};

// ===== 获取动作详情 =====
export const getExerciseDetail = async (id: number): Promise<ExerciseDetail> => {
  if (USE_MOCK) {
    await mockDelay(300);
    const detail = mockExerciseDetails[id];
    if (!detail) {
      return Promise.reject(new Error('动作不存在'));
    }
    return detail;
  }
  try {
    const res: any = await apiClient.get(`/api/exercises/${id}`);
    const item = res?.data || res;
    return {
      id: item.id,
      name: item.name,
      target: item.bodyPart || item.target || '未分类',
      difficulty: item.difficulty === 1 ? '初级' : item.difficulty === 2 ? '中级' : '高级',
      imageUrl: item.imageUrl || '',
      description: item.description || '',
      tips: item.tips ? (Array.isArray(item.tips) ? item.tips : [item.tips]) : [],
      videoUrl: item.videoUrl || '',
      steps: item.steps || ['准备姿势', '执行动作', '回到起始位置'],
      commonMistakes: item.commonMistakes || ['注意姿势正确'],
    };
  } catch (error) {
    console.error('获取动作详情失败:', error);
    return Promise.reject(error);
  }
};
// ===== 首页 - 今日推荐动作 =====
export interface TodayRecommendation {
  id: number;
  name: string;
  target: string;
  difficulty: '初级' | '中级' | '高级';
  description: string;
  imageUrl?: string;
}

export const getTodayRecommendation = async (): Promise<TodayRecommendation | null> => {
  if (USE_MOCK) {
    await mockDelay(200);
    // 从 mockExercises 中随机选一个
    const randomIndex = Math.floor(Math.random() * mockExercises.length);
    const ex = mockExercises[randomIndex];
    return {
      id: ex.id,
      name: ex.name,
      target: ex.target,
      difficulty: ex.difficulty,
      description: ex.description,
      imageUrl: ex.imageUrl,
    };
  }
  try {
    const res: any = await apiClient.get('/api/exercises/recommend');
    const item = res?.data || res;
    if (!item) return null;
    return {
      id: item.id,
      name: item.name,
      target: item.bodyPart || item.target || '未分类',
      difficulty: item.difficulty === 1 ? '初级' : item.difficulty === 2 ? '中级' : '高级',
      description: item.description || '',
      imageUrl: item.imageUrl || '',
    };
  } catch (error) {
    console.error('获取今日推荐动作失败:', error);
    return null;
  }
};