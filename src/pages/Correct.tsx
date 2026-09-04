import { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { uploadVideo, analyzeVideo, getCorrectHistory } from '@/api/correct';

// ===== 图标 =====
const Icons = {
  upload: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  ),
  video: (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="5" width="14" height="14" rx="2" />
      <polyline points="22 7 16 12 22 17" />
    </svg>
  ),
  history: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  ),
  analyze: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  ),
  issues: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  ),
};

// ===== 类型定义 =====
interface AnalyzeResult {
  score: number;
  issues: string[];
  suggestions: string[];
}

interface HistoryItem {
  id: number;
  exerciseName: string;
  score: number;
  createdAt: string;
}

// ===== 思考中指示器：三个跳动的小点 =====
const ThinkingDots = () => (
  <span className="inline-flex items-center gap-1 ml-1">
    {[0, 150, 300].map((delay) => (
      <span
        key={delay}
        className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce"
        style={{ animationDelay: `${delay}ms` }}
      />
    ))}
  </span>
);

// ===== 思考中状态块：emoji + 标题 + 跳动点 + 副标题 =====
const ThinkingState = ({ emoji, title, subtitle }: { emoji: string; title: string; subtitle: string }) => (
  <div className="mt-6 flex flex-col items-center justify-center py-12 text-slate-500">
    <span className="text-4xl mb-4">{emoji}</span>
    <p className="text-sm font-light flex items-center">
      {title}
      <ThinkingDots />
    </p>
    <p className="text-xs text-slate-400 font-light mt-2">{subtitle}</p>
  </div>
);

