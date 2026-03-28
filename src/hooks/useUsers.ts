import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

export interface UserProfile {
  id: string;
  username: string;
  avatar_url?: string | null;
  full_name?: string | null;
  bio?: string | null;
  followers_count?: number | null;
  created_at?: string | null;
}

export const useUsers = (search?: string) => {
  const { user } = useAuth();

  return useQuery<UserProfile[], Error>({
    queryKey: ['users', search],
    queryFn: async () => {
      let query = supabase
        .from('profiles')
        .select('id, username, avatar_url, full_name, bio');

      if (search?.trim()) {
        const sanitized = search.trim();
        query = query.or(`username.ilike.%${sanitized}%,full_name.ilike.%${sanitized}%`);
      }

      const { data, error } = await query;
      if (error) {
        if (error.message?.includes('does not exist')) {
          console.warn('Supabase table missing for user discovery:', error.message);
          return [];
        }
        throw error;
      }
      return data || [];
    },
    enabled: !!user?.id,
    initialData: [],
  });
};
