import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuthStore } from '@/store/useAuthStore';
import { login as loginApi } from '@/api/auth';

const Icons = {
  user: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
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
};

const Login = () => {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await loginApi({ username, password });
      console.log('登录返回:', res);
      
      let token, userId, userName, userEmail;
      
      if (res.data && res.data.token) {
        token = res.data.token;
        userId = res.data.userId;
        userName = res.data.username;
        userEmail = res.data.email;
      } else if (res.token) {
        token = res.token;
        userId = res.userId;
        userName = res.username;
        userEmail = res.email;
      } else {
        console.error('未知格式:', res);
        setError('登录数据格式异常');
        setLoading(false);
        return;
      }
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify({
        id: userId,
        username: userName,
        email: userEmail
      }));
      
      login(token, { id: userId, username: userName, email: userEmail });
      navigate('/');
    } catch (err: any) {
      console.error('登录失败:', err);
      setError(err?.message || '登录失败，请检查用户名和密码');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/30 flex items-center justify-center px-4">
      <Card className="w-full max-w-sm border-0 shadow-sm bg-white">
        <CardHeader className="text-center pb-4">
          <div className="flex justify-center mb-3 text-slate-800">{Icons.logo}</div>
          <CardTitle className="text-xl font-light text-slate-800 tracking-tight">登录 FitAI</CardTitle>
          <p className="text-sm text-slate-400 font-light mt-1">欢迎回来，继续你的训练</p>
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
                placeholder="用户名"
                className="pl-10 rounded-lg border-slate-200 focus:border-slate-400 focus:ring-0 text-sm font-light h-11"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">{Icons.lock}</div>
              <Input
                type="password"
                placeholder="密码"
                className="pl-10 rounded-lg border-slate-200 focus:border-slate-400 focus:ring-0 text-sm font-light h-11"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-slate-800 hover:bg-slate-700 text-white rounded-lg h-11 text-sm font-normal"
              disabled={loading}
            >
              {loading ? '登录中...' : '登录'}
            </Button>
            <p className="text-center text-sm text-slate-400 font-light">
              还没有账号？{' '}
              <Link to="/register" className="text-slate-600 hover:text-slate-800 transition-colors font-medium">
                立即注册
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;