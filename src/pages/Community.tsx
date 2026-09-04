import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { getFeed, createCheckin, toggleLike, deleteCheckin, getLikeStatus } from '@/api/community';
import { motion } from 'framer-motion';
import { shouldShowAdminActions } from '@/utils/auth';

// ===== 图标 =====
const Icons = {
  back: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 12H5" />
      <path d="M12 19l-7-7 7-7" />
    </svg>
  ),
  heart: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  ),
  heartFilled: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="#ef4444" stroke="none">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  ),
  plus: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </svg>
  ),
  user: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
  send: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 2L11 13" />
      <path d="M22 2l-7 20-4-9-9-4 20-7z" />
    </svg>
  ),
  image: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <path d="M21 15l-5-5L5 21" />
    </svg>
  ),
  close: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6L6 18" />
      <path d="M6 6l12 12" />
    </svg>
  ),
  x: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6L6 18" />
      <path d="M6 6l12 12" />
    </svg>
  ),
  delete: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6h18" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  ),
};

interface Checkin {
  id: number;
  userId: number;
  username: string;
  avatar: string;
  content: string;
  images: string[];
  likes: number;
  isLiked: boolean;
  time: string;
}

const Community = () => {
  const navigate = useNavigate();
  const [feed, setFeed] = useState<Checkin[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedCheckin, setSelectedCheckin] = useState<Checkin | null>(null);
  const [newContent, setNewContent] = useState('');
  const [newImages, setNewImages] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchData = async () => {
    try {
      const data = await getFeed();
      const list = Array.isArray(data) ? data : [];
      // 逐个查询当前用户对每个帖子的点赞状态，并挂到 isLiked 上
      const withStatus = await Promise.all(
        list.map(async (item) => {
          try {
            const liked = await getLikeStatus(item.id);
            return { ...item, isLiked: !!liked };
          } catch {
            return { ...item, isLiked: false };
          }
        })
      );
      setFeed(withStatus);
    } catch (error) {
      console.error('加载动态失败:', error);
      setFeed([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async () => {
    if (!newContent.trim() && newImages.length === 0) return;
    await createCheckin({ content: newContent, images: newImages });
    setNewContent('');
    setNewImages([]);
    setDialogOpen(false);
    fetchData();
  };

  const handleLike = async (id: number) => {
    const target = feed.find((f) => f.id === id);
    const wasLiked = target?.isLiked ?? selectedCheckin?.isLiked ?? false;
    const nextLiked = !wasLiked;

    // 更新 feed 与详情弹窗里对应帖子的 isLiked
    const applyLikeState = (liked: boolean) => {
      setFeed((prev) =>
        prev.map((item) => (item.id === id ? { ...item, isLiked: liked } : item))
      );
      setSelectedCheckin((prev) =>
        prev && prev.id === id ? { ...prev, isLiked: liked } : prev
      );
    };

    try {
      await toggleLike(id, wasLiked);
      // 接口成功：立即切换本地状态（灰↔红）
      applyLikeState(nextLiked);
    } catch (err) {
      console.error('点赞/取消点赞失败，回查真实状态:', err);
      // 失败（如 400 重复点赞）→ 回查服务端状态，覆盖本地
      try {
        const serverLiked = await getLikeStatus(id);
        applyLikeState(!!serverLiked);
      } catch (e2) {
        console.error('查询点赞状态失败:', e2);
      }
    }
  };

  const handleDeleteCheckin = async (checkinId: number) => {
    if (!confirm('确定要删除该打卡吗？此操作不可撤销。')) return;
    try {
      await deleteCheckin(checkinId);
      fetchData();
      if (detailOpen && selectedCheckin?.id === checkinId) {
        setDetailOpen(false);
        setSelectedCheckin(null);
      }
    } catch (error) {
      console.error('删除打卡失败:', error);
    }
  };

  const openDetail = (checkin: Checkin) => {
    setSelectedCheckin(checkin);
    setDetailOpen(true);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    for (let i = 0; i < Math.min(files.length, 3 - newImages.length); i++) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setNewImages(prev => [...prev, event.target!.result as string]);
        }
      };
      reader.readAsDataURL(files[i]);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeImage = (index: number) => {
    setNewImages(prev => prev.filter((_, i) => i !== index));
  };

  const formatTime = (timeStr: string) => {
    const map: Record<string, string> = { '刚刚': '刚刚', '1小时前': '1小时前', '2小时前': '2小时前', '3小时前': '3小时前', '昨天': '昨天' };
    return map[timeStr] || timeStr;
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="columns-1 sm:columns-2 gap-4 space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-slate-100 rounded-xl h-64 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const safeFeed = Array.isArray(feed) ? feed : [];

  return (
    <div className="page-container space-y-6">
      {/* ===== 标题区 ===== */}
      <div className="page-header flex items-center justify-between">
        <div>
          <h1 className="page-title">社区</h1>
          <p className="page-subtitle">分享训练，互相激励</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-slate-800 hover:bg-slate-700 text-white rounded-full">
              {Icons.plus}
              打卡
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md p-0 bg-transparent border-0 shadow-none">
            <div className="bg-white rounded-xl shadow-xl p-6">
              <DialogHeader className="px-0 pt-0 pb-4">
                <DialogTitle className="text-slate-800 text-base font-light tracking-wide">发布打卡</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {newImages.map((img, idx) => (
                    <div key={idx} className="relative w-16 h-16 rounded-lg overflow-hidden bg-slate-100">
                      <img src={img} alt="" className="w-full h-full object-cover" />
                      <button onClick={() => removeImage(idx)} className="absolute top-0 right-0 p-0.5 bg-slate-800/70 rounded-bl-lg text-white">{Icons.close}</button>
                    </div>
                  ))}
                  {newImages.length < 3 && (
                    <button onClick={() => fileInputRef.current?.click()} className="w-16 h-16 rounded-lg border-2 border-dashed border-slate-200 flex items-center justify-center text-slate-400 hover:border-slate-400 transition-colors">
                      {Icons.image}
                    </button>
                  )}
                  <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} />
                </div>
                <textarea
                  className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm text-slate-700 focus:outline-none focus:border-slate-400 transition-colors min-h-[80px] resize-none font-light placeholder:text-slate-400"
                  placeholder="分享你的训练成果..."
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                />
                <Button onClick={handleSubmit} className="w-full bg-slate-800 hover:bg-slate-700 text-white">
                  {Icons.send}
                  发布打卡
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* ===== 双列瀑布流 ===== */}
      {safeFeed.length === 0 ? (
        <div className="text-center py-16">
          <div className="p-4 rounded-full bg-slate-100 inline-block text-slate-400">{Icons.user}</div>
          <p className="text-sm text-slate-400 font-light mt-4">还没有打卡动态</p>
          <p className="text-xs text-slate-300 font-light mt-1">成为第一个打卡的人</p>
        </div>
      ) : (
        <div className="columns-1 sm:columns-2 gap-4 space-y-4">
          {safeFeed.map((item, idx) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: idx * 0.04 }}
              className="break-inside-avoid cursor-pointer"
              onClick={() => openDetail(item)}
            >
              <Card className="border-0 shadow-sm bg-white rounded-xl overflow-hidden hover:shadow-md transition-shadow duration-200">
                <CardContent className="p-0">
                  {item.images && item.images.length > 0 ? (
                    <div className="aspect-[4/3] overflow-hidden bg-slate-100">
                      <img src={item.images[0]} alt="" className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="aspect-[4/3] bg-gradient-to-br from-slate-100 to-slate-200/50 flex items-center justify-center text-4xl text-slate-300">
                      {Icons.user}
                    </div>
                  )}
                  <div className="p-4">
                    <div className="flex items-center gap-2.5 mb-2">
                      <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 text-xs font-light">
                        {item.username?.[0]?.toUpperCase() || 'U'}
                      </div>
                      <span className="text-xs font-medium text-slate-700">{item.username}</span>
                      <span className="text-[10px] text-slate-300 ml-auto">{formatTime(item.time)}</span>
                    </div>
                    {item.content && (
                      <p className="text-xs text-slate-500 font-light leading-relaxed line-clamp-2 mb-2.5">
                        {item.content}
                      </p>
                    )}
                    <div className="flex items-center gap-4 pt-2.5 border-t border-slate-200/50">
                      <button
                        className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 transition-colors"
                        onClick={(e) => { e.stopPropagation(); handleLike(item.id); }}
                      >
                        {item.isLiked ? Icons.heartFilled : Icons.heart}
                      </button>
                      {shouldShowAdminActions() && (
                        <button
                          className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-600 transition-colors ml-auto"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteCheckin(item.id);
                          }}
                        >
                          {Icons.delete}
                          删除
                        </button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* ===== 详情弹窗 ===== */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-md p-0 bg-transparent border-0 shadow-none max-h-[90vh] overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl overflow-hidden">
            {selectedCheckin && (
              <>
                <button onClick={() => setDetailOpen(false)} className="absolute top-3 right-3 z-10 p-1.5 rounded-full bg-black/30 text-white hover:bg-black/50 transition-colors">
                  {Icons.x}
                </button>
                {selectedCheckin.images && selectedCheckin.images.length > 0 ? (
                  <div className="aspect-[4/3] overflow-hidden bg-slate-100">
                    <img src={selectedCheckin.images[0]} alt="" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="aspect-[4/3] bg-gradient-to-br from-slate-100 to-slate-200/50 flex items-center justify-center text-5xl text-slate-300">
                    {Icons.user}
                  </div>
                )}
                <div className="p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 text-sm font-light">
                      {selectedCheckin.username?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-700">{selectedCheckin.username}</p>
                      <p className="text-xs text-slate-400 font-light">{formatTime(selectedCheckin.time)}</p>
                    </div>
                  </div>
                  <p className="text-sm text-slate-600 font-light leading-relaxed mb-4">{selectedCheckin.content}</p>
                  <div className="flex items-center gap-4 mb-4">
                    <button
                      className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 transition-colors"
                      onClick={() => handleLike(selectedCheckin.id)}
                    >
                      {selectedCheckin.isLiked ? Icons.heartFilled : Icons.heart}
                    </button>
                    {shouldShowAdminActions() && (
                      <button
                        className="flex items-center gap-1.5 text-sm text-red-400 hover:text-red-600 transition-colors"
                        onClick={() => handleDeleteCheckin(selectedCheckin.id)}
                      >
                        {Icons.delete}
                        删除
                      </button>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Community;