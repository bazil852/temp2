export type User = {
  id: string;
  email?: string;
  user_metadata?: {
    display_name?: string;
    avatar_url?: string;
  };
};

export type Comment = {
  id: string;
  content: string;
  created_at: string;
  profiles: {
    email: string;
    display_name: string | null;
    avatar_url: string | null;
  };
};

export type Message = {
  id: string;
  content: string;
  image_url?: string;
  created_at: string;
  is_pinned: boolean;
  user_id: string;
  like_count: number;
  user_has_liked?: boolean;
  comments?: Comment[];
  profiles: {
    email: string;
    display_name: string | null;
    avatar_url: string | null;
    is_admin: boolean;
  };
};

export type PollOption = {
  id: string;
  text: string;
  votes: number;
};

export type Poll = {
  id: string;
  question: string;
  created_at: string;
  user_id: string;
  expires_at: string | null;
  is_active: boolean;
  options: PollOption[];
  user_vote?: string;
  total_votes: number;
  profiles: {
    email: string;
    display_name: string | null;
    avatar_url: string | null;
    is_admin: boolean;
  };
};

export type ChatCategory = {
  id: string;
  name: string;
  created_at: string;
};