import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { Send, Image as ImageIcon, Loader2, X, Users, Plus, MessageSquare, User, Pin, Trash2, BarChart3 } from 'lucide-react';
import { User as SupabaseUser } from '@supabase/supabase-js';

type PollOption = {
  id: string;
  text: string;
  votes?: number;
};

type Poll = {
  id: string;
  question: string;
  options: PollOption[];
  created_at: string;
  expires_at: string | null;
  is_active: boolean;
  user_id: string;
};

type Message = {
  id: string;
  content: string;
  image_url?: string;
  created_at: string;
  is_pinned: boolean;
  user_id: string;
  comments?: Comment[];
  poll?: Poll;
  profiles: {
    email: string;
    display_name: string | null;
    avatar_url: string | null;
    is_admin: boolean;
  };
};

type Comment = {
  id: string;
  content: string;
  created_at: string;
  profiles: {
    email: string;
    display_name: string | null;
    avatar_url: string | null;
  };
};

export default function Community() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [pinnedMessages, setPinnedMessages] = useState<Message[]>([]);
  const [polls, setPolls] = useState<Poll[]>([]);
  const [showNewPollModal, setShowNewPollModal] = useState(false);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState<string[]>(['', '']);
  const [pollExpiry, setPollExpiry] = useState<string>('');
  const [userVotes, setUserVotes] = useState<{ [key: string]: string }>({});
  const [newMessage, setNewMessage] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [commentText, setCommentText] = useState<{ [key: string]: string }>({});
  const [showComments, setShowComments] = useState<{ [key: string]: boolean }>({});
  const [commentLoading, setCommentLoading] = useState<{ [key: string]: boolean }>({});
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [currentUser, setCurrentUser] = useState<SupabaseUser | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const retryTimeoutRef = useRef<NodeJS.Timeout>();
  const pollingIntervalRef = useRef<NodeJS.Timeout>();

  const handleAddPoll = async () => {
    try {
      if (!pollQuestion.trim() || pollOptions.some(opt => !opt.trim())) {
        throw new Error('Please fill in all fields');
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      // Create poll
      const { data: poll, error: pollError } = await supabase
        .from('polls')
        .insert({
          question: pollQuestion,
          user_id: user.id,
          expires_at: pollExpiry || null,
        })
        .select()
        .single();

      if (pollError) throw pollError;

      // Create poll options
      const optionsData = pollOptions
        .filter(opt => opt.trim())
        .map(text => ({
        poll_id: poll.id,
        text,
      }));

      const { error: optionsError } = await supabase
        .from('poll_options')
        .insert(optionsData);

      if (optionsError) throw optionsError;

      setShowNewPollModal(false);
      setPollQuestion('');
      setPollOptions(['', '']);
      await fetchPolls();
    } catch (err) {
      console.error('Error creating poll:', err);
      setError(err instanceof Error ? err.message : 'Failed to create poll');
    }
  };

  const handleVote = async (pollId: string, optionId: string) => {
    try {
      const { error } = await supabase
        .from('poll_votes')
        .insert({
          option_id: optionId,
          user_id: currentUser?.id,
        });

      if (error) throw error;

      setUserVotes(prev => ({ ...prev, [pollId]: optionId }));
      await fetchPolls();
    } catch (err) {
      console.error('Error voting:', err);
      setError('Failed to submit vote');
    }
  };

  const fetchPolls = async () => {
    try {
      // Fetch polls with their options and votes
      const { data: pollsData, error: pollsError } = await supabase
        .from('polls')
        .select(`
          *,
          poll_options (
            id,
            text,
            poll_votes (
              user_id
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (pollsError) throw pollsError;

      // Transform the data to include vote counts
      const transformedPolls = pollsData.map(poll => ({
        ...poll,
        options: poll.poll_options.map(option => ({
          id: option.id,
          text: option.text,
          votes: option.poll_votes?.length || 0
        }))
      }));

      setPolls(transformedPolls);
    } catch (err) {
      console.error('Error fetching polls:', err);
      setError('Failed to load polls');
    }
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

  const handleDeleteMessage = async (messageId: string, userId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('You must be logged in to delete messages');
        return;
      }

      // Check if user is admin or message owner
      if (!isAdmin && user.id !== userId) {
        setError('You can only delete your own messages');
        return;
      }

      const { error: deleteError } = await supabase
        .from('messages')
        .delete()
        .eq('id', messageId)
        .single();

      if (deleteError) {
        throw deleteError;
      }

      // Immediately update local state
      setMessages(prev => prev.filter(m => m.id !== messageId));
      setPinnedMessages(prev => prev.filter(m => m.id !== messageId));
    } catch (err) {
      console.error('Error deleting message:', err);
      setError('Failed to delete message');
    }
  };

  const LoadingMessageSkeleton = () => (
    <div className="bg-gray-800 rounded-lg p-4 animate-pulse">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center">
            <User className="w-6 h-6 text-gray-600" />
          </div>
          <div className="h-4 bg-gray-700 rounded w-24"></div>
        </div>
        <div className="h-4 bg-gray-700 rounded w-16"></div>
      </div>
      <div className="space-y-2">
        <div className="h-4 bg-gray-700 rounded w-3/4"></div>
        <div className="h-4 bg-gray-700 rounded w-1/2"></div>
      </div>
    </div>
  );

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  const retryFetchMessages = () => {
    retryTimeoutRef.current = setTimeout(() => {
      fetchMessages();
    }, 5000); // Retry after 5 seconds
  };

  useEffect(() => {
    const initializeChat = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setLoading(true);
        
        if (!session) throw new Error('Authentication required');
        
        setCurrentUser(session.user);
        
        await Promise.all([
          fetchMessages(),
          fetchPolls()
        ]);
        
        setError(null);
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
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    pollingIntervalRef.current = setInterval(() => {
      fetchMessages();
      fetchPolls();
    }, 3000);

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const subscription = supabase
      .channel('messages')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'messages' },
        async (payload) => {
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
  }, []);

  const fetchMessages = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Authentication required');

      const { data, error } = await supabase
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

      if (error) throw error;

      const allMessages = data || [];
      const pinned = allMessages.filter(m => m.is_pinned);
      const regular = allMessages.filter(m => !m.is_pinned);
      
      setPinnedMessages(pinned);
      setMessages(regular);

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('is_admin')
          .eq('id', user.id)
          .single();
        
        setIsAdmin(profile?.is_admin || false);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
      setMessages([]);
      if (error instanceof Error) {
        setError(error.message === 'Authentication required' 
          ? 'Please sign in to view messages' 
          : 'Connection error. Retrying...');
      } else {
        setError('Connection error. Retrying...');
      }
      retryFetchMessages();
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() && !selectedImage) return;
    setLoading(true);
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error('No authenticated user found');
      setLoading(false);
      return;
    }

    let uploadedImageUrl = '';
    if (selectedImage) {
      const fileExt = selectedImage.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('message-images')
        .upload(fileName, selectedImage);

      if (uploadError) {
        console.error('Error uploading image:', uploadError);
        setLoading(false);
        return;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('message-images')
        .getPublicUrl(fileName);
      
      uploadedImageUrl = publicUrl;
    }

    const { data: newMessageData, error } = await supabase
      .from('messages')
      .insert({
        user_id: user.id,
        content: newMessage.trim(),
        image_url: uploadedImageUrl || null,
      })
      .select(`
        *,
        profiles:user_id (
          email,
          display_name,
          avatar_url
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

    if (error) {
      console.error('Error sending message:', error);
      setError('Failed to send message');
    } else {
      const messageWithProfile = {
        ...newMessageData,
        profiles: {
          email: user.email || '',
          display_name: user.user_metadata?.display_name || null,
          avatar_url: user.user_metadata?.avatar_url || null,
          is_admin: false
        },
        comments: []
      };
      
      setMessages(prev => [messageWithProfile, ...prev]);
      setNewMessage('');
      setSelectedImage(null);
    }
    setLoading(false);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size must be less than 5MB');
        return;
      }
      if (!file.type.startsWith('image/')) {
        alert('Only image files are allowed');
        return;
      }
      setSelectedImage(file);
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const handleComment = async (messageId: string) => {
    if (!commentText[messageId]?.trim()) return;
    
    setCommentLoading(prev => ({ ...prev, [messageId]: true }));
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error('No authenticated user found');
      setCommentLoading(prev => ({ ...prev, [messageId]: false }));
      return;
    }

    const { error } = await supabase
      .from('comments')
      .insert({
        message_id: messageId,
        user_id: user.id,
        content: commentText[messageId].trim(),
      });

    if (error) {
      console.error('Error adding comment:', error);
    } else {
      setCommentText(prev => ({ ...prev, [messageId]: '' }));
      await fetchMessages();
    }
    
    setCommentLoading(prev => ({ ...prev, [messageId]: false }));
  };

  return (
    <div className="p-4 sm:p-8 h-screen flex flex-col">
      <h1 className="text-2xl font-bold text-white mb-4">Community Chat</h1>
      
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-4">
          <p className="text-red-400">{error}</p>
        </div>
      )}
      
      <div className="flex-1 overflow-y-auto mb-4 space-y-4">
        {/* Pinned Messages */}
        {pinnedMessages.length > 0 && (
          <div className="mb-8">
            <div className="sticky top-0 z-10">
              {/* Polls Section */}
              {polls.length > 0 && (
                <div className="bg-gradient-to-r from-[#c9fffc]/20 via-[#c9fffc]/10 to-[#c9fffc]/20 backdrop-blur-md border border-[#c9fffc]/20 py-6 px-4 sm:px-8 mx-2 sm:mx-4 rounded-2xl mb-4">
                  <div className="px-4 sm:px-8">
                    <h2 className="text-[#c9fffc] font-bold text-xl flex items-center gap-2 mb-4">
                      <BarChart3 className="w-5 h-5" />
                      Active Polls
                    </h2>
                    <div className="grid gap-3">
                      {polls.map((poll) => (
                        <div
                          key={poll.id}
                          className="bg-gray-900/60 backdrop-blur-sm shadow-lg shadow-[#c9fffc]/5 rounded-lg p-4"
                        >
                          <h3 className="text-white font-medium mb-4">{poll.question}</h3>
                          <div className="space-y-2">
                            {poll.options.map((option) => {
                              const totalVotes = poll.options.reduce((sum, opt) => sum + (opt.votes || 0), 0);
                              const percentage = totalVotes > 0 ? ((option.votes || 0) / totalVotes) * 100 : 0;
                              const hasVoted = userVotes[poll.id] === option.id;

                              return (
                                <button
                                  key={option.id}
                                  onClick={() => !userVotes[poll.id] && handleVote(poll.id, option.id)}
                                  disabled={!!userVotes[poll.id]}
                                  className={`w-full p-3 rounded-lg relative overflow-hidden transition-all ${
                                    hasVoted
                                      ? 'bg-[#c9fffc] text-gray-900'
                                      : userVotes[poll.id]
                                      ? 'bg-gray-800 text-gray-400'
                                      : 'bg-gray-800 text-white hover:bg-gray-700'
                                  }`}
                                >
                                  <div
                                    className="absolute inset-0 bg-[#c9fffc]/10"
                                    style={{ width: `${percentage}%` }}
                                  />
                                  <div className="relative flex justify-between">
                                    <span>{option.text}</span>
                                    <span>{Math.round(percentage)}%</span>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                          <div className="mt-2 text-sm text-gray-400">
                            Total votes: {poll.options.reduce((sum, opt) => sum + (opt.votes || 0), 0)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-gradient-to-r from-[#c9fffc]/20 via-[#c9fffc]/10 to-[#c9fffc]/20 backdrop-blur-md border border-[#c9fffc]/20 py-6 px-4 sm:px-8 mx-2 sm:mx-4 rounded-2xl">
                <div className="px-4 sm:px-8">
                  <h2 className="text-[#c9fffc] font-bold text-xl flex items-center gap-2 mb-4">
                    <Pin className="w-5 h-5" />
                    Pinned Announcements
                  </h2>
                  <div className="grid gap-3">
                    {pinnedMessages.map((message) => (
                      <div 
                        key={message.id} 
                        className="bg-gray-900/60 backdrop-blur-sm shadow-lg shadow-[#c9fffc]/5 rounded-lg p-4 hover:bg-gray-900/80 transition-all hover:shadow-[#c9fffc]/10"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-700 flex-shrink-0">
                              {message.profiles?.avatar_url ? (
                                <img
                                  src={message.profiles.avatar_url}
                                  alt="Profile"
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-500">
                                  <Users className="w-6 h-6" />
                                </div>
                              )}
                            </div>
                            <div>
                              <span className="text-[#c9fffc] font-medium block">
                                {message.profiles?.display_name || message.profiles?.email}
                              </span>
                              {message.profiles?.is_admin && (
                                <span className="text-xs text-[#c9fffc]/60">Admin</span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-gray-400 text-sm">
                              {formatTime(message.created_at)}
                            </span>
                            <div className="flex items-center gap-2">
                              {isAdmin && (
                                <button
                                  onClick={() => togglePin(message.id, message.is_pinned)}
                                  className="p-1 text-[#c9fffc] hover:bg-[#c9fffc]/10 rounded-full transition-colors"
                                >
                                  <Pin className="w-4 h-4" />
                                </button>
                              )}
                              <button
                                onClick={() => handleDeleteMessage(message.id, message.user_id)}
                                className={`p-1 hover:bg-red-500/10 rounded-full transition-colors ${
                                  isAdmin || message.user_id === currentUser?.id ? 'text-red-400' : 'hidden'
                                }`}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                        <p className="text-white text-lg font-medium">{message.content}</p>
                        {message.image_url && (
                          <img 
                            src={message.image_url} 
                            alt="Message attachment" 
                            className="mt-3 rounded-lg max-h-60 w-full object-cover border border-[#c9fffc]/10"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="h-px bg-gradient-to-r from-transparent via-[#c9fffc]/20 to-transparent my-8 mx-4" />
            </div>
          </div>
        )}
      </div>
    </div>
  )}