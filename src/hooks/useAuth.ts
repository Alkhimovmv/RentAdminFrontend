import { useMutation, useQuery } from '@tanstack/react-query';
import { authApi } from '../api/auth';

export const useAuth = () => {
  const token = localStorage.getItem('authToken');
  const isAuthenticated = Boolean(token);

  const loginMutation = useMutation(authApi.login, {
    onSuccess: (data) => {
      localStorage.setItem('authToken', data.token);
      window.location.reload(); // Перезагрузить страницу после успешного входа
    },
    onError: () => {
      localStorage.removeItem('authToken');
    },
  });

  const verifyQuery = useQuery(['auth', 'verify'], authApi.verify, {
    enabled: isAuthenticated,
    retry: false,
  });

  const logout = () => {
    localStorage.removeItem('authToken');
    window.location.href = '/login';
  };

  // Если нет токена, то не проверяем - пользователь точно не аутентифицирован
  const isVerifying = isAuthenticated ? verifyQuery.isLoading : false;

  return {
    isAuthenticated,
    login: loginMutation.mutate,
    loginError: loginMutation.error,
    loginLoading: loginMutation.isLoading,
    logout,
    user: verifyQuery.data,
    isVerifying,
  };
};