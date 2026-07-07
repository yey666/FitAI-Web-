import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { getExercises, getExerciseDetail } from '@/api/exercises';
import { motion } from 'framer-motion';

// ===== 图标 =====
const Icons = {
  back: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 12H5" />
      <path d="M12 19l-7-7 7-7" />
    </svg>
  ),
  search: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  ),
  close: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6L6 18" />
      <path d="M6 6l12 12" />
    </svg>
  ),
};

interface Exercise {
  id: number;
  name: string;
  target: string;
  difficulty: '初级' | '中级' | '高级';
  imageUrl: string;
  description: string;
  tips: string[];
  videoUrl?: string;
}

interface ExerciseDetail extends Exercise {
  steps: string[];
  commonMistakes: string[];
}

const Exercises = () => {
  const navigate = useNavigate();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [filteredExercises, setFilteredExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('全部');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedExercise, setSelectedExercise] = useState<ExerciseDetail | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);

  const tabs = ['全部', '胸', '背', '腿', '肩', '手臂', '核心'];

  const difficultyMap = {
    '初级': { label: '初级', color: 'bg-emerald-50 text-emerald-600' },
    '中级': { label: '中级', color: 'bg-amber-50 text-amber-600' },
    '高级': { label: '高级', color: 'bg-red-50 text-red-600' },
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getExercises();
        setExercises(data);
        setFilteredExercises(data);
      } catch (error) {
        console.error('加载动作库失败:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    let result = exercises;
    if (activeTab !== '全部') {
      result = result.filter(ex => ex.target === activeTab);
    }
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(ex =>
        ex.name.includes(query) ||
        ex.target.includes(query) ||
        ex.description.includes(query)
      );
    }
    setFilteredExercises(result);
  }, [activeTab, searchQuery, exercises]);

  const handleCardClick = async (id: number) => {
    setDetailOpen(true);
    setDetailLoading(true);
    try {
      const detail = await getExerciseDetail(id);
      setSelectedExercise(detail);
    } catch (error) {
      console.error('加载动作详情失败:', error);
    } finally {
      setDetailLoading(false);
    }
  };

  const getDifficultyLabel = (diff: string) => {
    return difficultyMap[diff as keyof typeof difficultyMap] || difficultyMap['初级'];
  };

  const getTargetEmoji = (target: string) => {
    const map: Record<string, string> = {
      '胸': '💪',
      '背': '🔙',
      '腿': '🦵',
      '肩': '🏋️',
      '手臂': '💪',
      '核心': '🔥',
    };
    return map[target] || '💪';
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-slate-100 rounded-lg h-48 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="page-container space-y-6">
      {/* ===== 标题区 ===== */}
      <div className="page-header flex items-center justify-between">
        <div>
          <h1 className="page-title">动作库</h1>
          <p className="page-subtitle">浏览标准训练动作，学习正确姿势</p>
        </div>
        <div className="text-sm text-slate-400 font-light">
          共 {filteredExercises.length} 个动作
        </div>
      </div>

      {/* ===== 搜索 + 筛选 ===== */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            {Icons.search}
          </div>
          <input
            type="text"
            placeholder="搜索动作名称、部位..."
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 bg-white text-sm text-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-300 transition-colors font-light placeholder:text-slate-400"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {tabs.map(tab => (
            <button
              key={tab}
              className={`px-3.5 py-1.5 text-xs rounded-full transition-colors font-light ${
                activeTab === tab
                  ? 'bg-slate-800 text-white'
                  : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
              }`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* ===== 动作卡片网格 ===== */}
      {filteredExercises.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-sm text-slate-400 font-light">没有找到匹配的动作</p>
          <button
            className="mt-2 text-sm text-slate-500 hover:text-slate-700 underline font-light"
            onClick={() => { setSearchQuery(''); setActiveTab('全部'); }}
          >
            清除筛选条件
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredExercises.map((exercise, idx) => {
            const diff = getDifficultyLabel(exercise.difficulty);
            return (
              <motion.div
                key={exercise.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: idx * 0.04 }}
                className="cursor-pointer"
                onClick={() => handleCardClick(exercise.id)}
              >
                <Card className="border-0 shadow-sm bg-white rounded-lg overflow-hidden hover:shadow-md transition-all duration-200 hover:-translate-y-0.5">
                  {/* 图片区 */}
                  <div className="aspect-[4/3] bg-slate-100 overflow-hidden relative">
                    {exercise.imageUrl ? (
                      <img
                        src={exercise.imageUrl}
                        alt={exercise.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-slate-100 to-slate-200/50 flex items-center justify-center text-5xl text-slate-300">
                        💪
                      </div>
                    )}
                    <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-full bg-black/40 backdrop-blur-sm text-white text-[10px] font-light">
                      {getTargetEmoji(exercise.target)} {exercise.target}
                    </div>
                  </div>

                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-sm font-medium text-slate-700">{exercise.name}</h3>
                        <p className="text-xs text-slate-400 font-light mt-0.5 line-clamp-1">{exercise.description}</p>
                      </div>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full ${diff.color} font-light flex-shrink-0 ml-2`}>
                        {diff.label}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* ===== 详情弹窗 ===== */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0 bg-transparent border-0 shadow-none">
          <div className="bg-white rounded-xl shadow-xl p-6">
            <DialogHeader className="px-0 pt-0 pb-4">
              <DialogTitle className="text-slate-800 text-base font-light tracking-wide">动作详情</DialogTitle>
            </DialogHeader>

            {detailLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-slate-300 border-t-slate-600" />
              </div>
            ) : selectedExercise ? (
              <div className="space-y-5">
                {/* 图片 */}
                <div className="aspect-video bg-slate-100 rounded-lg overflow-hidden relative">
                  {selectedExercise.imageUrl ? (
                    <img src={selectedExercise.imageUrl} alt={selectedExercise.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-slate-100 to-slate-200/50 flex items-center justify-center text-6xl text-slate-300">
                      💪
                    </div>
                  )}
                  <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-sm text-white text-xs font-light">
                    {selectedExercise.target}
                  </div>
                </div>

                {/* 标题 + 难度 */}
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-medium text-slate-700">{selectedExercise.name}</h2>
                  <span className={`text-xs px-3 py-1 rounded-full ${getDifficultyLabel(selectedExercise.difficulty).color} font-light`}>
                    {selectedExercise.difficulty}
                  </span>
                </div>

                {/* 描述 */}
                <p className="text-sm text-slate-600 font-light leading-relaxed">{selectedExercise.description}</p>

                {/* 步骤 */}
                {selectedExercise.steps && selectedExercise.steps.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">执行步骤</p>
                    <ol className="list-decimal list-inside space-y-1 text-sm text-slate-600 font-light">
                      {selectedExercise.steps.map((step, idx) => (
                        <li key={idx}>{step}</li>
                      ))}
                    </ol>
                  </div>
                )}

                {/* 注意事项 */}
                {selectedExercise.tips && selectedExercise.tips.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">注意事项</p>
                    <ul className="list-disc list-inside space-y-1 text-sm text-slate-600 font-light">
                      {selectedExercise.tips.map((tip, idx) => (
                        <li key={idx}>{tip}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* 常见错误 */}
                {selectedExercise.commonMistakes && selectedExercise.commonMistakes.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">常见错误</p>
                    <ul className="list-disc list-inside space-y-1 text-sm text-amber-600 font-light">
                      {selectedExercise.commonMistakes.map((mistake, idx) => (
                        <li key={idx}>{mistake}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-center text-sm text-slate-400 font-light py-8">加载失败，请重试</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Exercises;