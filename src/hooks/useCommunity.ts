import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { Message, User, Poll, PollOption, ChatCategory } from '../types/community';

export function useCommunity() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [pinnedMessages, setPinnedMessages] = useState<Message[]>([]);
  const [polls, setPolls] = useState<Poll[]>([]);
  const [categories, setCategories] = useState<ChatCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const retryTimeoutRef = useRef<NodeJS.Timeout>();
  const pollingIntervalRef = useRef<NodeJS.Timeout>();

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('chat_categories')
        .select('*')
        .order('name');
      
      if (error) throw error;
      
      const categories = data || [];
      setCategories(categories);
      
      // Find and select the General category
      const generalCategory = categories.find(c => 
        c.name.toLowerCase().includes('general')
      );
      if (generalCategory && !selectedCategory) {
        setSelectedCategory(generalCategory.id);
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  const fetchMessages = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Authentication required');
  
      let query = supabase
        .from('messages')
        .select(`
          *,
          profiles:user_id (
            email,
            display_name,
            avatar_url,
            is_admin
          ),
          comments:comments (
            id,
            content,
            created_at,
            profiles:user_id (
              email,
              display_name,
              avatar_url
            )
          )
        `)
        .order('created_at', { ascending: false });
  
      // Filter by category if selected
      if (selectedCategory) {
        query = query.eq('category_id', selectedCategory);
      }
  
      const { data, error: fetchError } = await query;
  
      if (fetchError) throw fetchError;
  
      const allMessages = data || [];
      const pinned = allMessages.filter(m => m.is_pinned);
      setPinnedMessages(pinned);
      const regularMessages = allMessages.filter(m => !m.is_pinned);
      setMessages(regularMessages);
  
      setError(null);
    } catch (error) {
      console.error('Error fetching messages:', error);
      setMessages([]);
      setError('Connection error. Retrying...');
      retryFetchMessages();
    } finally {
      setLoading(false);
    }
  };
  const retryFetchMessages = () => {
    retryTimeoutRef.current = setTimeout(() => {
      fetchMessages();
    }, 5000);
  };

  const togglePin = async (messageId: string, currentPinned: boolean) => {
    try {
      const { error } = await supabase
        .from('messages')
        .update({ is_pinned: !currentPinned })
        .eq('id', messageId);

      if (error) throw error;
      await fetchMessages();
    } catch (err) {
      console.error('Error toggling pin:', err);
      setError('Failed to update pin status');
    }
  };

  const deleteMessage = async (messageId: string, userId: string) => {
    try {
      if (!currentUser) {
        setError('You must be logged in to delete messages');
        return;
      }

      if (!isAdmin && currentUser.id !== userId) {
        setError('You can only delete your own messages');
        return;
      }

      const { error: deleteError } = await supabase
        .from('messages')
        .delete()
        .eq('id', messageId)
        .single();

      if (deleteError) throw deleteError;

      setMessages(prev => prev.filter(m => m.id !== messageId));
      setPinnedMessages(prev => prev.filter(m => m.id !== messageId));
    } catch (err) {
      console.error('Error deleting message:', err);
      setError('Failed to delete message');
    }
  };

  const addMessage = async (content: string, image?: File) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      let imageUrl = '';
      let like_count = 0;
      if (image) {
        const fileExt = image.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('message-images')
          .upload(fileName, image);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('message-images')
          .getPublicUrl(fileName);
        
        imageUrl = publicUrl;
      }

      const { data: newMessage, error } = await supabase
        .from('messages')
        .insert({
          content,
          image_url: imageUrl || null,
          user_id: user.id,
          like_count,
          category_id: selectedCategory,
        })
        .select(`
          *,
          profiles:user_id (
            email,
            display_name,
            avatar_url,
            is_admin
          ),
          comments:comments (
            id,
            content,
            created_at,
            profiles:user_id (
              email,
              display_name,
              avatar_url
            )
          )
        `)
        .single();

      if (error) throw error;

      // Only add the message to the current view if it matches the category filter
      if (!selectedCategory || newMessage.category_id === selectedCategory) {
        setMessages(prev => [newMessage, ...prev]);
      }
      
      return true;
    } catch (err) {
      console.error('Error adding message:', err);
      setError(err instanceof Error ? err.message : 'Failed to send message');
      return false;
    }
  };

  const addComment = async (messageId: string, content: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      const { error } = await supabase
        .from('comments')
        .insert({
          message_id: messageId,
          user_id: user.id,
          content: content.trim(),
        });

      if (error) throw error;
      await fetchMessages();
      return true;
    } catch (err) {
      console.error('Error adding comment:', err);
      return false;
    }
  };

  const fetchPolls = async () => {
    try {
      // Fetch polls for the selected category
      const query = supabase
        .from('polls')
        .select(`
          *,
          profiles:user_id (
            email,
            display_name,
            avatar_url,
            is_admin
          )
        `);

      // Add category filter if one is selected
      if (selectedCategory) {
        query.eq('category_id', selectedCategory);
      }

      console.log("Poll data: ",selectedCategory);

      const { data: pollsData, error: pollsError } = await query.order('created_at', { ascending: false });


      if (pollsError) throw pollsError;

      // Fetch options for all polls
      const { data: optionsData } = await supabase
        .from('poll_options')
        .select('*')
        .in('poll_id', pollsData?.map(p => p.id) || []);

      // Fetch votes for all options
      const { data: votesData } = await supabase
        .from('poll_votes')
        .select('*')
        .in('option_id', optionsData?.map(o => o.id) || []);

      // Process the data
      const processedPolls = pollsData.map(poll => {
        const pollOptions = optionsData?.filter(o => o.poll_id === poll.id) || [];
        const options = pollOptions.map(option => {
          const votes = votesData?.filter(v => v.option_id === option.id).length || 0;
          return {
            id: option.id,
            text: option.text,
            votes
          };
        });

        const totalVotes = options.reduce((sum: number, opt: PollOption) => sum + opt.votes, 0);
        const userVote = votesData?.find(
          v => options.some(o => o.id === v.option_id) && v.user_id === currentUser?.id
        )?.option_id;

        return {
          ...poll,
          options,
          total_votes: totalVotes,
          user_vote: userVote
        };
      });

      setPolls(processedPolls);
    } catch (err) {
      console.error('Error fetching polls:', err);
    }
  };

  const createPoll = async (question: string, options: string[], expiresAt?: Date) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      // Create poll
      const { data: poll, error: pollError } = await supabase
        .from('polls')
        .insert({
          question,
          user_id: user.id,
          expires_at: expiresAt?.toISOString(),
          category_id: selectedCategory,
        })
        .select()
        .single();

      if (pollError) throw pollError;

      // Create poll options
      const optionsData = options.map(text => ({
        poll_id: poll.id,
        text
      }));

      const { error: optionsError } = await supabase
        .from('poll_options')
        .insert(optionsData);

      if (optionsError) throw optionsError;

      await fetchPolls();
      return true;
    } catch (err) {
      console.error('Error creating poll:', err);
      return false;
    }
  };

  const votePoll = async (pollId: string, optionId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      const { error } = await supabase
        .from('poll_votes')
        .insert({
          user_id: user.id,
          option_id: optionId
        });

      if (error) throw error;

      await fetchPolls();
      return true;
    } catch (err) {
      console.error('Error voting in poll:', err);
      return false;
    }
  };

  const deletePoll = async (pollId: string) => {
    try {
      const { error } = await supabase
        .from('polls')
        .delete()
        .eq('id', pollId);

      if (error) throw error;
      setPolls(prev => prev.filter(p => p.id !== pollId));
      return true;
    } catch (err) {
      console.error('Error deleting poll:', err);
      return false;
    }
  };

  const toggleLike = async (messageId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      const message = [...messages, ...pinnedMessages].find(m => m.id === messageId);
      if (!message) return;

      const { error } = await supabase
        .from('messages')
        .update({ like_count: message.like_count + 1 })
        .eq('id', messageId);

      if (error) throw error;

      // Update local state
      const updateMessage = (msg: Message) => {
        if (msg.id === messageId) {
          return {
            ...msg,
            like_count: msg.like_count + 1
          };
        }
        return msg;
      };

      setMessages(prev => prev.map(updateMessage));
      setPinnedMessages(prev => prev.map(updateMessage));
    } catch (err) {
      console.error('Error toggling like:', err);
    }
  };

  useEffect(() => {
    const initializeChat = async () => {
      try {
        setLoading(true);
        
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error('Authentication required');
        
        setCurrentUser(session.user);
        
        // Set isAdmin based on email
        setIsAdmin(session.user.email === 'markofilipovic2003@gmail.com');
        
        await Promise.all([fetchCategories(), fetchMessages(), fetchPolls()]);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Connection error';
        console.error('Error initializing chat:', errorMessage);
        setError(errorMessage === 'Authentication required' 
          ? 'Please sign in to view messages' 
          : 'Connecting to chat...');
        retryFetchMessages();
      } finally {
        setLoading(false);
      }
    };

    initializeChat();

    return () => {
      if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
      if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
    };
  }, []);

  useEffect(() => {
    fetchMessages();
  }, [selectedCategory]);

  useEffect(() => {
    pollingIntervalRef.current = setInterval(() => {
      fetchMessages();
    }, 3000);

    return () => {
      if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
    };
  }, [selectedCategory]);

  useEffect(() => {
    const subscription = supabase
      .channel('messages')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'messages' },
        async (payload) => {
          // Skip if message doesn't match current category filter
          if (selectedCategory && payload.new.category_id !== selectedCategory) {
            return;
          }

          const { data: newMessage } = await supabase
            .from('messages')
            .select(`
              *,
              profiles:user_id (
                email,
                display_name,
                avatar_url,
                is_admin
              ),
              comments:comments (
                id,
                content,
                created_at,
                profiles:user_id (
                  email,
                  display_name,
                  avatar_url
                )
              )
            `)
            .eq('id', payload.new.id)
            .single();

          if (newMessage) {
            if (newMessage.is_pinned) {
              setPinnedMessages(prev => [newMessage, ...prev]);
            } else {
              setMessages(prev => [newMessage, ...prev]);
            }
          }
        }
      )
      .on('postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'messages' },
        (payload) => {
          const deletedId = payload.old.id;
          setMessages(prev => prev.filter(m => m.id !== deletedId));
          setPinnedMessages(prev => prev.filter(m => m.id !== deletedId));
        }
      )
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'messages' },
        async (payload) => {
          // Skip if message doesn't match current category filter
          if (selectedCategory && payload.new.category_id !== selectedCategory) {
            return;
          }

          const { data: updatedMessage } = await supabase
            .from('messages')
            .select(`
              *,
              profiles:user_id (
                email,
                display_name,
                avatar_url,
                is_admin
              ),
              comments:comments (
                id,
                content,
                created_at,
                profiles:user_id (
                  email,
                  display_name,
                  avatar_url
                )
              )
            `)
            .eq('id', payload.new.id)
            .single();

          if (updatedMessage) {
            if (updatedMessage.is_pinned) {
              setMessages(prev => prev.filter(m => m.id !== updatedMessage.id));
              setPinnedMessages(prev => [updatedMessage, ...prev]);
            } else {
              setPinnedMessages(prev => prev.filter(m => m.id !== updatedMessage.id));
              setMessages(prev => [updatedMessage, ...prev]);
            }
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [currentUser?.id, selectedCategory]);

  return {
    messages,
    pinnedMessages,
    loading,
    error,
    currentUser,
    isAdmin,
    categories,
    selectedCategory,
    setSelectedCategory,
    togglePin,
    deleteMessage,
    addMessage,
    toggleLike,
    addComment,
    polls,
    createPoll,
    votePoll,
    deletePoll,
  };
}