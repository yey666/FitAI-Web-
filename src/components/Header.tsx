import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore';
import { Button } from '@/components/ui/button';
import { isAdmin } from '@/utils/auth';

// 普通用户导航
const userNavItems = [
  { path: '/', label: '首页' },
  { path: '/exercises', label: '动作库' },
  { path: '/workout', label: '训练' },
  { path: '/correct', label: '纠正' },
  { path: '/ai-plan', label: 'AI计划' },
  { path: '/metrics', label: '身体数据' },
  { path: '/community', label: '社区' },
  { path: '/profile', label: '个人' },
];

// 管理员导航
const adminNavItems = [
  { path: '/admin', label: '数据统计' },
  { path: '/admin/users', label: '用户管理' },
  { path: '/admin/checkins', label: '打卡管理' },
  { path: '/admin/exercises', label: '动作管理' },
];

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, logout, viewMode, toggleView, switchToAdminView } = useAuthStore();
  const isAdminUser = isAdmin();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

 const isActive = (path: string) => {
  if (path === '/') return location.pathname === '/';
  // 精确匹配当前路径
  if (path === '/admin') return location.pathname === '/admin';
  // 其他路径用 startsWith 匹配（普通用户的子路径）
  return location.pathname.startsWith(path);
};

  // 决定显示哪些导航项
  let navItems = userNavItems;
  let showSwitchButton = false;
  let switchButtonLabel = '';

  if (isAdminUser && viewMode === 'admin') {
    // 管理员 - 管理视图：显示管理导航 + 切换按钮
    navItems = adminNavItems;
    showSwitchButton = true;
    switchButtonLabel = '切换普通视图';
  } else if (isAdminUser && viewMode === 'user') {
    // 管理员 - 普通用户视图：显示普通导航 + 回到管理后台按钮
    navItems = userNavItems;
    showSwitchButton = true;
    switchButtonLabel = '回到管理后台';
  } else {
    // 普通用户：显示普通导航，无切换按钮
    navItems = userNavItems;
    showSwitchButton = false;
  }

const handleSwitchView = () => {
  if (viewMode === 'admin') {
    toggleView();
    navigate('/');  // 切换到普通视图时跳转到首页
  } else {
    switchToAdminView();
    navigate('/admin');  // 切换到管理视图时跳转到管理后台
  }
};

  return (
    <header className="bg-white border-b border-slate-200/60 sticky top-0 z-50 backdrop-blur-sm bg-white/90">
      <div className="max-w-5xl mx-auto px-5 py-3 flex items-center justify-between">
        <Link to="/" className="text-xl font-light text-slate-800 tracking-tight">
          FitAI
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`text-sm transition-colors ${
                isActive(item.path)
                  ? 'text-slate-800 font-medium'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              {item.label}
            </Link>
          ))}
          {/* 管理员视图切换按钮 */}
          {showSwitchButton && (
            <button
              onClick={handleSwitchView}
              className="text-sm text-blue-500 hover:text-blue-700 transition-colors"
            >
              {switchButtonLabel}
            </button>
          )}
        </nav>

        <div className="flex items-center gap-3">
          {isAuthenticated && (
            <span className="text-sm text-slate-500 font-light hidden sm:block">
              👋 {user?.username}
              {isAdminUser && viewMode === 'admin' && (
                <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                  管理员
                </span>
              )}
            </span>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="text-slate-400 hover:text-slate-600"
          >
            退出
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;