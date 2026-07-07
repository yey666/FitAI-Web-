import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { getMetricsList, saveMetrics, getMetricsTrend } from '@/api/metrics';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { motion } from 'framer-motion';

// ===== 图标 =====
const Icons = {
  back: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 12H5" />
      <path d="M12 19l-7-7 7-7" />
    </svg>
  ),
  weight: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </svg>
  ),
  height: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 2v20" />
      <path d="M20 2v20" />
      <path d="M8 12l4-4 4 4" />
      <path d="M8 16l4 4 4-4" />
    </svg>
  ),
  fat: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l3 3" />
    </svg>
  ),
  muscle: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 12l3-3 3 3" />
      <path d="M15 12l3-3 3 3" />
      <path d="M9 9V5" />
      <path d="M18 9V5" />
    </svg>
  ),
  bmi: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M8 8h8" />
      <path d="M8 12h6" />
      <path d="M8 16h4" />
    </svg>
  ),
  chest: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2v20" />
      <path d="M4 6l16 0" />
      <path d="M4 12l16 0" />
      <path d="M4 18l16 0" />
    </svg>
  ),
  waist: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 8a8 8 0 0 1 16 0" />
      <path d="M4 16a8 8 0 0 0 16 0" />
      <path d="M12 2v20" />
    </svg>
  ),
  arm: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 8l3-3 3 3" />
      <path d="M9 5v14" />
      <path d="M15 10l3-3 3 3" />
      <path d="M18 7v10" />
    </svg>
  ),
  plus: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </svg>
  ),
  trend: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 17l5-5 4 4 7-7" />
      <path d="M19 7v4" />
      <path d="M16 7h4" />
    </svg>
  ),
  calendar: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  ),
};

interface MetricsRecord {
  id: number;
  weight: number;
  height: number;
  bodyFat: number;
  muscleMass: number;
  chest: number;
  waist: number;
  hip: number;
  arm: number;
  date: string;
}

interface TrendData {
  date: string;
  weight: number;
  bodyFat: number;
  muscleMass: number;
}

