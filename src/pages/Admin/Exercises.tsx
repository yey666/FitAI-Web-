import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { getAdminExercises, createAdminExercise, updateAdminExercise, deleteAdminExercise } from '@/api/admin';

interface Exercise {
  id: number;
  name: string;
  bodyPart: string;
  difficulty: 1 | 2 | 3;
  description: string;
  imageUrl: string;
  steps: string[];
  tips: string;
  commonMistakes: string[];
  status: 'published' | 'draft';
  createdAt: string;
}

const AdminExercises = () => {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [filtered, setFiltered] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterPart, setFilterPart] = useState<string>('all');
  const [filterDiff, setFilterDiff] = useState<number | 'all'>('all');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Exercise | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    name: '',
    bodyPart: '',
    difficulty: 1 as 1 | 2 | 3,
    description: '',
    imageUrl: '',
    steps: '',
    tips: '',
    commonMistakes: '',
  });

  const bodyParts = ['胸', '背', '腿', '肩', '手臂', '核心'];

  useEffect(() => {
    fetchExercises();
  }, []);

  useEffect(() => {
    let result = exercises;
    if (search) result = result.filter(e => e.name.includes(search) || e.bodyPart.includes(search));
    if (filterPart !== 'all') result = result.filter(e => e.bodyPart === filterPart);
    if (filterDiff !== 'all') result = result.filter(e => e.difficulty === filterDiff);
    setFiltered(result);
  }, [search, filterPart, filterDiff, exercises]);

  const fetchExercises = async () => {
    try {
      const data = await getAdminExercises();
      setExercises(data.map((e: any) => ({
        id: e.id,
        name: e.name,
        bodyPart: e.bodyPart,
        difficulty: e.difficulty as 1 | 2 | 3,
        description: e.description || '',
        imageUrl: e.imageUrl || '',
        steps: e.steps || [],
        tips: e.tips || '',
        commonMistakes: e.commonMistakes || [],
        status: e.status || (e.deleted ? 'draft' : 'published'),
        createdAt: e.createdAt || '',
      })));
    } catch (error) {
      console.error('获取动作列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      bodyPart: '',
      difficulty: 1,
      description: '',
      imageUrl: '',
      steps: '',
      tips: '',
      commonMistakes: '',
    });
    setEditing(null);
  };

  const closeForm = () => {
    resetForm();
    setShowForm(false);
  };

  const openNewForm = () => {
    resetForm();
    setShowForm(true);
  };

  const openEditForm = (item: Exercise) => {
    setEditing(item);
    setFormData({
      name: item.name,
      bodyPart: item.bodyPart,
      difficulty: item.difficulty,
      description: item.description,
      imageUrl: item.imageUrl || '',
      steps: item.steps.join('\n'),
      tips: item.tips || '',
      commonMistakes: item.commonMistakes.join('\n'),
    });
    setShowForm(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('图片大小不能超过 5MB');
      return;
    }

    if (!file.type.startsWith('image/')) {
      alert('请上传图片文件');
      return;
    }

    setUploading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setFormData({ ...formData, imageUrl: event.target.result as string });
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('上传失败:', error);
      alert('图片上传失败，请重试');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (status: 'published' | 'draft') => {
    if (!formData.name.trim()) { alert('请输入动作名称'); return; }
    if (!formData.bodyPart.trim()) { alert('请选择目标部位'); return; }
    if (!formData.description.trim()) { alert('请输入动作描述'); return; }

    const stepsList = formData.steps.split('\n').filter(s => s.trim());
    const tipsList = formData.tips.split('\n').filter(s => s.trim());
    const mistakesList = formData.commonMistakes.split('\n').filter(s => s.trim());

    if (stepsList.length === 0) { alert('请至少输入一个执行步骤'); return; }
    if (tipsList.length === 0) { alert('请至少输入一条注意事项'); return; }

    const data = {
      name: formData.name,
      bodyPart: formData.bodyPart,
      difficulty: formData.difficulty,
      description: formData.description,
      imageUrl: formData.imageUrl || '',
      tips: tipsList.join('\n'),
      steps: stepsList,
      commonMistakes: mistakesList,
    };

    try {
      if (editing) {
        await updateAdminExercise(editing.id, data);
      } else {
        await createAdminExercise(data);
      }
      closeForm();
      fetchExercises();
    } catch (error) {
      console.error('保存失败:', error);
      alert('保存失败，请重试');
    }
  };

  const deleteExercise = async (id: number) => {
    if (!confirm('确定要删除该动作吗？')) return;
    try {
      await deleteAdminExercise(id);
      fetchExercises();
    } catch (error) {
      console.error('删除失败:', error);
      alert('删除失败，请重试');
    }
  };

  if (loading) {
    return <div className="p-6 text-center text-slate-400">加载中...</div>;
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">动作管理</h1>
          <p className="text-sm text-slate-400">管理训练动作库</p>
        </div>
        <button
          className="px-4 py-2 bg-slate-800 text-white text-sm rounded-lg hover:bg-slate-700 transition-colors"
          onClick={openNewForm}
        >
          + 新增动作
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <input
            type="text"
            placeholder="搜索动作名称..."
            className="w-full px-4 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-slate-300 transition-colors"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="px-4 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-slate-300 bg-white"
          value={filterPart}
          onChange={(e) => setFilterPart(e.target.value)}
        >
          <option value="all">全部部位</option>
          {bodyParts.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        <select
          className="px-4 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-slate-300 bg-white"
          value={filterDiff}
          onChange={(e) => setFilterDiff(e.target.value === 'all' ? 'all' : Number(e.target.value))}
        >
          <option value="all">全部难度</option>
          <option value={1}>初级</option>
          <option value={2}>中级</option>
          <option value={3}>高级</option>
        </select>
        <span className="text-xs text-slate-400 ml-auto">共 {filtered.length} 个动作</span>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm mb-4">
          <h2 className="font-medium text-slate-700 mb-3">{editing ? '编辑动作' : '新增动作'}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              className="px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-slate-300"
              placeholder="动作名称 *"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
            />
            <select
              className="px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-slate-300 bg-white"
              value={formData.bodyPart}
              onChange={e => setFormData({ ...formData, bodyPart: e.target.value })}
            >
              <option value="">选择部位 *</option>
              {bodyParts.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            <select
              className="px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-slate-300 bg-white"
              value={formData.difficulty}
              onChange={e => setFormData({ ...formData, difficulty: Number(e.target.value) as 1 | 2 | 3 })}
            >
              <option value={1}>初级</option>
              <option value={2}>中级</option>
              <option value={3}>高级</option>
            </select>
            <div>
              <div className="flex items-center gap-3">
                <button
                  className="px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  {uploading ? '上传中...' : '📷 选择图片'}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                />
                <span className="text-xs text-slate-400">支持 JPG、PNG，最大 5MB</span>
              </div>
              {formData.imageUrl && (
                <div className="mt-2 flex items-center gap-3">
                  <div className="w-16 h-16 rounded-lg overflow-hidden bg-slate-100 border border-slate-200">
                    <img src={formData.imageUrl} alt="预览" className="w-full h-full object-cover" />
                  </div>
                  <button
                    className="text-xs text-red-400 hover:text-red-600 transition-colors"
                    onClick={() => setFormData({ ...formData, imageUrl: '' })}
                  >
                    移除图片
                  </button>
                </div>
              )}
            </div>
            <textarea
              className="md:col-span-2 px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-slate-300 resize-none"
              placeholder="动作描述 *"
              rows={2}
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
            />
            <textarea
              className="md:col-span-2 px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-slate-300 resize-none"
              placeholder="执行步骤（每行一步）*"
              rows={4}
              value={formData.steps}
              onChange={e => setFormData({ ...formData, steps: e.target.value })}
            />
            <textarea
              className="md:col-span-2 px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-slate-300 resize-none"
              placeholder="注意事项（每行一条）*"
              rows={3}
              value={formData.tips}
              onChange={e => setFormData({ ...formData, tips: e.target.value })}
            />
            <textarea
              className="md:col-span-2 px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-slate-300 resize-none"
              placeholder="常见错误（每行一条）"
              rows={3}
              value={formData.commonMistakes}
              onChange={e => setFormData({ ...formData, commonMistakes: e.target.value })}
            />
          </div>
          <div className="flex items-center gap-3 mt-4">
            <button
              className="px-4 py-2 bg-slate-800 text-white text-sm rounded-lg hover:bg-slate-700 transition-colors"
              onClick={() => handleSubmit('published')}
            >
              📤 保存并发布
            </button>
            <button
              className="px-4 py-2 bg-slate-200 text-slate-600 text-sm rounded-lg hover:bg-slate-300 transition-colors"
              onClick={() => handleSubmit('draft')}
            >
              📝 保存为草稿
            </button>
            <button
              className="px-4 py-2 bg-slate-100 text-slate-400 text-sm rounded-lg hover:bg-slate-200 transition-colors"
              onClick={closeForm}
            >
              取消
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-100 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">名称</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider hidden sm:table-cell">部位</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider hidden sm:table-cell">难度</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider hidden md:table-cell">状态</th>
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
                  <td className="px-4 py-3 font-medium text-slate-700">{item.name}</td>
                  <td className="px-4 py-3 text-slate-500 hidden sm:table-cell">{item.bodyPart}</td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <span className={`px-2 py-0.5 rounded-full text-xs ${
                      item.difficulty === 1 ? 'bg-emerald-50 text-emerald-600' :
                      item.difficulty === 2 ? 'bg-amber-50 text-amber-600' :
                      'bg-red-50 text-red-600'
                    }`}>
                      {item.difficulty === 1 ? '初级' : item.difficulty === 2 ? '中级' : '高级'}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className={`px-2 py-0.5 rounded-full text-xs ${
                      item.status === 'published' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {item.status === 'published' ? '已发布' : '草稿'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button className="text-xs text-blue-500 hover:bg-blue-50 px-2 py-1 rounded transition-colors" onClick={() => openEditForm(item)}>
                        编辑
                      </button>
                      <button className="text-xs text-red-500 hover:bg-red-50 px-2 py-1 rounded transition-colors" onClick={() => deleteExercise(item.id)}>
                        删除
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="text-center py-12 text-slate-400">
            <p className="text-sm">没有找到匹配的动作</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminExercises;