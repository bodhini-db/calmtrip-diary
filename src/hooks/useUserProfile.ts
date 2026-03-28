import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { UserProfile } from '@/hooks/useUsers';

export const useUserProfile = (userId?: string) => {
  return useQuery<UserProfile | null, Error>({
    queryKey: ['profile', userId],
    queryFn: async () => {
      if (!userId) throw new Error('Missing profile id');
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, avatar_url, full_name, bio')
        .eq('id', userId)
        .maybeSingle();
      if (error) throw error;
      return (data as UserProfile) ?? null;
    },
    enabled: !!userId,
    initialData: undefined,
  });
};
