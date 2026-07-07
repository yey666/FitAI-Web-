import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { getWorkoutList, saveWorkout, deleteWorkout, getWorkoutCalendar, updateWorkout } from '@/api/workout';
import { getExercises } from '@/api/exercises';
import ReactECharts from 'echarts-for-react';
import { motion } from 'framer-motion';

// ===== 图标 =====
const Icons = {
  back: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 12H5" />
      <path d="M12 19l-7-7 7-7" />
    </svg>
  ),
  plus: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </svg>
  ),
  edit: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
    </svg>
  ),
  delete: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6h18" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
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
  chart: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="18" rx="1" />
      <rect x="13" y="8" width="8" height="13" rx="1" />
    </svg>
  ),
  close: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6L6 18" />
      <path d="M6 6l12 12" />
    </svg>
  ),
};

interface WorkoutRecord {
  id: number;
  exerciseName: string;
  weight: number;
  sets: number;
  reps: number;
  duration: number;
  date: string;
}

interface Exercise {
  id: number;
  name: string;
  target: string;
}

const Workout = () => {
  const navigate = useNavigate();
  const [records, setRecords] = useState<WorkoutRecord[]>([]);
  const [calendarData, setCalendarData] = useState<{ date: string; count: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [exerciseOptions, setExerciseOptions] = useState<Exercise[]>([]);
  const [dayDetailOpen, setDayDetailOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [dayRecords, setDayRecords] = useState<WorkoutRecord[]>([]);

  const [form, setForm] = useState({
    exerciseName: '',
    weight: '',
    sets: '',
    reps: '',
    duration: '',
    date: new Date().toISOString().split('T')[0],
  });

  const fetchData = async () => {
    try {
      const [list, calendar, exercises] = await Promise.all([
        getWorkoutList(),
        getWorkoutCalendar(),
        getExercises(),
      ]);
      setRecords(list);
      setCalendarData(calendar);
      setExerciseOptions(exercises);
    } catch (error) {
      console.error('加载失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async () => {
    const data = {
      exerciseName: form.exerciseName,
      weight: parseFloat(form.weight) || 0,
      sets: parseInt(form.sets) || 0,
      reps: parseInt(form.reps) || 0,
      duration: parseInt(form.duration) || 0,
      date: form.date,
    };

    if (editingId) {
      await updateWorkout(editingId, data);
    } else {
      await saveWorkout(data);
    }

    setDialogOpen(false);
    setEditingId(null);
    setForm({ exerciseName: '', weight: '', sets: '', reps: '', duration: '', date: new Date().toISOString().split('T')[0] });
    fetchData();
  };

  const handleEdit = (record: WorkoutRecord) => {
    setEditingId(record.id);
    setForm({
      exerciseName: record.exerciseName,
      weight: String(record.weight),
      sets: String(record.sets),
      reps: String(record.reps),
      duration: String(record.duration),
      date: record.date,
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm('确定要删除这条记录吗？')) {
      await deleteWorkout(id);
      fetchData();
    }
  };

  const handleCalendarClick = (params: any) => {
    const dayIndex = params.data[0];
    const year = new Date().getFullYear();
    const month = new Date().getMonth() + 1;
    const day = dayIndex + 1;
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const filtered = records.filter(r => r.date === dateStr);
    setSelectedDate(dateStr);
    setDayRecords(filtered);
    setDayDetailOpen(true);
  };

  const getCalendarOptions = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const calendarMap: Record<string, number> = {};
    calendarData.forEach(item => { calendarMap[item.date] = item.count; });

    const heatmapData = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const count = calendarMap[dateStr] || 0;
      heatmapData.push([d - 1, 0, count]);
    }

    const maxCount = Math.max(1, ...calendarData.map(d => d.count));

    return {
      tooltip: {
        formatter: (params: any) => {
          const day = params.data[0] + 1;
          const count = params.data[2];
          return `${year}年${month + 1}月${day}日<br/>训练次数：${count} 次`;
        },
      },
      grid: {
        left: '2%',
        right: '2%',
        top: '5%',
        bottom: '5%',
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        data: Array.from({ length: daysInMonth }, (_, i) => i + 1),
        axisLabel: { fontSize: 10, color: '#94a3b8', interval: 2 },
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: { show: false },
      },
      yAxis: {
        type: 'category',
        data: ['训练'],
        axisLabel: { show: false },
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: { show: false },
      },
      visualMap: {
        min: 0,
        max: maxCount,
        calculable: false,
        orient: 'horizontal',
        left: 'center',
        bottom: 0,
        inRange: { color: ['#f1f5f9', '#94a3b8', '#475569', '#0f172a'] },
        text: ['', ''],
        textStyle: { color: '#94a3b8', fontSize: 10 },
      },
      series: [{
        type: 'heatmap',
        data: heatmapData,
        label: {
          show: true,
          fontSize: 10,
          color: '#475569',
          formatter: (params: any) => {
            const count = params.data[2];
            return count > 0 ? '●' : '';
          },
        },
        emphasis: {
          itemStyle: { shadowBlur: 10, shadowColor: 'rgba(0,0,0,0.08)' },
        },
        itemStyle: {
          borderRadius: 4,
          borderColor: '#fff',
          borderWidth: 1,
        },
      }],
    };
  };

  const totalWorkouts = records.length;
  const totalSets = records.reduce((sum, r) => sum + r.sets, 0);
  const totalVolume = records.reduce((sum, r) => sum + r.weight * r.sets * r.reps, 0);

  if (loading) {
    return (
      <div className="page-container">
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-slate-100 rounded-lg h-24 animate-pulse" />
          ))}
        </div>
        <div className="mt-6 bg-slate-100 rounded-lg h-32 animate-pulse" />
        <div className="mt-6 space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-slate-100 rounded-lg h-16 animate-pulse" />
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
          <h1 className="page-title">训练记录</h1>
          <p className="page-subtitle">记录每一次训练，见证每一次进步</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) { setEditingId(null); setForm({ exerciseName: '', weight: '', sets: '', reps: '', duration: '', date: new Date().toISOString().split('T')[0] }); }
        }}>
          <DialogTrigger asChild>
            <Button className="bg-slate-800 hover:bg-slate-700 text-white">
              {Icons.plus}
              添加记录
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md p-0 bg-transparent border-0 shadow-none">
            <div className="bg-white rounded-xl shadow-xl p-6">
              <DialogHeader className="px-0 pt-0 pb-4">
                <DialogTitle className="text-slate-800 text-base font-light tracking-wide">
                  {editingId ? '编辑训练记录' : '添加训练记录'}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-slate-400 uppercase tracking-wider block mb-1.5">动作名称</label>
                  <select
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-300 font-light"
                    value={form.exerciseName}
                    onChange={(e) => setForm({ ...form, exerciseName: e.target.value })}
                  >
                    <option value="">请选择动作</option>
                    {exerciseOptions.map(opt => (
                      <option key={opt.id} value={opt.name}>{opt.name}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-slate-400 uppercase tracking-wider block mb-1.5">重量 (kg)</label>
                    <Input type="number" placeholder="0" className="rounded-lg border-slate-200 focus:border-slate-400 focus:ring-0" value={form.weight} onChange={(e) => setForm({ ...form, weight: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-400 uppercase tracking-wider block mb-1.5">组数</label>
                    <Input type="number" placeholder="0" className="rounded-lg border-slate-200 focus:border-slate-400 focus:ring-0" value={form.sets} onChange={(e) => setForm({ ...form, sets: e.target.value })} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-slate-400 uppercase tracking-wider block mb-1.5">次数</label>
                    <Input type="number" placeholder="0" className="rounded-lg border-slate-200 focus:border-slate-400 focus:ring-0" value={form.reps} onChange={(e) => setForm({ ...form, reps: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-400 uppercase tracking-wider block mb-1.5">时长 (分钟)</label>
                    <Input type="number" placeholder="0" className="rounded-lg border-slate-200 focus:border-slate-400 focus:ring-0" value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-400 uppercase tracking-wider block mb-1.5">日期</label>
                  <Input type="date" className="rounded-lg border-slate-200 focus:border-slate-400 focus:ring-0" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
                </div>
                <Button onClick={handleSubmit} className="w-full bg-slate-800 hover:bg-slate-700 text-white">
                  {editingId ? '更新记录' : '保存记录'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* ===== 统计概览 ===== */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="border-0 shadow-sm bg-white">
          <CardContent className="p-4 text-center">
            <p className="stat-label">训练次数</p>
            <p className="stat-number mt-0.5">{totalWorkouts}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-white">
          <CardContent className="p-4 text-center">
            <p className="stat-label">总组数</p>
            <p className="stat-number mt-0.5">{totalSets}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-white">
          <CardContent className="p-4 text-center">
            <p className="stat-label">总容量</p>
            <p className="stat-number mt-0.5">{totalVolume} <span className="text-sm font-light text-slate-300">kg</span></p>
          </CardContent>
        </Card>
      </div>

      {/* ===== 日历 ===== */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          {Icons.calendar}
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
            {new Date().getFullYear()}年{new Date().getMonth() + 1}月 训练日历
          </span>
          <span className="text-xs text-slate-300 font-light ml-auto">点击日期查看记录</span>
        </div>
        <Card className="border-0 shadow-sm bg-white">
          <CardContent className="p-4">
            <ReactECharts
              option={getCalendarOptions()}
              style={{ height: '110px', width: '100%' }}
              opts={{ renderer: 'canvas' }}
              onEvents={{ click: handleCalendarClick }}
            />
          </CardContent>
        </Card>
      </div>

      {/* ===== 历史记录 ===== */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-medium text-slate-400 uppercase tracking-wider">历史记录</h2>
          <span className="text-xs text-slate-300 font-light">共 {records.length} 条</span>
        </div>
        <Card className="border-0 shadow-sm bg-white">
          <CardContent className="p-0 divide-y divide-slate-100/60">
            {records.length === 0 ? (
              <p className="text-sm text-slate-400 font-light text-center py-8">暂无训练记录</p>
            ) : (
              records.map((record, idx) => (
                <motion.div
                  key={record.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: idx * 0.03 }}
                  className="flex items-center justify-between px-4 py-3"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 text-xs font-light flex-shrink-0">
                      {record.exerciseName.slice(0, 2)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-700">{record.exerciseName}</p>
                      <p className="text-xs text-slate-400 font-light">
                        {record.weight}kg × {record.sets}组 × {record.reps}次 · {record.duration}分钟
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-xs text-slate-300 font-light">{record.date}</span>
                    <button onClick={() => handleEdit(record)} className="p-1 rounded hover:bg-slate-100 transition-colors text-slate-400 hover:text-slate-600">
                      {Icons.edit}
                    </button>
                    <button onClick={() => handleDelete(record.id)} className="p-1 rounded hover:bg-slate-100 transition-colors text-slate-400 hover:text-red-500">
                      {Icons.delete}
                    </button>
                  </div>
                </motion.div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* ===== 当日详情弹窗 ===== */}
      <Dialog open={dayDetailOpen} onOpenChange={setDayDetailOpen}>
        <DialogContent className="max-w-md p-0 bg-transparent border-0 shadow-none">
          <div className="bg-white rounded-xl shadow-xl p-6">
            <DialogHeader className="px-0 pt-0 pb-4">
              <DialogTitle className="text-slate-800 text-base font-light tracking-wide">📅 {selectedDate} 训练记录</DialogTitle>
            </DialogHeader>
            <div className="py-2">
              {dayRecords.length === 0 ? (
                <p className="text-sm text-slate-400 font-light text-center py-6">当天没有训练记录</p>
              ) : (
                <div className="space-y-3">
                  {dayRecords.map((r, idx) => (
                    <div key={idx} className="bg-slate-50 rounded-lg p-3 flex justify-between items-center">
                      <div>
                        <p className="text-sm font-medium text-slate-700">{r.exerciseName}</p>
                        <p className="text-xs text-slate-400 font-light">
                          {r.weight}kg × {r.sets}组 × {r.reps}次
                        </p>
                      </div>
                      <span className="text-xs text-slate-300 font-light">{r.duration}分钟</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Workout;