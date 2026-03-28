import type { MouseEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { useIsFollowing, useFollowMutation } from '@/hooks/useFollow';
import { toast } from '@/components/ui/sonner';

export interface UserCardProfile {
  id: string;
  username: string;
  avatar_url?: string | null;
  full_name?: string | null;
  bio?: string | null;
  followers_count?: number | null;
}

interface UserCardProps {
  user: UserCardProfile;
}

export function UserCard({ user }: UserCardProps) {
  const navigate = useNavigate();
  const { data: isFollowing = false, isLoading } = useIsFollowing(user.id);
  const { follow, unfollow } = useFollowMutation();

  const handleNavigateProfile = (event?: MouseEvent<HTMLButtonElement>) => {
    event?.stopPropagation();
    if (isFollowing) {
      navigate(`/journal/${user.id}`);
    } else {
      toast.error('Follow to view this traveler\'s journal');
    }
  };

  const handleNavigateJournal = () => {
    if (isFollowing) {
      navigate(`/journal/${user.id}`);
    } else {
      toast.error('Follow to view this traveler\'s journal');
    }
  };

  const handleToggle = async () => {
    try {
      if (isFollowing) {
        await unfollow.mutateAsync(user.id);
        toast.success(`Unfollowed ${user.username}`);
      } else {
        await follow.mutateAsync(user.id);
        toast.success(`Followed ${user.username}`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to update follow status';
      toast.error(message);
    }
  };

  return (
    <Card
      className="flex items-center justify-between gap-4 p-4 shadow-soft cursor-pointer"
      onClick={handleNavigateJournal}
    >
      <div className="flex items-center gap-4 min-w-0">
        <Avatar>
          {user.avatar_url ? (
            <AvatarImage src={user.avatar_url} alt={user.username} />
          ) : (
            <AvatarFallback>{user.username.charAt(0).toUpperCase()}</AvatarFallback>
          )}
        </Avatar>
        <div className="min-w-0">
          <p className="font-semibold text-foreground truncate">{user.full_name || user.username}</p>
          <p className="text-sm text-muted-foreground truncate">@{user.username}</p>
          {user.bio && <p className="text-sm text-muted-foreground truncate">{user.bio}</p>}
        </div>
      </div>

      <div className="flex flex-col items-end gap-3">
        <p className="text-xs text-muted-foreground">{user.followers_count ?? 0} followers</p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={(event) => {
              event.stopPropagation();
              handleNavigateProfile();
            }}
          >
            Profile
          </Button>
          <Button
            variant={isFollowing ? 'outline' : 'default'}
            size="sm"
            onClick={(event) => {
              event.stopPropagation();
              handleToggle();
            }}
            disabled={isLoading || follow.status === 'pending' || unfollow.status === 'pending'}
          >
            {isFollowing ? 'Unfollow' : 'Follow'}
          </Button>
        </div>
      </div>
    </Card>
  );
}