const Correct = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [exerciseName, setExerciseName] = useState('深蹲');
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState('');
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalyzeResult | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getCorrectHistory().then(setHistory).catch(console.error);
  }, []);

  // 卸载或更换视频时释放本地预览的 object URL
  useEffect(() => {
    return () => {
      if (videoUrl) URL.revokeObjectURL(videoUrl);
    };
  }, [videoUrl]);

  // 点击按钮 → 打开文件选择器
  const handleUploadClick = () => {
    setError(null);
    fileInputRef.current?.click();
  };

  // 选择视频后：本地预览 → 上传 → 分析
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setResult(null);

    if (videoUrl) URL.revokeObjectURL(videoUrl);
    setVideoUrl(URL.createObjectURL(file));
    setFileName(file.name);

    setUploading(true);
    setAnalyzing(true);
    try {
      // 1) 上传视频，拿到后端返回的媒体地址 mediaUrl
      const uploadedUrl = await uploadVideo(file);
      // 2) 用 mediaUrl 自动调用分析接口
      const data = await analyzeVideo({ videoUrl: uploadedUrl, exerciseName });
      setResult(data);
    } catch (err: any) {
      console.error('分析失败:', err);
      setError(err?.message || '分析失败，请稍后重试');
    } finally {
      setUploading(false);
      setAnalyzing(false);
    }

    // 3) 刷新历史记录（失败不影响分析结果展示，不触发红色错误横幅）
    getCorrectHistory().then(setHistory).catch(() => {});

    // 重置 input，允许再次选择同一个文件
    e.target.value = '';
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-600';
    if (score >= 60) return 'text-amber-600';
    return 'text-red-600';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return '动作标准';
    if (score >= 60) return '基本正确';
    return '需要改进';
  };

  const getScoreStroke = (score: number) => {
    if (score >= 80) return '#22c55e';
    if (score >= 60) return '#eab308';
    return '#ef4444';
  };

  const isBusy = uploading || analyzing;

  const statusText = () => {
    if (error) return '失败';
    if (uploading) return '上传中...';
    if (analyzing) return 'AI 分析中...';
    if (result) return '分析完成';
    return '等待上传';
  };

  const statusColor = () => {
    if (error) return 'bg-red-400';
    if (isBusy) return 'bg-amber-400 animate-pulse';
    if (result) return 'bg-emerald-400';
    return 'bg-slate-300';
  };

  return (
    <div className="max-w-4xl mx-auto px-5 py-7 space-y-7">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          ⚠️ {error}
        </div>
      )}

      {/* ===== 标题区 ===== */}
      <div className="flex items-center justify-between pb-5 border-b border-slate-200/50">
        <div>
          <h1 className="text-xl font-light text-slate-800 tracking-tight">动作纠正</h1>
          <p className="text-sm text-slate-400 font-light mt-0.5">上传训练视频，AI 分析动作质量</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            className="text-sm border border-slate-200 rounded-md px-3 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-300 font-light"
            value={exerciseName}
            onChange={(e) => setExerciseName(e.target.value)}
          >
            <option>深蹲</option>
            <option>卧推</option>
            <option>硬拉</option>
          </select>
          <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="border-slate-200 text-slate-600 hover:bg-slate-100 rounded-md px-4 py-1.5 text-sm font-light flex items-center gap-1.5">
                {Icons.history}
                历史记录
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md p-0 bg-transparent border-0 shadow-none">
              <div className="bg-white rounded-xl shadow-2xl p-6">
                <DialogHeader className="px-0 pt-0 pb-4">
                  <DialogTitle className="text-slate-800 text-base font-light tracking-wide">纠正历史</DialogTitle>
                </DialogHeader>
                <div className="space-y-2 max-h-80 overflow-auto">
                  {history.length === 0 ? (
                    <p className="text-sm text-slate-400 font-light text-center py-4">暂无纠正记录</p>
                  ) : (
                    history.map((item) => (
                      <div key={item.id} className="flex justify-between items-center bg-slate-50/60 rounded-lg p-3">
                        <div>
                          <p className="text-sm font-medium text-slate-700">{item.exerciseName}</p>
                          <p className="text-xs text-slate-400 font-light">{item.createdAt}</p>
                        </div>
                        <span className={`text-sm font-medium ${getScoreColor(item.score)}`}>{item.score}分</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* ===== 上传卡片 ===== */}
      <Card className="border-0 shadow-none bg-slate-50/60 rounded-xl overflow-hidden">
        <CardContent className="p-0">
          <div className="relative aspect-video bg-slate-200">
            {videoUrl ? (
              <video
                key={videoUrl}
                src={videoUrl}
                controls
                playsInline
                className="absolute inset-0 w-full h-full object-contain bg-black"
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 pointer-events-none">
                <span className="text-6xl mb-3 opacity-30">{Icons.video}</span>
                <p className="text-sm font-light">点击下方「上传视频」选择训练视频</p>
                <p className="text-xs text-slate-300 font-light mt-1">支持 mp4、webm 等常见视频格式</p>
              </div>
            )}

            <div className="absolute top-4 left-4 flex items-center gap-2 bg-black/40 backdrop-blur-sm px-3 py-1.5 rounded-full">
              <span className={`w-2 h-2 rounded-full ${statusColor()}`} />
              <span className="text-xs text-white/80 font-light">{statusText()}</span>
            </div>
            {fileName && (
              <div className="absolute bottom-4 left-4 bg-black/40 backdrop-blur-sm px-3 py-1.5 rounded-full">
                <span className="text-xs text-white/80 font-light truncate">{fileName}</span>
              </div>
            )}
          </div>

          <div className="p-5 flex items-center justify-between bg-white">
            <Button
              className="bg-slate-700 hover:bg-slate-800 text-white rounded-lg px-5 py-2 text-sm font-normal tracking-wide transition-all duration-200 flex items-center gap-2"
              onClick={handleUploadClick}
              disabled={isBusy}
            >
              {isBusy ? Icons.analyze : Icons.upload}
              {isBusy ? '分析中...' : '上传视频'}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="video/*"
              className="hidden"
              onChange={handleFileChange}
            />
            <span className="text-xs text-slate-400 font-light">{exerciseName} · 上传后自动分析</span>
          </div>
        </CardContent>
      </Card>

      {/* ===== 结果区 ===== */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 问题列表 */}
        <Card className="border-0 shadow-none bg-slate-50/60 rounded-xl">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              {Icons.issues}
              <span className="text-xs text-slate-500 font-light uppercase tracking-wider">发现的问题</span>
            </div>
            {result && result.issues?.length > 0 ? (
              <ul className="space-y-2.5">
                {result.issues.map((item, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-3 bg-white rounded-lg p-3 border border-slate-200/50"
                  >
                    <span className="w-5 h-5 flex-shrink-0 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center text-xs font-medium">
                      {idx + 1}
                    </span>
                    <span className="text-sm text-slate-600 font-light leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            ) : analyzing ? (
              <ThinkingState emoji="🤔" title="AI 正在分析动作" subtitle="🔍 检测关节角度..." />
            ) : (
              <p className="text-sm text-slate-400 font-light text-center py-10">上传视频并分析后显示问题</p>
            )}
          </CardContent>
        </Card>

        {/* 评分 + 建议 */}
        <Card className="border-0 shadow-none bg-slate-50/60 rounded-xl">
          <CardContent className="p-6">
            <span className="text-xs text-slate-500 font-light uppercase tracking-wider">分析结果</span>
            {result ? (
              <div className="mt-4 space-y-4">
                <div className="flex items-center gap-4">
                  <div className="relative w-16 h-16 flex-shrink-0">
                    <svg className="w-16 h-16 transform -rotate-90">
                      <circle cx="32" cy="32" r="28" stroke="#e2e8f0" strokeWidth="4" fill="none" />
                      <circle
                        cx="32"
                        cy="32"
                        r="28"
                        stroke={getScoreStroke(result.score)}
                        strokeWidth="4"
                        fill="none"
                        strokeDasharray={`${(result.score / 100) * 175.93} 175.93`}
                        strokeLinecap="round"
                        className="transition-all duration-1000"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center text-sm font-medium text-slate-700">
                      {result.score}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-700">{getScoreLabel(result.score)}</p>
                    <p className={`text-sm font-medium ${getScoreColor(result.score)}`}>{result.score}分</p>
                  </div>
                </div>
                <div className="bg-white rounded-lg p-4 border border-slate-200/50">
                  <p className="text-xs text-slate-500 font-light mb-2">纠正建议</p>
                  {result.suggestions?.length > 0 ? (
                    <ul className="space-y-1.5">
                      {result.suggestions.map((s, i) => (
                        <li key={i} className="text-sm text-slate-600 font-light flex items-start gap-2">
                          <span className="text-slate-300 mt-0.5 flex-shrink-0">{i + 1}.</span>
                          <span>{s}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-slate-400 font-light">暂无建议</p>
                  )}
                </div>
              </div>
            ) : analyzing ? (
              <ThinkingState emoji="🧠" title="生成评分与建议中" subtitle="📊 生成分析报告..." />
            ) : error ? (
              <div className="mt-6 flex flex-col items-center justify-center py-12 text-slate-400">
                <span className="text-4xl mb-4">😕</span>
                <p className="text-sm font-light text-red-500">分析失败，请稍后重试</p>
                <p className="text-xs text-slate-400 font-light mt-2">可检查网络后重新上传视频</p>
              </div>
            ) : (
              <div className="mt-4 text-center py-10 text-slate-400">
                <p className="text-sm font-light">上传视频后查看 AI 分析</p>
                <p className="text-xs font-light mt-1">AI 将分析你的动作姿态并给出建议</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Correct;
