import { useMutation, useQuery } from '@tanstack/react-query';
import { fetchApi } from '../lib/api-client';
import { useAuthStore } from '../store/useAuthStore';
import { IUser } from '@pdf-chatbot/shared';

export const useLoginMutation = () => {
  const { setAuth } = useAuthStore();
  return useMutation({
    mutationFn: async (credentials: { email: string; password: string }) => {
      const res = await fetchApi<any>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      });
      if (!res.success || !res.data) {
        throw new Error(res.message || 'Login failed');
      }
      return res.data;
    },
    onSuccess: (data) => {
      setAuth(data.user, data.token);
    },
  });
};

export const useRegisterMutation = () => {
  const { setAuth } = useAuthStore();
  return useMutation({
    mutationFn: async (userData: { email: string; password: string; name: string; role?: string }) => {
      const res = await fetchApi<any>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData),
      });
      if (!res.success || !res.data) {
        throw new Error(res.message || 'Registration failed');
      }
      return res.data;
    },
    onSuccess: (data) => {
      setAuth(data.user, data.token);
    },
  });
};

export const useCurrentUserQuery = () => {
  const { token } = useAuthStore();
  return useQuery({
    queryKey: ['currentUser', token],
    queryFn: async () => {
      const res = await fetchApi<IUser>('/auth/me');
      if (!res.success || !res.data) {
        throw new Error(res.message || 'Failed to fetch user');
      }
      return res.data;
    },
    enabled: !!token,
  });
};
