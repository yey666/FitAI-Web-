import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { generatePlan, getPlanHistory, savePlan } from '@/api/ai';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { motion, AnimatePresence } from 'framer-motion';

// ===== 图标 =====
const Icons = {
  sparkles: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2L9 7l-5 2.5L9 12l3 5 3-5 5-2.5L15 7z" />
      <path d="M12 17v5" />
    </svg>
  ),
  history: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  ),
  save: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
      <polyline points="17 21 17 13 7 13 7 21" />
      <polyline points="7 3 7 8 15 8" />
    </svg>
  ),
  refresh: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 4 23 10 17 10" />
      <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
    </svg>
  ),
  check: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  target: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  ),
  mapPin: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  ),
  barChart: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20V10" />
      <path d="M18 20V4" />
      <path d="M6 20v-4" />
    </svg>
  ),
  calendarDays: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
      <path d="M8 14h.01" />
      <path d="M12 14h.01" />
      <path d="M16 14h.01" />
      <path d="M8 18h.01" />
      <path d="M12 18h.01" />
      <path d="M16 18h.01" />
    </svg>
  ),
  savedBadge: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  expand: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  ),
  collapse: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="18 15 12 9 6 15" />
    </svg>
  ),
  ai: (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2a10 10 0 0 0 0 20" />
      <path d="M12 2a10 10 0 0 1 0 20" />
      <path d="M12 2L2 7l10 5 10-5-10-5z" />
      <path d="M2 17l10 5 10-5" />
      <path d="M2 12l10 5 10-5" />
    </svg>
  ),
  arrowRight: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  ),
  arrowLeft: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  ),
};

interface PlanHistory {
  id: number;
  goal: string;
  content: string;
  createdAt: string;
}

const PlanSkeleton = () => {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-200/50">
        <div className="h-4 w-16 bg-slate-200 rounded animate-pulse" />
        <div className="h-6 w-20 bg-slate-200 rounded-full animate-pulse" />
      </div>
      <div className="flex-1 space-y-4">
        <div className="h-20 bg-slate-200 rounded-lg animate-pulse" />
        <div className="h-20 bg-slate-200 rounded-lg animate-pulse" />
        <div className="h-20 bg-slate-200 rounded-lg animate-pulse" />
        <div className="h-10 bg-slate-200 rounded-lg animate-pulse" />
      </div>
      <div className="flex items-center gap-3 mt-4 pt-4 border-t border-slate-200/50">
        <div className="h-10 w-24 bg-slate-200 rounded-lg animate-pulse" />
        <div className="h-10 w-24 bg-slate-200 rounded-lg animate-pulse" />
      </div>
    </div>
  );
};

// ===== 步骤配置 =====
const STEPS = [
  { id: 0, label: '目标', icon: Icons.target },
  { id: 1, label: '场地', icon: Icons.mapPin },
  { id: 2, label: '经验', icon: Icons.barChart },
  { id: 3, label: '频率', icon: Icons.calendarDays },
];