const Metrics = () => {
  const navigate = useNavigate();
  const [records, setRecords] = useState<MetricsRecord[]>([]);
  const [trendData, setTrendData] = useState<TrendData[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [range, setRange] = useState<'7days' | 'month' | '3months'>('month');

  const [form, setForm] = useState({
    weight: '',
    height: '',
    bodyFat: '',
    muscleMass: '',
    chest: '',
    waist: '',
    hip: '',
    arm: '',
    date: new Date().toISOString().split('T')[0],
  });

  const fetchData = async () => {
    try {
      const [list, trend] = await Promise.all([
        getMetricsList(),
        getMetricsTrend(range),
      ]);
      setRecords(Array.isArray(list) ? list : []);
      setTrendData(Array.isArray(trend) ? trend : []);
    } catch (error) {
      console.error('加载身体数据失败:', error);
      setRecords([]);
      setTrendData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [range]);

  const handleSubmit = async () => {
    const data = {
      weight: parseFloat(form.weight) || 0,
      height: parseFloat(form.height) || 0,
      bodyFat: parseFloat(form.bodyFat) || 0,
      muscleMass: parseFloat(form.muscleMass) || 0,
      chest: parseFloat(form.chest) || 0,
      waist: parseFloat(form.waist) || 0,
      hip: parseFloat(form.hip) || 0,
      arm: parseFloat(form.arm) || 0,
      date: form.date,
    };
    if (data.weight <= 0) { alert('请输入有效的体重'); return; }
    if (data.height <= 0) { alert('请输入有效的身高'); return; }
    await saveMetrics(data);
    setDialogOpen(false);
    setForm({ weight: '', height: '', bodyFat: '', muscleMass: '', chest: '', waist: '', hip: '', arm: '', date: new Date().toISOString().split('T')[0] });
    fetchData();
  };

  const latest = records && Array.isArray(records) && records.length > 0 ? records[0] : null;

  const calculateBMI = (weight: number, height: number): string => {
    if (weight <= 0 || height <= 0) return '--';
    const bmi = weight / ((height / 100) ** 2);
    return bmi.toFixed(1);
  };

  const statCards = [
    { label: '体重', value: latest?.weight ?? '--', unit: 'kg', icon: Icons.weight },
    { label: '身高', value: latest?.height ?? '--', unit: 'cm', icon: Icons.height },
    { label: '体脂率', value: latest?.bodyFat ?? '--', unit: '%', icon: Icons.fat },
    { label: '肌肉量', value: latest?.muscleMass ?? '--', unit: 'kg', icon: Icons.muscle },
    { label: 'BMI', value: latest ? calculateBMI(latest.weight, latest.height) : '--', unit: '', icon: Icons.bmi },
    { label: '胸围', value: latest?.chest ?? '--', unit: 'cm', icon: Icons.chest },
    { label: '腰围', value: latest?.waist ?? '--', unit: 'cm', icon: Icons.waist },
    { label: '臂围', value: latest?.arm ?? '--', unit: 'cm', icon: Icons.arm },
  ];

  const rangeOptions = [
    { value: '7days', label: '7 天' },
    { value: 'month', label: '本月' },
    { value: '3months', label: '三个月' },
  ];

  const chartColors = {
    weight: '#1e293b',
    bodyFat: '#94a3b8',
    muscleMass: '#475569',
  };

  const formatXAxis = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="grid grid-cols-4 gap-3">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="bg-slate-100 rounded-lg h-20 animate-pulse" />
          ))}
        </div>
        <div className="mt-6 bg-slate-100 rounded-lg h-64 animate-pulse" />
        <div className="mt-6 space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-slate-100 rounded-lg h-12 animate-pulse" />
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
          <h1 className="page-title">身体数据</h1>
          <p className="page-subtitle">追踪身体成分变化</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-slate-800 hover:bg-slate-700 text-white">
              {Icons.plus}
              录入数据
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md p-0 bg-transparent border-0 shadow-none">
            <div className="bg-white rounded-xl shadow-xl p-6">
              <DialogHeader className="px-0 pt-0 pb-4">
                <DialogTitle className="text-slate-800 text-base font-light tracking-wide">录入身体数据</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-slate-400 uppercase tracking-wider block mb-1.5">体重 (kg)</label>
                    <Input type="number" step="0.1" placeholder="0" className="rounded-lg border-slate-200 focus:border-slate-400 focus:ring-0" value={form.weight} onChange={(e) => setForm({ ...form, weight: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-400 uppercase tracking-wider block mb-1.5">身高 (cm)</label>
                    <Input type="number" step="0.1" placeholder="0" className="rounded-lg border-slate-200 focus:border-slate-400 focus:ring-0" value={form.height} onChange={(e) => setForm({ ...form, height: e.target.value })} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-slate-400 uppercase tracking-wider block mb-1.5">体脂率 (%)</label>
                    <Input type="number" step="0.1" placeholder="0" className="rounded-lg border-slate-200 focus:border-slate-400 focus:ring-0" value={form.bodyFat} onChange={(e) => setForm({ ...form, bodyFat: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-400 uppercase tracking-wider block mb-1.5">肌肉量 (kg)</label>
                    <Input type="number" step="0.1" placeholder="0" className="rounded-lg border-slate-200 focus:border-slate-400 focus:ring-0" value={form.muscleMass} onChange={(e) => setForm({ ...form, muscleMass: e.target.value })} />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-medium text-slate-400 uppercase tracking-wider block mb-1.5">胸围</label>
                    <Input type="number" step="0.1" placeholder="0" className="rounded-lg border-slate-200 focus:border-slate-400 focus:ring-0" value={form.chest} onChange={(e) => setForm({ ...form, chest: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-400 uppercase tracking-wider block mb-1.5">腰围</label>
                    <Input type="number" step="0.1" placeholder="0" className="rounded-lg border-slate-200 focus:border-slate-400 focus:ring-0" value={form.waist} onChange={(e) => setForm({ ...form, waist: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-400 uppercase tracking-wider block mb-1.5">臂围</label>
                    <Input type="number" step="0.1" placeholder="0" className="rounded-lg border-slate-200 focus:border-slate-400 focus:ring-0" value={form.arm} onChange={(e) => setForm({ ...form, arm: e.target.value })} />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-400 uppercase tracking-wider block mb-1.5">日期</label>
                  <Input type="date" className="rounded-lg border-slate-200 focus:border-slate-400 focus:ring-0" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
                </div>
                <Button onClick={handleSubmit} className="w-full bg-slate-800 hover:bg-slate-700 text-white">
                  保存数据
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* ===== 当前数据卡片 ===== */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
        {statCards.map((stat, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: idx * 0.03 }}
          >
            <Card className="border-0 shadow-sm bg-white">
              <CardContent className="p-3 text-center">
                <div className="text-slate-400 flex justify-center mb-1">{stat.icon}</div>
                <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">{stat.label}</p>
                <p className="text-base font-light text-slate-800 mt-0.5">
                  {stat.value} <span className="text-[10px] font-light text-slate-300">{stat.unit}</span>
                </p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* ===== 趋势图 ===== */}
      <Card className="border-0 shadow-sm bg-white">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-slate-400">
              {Icons.trend}
              <span className="text-xs font-medium uppercase tracking-wider">身体成分趋势</span>
            </div>
            <div className="flex gap-1">
              {rangeOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setRange(opt.value as '7days' | 'month' | '3months')}
                  className={`px-3 py-1 text-xs rounded-full transition-all font-light ${
                    range === opt.value
                      ? 'bg-slate-800 text-white'
                      : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={formatXAxis} />
                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#ffffff', border: 'none', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', padding: '12px 16px' }} labelFormatter={(label) => `日期: ${label}`} />
                <Line type="monotone" dataKey="weight" stroke={chartColors.weight} strokeWidth={2} dot={{ r: 3, fill: chartColors.weight }} activeDot={{ r: 5 }} name="体重" />
                <Line type="monotone" dataKey="bodyFat" stroke={chartColors.bodyFat} strokeWidth={2} dot={{ r: 3, fill: chartColors.bodyFat }} activeDot={{ r: 5 }} name="体脂率" />
                <Line type="monotone" dataKey="muscleMass" stroke={chartColors.muscleMass} strokeWidth={2} dot={{ r: 3, fill: chartColors.muscleMass }} activeDot={{ r: 5 }} name="肌肉量" />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-4 mt-3">
            {Object.entries(chartColors).map(([key, color]) => {
              const labels: Record<string, string> = { weight: '体重', bodyFat: '体脂率', muscleMass: '肌肉量' };
              return (
                <span key={key} className="flex items-center gap-1.5 text-[10px] text-slate-400 font-light uppercase tracking-wider">
                  <span className="w-3 h-0.5 rounded-full" style={{ backgroundColor: color }} />
                  {labels[key] || key}
                </span>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* ===== 历史记录 ===== */}
      <Card className="border-0 shadow-sm bg-white">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-slate-400">
              {Icons.calendar}
              <span className="text-xs font-medium uppercase tracking-wider">历史记录</span>
            </div>
            <span className="text-xs text-slate-300 font-light">{records && Array.isArray(records) ? records.length : 0} 条记录</span>
          </div>
          <div className="space-y-1">
            {!records || !Array.isArray(records) || records.length === 0 ? (
              <p className="text-sm text-slate-400 font-light text-center py-6">暂无数据</p>
            ) : (
              records.map((record, idx) => {
                const bmi = calculateBMI(record.weight, record.height);
                return (
                  <motion.div
                    key={record.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: idx * 0.02 }}
                    className="flex items-center justify-between py-2.5 px-3 -mx-3 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-4 flex-wrap">
                      <span className="text-xs text-slate-400 font-light w-20">{record.date}</span>
                      <span className="text-sm text-slate-600 font-light">体重 {record.weight}kg</span>
                      <span className="text-xs text-slate-400 font-light">体脂 {record.bodyFat}%</span>
                      <span className="text-xs text-slate-400 font-light">肌肉 {record.muscleMass}kg</span>
                      <span className="text-xs text-slate-400 font-light">BMI {bmi}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-400 font-light">
                      <span>胸 {record.chest}</span>
                      <span>腰 {record.waist}</span>
                      <span>臂 {record.arm}</span>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Metrics;