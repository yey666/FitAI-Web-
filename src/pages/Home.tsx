import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/useAuthStore';
import { getStats, getRecentActivities, getWeeklyTrend, getTodayRecommendation } from '@/api/home';
import { motion } from 'framer-motion';

// ===== 图标 =====
const Icons = {
  target: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  ),
  clock: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  ),
  fire: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22c3.314 0 6-2.686 6-6 0-4-6-10-6-10S6 12 6 16c0 3.314 2.686 6 6 6z" />
      <path d="M12 13c.552 0 1-.448 1-1s-.448-1-1-1-1 .448-1 1 .448 1 1 1z" />
    </svg>
  ),
  calendar: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  ),
  dumbbell: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 6L18 18" />
      <path d="M18 6L6 18" />
      <rect x="2" y="8" width="4" height="8" rx="1" />
      <rect x="18" y="8" width="4" height="8" rx="1" />
    </svg>
  ),
  targetCorrect: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 8v4l3 3" />
    </svg>
  ),
  sparkles: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2L9 7l-5 2.5L9 12l3 5 3-5 5-2.5L15 7z" />
      <path d="M12 17v5" />
    </svg>
  ),
  arrow: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  ),
  chart: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 3v18h18" />
      <path d="M7 14l4-4 4 4 6-6" />
    </svg>
  ),
};

interface Stats {
  totalWorkouts: number;
  totalDuration: number;
  totalCalories: number;
  streakDays: number;
}

interface Activity {
  id: number;
  type: 'workout' | 'checkin' | 'correct';
  title: string;
  description: string;
  time: string;
}

interface WeeklyData {
  day: string;
  count: number;
  duration: number;
}

interface Recommendation {
  id: number;
  name: string;
  target: string;
  difficulty: '初级' | '中级' | '高级';
  description: string;
}

