import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface Checkin {
  id: number;
  userId: number;
  username: string;
  content: string;
  images: string[];
  likes: number;
  commentCount: number;
  createdAt: string;
}

const AdminCheckins = () => {
  const [checkins, setCheckins] = useState<Checkin[]>([]);
  const [filtered, setFiltered] = useState<Checkin[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  useEffect(() => {
    setTimeout(() => {
      setCheckins([
        { id: 1, userId: 2, username: 'testuser', content: '今天深蹲突破 100kg！坚持就是胜利，记录一下这个里程碑。', images: [], likes: 12, commentCount: 2, createdAt: '2小时前' },
        { id: 2, userId: 3, username: 'kkk', content: '晨跑打卡 5km，配速 5:30，感觉状态不错。今天天气也很好，适合运动。', images: [], likes: 8, commentCount: 1, createdAt: '昨天' },
        { id: 3, userId: 1, username: 'admin', content: '完成了一周的训练计划，下周继续加油！💪', images: [], likes: 15, commentCount: 3, createdAt: '3天前' },
        { id: 4, userId: 4, username: 'sarah_c', content: '瑜伽晨练 30 分钟，身心都放松了 🧘', images: [], likes: 6, commentCount: 0, createdAt: '4天前' },
      ]);
      setLoading(false);
    }, 400);
  }, []);

  useEffect(() => {
    let result = checkins;
    if (search) result = result.filter(c => c.username.includes(search) || c.content.includes(search));
    setFiltered(result);
  }, [search, checkins]);

  const deleteCheckin = (id: number) => {
    if (!confirm('确定要删除该打卡吗？')) return;
    setCheckins(checkins.filter(c => c.id !== id));
  };

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const toggleSelectAll = () => {
    setSelectedIds(prev => prev.length === filtered.length ? [] : filtered.map(c => c.id));
  };

  const batchDelete = () => {
    if (!selectedIds.length) return;
    if (!confirm(`确定要删除选中的 ${selectedIds.length} 条打卡吗？`)) return;
    setCheckins(checkins.filter(c => !selectedIds.includes(c.id)));
    setSelectedIds([]);
  };

  if (loading) {
    return <div className="p-6 text-center text-slate-400">加载中...</div>;
  }

  const totalLikes = checkins.reduce((s, c) => s + c.likes, 0);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* 页面标题 */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">打卡管理</h1>
          <p className="text-sm text-slate-400">管理所有用户打卡内容</p>
        </div>
        {selectedIds.length > 0 && (
          <button
            onClick={batchDelete}
            className="px-4 py-2 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600 transition-colors"
          >
            删除选中 ({selectedIds.length})
          </button>
        )}
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {[
          { label: '总打卡', value: checkins.length, color: '#1e293b' },
          { label: '总点赞', value: totalLikes, color: '#3b82f6' },
          { label: '总评论', value: checkins.reduce((s, c) => s + c.commentCount, 0), color: '#8b5cf6' },
        ].map((item) => (
          <div key={item.label} className="bg-white rounded-lg border border-slate-100 px-4 py-3 shadow-sm">
            <p className="text-xs text-slate-400">{item.label}</p>
            <p className="text-lg font-bold text-slate-800" style={{ color: item.color }}>{item.value}</p>
          </div>
        ))}
      </div>

      {/* 搜索 */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <input
            type="text"
            placeholder="搜索用户名或打卡内容..."
            className="w-full px-4 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-slate-300 transition-colors"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <span className="text-xs text-slate-400 ml-auto">共 {filtered.length} 条打卡</span>
      </div>

      {/* 打卡表格 */}
      <div className="bg-white rounded-xl border border-slate-100 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left w-8">
                  <input type="checkbox" checked={selectedIds.length === filtered.length && filtered.length > 0} onChange={toggleSelectAll} className="rounded border-slate-300"/>
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">用户</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">内容</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider hidden sm:table-cell">点赞</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider hidden sm:table-cell">评论</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider hidden md:table-cell">时间</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map((item, idx) => (
                <motion.tr
                  key={item.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: idx * 0.02 }}
                  className="hover:bg-slate-50/50 transition-colors"
                >
                  <td className="px-4 py-3">
                    <input type="checkbox" checked={selectedIds.includes(item.id)} onChange={() => toggleSelect(item.id)} className="rounded border-slate-300"/>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-medium text-slate-600">
                        {item.username[0].toUpperCase()}
                      </div>
                      <span className="font-medium text-slate-700">{item.username}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-600 max-w-xs truncate">{item.content}</td>
                  <td className="px-4 py-3 text-slate-500 hidden sm:table-cell">{item.likes}</td>
                  <td className="px-4 py-3 text-slate-500 hidden sm:table-cell">{item.commentCount}</td>
                  <td className="px-4 py-3 text-slate-400 hidden md:table-cell">{item.createdAt}</td>
                  <td className="px-4 py-3">
                    <button className="text-xs text-red-500 hover:bg-red-50 px-2 py-1 rounded transition-colors" onClick={() => deleteCheckin(item.id)}>
                      删除
                    </button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="text-center py-12 text-slate-400">
            <p className="text-sm">没有找到匹配的打卡</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminCheckins;