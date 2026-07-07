import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { register as registerApi } from '@/api/auth';

// ===== 图标 =====
const Icons = {
  user: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
  mail: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 7-10 7L2 7" />
    </svg>
  ),
  lock: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  ),
  logo: (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2a10 10 0 0 0 0 20" />
      <path d="M12 2a10 10 0 0 1 0 20" />
      <path d="M12 2L2 7l10 5 10-5-10-5z" />
      <path d="M2 17l10 5 10-5" />
      <path d="M2 12l10 5 10-5" />
    </svg>
  ),
  check: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
};

const Register = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    if (username.length < 3) {
      setError('用户名至少 3 位');
      return;
    }
    if (password.length < 6) {
      setError('密码至少 6 位');
      return;
    }
    if (password !== confirmPassword) {
      setError('两次密码输入不一致');
      return;
    }
    if (!email.includes('@')) {
      setError('请输入有效的邮箱地址');
      return;
    }

    setLoading(true);

    try {
      await registerApi({ username, password, email });
      navigate('/login');
    } catch (err: any) {
      setError(err?.message || '注册失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/30 flex items-center justify-center px-4">
      <Card className="w-full max-w-sm border-0 shadow-sm bg-white">
        <CardHeader className="text-center pb-4">
          <div className="flex justify-center mb-3 text-slate-800">{Icons.logo}</div>
          <CardTitle className="text-xl font-light text-slate-800 tracking-tight">注册 FitAI</CardTitle>
          <p className="text-sm text-slate-400 font-light mt-1">创建账号，开始你的训练计划</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg font-light">
                {error}
              </div>
            )}
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">{Icons.user}</div>
              <Input
                type="text"
                placeholder="用户名（至少 3 位）"
                className="pl-10 rounded-lg border-slate-200 focus:border-slate-400 focus:ring-0 text-sm font-light h-11"
                value={username}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUsername(e.target.value)}
                required
              />
            </div>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">{Icons.mail}</div>
              <Input
                type="email"
                placeholder="邮箱"
                className="pl-10 rounded-lg border-slate-200 focus:border-slate-400 focus:ring-0 text-sm font-light h-11"
                value={email}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">{Icons.lock}</div>
              <Input
                type="password"
                placeholder="密码（至少 6 位）"
                className="pl-10 rounded-lg border-slate-200 focus:border-slate-400 focus:ring-0 text-sm font-light h-11"
                value={password}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">{Icons.lock}</div>
              <Input
                type="password"
                placeholder="确认密码"
                className="pl-10 rounded-lg border-slate-200 focus:border-slate-400 focus:ring-0 text-sm font-light h-11"
                value={confirmPassword}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-slate-800 hover:bg-slate-700 text-white rounded-lg h-11 text-sm font-normal"
              disabled={loading}
            >
              {loading ? '注册中...' : '注册'}
            </Button>
            <p className="text-center text-sm text-slate-400 font-light">
              已有账号？{' '}
              <Link to="/login" className="text-slate-600 hover:text-slate-800 transition-colors font-medium">
                去登录
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Register;