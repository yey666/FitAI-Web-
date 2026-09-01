import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { getAdminUsers, toggleUserStatus, deleteAdminUser } from '@/api/admin';

interface User {
  id: number;
  username: string;
  email: string;
  role: 'admin' | 'user';
  status: 'active' | 'disabled';
  avatar?: string;
  createdAt: string;
  lastActive: string;
  workoutCount: number;
  checkinCount: number;
}

const Icons = {
  search: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
};

const AdminUsers = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [filtered, setFiltered] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState<'all' | 'admin' | 'user'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'disabled'>('all');
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    let result = users;
    if (search) result = result.filter(u => u.username.includes(search) || u.email.includes(search));
    if (filterRole !== 'all') result = result.filter(u => u.role === filterRole);
    if (filterStatus !== 'all') result = result.filter(u => u.status === filterStatus);
    setFiltered(result);
  }, [search, filterRole, filterStatus, users]);

  const fetchUsers = async () => {
    try {
      const data = await getAdminUsers();
      console.log('用户列表原始数据:', data);  
      setUsers(data.map((u: any) => ({
        id: u.id,
        username: u.username,
        email: u.email,
       role: u.role?.toLowerCase() === 'admin' ? 'admin' : 'user',
        status: u.deleted === 0 ? 'active' : 'disabled',
        createdAt: u.createdAt || '',
        lastActive: u.lastActive || '',
        workoutCount: u.workoutCount || 0,
        checkinCount: u.checkinCount || 0,
      })));
    } catch (error) {
      console.error('获取用户列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = async (userId: number, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'DISABLED' : 'ENABLED';
    const action = newStatus === 'DISABLED' ? '禁用' : '启用';
    if (!confirm(`确定要${action}该用户吗？`)) return;
    try {
      await toggleUserStatus(userId, newStatus);
      setUsers(users.map(u => u.id === userId ? { ...u, status: newStatus === 'ENABLED' ? 'active' : 'disabled' } : u));
    } catch (error) {
      console.error('操作失败:', error);
      alert('操作失败，请重试');
    }
  };

  const deleteUser = async (userId: number) => {
    if (!confirm('确定要删除该用户吗？此操作不可撤销。')) return;
    try {
      await deleteAdminUser(userId);
      setUsers(users.filter(u => u.id !== userId));
    } catch (error) {
      console.error('删除失败:', error);
      alert('删除失败，请重试');
    }
  };

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const toggleSelectAll = () => {
    setSelectedIds(prev => prev.length === filtered.length ? [] : filtered.map(u => u.id));
  };

  const batchDelete = async () => {
    if (!selectedIds.length) return;
    if (!confirm(`确定要删除选中的 ${selectedIds.length} 个用户吗？`)) return;
    try {
      for (const id of selectedIds) {
        await deleteAdminUser(id);
      }
      setUsers(users.filter(u => !selectedIds.includes(u.id)));
      setSelectedIds([]);
    } catch (error) {
      console.error('批量删除失败:', error);
      alert('批量删除失败，请重试');
    }
  };

  if (loading) {
    return <div className="p-6 text-center text-slate-400">加载中...</div>;
  }

const stats = {
  total: users.length,
  active: users.filter(u => u.status === 'active').length,
  disabled: users.filter(u => u.status === 'disabled').length,
  admin: users.filter(u => u.role?.toLowerCase() === 'admin').length,  //  大小写都匹配
};
  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">用户管理</h1>
          <p className="text-sm text-slate-400">管理平台所有注册用户</p>
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

      <div className="grid grid-cols-4 gap-3 mb-5">
        {[
          { label: '总用户', value: stats.total, color: '#1e293b' },
          { label: '正常', value: stats.active, color: '#10b981' },
          { label: '已禁用', value: stats.disabled, color: '#ef4444' },
          { label: '管理员', value: stats.admin, color: '#8b5cf6' },
        ].map((item) => (
          <div key={item.label} className="bg-white rounded-lg border border-slate-100 px-4 py-3 shadow-sm">
            <p className="text-xs text-slate-400">{item.label}</p>
            <p className="text-lg font-bold text-slate-800" style={{ color: item.color }}>{item.value}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">{Icons.search}</span>
          <input
            type="text"
            placeholder="搜索用户名或邮箱..."
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-slate-300 transition-colors"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="px-4 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-slate-300 bg-white"
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value as any)}
        >
          <option value="all">全部角色</option>
          <option value="admin">管理员</option>
          <option value="user">普通用户</option>
        </select>
        <select
          className="px-4 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-slate-300 bg-white"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as any)}
        >
          <option value="all">全部状态</option>
          <option value="active">正常</option>
          <option value="disabled">已禁用</option>
        </select>
        <span className="text-xs text-slate-400 ml-auto">共 {filtered.length} 个用户</span>
      </div>

      <div className="bg-white rounded-xl border border-slate-100 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left w-8">
                  <input type="checkbox" checked={selectedIds.length === filtered.length && filtered.length > 0} onChange={toggleSelectAll} className="rounded border-slate-300"/>
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">用户</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider hidden md:table-cell">邮箱</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider hidden lg:table-cell">角色</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">状态</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider hidden sm:table-cell">训练</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider hidden sm:table-cell">打卡</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map((user, idx) => (
                <motion.tr
                  key={user.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: idx * 0.02 }}
                  className="hover:bg-slate-50/50 transition-colors"
                >
                  <td className="px-4 py-3">
                    <input type="checkbox" checked={selectedIds.includes(user.id)} onChange={() => toggleSelect(user.id)} className="rounded border-slate-300"/>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-medium text-slate-600">
                        {user.username[0].toUpperCase()}
                      </div>
                      <span className="font-medium text-slate-700">{user.username}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-500 hidden md:table-cell">{user.email}</td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <span className={`px-2 py-0.5 rounded-full text-xs ${
                      user.role === 'admin' ? 'bg-purple-50 text-purple-600' : 'bg-slate-100 text-slate-500'
                    }`}>
                     {user.role?.toLowerCase() === 'admin' ? '管理员' : '用户'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs ${
                      user.status === 'active' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
                    }`}>
                      {user.status === 'active' ? '正常' : '已禁用'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500 hidden sm:table-cell">{user.workoutCount}</td>
                  <td className="px-4 py-3 text-slate-500 hidden sm:table-cell">{user.checkinCount}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        className={`text-xs px-2 py-1 rounded transition-colors ${
                          user.status === 'active' ? 'text-amber-600 hover:bg-amber-50' : 'text-emerald-600 hover:bg-emerald-50'
                        }`}
                        onClick={() => toggleStatus(user.id, user.status)}
                      >
                        {user.status === 'active' ? '禁用' : '启用'}
                      </button>
                      {user.role !== 'admin' && (
                        <button className="text-xs text-red-500 hover:bg-red-50 px-2 py-1 rounded transition-colors" onClick={() => deleteUser(user.id)}>
                          删除
                        </button>
                      )}
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="text-center py-12 text-slate-400">
            <p className="text-sm">没有找到匹配的用户</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminUsers;