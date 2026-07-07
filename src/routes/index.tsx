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
import { useAuthStore } from '../store/useAuthStore';

// 路由守卫组件
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  return isAuthenticated ? children : <Navigate to="/login" replace />;
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
  { path: '/login', element: <Login /> },
  { path: '/register', element: <Register /> },
]);