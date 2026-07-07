import { createBrowserRouter, Navigate } from 'react-router-dom';
import Layout from '../components/Layout';
import Home from '../pages/Home';
import Login from '../pages/Login';
import Register from '../pages/Register';
import Exercises from '../pages/Exercises';
import Workout from '../pages/Workout';
import Correct from '../pages/Correct';
import AIPlan from '../pages/AIPlan';
import Metrics from '../pages/Metrics';
import Community from '../pages/Community';
import Profile from '../pages/Profile';
import ProfileEdit from '../pages/ProfileEdit';
// 管理后台页面
import Admin from '../pages/Admin';
import AdminUsers from '../pages/Admin/Users';
import AdminCheckins from '../pages/Admin/Checkins';
import AdminExercises from '../pages/Admin/Exercises';
import { useAuthStore } from '../store/useAuthStore';

// ===== 普通用户路由守卫 =====
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

// ===== 管理员路由守卫 =====
const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);
  const viewMode = useAuthStore((state) => state.viewMode);
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  if (user?.role !== 'admin' || viewMode !== 'admin') {
    return <Navigate to="/" replace />;
  }
  return children;
};

export const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <Layout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Home /> },
      { path: 'exercises', element: <Exercises /> },
      { path: 'workout', element: <Workout /> },
      { path: 'correct', element: <Correct /> },
      { path: 'ai-plan', element: <AIPlan /> },
      { path: 'metrics', element: <Metrics /> },
      { path: 'community', element: <Community /> },
      { path: 'profile', element: <Profile /> },
      { path: 'profile/edit', element: <ProfileEdit /> },
    ],
  },
  // ===== 管理后台路由 =====
  {
    path: '/admin',
    element: (
      <AdminRoute>
        <Layout />
      </AdminRoute>
    ),
    children: [
      { index: true, element: <Admin /> },
      { path: 'users', element: <AdminUsers /> },
      { path: 'checkins', element: <AdminCheckins /> },
      { path: 'exercises', element: <AdminExercises /> },
    ],
  },
  { path: '/login', element: <Login /> },
  { path: '/register', element: <Register /> },
  { path: '*', element: <Navigate to="/" replace /> },
]);