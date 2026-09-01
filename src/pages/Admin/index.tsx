import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LineChart, Line, AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import { motion } from 'framer-motion';
import { getAdminStats, getAdminTrend } from '@/api/admin';
import { getRecentActivities } from '@/api/home';

// ===== 图标 =====
const Icons = {
  users: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  checkin: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>,
  workout: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M6 6L18 18"/><path d="M18 6L6 18"/><rect x="2" y="8" width="4" height="8" rx="1"/><rect x="18" y="8" width="4" height="8" rx="1"/></svg>,
};

// ===== 类型定义 =====
interface StatCard {
  label: string;
  value: number | string;
  change: number;
  icon: React.ReactNode;
  color: string;
}

interface StatsData {
  totalUsers: number;
  totalCheckins: number;
  totalExercises: number;
}

const Admin = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [statsData, setStatsData] = useState<StatsData>({
    totalUsers: 0,
    totalCheckins: 0,
    totalExercises: 0,
  });
  const [trendData, setTrendData] = useState<{ date: string; 打卡: number }[]>([]);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);

  const [stats, setStats] = useState<StatCard[]>([
    { label: '总用户数', value: 0, change: 0, icon: Icons.users, color: '#1e293b' },
    { label: '打卡总次数', value: 0, change: 0, icon: Icons.checkin, color: '#8b5cf6' },
    { label: '动作总数', value: 0, change: 0, icon: Icons.workout, color: '#10b981' },
  ]);

  const COLORS = ['#8b5cf6', '#10b981'];

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [statsRes, trendRes, activitiesRes] = await Promise.all([
        getAdminStats(),
        getAdminTrend(7),
        getRecentActivities(),
      ]);

      setStatsData({
        totalUsers: statsRes.totalUsers || 0,
        totalCheckins: statsRes.totalCheckins || 0,
        totalExercises: statsRes.totalExercises || 0,
      });

      setStats([
        { label: '总用户数', value: statsRes.totalUsers || 0, change: 0, icon: Icons.users, color: '#1e293b' },
        { label: '打卡总次数', value: statsRes.totalCheckins || 0, change: 0, icon: Icons.checkin, color: '#8b5cf6' },
        { label: '动作总数', value: statsRes.totalExercises || 0, change: 0, icon: Icons.workout, color: '#10b981' },
      ]);

      const chartData = (trendRes || []).map((item: any) => ({
        date: item.date || '',
        打卡: item.count || 0,
      }));
      setTrendData(chartData);

      const activities = (activitiesRes || []).map((item: any) => ({
        id: item.id,
        user: item.username || '用户',
        action: item.type === 'checkin' ? '发布了打卡' : '动态',
        detail: item.content || item.title || '',
        time: item.time || '刚刚',
        type: item.type || 'checkin',
      }));
      setRecentActivities(activities);

    } catch (error) {
      console.error('获取统计数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-6 text-center text-slate-400">加载中...</div>;
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* 页面标题 */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">数据总览</h1>
        <p className="text-sm text-slate-400">平台运营数据实时监控</p>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {stats.map((stat, idx) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">{stat.label}</p>
                <p className="text-2xl font-bold text-slate-800 mt-1">{stat.value}</p>
              </div>
              <div className="p-2 rounded-lg bg-slate-50 text-slate-600">{stat.icon}</div>
            </div>
            <div className="flex items-center gap-1.5 mt-3">
              <span className={`text-xs font-medium ${stat.change >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                {stat.change >= 0 ? '↑' : '↓'} {Math.abs(stat.change)}%
              </span>
              <span className="text-xs text-slate-400">较上周</span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* 图表区域 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        {/* 趋势图 */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-100 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">平台趋势</p>
              <p className="text-sm text-slate-600">近7天数据变化</p>
            </div>
            <div className="flex gap-3 text-xs text-slate-400">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-purple-500"/>打卡</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={trendData}>
              <defs>
                <linearGradient id="checkinGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.2}/>
                  <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false}/>
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false}/>
              <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false}/>
              <Tooltip contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}/>
              <Area type="monotone" dataKey="打卡" stroke="#8b5cf6" strokeWidth={2} fill="url(#checkinGrad)"/>
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* 饼图 */}
        <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">数据分布</p>
          <p className="text-sm text-slate-600 mb-3">平台数据占比</p>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie
                data={[
                  { name: '打卡', value: statsData.totalCheckins || 0 },
                  { name: '动作', value: statsData.totalExercises || 0 },
                ]}
                cx="50%" cy="50%"
                innerRadius={40} outerRadius={70}
                paddingAngle={2}
                dataKey="value"
              >
                <Cell fill="#8b5cf6"/>
                <Cell fill="#10b981"/>
              </Pie>
              <Tooltip contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}/>
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-4 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: '#8b5cf6' }}/>
              打卡 ({statsData.totalCheckins})
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: '#10b981' }}/>
              动作 ({statsData.totalExercises})
            </span>
          </div>
        </div>
      </div>

      {/* 快捷入口 + 最近活动 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm">
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-3">快捷入口</p>
            <div className="space-y-2">
              {[
                { label: '用户管理', path: '/admin/users', icon: '👥', desc: '查看/管理所有用户' },
                { label: '打卡管理', path: '/admin/checkins', icon: '📋', desc: '审核/删除打卡内容' },
                { label: '动作管理', path: '/admin/exercises', icon: '💪', desc: '增删改训练动作' },
              ].map((item) => (
                <div
                  key={item.path}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors"
                  onClick={() => navigate(item.path)}
                >
                  <span className="text-xl">{item.icon}</span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-700">{item.label}</p>
                    <p className="text-xs text-slate-400">{item.desc}</p>
                  </div>
                  <span className="text-slate-300">›</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-100 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">最近动态</p>
              <p className="text-sm text-slate-600">实时平台活动</p>
            </div>
            <span className="text-xs text-slate-400">共 {recentActivities.length} 条</span>
          </div>
          <div className="space-y-3">
            {recentActivities.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-4">暂无动态</p>
            ) : (
              recentActivities.map((item, idx) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.04 }}
                  className="flex items-center gap-3 pb-3 border-b border-slate-50 last:border-0 last:pb-0"
                >
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium bg-slate-100 text-slate-600">
                    {item.user?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-700">
                      <span className="font-medium">{item.user}</span>
                      <span className="text-slate-500"> {item.action}</span>
                    </p>
                    <p className="text-xs text-slate-400 truncate">{item.detail}</p>
                  </div>
                  <span className="text-xs text-slate-300 flex-shrink-0">{item.time}</span>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Admin;