const Home = () => {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const [stats, setStats] = useState<Stats>({
    totalWorkouts: 0,
    totalDuration: 0,
    totalCalories: 0,
    streakDays: 0,
  });
  const [activities, setActivities] = useState<Activity[]>([]);
  const [weeklyData, setWeeklyData] = useState<WeeklyData[]>([]);
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsData, activitiesData, weeklyData, recData] = await Promise.all([
          getStats(),
          getRecentActivities(),
          getWeeklyTrend(),
          getTodayRecommendation(),
        ]);
        setStats(statsData);
        setActivities(activitiesData);
        setWeeklyData(weeklyData);
        setRecommendation(recData);
      } catch (error) {
        console.error('加载首页数据失败:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 6) return '夜深了';
    if (hour < 12) return '早上好';
    if (hour < 14) return '中午好';
    if (hour < 18) return '下午好';
    if (hour < 22) return '晚上好';
    return '夜深了';
  };

  const weeklyTotal = weeklyData.reduce((sum, d) => sum + d.count, 0);
  const weeklyGoal = 10;
  const progressPercent = Math.min(Math.round((weeklyTotal / weeklyGoal) * 100), 100);

  const statCards = [
    { label: '训练次数', value: stats.totalWorkouts, unit: '次', icon: Icons.target },
    { label: '训练时长', value: stats.totalDuration, unit: '分钟', icon: Icons.clock },
    { label: '消耗热量', value: stats.totalCalories, unit: '千卡', icon: Icons.fire },
    { label: '连续打卡', value: stats.streakDays, unit: '天', icon: Icons.calendar },
  ];

  const quickActions = [
    { label: '开始训练', description: '记录训练数据', icon: Icons.dumbbell, onClick: () => navigate('/workout') },
    { label: '动作纠正', description: 'AI 动作分析', icon: Icons.targetCorrect, onClick: () => navigate('/correct') },
    { label: 'AI 计划', description: '生成训练方案', icon: Icons.sparkles, onClick: () => navigate('/ai-plan') },
  ];

  if (loading) {
    return (
      <div className="page-container">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-slate-100 rounded-lg h-24 animate-pulse" />
          ))}
        </div>
        <div className="mt-6 bg-slate-100 rounded-lg h-48 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="page-container space-y-8">
      {/* ===== 欢迎区 ===== */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-light text-slate-800 tracking-tight">
            {getGreeting()}，{user?.username || '朋友'}
          </h1>
          <p className="text-sm text-slate-400 font-light mt-0.5">保持运动，遇见更好的自己</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400 font-light">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400" />
          本周进度 {progressPercent}%
        </div>
      </motion.div>

      {/* ===== 统计卡片 ===== */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {statCards.map((stat, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: idx * 0.05 }}
          >
            <Card className="border-0 shadow-sm bg-white">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="stat-label">{stat.label}</p>
                    <p className="stat-number mt-0.5">
                      {stat.value} <span className="text-sm font-light text-slate-300">{stat.unit}</span>
                    </p>
                  </div>
                  <div className="p-1.5 rounded-lg bg-slate-50 text-slate-400">{stat.icon}</div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* ===== 周趋势 + 今日推荐 ===== */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="md:col-span-2 border-0 shadow-sm bg-white">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-slate-400">
                {Icons.chart}
                <span className="text-xs font-medium uppercase tracking-wider">本周训练</span>
              </div>
              <span className="text-xs text-slate-400 font-light">共 {weeklyTotal} 次</span>
            </div>
            <div className="flex items-end justify-between h-20 gap-1.5">
              {weeklyData.map((item, idx) => {
                const height = weeklyTotal > 0 ? (item.count / Math.max(...weeklyData.map(d => d.count), 1)) * 100 : 0;
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full max-w-8 bg-slate-300 rounded-sm transition-all duration-500" style={{ height: `${Math.max(height * 0.8, 4)}%` }} />
                    <span className="text-[10px] text-slate-400 font-light">{item.day}</span>
                  </div>
                );
              })}
            </div>
            <div className="flex justify-between mt-2.5 text-[10px] text-slate-300 font-light">
              <span>目标 {weeklyGoal} 次</span>
              <span>{progressPercent}%</span>
            </div>
            <div className="w-full h-1 bg-slate-200 rounded-full mt-1.5 overflow-hidden">
              <div className="h-full bg-slate-400 rounded-full transition-all duration-700" style={{ width: `${progressPercent}%` }} />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-white">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-3 text-slate-400">
              <span className="text-sm">{Icons.sparkles}</span>
              <span className="text-xs font-medium uppercase tracking-wider">今日推荐</span>
            </div>
            {recommendation ? (
              <div>
                <p className="text-sm font-medium text-slate-700">{recommendation.name}</p>
                <p className="text-xs text-slate-400 font-light mt-0.5">{recommendation.target}</p>
                <p className="text-xs text-slate-400 font-light mt-1 line-clamp-2">{recommendation.description}</p>
                <button
                  onClick={() => navigate('/exercises')}
                  className="mt-2.5 text-xs text-slate-400 hover:text-slate-600 transition-colors flex items-center gap-0.5"
                >
                  查看详情 {Icons.arrow}
                </button>
              </div>
            ) : (
              <p className="text-sm text-slate-400 font-light">暂无推荐</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ===== 快速入口 ===== */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {quickActions.map((action, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 + idx * 0.05 }}
            className="bg-slate-800 hover:bg-slate-700 rounded-lg p-4 text-white cursor-pointer transition-all duration-200 hover:shadow-md flex items-center gap-3"
            onClick={action.onClick}
          >
            <div className="p-1.5 bg-white/10 rounded-lg">{action.icon}</div>
            <div>
              <p className="text-sm font-medium">{action.label}</p>
              <p className="text-xs text-white/60 font-light">{action.description}</p>
            </div>
            <div className="ml-auto opacity-40">{Icons.arrow}</div>
          </motion.div>
        ))}
      </div>

      {/* ===== 最近动态 ===== */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-medium text-slate-400 uppercase tracking-wider">最近动态</h2>
       <span 
        className="text-xs text-slate-300 font-light cursor-pointer hover:text-slate-500 transition-colors flex items-center gap-0.5"
  onClick={() => navigate('/community')}
>
         查看全部 {Icons.arrow}
        </span>
        </div>
        <Card className="border-0 shadow-sm bg-white">
          <CardContent className="p-0 divide-y divide-slate-100/60">
            {activities.length === 0 ? (
              <p className="text-sm text-slate-400 font-light text-center py-8">暂无动态</p>
            ) : (
              activities.slice(0, 5).map((activity) => (
                <div key={activity.id} className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-xs text-slate-400">{Icons.calendar}</span>
                    <span className="text-sm text-slate-600 font-light truncate">{activity.title}</span>
                    <span className="text-xs text-slate-400 font-light truncate hidden sm:inline">{activity.description}</span>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 font-light">{activity.type}</span>
                    <span className="text-xs text-slate-300 font-light">{activity.time}</span>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Home;