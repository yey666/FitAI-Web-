import apiClient, { USE_MOCK, mockSuccess, mockDelay } from './client';

interface PlanParams {
  goal: string;
  venue: string;
  experience: string;   // ← level 改成 experience
  frequency: number;
}

interface PlanHistory {
  id: number;
  goal: string;
  content: string;
  createdAt: string;
}

// ===== Mock 数据 =====
let mockHistory: PlanHistory[] = [];
let nextId = 1;

// ===== 生成 Mock 计划内容 =====
const generateMockPlan = (params: PlanParams): string => {
  const { goal, venue, experience, frequency } = params;  // ← level 改成 experience
  
  // 根据场地选择动作
  const getExercises = (day: string) => {
    if (venue === '健身房') {
      const gymPlans: Record<string, any> = {
        '周一': { name: '胸部 + 三头肌', exercises: ['卧推 4组 × 10次', '哑铃飞鸟 4组 × 12次', '三头下压 3组 × 15次'] },
        '周三': { name: '背部 + 二头肌', exercises: ['引体向上 4组 × 8次', '划船 4组 × 10次', '哑铃弯举 3组 × 12次'] },
        '周五': { name: '腿部 + 肩部', exercises: ['深蹲 4组 × 10次', '腿举 4组 × 12次', '推举 3组 × 10次'] },
      };
      return gymPlans[day] || gymPlans['周一'];
    } else if (venue === '宿舍') {
      return { name: '徒手训练', exercises: ['俯卧撑 4组 × 15次', '深蹲 4组 × 20次', '平板支撑 4组 × 60秒'] };
    } else {
      return { name: '户外训练', exercises: ['慢跑 30分钟', '深蹲 4组 × 20次', '引体向上 4组 × 8次'] };
    }
  };

  const days = ['周一', '周三', '周五'];
  let content = `## ${goal}训练计划（${experience}）\n\n`;  // ← level 改成 experience
  content += `**目标**：${goal} | **场地**：${venue} | **频率**：每周 ${frequency} 次\n\n`;
  content += `---\n\n`;
  content += `### 🏋️ 训练安排\n\n`;

  for (let i = 0; i < Math.min(frequency, 3); i++) {
    const day = days[i] || `第${i+1}天`;
    const ex = getExercises(day);
    content += `**${day}：${ex.name}**\n\n`;
    content += `| 动作 | 组数 × 次数 | 休息 |\n`;
    content += `|------|------------|------|\n`;
    for (const exercise of ex.exercises) {
      const parts = exercise.split(' ');
      const name = parts.slice(0, -2).join(' ');
      const setsReps = parts.slice(-2).join(' ');
      content += `| ${name} | ${setsReps} | 60秒 |\n`;
    }
    content += `\n`;
  }

  content += `---\n\n`;
  content += `### 💡 注意事项\n\n`;
  content += `1. 每次训练前热身 5-10 分钟\n`;
  content += `2. 训练后拉伸 10 分钟\n`;
  content += `3. 保持充足睡眠和水分摄入\n`;
  content += `4. ${experience === '初级' ? '建议先从轻重量开始，逐步增加' : '注意动作质量，可适当增加负重'}\n`;  // ← level 改成 experience

  return content;
};

// ===== 1. 生成计划 =====
export const generatePlan = async (params: PlanParams) => {
  if (USE_MOCK) {
    await mockDelay(1200);
    const content = generateMockPlan(params);
    const newItem = {
      id: nextId++,
      goal: params.goal,
      content,
      createdAt: new Date().toISOString().split('T')[0],
    };
    mockHistory = [newItem, ...mockHistory];
    return { content };
  }
  return apiClient.post('/api/ai/plan', params);
};

// ===== 2. 历史计划列表 =====
export const getPlanHistory = async (): Promise<PlanHistory[]> => {
  if (USE_MOCK) {
    await mockDelay(300);
    return [...mockHistory];
  }
  return apiClient.get('/api/ai/plan/history');
};

// ===== 3. 保存计划 =====
export const savePlan = async (data: {
  goal: string;
  content: string;
  frequency: number;
  experience: string;   // ← level 改成 experience
  venue: string;
}) => {
  if (USE_MOCK) {
    await mockDelay(400);
    const exists = mockHistory.some(item => item.content === data.content);
    if (exists) return mockSuccess({ message: '计划已存在' });
    const newItem = {
      id: nextId++,
      goal: data.goal,
      content: data.content,
      createdAt: new Date().toISOString().split('T')[0],
    };
    mockHistory = [newItem, ...mockHistory];
    return mockSuccess(newItem);
  }
  return apiClient.post('/api/ai/plan/save', data);
};