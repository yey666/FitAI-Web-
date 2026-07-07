import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { Button } from '@/components/ui/button';

const navItems = [
  { path: '/', label: '首页' },
  { path: '/exercises', label: '动作库' },
  { path: '/workout', label: '训练' },
  { path: '/correct', label: '纠正' },
  { path: '/ai-plan', label: 'AI计划' },
  { path: '/metrics', label: '身体数据' },
  { path: '/community', label: '社区' },
  { path: '/profile', label: '个人' },
];

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
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
        </nav>

        <div className="flex items-center gap-3">
          {isAuthenticated && (
            <span className="text-sm text-slate-500 font-light hidden sm:block">
              👋 {user?.username}
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