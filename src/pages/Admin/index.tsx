import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LineChart, Line, AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import { motion } from 'framer-motion';

const Icons = {
  users: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  active: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  workout: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M6 6L18 18"/><path d="M18 6L6 18"/><rect x="2" y="8" width="4" height="8" rx="1"/><rect x="18" y="8" width="4" height="8" rx="1"/></svg>,
  checkin: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>,
  trendUp: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>,
  arrow: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>,
  activity: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
  medal: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="8" r="6"/><path d="M8.5 14.5L5 21l7-3 7 3-3.5-6.5"/></svg>,
};

interface StatCard {
  label: string;
  value: number | string;
  change: number;
  icon: React.ReactNode;
  color: string;
}

const Admin = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  // 模拟数据
  const stats: StatCard[] = [
    { label: '总用户数', value: 1, change: 12.5, icon: Icons.users, color: '#1e293b' },
    { label: '今日活跃', value: 23, change: 8.3, icon: Icons.active, color: '#3b82f6' },
    { label: '训练总次数', value: 892, change: 18.7, icon: Icons.workout, color: '#10b981' },
    { label: '打卡总次数', value: 345, change: -2.4, icon: Icons.checkin, color: '#8b5cf6' },
  ];

  const trendData = [
    { date: '6/30', 用户: 120, 训练: 45, 打卡: 23 },
    { date: '7/01', 用户: 128, 训练: 52, 打卡: 28 },
    { date: '7/02', 用户: 135, 训练: 48, 打卡: 31 },
    { date: '7/03', 用户: 142, 训练: 61, 打卡: 35 },
    { date: '7/04', 用户: 148, 训练: 55, 打卡: 29 },
    { date: '7/05', 用户: 152, 训练: 70, 打卡: 42 },
    { date: '7/06', 用户: 156, 训练: 63, 打卡: 38 },
  ];

  const pieData = [
    { name: '训练', value: 892 },
    { name: '打卡', value: 345 },
    { name: '纠正', value: 156 },
  ];
  const COLORS = ['#1e293b', '#3b82f6', '#8b5cf6'];

  const recentActivities = [
    { id: 1, user: 'Alex Chen', action: '完成了训练', detail: '深蹲 100kg × 4组', time: '2分钟前', type: 'workout' },
    { id: 2, user: 'Sarah Wang', action: '发布了打卡', detail: '晨跑 5km，配速 5:30', time: '15分钟前', type: 'checkin' },
    { id: 3, user: 'Mike Zhang', action: '注册了账号', detail: '新用户加入', time: '1小时前', type: 'user' },
    { id: 4, user: 'Lisa Chen', action: '进行了动作纠正', detail: '卧推动作分析得分 85', time: '3小时前', type: 'correct' },
    { id: 5, user: 'Tom Li', action: '完成了训练', detail: '硬拉 120kg × 3组', time: '5小时前', type: 'workout' },
  ];

  useEffect(() => {
    setTimeout(() => setLoading(false), 500);
  }, []);

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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
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
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-slate-800"/>用户</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500"/>训练</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-purple-500"/>打卡</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={trendData}>
              <defs>
                <linearGradient id="userGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#1e293b" stopOpacity={0.2}/><stop offset="100%" stopColor="#1e293b" stopOpacity={0}/></linearGradient>
                <linearGradient id="workoutGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#3b82f6" stopOpacity={0.2}/><stop offset="100%" stopColor="#3b82f6" stopOpacity={0}/></linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false}/>
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false}/>
              <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false}/>
              <Tooltip contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}/>
              <Area type="monotone" dataKey="用户" stroke="#1e293b" strokeWidth={2} fill="url(#userGrad)"/>
              <Area type="monotone" dataKey="训练" stroke="#3b82f6" strokeWidth={2} fill="url(#workoutGrad)"/>
              <Area type="monotone" dataKey="打卡" stroke="#8b5cf6" strokeWidth={2} fill="none"/>
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* 饼图 */}
        <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">行为分布</p>
          <p className="text-sm text-slate-600 mb-3">用户行为占比</p>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={2} dataKey="value">
                {pieData.map((_, idx) => <Cell key={idx} fill={COLORS[idx % COLORS.length]}/>)}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}/>
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-4 text-xs text-slate-500">
            {pieData.map((item, idx) => (
              <span key={item.name} className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[idx] }}/>
                {item.name} ({item.value})
              </span>
            ))}
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
            <span className="text-xs text-slate-400">共 5 条</span>
          </div>
          <div className="space-y-3">
            {recentActivities.map((item, idx) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.04 }}
                className="flex items-center gap-3 pb-3 border-b border-slate-50 last:border-0 last:pb-0"
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                  item.type === 'workout' ? 'bg-blue-50 text-blue-600' :
                  item.type === 'checkin' ? 'bg-purple-50 text-purple-600' :
                  'bg-slate-100 text-slate-600'
                }`}>
                  {item.user[0]}
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
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Admin;