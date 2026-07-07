import { useAuthStore } from '@/store/useAuthStore';

// 判断当前用户是否为管理员
export const isAdmin = () => {
  const user = useAuthStore.getState().user;
  return user?.role === 'admin';
};

// 判断当前是否在管理视图
export const isAdminView = () => {
  const state = useAuthStore.getState();
  return state.user?.role === 'admin' && state.viewMode === 'admin';
};

// 判断是否显示管理操作按钮（删除/编辑等）
// 只有管理员且在管理视图下才显示
export const shouldShowAdminActions = () => {
  const state = useAuthStore.getState();
  return state.user?.role === 'admin' && state.viewMode === 'admin';
};