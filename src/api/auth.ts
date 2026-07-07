import apiClient, { USE_MOCK, mockSuccess, mockDelay } from './client';

// ============ 类型 ============
export interface RegisterData {
  username: string;
  password: string;
  email: string;
}

export interface LoginData {
  username: string;
  password: string;
}

// ============ Mock 数据库 ============
// 放在模块级别，跨请求持久化
const mockDb: { users: any[]; tokens: Record<string, number> } = {
  users: [
    { id: 1, username: 'admin', password: '123456', email: 'admin@fitai.com' },
    { id: 2, username: 'test', password: '123456', email: 'test@fitai.com' },
    { id: 3, username: 'kkk', password: 'YY2233', email: '3969886822@qq.com' },
  ],
  tokens: {},
};

// ============ 注册 ============
export const register = async (data: RegisterData) => {
  if (USE_MOCK) {
    await mockDelay(600);
    const existing = mockDb.users.find((u) => u.username === data.username);
    if (existing) {
      return Promise.reject(new Error('用户名已存在'));
    }
    const newUser = {
      id: mockDb.users.length + 1,
      username: data.username,
      password: data.password,
      email: data.email,
    };
    mockDb.users.push(newUser);
    return mockSuccess({ id: newUser.id, username: newUser.username, email: newUser.email });
  }
  return apiClient.post('/api/auth/register', data);
};

// ============ 登录 ============
export const login = async (data: LoginData) => {
  if (USE_MOCK) {
    await mockDelay(500);
    const user = mockDb.users.find((u) => u.username === data.username && u.password === data.password);
    if (!user) {
      return Promise.reject(new Error('用户名或密码错误'));
    }
    const token = `mock-jwt-${Date.now()}-${user.id}`;
    mockDb.tokens[token] = user.id;
    return mockSuccess({
      token,
      userId: user.id,
      username: user.username,
      email: user.email,
    });
  }
  return apiClient.post('/api/auth/login', data);
};