const AIPlan = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [form, setForm] = useState({ goal: '增肌', venue: '健身房', level: '初级', frequency: 3 });
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<string | null>(null);
  const [history, setHistory] = useState<PlanHistory[]>([]);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [expandedHistoryId, setExpandedHistoryId] = useState<number | null>(null);

  const goalOptions = ['增肌', '减脂', '塑形'];
  const venueOptions = ['健身房', '居家', '户外'];
  const levelOptions = ['新手', '初级', '中级', '高级'];
  const frequencyOptions = [2, 3, 4, 5, 6];

  useEffect(() => {
    getPlanHistory().then(setHistory).catch(() => {});
  }, []);

  // ===== 生成计划 =====
  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    setPlan(null);
    setSaveSuccess(false);
    setIsSaved(false);
    const params = {
      goal: form.goal,
      venue: form.venue,
      experience: form.level,
      frequency: form.frequency,
    };
    console.log('[生成计划] 请求参数:', params);
    try {
      const data = await generatePlan(params);
      console.log('[生成计划] 响应数据:', data);
      setPlan(data.content);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
      const newHistory = await getPlanHistory();
      setHistory(newHistory);
    } catch (err: any) {
      setError(err?.message || '生成失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  // ===== 保存计划 =====
  const handleSave = async () => {
    if (!plan) return;
    setSaveLoading(true);
    try {
      await savePlan({
        goal: form.goal,
        content: plan,
        frequency: form.frequency,
         experience: form.level,
        venue: form.venue,
      });
      setIsSaved(true);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
      const newHistory = await getPlanHistory();
      setHistory(newHistory);
    } catch (err: any) {
      setError(err?.message || '保存失败，请重试');
    } finally {
      setSaveLoading(false);
    }
  };

  const toggleHistoryExpand = (id: number) => {
    setExpandedHistoryId(expandedHistoryId === id ? null : id);
  };

  // ===== 步骤内容 =====
  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div>
            <p className="text-sm font-medium text-slate-700 mb-3">你的目标是什么？</p>
            <div className="grid grid-cols-3 gap-2">
              {goalOptions.map(opt => (
                <button
                  key={opt}
                  className={`py-2.5 text-sm rounded-lg transition-all font-light ${
                    form.goal === opt
                      ? 'bg-slate-800 text-white scale-[1.02] shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                  onClick={() => setForm({ ...form, goal: opt })}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        );
      case 1:
        return (
          <div>
            <p className="text-sm font-medium text-slate-700 mb-3">在哪里训练？</p>
            <div className="grid grid-cols-3 gap-2">
              {venueOptions.map(opt => (
                <button
                  key={opt}
                  className={`py-2.5 text-sm rounded-lg transition-all font-light ${
                    form.venue === opt
                      ? 'bg-slate-800 text-white scale-[1.02] shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                  onClick={() => setForm({ ...form, venue: opt })}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        );
      case 2:
        return (
          <div>
            <p className="text-sm font-medium text-slate-700 mb-3">训练经验如何？</p>
            <div className="grid grid-cols-3 gap-2">
              {levelOptions.map(opt => (
                <button
                  key={opt}
                  className={`py-2.5 text-sm rounded-lg transition-all font-light ${
                    form.level === opt
                      ? 'bg-slate-800 text-white scale-[1.02] shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                  onClick={() => setForm({ ...form, level: opt })}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        );
      case 3:
        return (
          <div>
            <p className="text-sm font-medium text-slate-700 mb-3">每周训练几天？</p>
            <div className="grid grid-cols-7 gap-1.5">
              {frequencyOptions.map(num => (
                <button
                  key={num}
                  className={`py-2.5 text-sm rounded-lg transition-all font-light ${
                    form.frequency === num
                      ? 'bg-slate-800 text-white scale-[1.02] shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                  onClick={() => setForm({ ...form, frequency: num })}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  // ===== 步骤进度 =====
  const progress = ((currentStep + 1) / STEPS.length) * 100;

  return (
    <div className="page-container space-y-6">
      {/* ===== 标题区 ===== */}
      <div className="page-header flex items-center justify-between">
        <div>
          <h1 className="page-title">AI 训练计划</h1>
          <p className="page-subtitle">AI 将根据你的目标和场地，生成专属训练方案</p>
        </div>
        <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="border-slate-200 text-slate-600 hover:bg-slate-50">
              {Icons.history}
              历史计划
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl p-0 bg-transparent border-0 shadow-none">
            <div className="bg-white rounded-xl shadow-xl p-6 max-h-[80vh] overflow-auto">
              <DialogHeader className="px-0 pt-0 pb-4">
                <DialogTitle className="text-slate-800 text-base font-light tracking-wide">历史计划</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                {history.length === 0 ? (
                  <p className="text-sm text-slate-400 font-light text-center py-4">暂无历史计划</p>
                ) : (
                  history.map(item => {
                    const isExpanded = expandedHistoryId === item.id;
                    return (
                      <div key={item.id} className="bg-slate-50 rounded-xl border border-slate-100 overflow-hidden">
                        <div
                          className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-100/50 transition-colors"
                          onClick={() => toggleHistoryExpand(item.id)}
                        >
                          <div>
                            <p className="text-sm font-medium text-slate-700">{item.goal} 计划</p>
                            <p className="text-xs text-slate-400 font-light">{item.createdAt}</p>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-slate-400 font-light">
                            {isExpanded ? '收起' : '展开'}
                            {isExpanded ? Icons.collapse : Icons.expand}
                          </div>
                        </div>
                        {isExpanded && (
                          <div className="p-4 pt-0 border-t border-slate-100">
                            <div className="bg-white rounded-lg p-4 prose prose-slate max-w-none prose-headings:text-slate-700 prose-headings:font-medium prose-strong:text-slate-700 prose-table:border prose-table:border-slate-200 prose-th:border prose-th:border-slate-200 prose-th:px-2.5 prose-th:py-1.5 prose-td:border prose-td:border-slate-200 prose-td:px-2.5 prose-td:py-1.5 prose-th:bg-slate-50 text-sm max-h-[400px] overflow-auto font-light">
                              <Markdown remarkPlugins={[remarkGfm]}>{item.content}</Markdown>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* ===== 主内容 ===== */}
      <div className="flex gap-6">
        {/* ===== 左栏：步骤式表单 ===== */}
        <div className="w-[540px] h-[647px] flex-shrink-0">
          <Card className="border-0 shadow-sm bg-white h-full">
            <CardContent className="p-6 flex flex-col h-full">
              {/* AI 打招呼 */}
              <div className="mb-4 pb-4 border-b border-slate-200/50">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center text-white">
                    {Icons.ai}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-700">AI 教练</p>
                    <p className="text-xs text-slate-400 font-light">告诉我你的情况</p>
                  </div>
                </div>
                <p className="text-sm text-slate-600 font-light mt-2 leading-relaxed">
                  我来帮你定制专属训练计划。先告诉我几个问题：
                </p>
              </div>

              {/* 步骤进度条 */}
              <div className="mb-5">
                <div className="flex justify-between text-xs text-slate-400 font-light mb-1.5">
                  <span>步骤 {currentStep + 1} / {STEPS.length}</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <div className="w-full h-1 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-slate-800 rounded-full transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              {/* 步骤内容 */}
              <div className="flex-1">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentStep}
                    initial={{ opacity: 0, x: 8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -8 }}
                    transition={{ duration: 0.2 }}
                    className="h-full"
                  >
                    {renderStepContent()}
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* 底部导航 */}
              <div className="pt-4 border-t border-slate-200/50 space-y-3">
                <div className="flex items-center gap-2">
                  {currentStep > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-slate-200 text-slate-600 hover:bg-slate-50"
                      onClick={() => setCurrentStep(currentStep - 1)}
                    >
                      {Icons.arrowLeft}
                      上一步
                    </Button>
                  )}
                  <div className="flex-1" />
                  {currentStep < STEPS.length - 1 ? (
                    <Button
                      className="bg-slate-800 hover:bg-slate-700 text-white"
                      onClick={() => setCurrentStep(currentStep + 1)}
                    >
                      下一步
                      {Icons.arrowRight}
                    </Button>
                  ) : (
                    <Button
                      className="bg-slate-800 hover:bg-slate-700 text-white"
                      onClick={handleGenerate}
                      disabled={loading}
                    >
                      {loading ? '生成中...' : '生成我的专属计划'}
                      {!loading && Icons.sparkles}
                    </Button>
                  )}
                </div>

                <div className="flex items-center justify-center gap-1.5 text-xs text-slate-400 font-light">
                  {Icons.check}
                  基于 {form.goal} · {form.level} · 每周{form.frequency}次
                </div>

                {saveSuccess && (
                  <div className="text-xs text-emerald-600 font-light text-center flex items-center justify-center gap-1.5">
                    {Icons.save} 已保存
                  </div>
                )}
                {error && (
                  <div className="text-xs text-red-500 font-light text-center">{error}</div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ===== 右栏：计划展示 ===== */}
        <div className="w-[540px] h-[647px] flex-shrink-0">
          <Card className="border-0 shadow-sm bg-white h-full">
            <CardContent className="p-6 flex flex-col h-full">
              {loading ? (
                <PlanSkeleton />
              ) : plan ? (
                <>
                  <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-200/50">
                    <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">你的计划</span>
                    <div className="flex items-center gap-2">
                      {isSaved && (
                        <span className="text-xs bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-full flex items-center gap-1 font-light">
                          {Icons.savedBadge} 已保存
                        </span>
                      )}
                      <span className="text-xs bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-full font-light">
                        {form.goal} · {form.level}
                      </span>
                    </div>
                  </div>

                  <div className="flex-1 bg-slate-50 rounded-lg p-4 prose prose-slate max-w-none prose-headings:text-slate-700 prose-headings:font-medium prose-strong:text-slate-700 prose-table:border prose-table:border-slate-200 prose-th:border prose-th:border-slate-200 prose-th:px-2.5 prose-th:py-1.5 prose-td:border prose-td:border-slate-200 prose-td:px-2.5 prose-td:py-1.5 prose-th:bg-slate-50 text-sm max-h-[500px] overflow-auto font-light">
                    <Markdown remarkPlugins={[remarkGfm]}>{plan}</Markdown>
                  </div>

                  <div className="flex items-center gap-3 mt-4 pt-4 border-t border-slate-200/50">
                    <Button
                      className={`${isSaved ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : 'bg-slate-800 hover:bg-slate-700 text-white'}`}
                      onClick={handleSave}
                      disabled={saveLoading || isSaved}
                    >
                      {saveLoading ? '保存中...' : isSaved ? '已保存' : '保存计划'}
                    </Button>
                    <Button
                      variant="outline"
                      className="border-slate-200 text-slate-600 hover:bg-slate-50"
                      onClick={handleGenerate}
                      disabled={loading}
                    >
                      {Icons.refresh}
                      重新生成
                    </Button>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center">
                  <div className="w-16 h-16 mb-4 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                    {Icons.ai}
                  </div>
                  <p className="text-sm text-slate-600 font-medium">配置左侧参数后生成计划</p>
                  <p className="text-xs text-slate-400 font-light mt-1 max-w-[200px]">
                    AI 将根据你的目标、场地和经验，定制专属训练方案
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AIPlan;