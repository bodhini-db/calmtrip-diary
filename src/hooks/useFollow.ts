import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

export const useIsFollowing = (targetUserId: string) => {
  const { user } = useAuth();

  return useQuery<boolean, Error>({
    queryKey: ['isFollowing', targetUserId],
    queryFn: async () => {
      if (!user?.id || !targetUserId) return false;

      const { data, error } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', user.id)
        .eq('following_id', targetUserId)
        .maybeSingle();

      if (error) throw error;
      return Boolean(data?.following_id);
    },
    enabled: !!user?.id && !!targetUserId,
    initialData: false,
  });
};

export const useFollowMutation = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const follow = useMutation<void, Error, string>({
    mutationFn: async (targetUserId: string) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { error } = await supabase.from('follows').insert([
        {
          follower_id: user.id,
          following_id: targetUserId,
        },
      ]);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['isFollowing'], exact: false });
      queryClient.invalidateQueries({ queryKey: ['users'], exact: false });
      queryClient.invalidateQueries({ queryKey: ['feed'], exact: false });
    },
  });

  const unfollow = useMutation<void, Error, string>({
    mutationFn: async (targetUserId: string) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('follows')
        .delete()
        .eq('follower_id', user.id)
        .eq('following_id', targetUserId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['isFollowing'], exact: false });
      queryClient.invalidateQueries({ queryKey: ['users'], exact: false });
      queryClient.invalidateQueries({ queryKey: ['feed'], exact: false });
    },
  });

  return {
    follow,
    unfollow,
  };
};
