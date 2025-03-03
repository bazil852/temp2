import React from 'react';
import { Message } from '../../types/community';
import { Pin, Users, Trash2 } from 'lucide-react';
import { formatTimeShort } from '../../utils/formatters';

interface PinnedMessagesProps {
  messages: Message[];
  isAdmin: boolean;
  currentUserId?: string;
  onTogglePin: (messageId: string, isPinned: boolean) => void;
  onDelete: (messageId: string, userId: string) => void;
}

export function PinnedMessages({
  messages,
  isAdmin,
  currentUserId,
  onTogglePin,
  onDelete,
}: PinnedMessagesProps) {
  if (messages.length === 0) return null;

  return (
    <div className="mb-6 space-y-4">
      {messages.map((message) => (
        <div key={message.id} className="bg-[#1f2937] rounded-lg shadow-md">
        {/* Header for Each Pinned Message */}
        <div className="flex items-center gap-2 bg-[#c9fffc] rounded-t-lg px-4 py-3">
          <Pin className="w-5 h-5 text-gray-900" />
          <span className="text-sm font-medium text-gray-900 underline decoration-gray-900/30">
            Pinned Message
          </span>
        </div>
      
        {/* Message Content with Space Below Header */}
        <div className="group px-4 pb-4 mt-2">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-800/50 flex-shrink-0">
                {message.profiles?.avatar_url ? (
                  <img
                    src={message.profiles.avatar_url}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-500">
                    <Users className="w-5 h-5" />
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[#c9fffc] font-medium">
                  {message.profiles?.display_name || message.profiles?.email}
                </span>
                {message.profiles?.is_admin && (
                  <span className="text-xs text-[#c9fffc]/60">Admin</span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
            <span className="text-sm text-gray-400 whitespace-nowrap">
                    {formatTimeShort(message.created_at)}
                  </span>
              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => onTogglePin(message.id, message.is_pinned)}
                  className={`p-1 rounded-full transition-colors ${
                    isAdmin ? 'text-[#c9fffc] hover:bg-[#c9fffc]/10 cursor-pointer' : 'cursor-default'
                  }`}
                  title={isAdmin ? 'Unpin message' : 'Only admins can unpin messages'}
                >
                  <Pin className="w-4 h-4 fill-current" />
                </button>
                {(isAdmin || message.user_id === currentUserId) && (
                  <button
                    onClick={() => onDelete(message.id, message.user_id)}
                    className="p-1 text-red-400 hover:bg-red-500/10 rounded-full transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
          <p className="text-white mb-2">{message.content}</p>
          {message.image_url && (
            <img 
              src={message.image_url} 
              alt="Message attachment" 
              className="rounded-lg max-h-60 object-cover mb-2"
            />
          )}
        </div>
      </div>
      
      ))}
    </div>
  );
}
