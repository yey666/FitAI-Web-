import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getProfile, getUserCheckins, uploadAvatar } from '@/api/profile';
import { useAuthStore } from '@/store/useAuthStore';
import { motion } from 'framer-motion';

// ===== 图标 =====
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
  edit: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
    </svg>
  ),
  camera: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
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
  clock: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  ),
  fire: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22c3.314 0 6-2.686 6-6 0-4-6-10-6-10S6 12 6 16c0 3.314 2.686 6 6 6z" />
      <path d="M12 13c.552 0 1-.448 1-1s-.448-1-1-1-1 .448-1 1 .448 1 1 1z" />
    </svg>
  ),
};

interface ProfileData {
  id: number;
  username: string;
  email: string;
  avatar?: string;
  nickname?: string;
  gender?: string;
  bio?: string;
  height: number;
  weight: number;
  goal: string;
  totalWorkouts: number;
  totalDuration: number;
  totalCalories: number;
}

interface CheckinItem {
  id: number;
  content: string;
  time: string;
}

const Profile = () => {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [checkins, setCheckins] = useState<CheckinItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchData = async () => {
    try {
      const [profileData, checkinData] = await Promise.all([
        getProfile(),
        getUserCheckins(),
      ]);
      setProfile(profileData);
      setCheckins(checkinData);
    } catch (error) {
      console.error('加载个人数据失败:', error);
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
    setAvatarUploading(true);
    try {
      const avatarUrl = await uploadAvatar(file);
      setProfile(prev => prev ? { ...prev, avatar: avatarUrl } : null);
    } catch (error) {
      console.error('头像上传失败:', error);
    } finally {
      setAvatarUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="bg-slate-100 rounded-xl h-32 animate-pulse" />
        <div className="grid grid-cols-3 gap-3 mt-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-slate-100 rounded-lg h-20 animate-pulse" />
          ))}
        </div>
        <div className="mt-6 space-y-2">
          {[1, 2].map((i) => (
            <div key={i} className="bg-slate-100 rounded-lg h-12 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const displayName = profile?.nickname || profile?.username || user?.username || '用户';
  const displayEmail = profile?.email || user?.email || '';

  return (
    <div className="page-container space-y-6">
      {/* ===== 标题区 ===== */}
      <div className="page-header flex items-center justify-between">
        <div>
          <h1 className="page-title">个人主页</h1>
          <p className="page-subtitle">管理个人资料和训练数据</p>
        </div>
        <Button
          onClick={() => navigate('/profile/edit')}
          variant="outline"
          className="border-slate-200 text-slate-600 hover:bg-slate-50"
        >
          {Icons.edit}
          编辑资料
        </Button>
      </div>

      {/* ===== 用户信息卡片 ===== */}
      <Card className="border-0 shadow-sm bg-white">
        <CardContent className="p-6">
          <div className="flex items-center gap-6">
            <div className="relative flex-shrink-0">
              <div className="w-20 h-20 rounded-full bg-slate-200 flex items-center justify-center text-slate-400 overflow-hidden">
                {profile?.avatar ? (
                  <img src={profile.avatar} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-3xl">{Icons.user}</span>
                )}
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={avatarUploading}
                className="absolute -bottom-0.5 -right-0.5 p-1.5 rounded-full bg-slate-700 hover:bg-slate-600 text-white transition-colors disabled:opacity-50"
              >
                {avatarUploading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  Icons.camera
                )}
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
            </div>

            <div>
              <h2 className="text-lg font-medium text-slate-700">{displayName}</h2>
              <p className="text-sm text-slate-400 font-light">{displayEmail}</p>
              {profile?.bio && <p className="text-sm text-slate-500 font-light mt-1">{profile.bio}</p>}
              <div className="flex items-center gap-4 mt-1.5 flex-wrap">
                {profile?.gender && profile.gender !== '保密' && (
                  <span className="text-xs text-slate-400 font-light">{profile.gender}</span>
                )}
                <span className="text-xs text-slate-400 font-light">身高 {profile?.height || 0} cm</span>
                <span className="text-xs text-slate-400 font-light">体重 {profile?.weight || 0} kg</span>
                <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-light">
                  {profile?.goal || '未设置'}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ===== 训练总览 ===== */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="border-0 shadow-sm bg-white">
          <CardContent className="p-4 text-center">
            <div className="text-slate-400 flex justify-center mb-1">{Icons.calendar}</div>
            <p className="stat-label">总训练次数</p>
            <p className="stat-number mt-0.5">{profile?.totalWorkouts || 0}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-white">
          <CardContent className="p-4 text-center">
            <div className="text-slate-400 flex justify-center mb-1">{Icons.clock}</div>
            <p className="stat-label">总时长</p>
            <p className="stat-number mt-0.5">{profile?.totalDuration || 0} <span className="text-sm font-light text-slate-300">分钟</span></p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-white">
          <CardContent className="p-4 text-center">
            <div className="text-slate-400 flex justify-center mb-1">{Icons.fire}</div>
            <p className="stat-label">总消耗</p>
            <p className="stat-number mt-0.5">{profile?.totalCalories || 0} <span className="text-sm font-light text-slate-300">kcal</span></p>
          </CardContent>
        </Card>
      </div>

      {/* ===== 我的打卡 ===== */}
      <Card className="border-0 shadow-sm bg-white">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-slate-400">
              {Icons.calendar}
              <span className="text-xs font-medium uppercase tracking-wider">我的打卡</span>
            </div>
            <span className="text-xs text-slate-300 font-light">共 {checkins.length} 条</span>
          </div>
          <div className="space-y-2">
            {checkins.length === 0 ? (
              <p className="text-sm text-slate-400 font-light text-center py-6">暂无打卡记录</p>
            ) : (
              checkins.map((item, idx) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: idx * 0.05 }}
                  className="flex items-center justify-between py-2.5 px-3 -mx-3 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <p className="text-sm text-slate-600 font-light truncate max-w-[70%]">{item.content}</p>
                  <span className="text-xs text-slate-300 font-light flex-shrink-0 ml-4">{item.time}</span>
                </motion.div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Profile;