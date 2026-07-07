import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getProfile, updateProfile, uploadAvatar } from '@/api/profile';
import { useAuthStore } from '@/store/useAuthStore';

// ============ 专业图标 ============
const Icons = {
  back: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 12H5" />
      <path d="M12 19l-7-7 7-7" />
    </svg>
  ),
  user: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
  camera: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  ),
  check: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  close: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6L6 18" />
      <path d="M6 6l12 12" />
    </svg>
  ),
};

const ProfileEdit = () => {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    avatar: '',
    nickname: '',
    gender: '保密',
    bio: '',
    height: '',
    weight: '',
    goal: '增肌',
  });

  const fetchData = async () => {
    try {
      const profile = await getProfile();
      setForm({
        avatar: profile.avatar || '',
        nickname: profile.username || user?.username || '',
        gender: profile.gender || '保密',
        bio: profile.bio || '',
        height: String(profile.height || ''),
        weight: String(profile.weight || ''),
        goal: profile.goal || '增肌',
      });
      setAvatarPreview(profile.avatar || '');
    } catch (error) {
      console.error('加载失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // 本地预览
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setAvatarPreview(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);

    // 上传到后端（Mock 模式会返回本地预览）
    try {
      const url = await uploadAvatar(file);
      setForm(prev => ({ ...prev, avatar: url }));
    } catch (error) {
      console.error('头像上传失败:', error);
    }
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      await updateProfile({
        nickname: form.nickname,
        gender: form.gender,
        bio: form.bio,
        height: parseFloat(form.height) || 0,
        weight: parseFloat(form.weight) || 0,
        goal: form.goal,
        avatar: form.avatar,
      });
      navigate('/profile');
    } catch (error) {
      console.error('保存失败:', error);
    } finally {
      setSaving(false);
    }
  };

  const genderOptions = ['男', '女', '保密'];
  const goalOptions = ['增肌', '减脂', '塑形', '保持健康'];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-slate-300 border-t-slate-600" />
          <p className="mt-3 text-sm text-slate-400 font-light">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-5 py-7">
      {/* ===== 标题区 ===== */}
      <div className="flex items-center gap-4 pb-6 border-b border-slate-200/50 mb-7">
        <button
          onClick={() => navigate('/profile')}
          className="p-1.5 -ml-1.5 rounded-md hover:bg-slate-100 transition-colors text-slate-400 hover:text-slate-600"
        >
          {Icons.back}
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-light text-slate-800 tracking-tight">编辑个人资料</h1>
          <p className="text-sm text-slate-400 font-light mt-0.5">更新你的个人信息</p>
        </div>
        <Button
          onClick={handleSubmit}
          disabled={saving}
          className="bg-slate-800 hover:bg-slate-700 text-white rounded-md px-6 py-2.5 text-sm font-normal tracking-wide transition-all duration-200 flex items-center gap-2"
        >
          {saving ? '保存中...' : '保存修改'}
          {!saving && Icons.check}
        </Button>
      </div>

      {/* ===== 头像 ===== */}
      <div className="flex items-center gap-6 pb-6 mb-6 border-b border-slate-200/50">
        <div className="relative flex-shrink-0">
          <div className="w-20 h-20 rounded-full bg-slate-200 flex items-center justify-center text-slate-400 overflow-hidden">
            {avatarPreview ? (
              <img src={avatarPreview} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-3xl">{Icons.user}</span>
            )}
          </div>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="absolute -bottom-0.5 -right-0.5 p-1.5 rounded-full bg-slate-700 hover:bg-slate-600 text-white transition-colors"
          >
            {Icons.camera}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarUpload}
          />
        </div>
        <div>
          <p className="text-sm font-medium text-slate-700">个人头像</p>
          <p className="text-xs text-slate-400 font-light mt-0.5">点击相机图标更换头像</p>
        </div>
      </div>

      {/* ===== 表单 ===== */}
      <div className="space-y-5">
        {/* 昵称 */}
        <div>
          <label className="text-xs text-slate-400 font-light block mb-1.5 uppercase tracking-wider">昵称</label>
          <Input
            className="rounded-md border-slate-200 focus:border-slate-400 focus:ring-0 text-sm font-light"
            value={form.nickname}
            onChange={(e) => setForm({ ...form, nickname: e.target.value })}
            placeholder="请输入昵称"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* 性别 */}
          <div>
            <label className="text-xs text-slate-400 font-light block mb-1.5 uppercase tracking-wider">性别</label>
            <select
              className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-300 font-light"
              value={form.gender}
              onChange={(e) => setForm({ ...form, gender: e.target.value })}
            >
              {genderOptions.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>

          {/* 健身目标 */}
          <div>
            <label className="text-xs text-slate-400 font-light block mb-1.5 uppercase tracking-wider">健身目标</label>
            <select
              className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-300 font-light"
              value={form.goal}
              onChange={(e) => setForm({ ...form, goal: e.target.value })}
            >
              {goalOptions.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>
        </div>

        {/* 个性签名 */}
        <div>
          <label className="text-xs text-slate-400 font-light block mb-1.5 uppercase tracking-wider">个性签名</label>
          <textarea
            className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:outline-none focus:border-slate-400 transition-colors min-h-[80px] resize-none font-light placeholder:text-slate-400"
            placeholder="一句话介绍自己..."
            value={form.bio}
            onChange={(e) => setForm({ ...form, bio: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          {/* 身高 */}
          <div>
            <label className="text-xs text-slate-400 font-light block mb-1.5 uppercase tracking-wider">身高 (cm)</label>
            <Input
              type="number"
              step="0.1"
              className="rounded-md border-slate-200 focus:border-slate-400 focus:ring-0 text-sm font-light"
              value={form.height}
              onChange={(e) => setForm({ ...form, height: e.target.value })}
              placeholder="0"
            />
          </div>

          {/* 体重 */}
          <div>
            <label className="text-xs text-slate-400 font-light block mb-1.5 uppercase tracking-wider">体重 (kg)</label>
            <Input
              type="number"
              step="0.1"
              className="rounded-md border-slate-200 focus:border-slate-400 focus:ring-0 text-sm font-light"
              value={form.weight}
              onChange={(e) => setForm({ ...form, weight: e.target.value })}
              placeholder="0"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileEdit;