import React, { useState } from 'react';
import { Comment } from '../../types/community';
import { MessageSquare, Plus, Users, Loader2 } from 'lucide-react';
import { formatTimeShort } from '../../utils/formatters';

interface CommentSectionProps {
  messageId: string;
  comments: Comment[];
  onAddComment: (messageId: string, content: string) => Promise<boolean>;
}

export function CommentSection({ messageId, comments, onAddComment }: CommentSectionProps) {
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!commentText.trim()) return;
    
    setIsSubmitting(true);
    const success = await onAddComment(messageId, commentText);
    if (success) {
      setCommentText('');
    }
    setIsSubmitting(false);
  };

  return (
    <div className="mt-4 space-y-2">
      <div className="flex items-center gap-3">
        <button
          onClick={() => setShowComments(!showComments)}
          className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors"
        >
          <MessageSquare className="w-4 h-4" />
          {comments.length} Comments
        </button>
        <button
          onClick={() => setShowComments(!showComments)}
          className="flex items-center gap-1.5 text-sm text-[#c9fffc] hover:text-white transition-colors"
        >
          <Plus className="w-4 h-4" />
          Make a Comment
        </button>
      </div>
      
      {showComments && (
        <div className="pl-4 border-l-2 border-gray-700 space-y-3">
          {comments
            .slice()
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
            .map((comment) => (
              <div key={comment.id} className="bg-gray-800/50 rounded p-3">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-6 h-6 rounded-full overflow-hidden bg-gray-700 flex-shrink-0">
                    {comment.profiles?.avatar_url ? (
                      <img
                        src={comment.profiles.avatar_url}
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-500">
                        <Users className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                  <span className="text-sm text-[#c9fffc]">
                    {comment.profiles?.display_name || comment.profiles?.email}
                  </span>
                  <span className="text-xs text-gray-500">
                    {formatTimeShort(comment.created_at)}
                  </span>
                </div>
                <p className="text-sm text-gray-300">{comment.content}</p>
              </div>
            ))}
          
          <div className="flex gap-2">
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Add a comment..."
              className="flex-1 bg-gray-700 text-white text-sm rounded px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#c9fffc]"
            />
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || !commentText.trim()}
              className="bg-[#c9fffc] text-gray-900 rounded px-3 py-1.5 text-sm font-medium hover:bg-[#a0fcf9] focus:outline-none focus:ring-2 focus:ring-[#c9fffc] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                'Comment'
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}