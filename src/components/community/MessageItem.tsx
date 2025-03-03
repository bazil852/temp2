import React from 'react';
import { Message } from '../../types/community';
import { Users, Pin, Trash2 } from 'lucide-react';
import { formatTimeShort } from '../../utils/formatters';
import { CommentSection } from './CommentSection';

interface MessageItemProps {
  message: Message;
  isAdmin: boolean;
  currentUserId?: string;
  onTogglePin: (messageId: string, isPinned: boolean) => void;
  onDelete: (messageId: string, userId: string) => void;
  onAddComment: (messageId: string, content: string) => Promise<boolean>;
}

export function MessageItem({
  message,
  isAdmin,
  currentUserId,
  onTogglePin,
  onDelete,
  onAddComment,
}: MessageItemProps) {
  return (
    <div className="bg-gray-800 rounded-lg p-4">
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
          <span className="text-[#c9fffc] font-medium">
            {message.profiles?.display_name || message.profiles?.email}
          </span>
          {message.profiles?.is_admin && (
            <span className="text-xs text-[#c9fffc]/60 ml-2">Admin</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-gray-400 text-sm whitespace-nowrap">
            {formatTimeShort(message.created_at)}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => isAdmin && onTogglePin(message.id, message.is_pinned)}
              className={`p-1 rounded-full transition-colors ${
                message.is_pinned
                  ? 'text-[#c9fffc]'
                  : 'text-gray-400'
              } ${
                isAdmin
                  ? 'hover:text-[#c9fffc] hover:bg-[#c9fffc]/10 cursor-pointer'
                  : 'cursor-default'
              }`}
              title={isAdmin ? 'Toggle pin status' : 'Only admins can pin messages'}
            >
              <Pin className={`w-4 h-4 ${message.is_pinned ? 'fill-current' : ''}`} />
            </button>
            <button
              onClick={() => onDelete(message.id, message.user_id)}
              className={`p-1 hover:bg-red-500/10 rounded-full transition-colors ${
                isAdmin || message.user_id === currentUserId ? 'text-red-400' : 'hidden'
              }`}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
      <p className="text-white">{message.content}</p>
      {message.image_url && (
        <img 
          src={message.image_url} 
          alt="Message attachment" 
          className="mt-2 rounded-lg max-h-60 object-cover"
        />
      )}
      <CommentSection
        messageId={message.id}
        comments={message.comments || []}
        onAddComment={onAddComment}
      />
    </div>
  );
}