import React from 'react';
import { Message, Poll } from '../../types/community';
import { MessageItem } from './MessageItem';
import { PollItem } from './PollItem';

interface MessageListProps {
  messages: Message[];
  polls: Poll[];
  isAdmin: boolean;
  currentUserId?: string;
  onTogglePin: (messageId: string, isPinned: boolean) => void;
  onDelete: (messageId: string, userId: string) => void;
  onAddComment: (messageId: string, content: string) => Promise<boolean>;
  onVotePoll: (pollId: string, optionId: string) => Promise<boolean>;
  onDeletePoll: (pollId: string) => Promise<boolean>;
}

export function MessageList({
  messages,
  polls,
  isAdmin,
  currentUserId,
  onTogglePin,
  onDelete,
  onAddComment,
  onVotePoll,
  onDeletePoll,
}: MessageListProps) {
  // Combine messages and polls into a single timeline
  const timeline = [
    ...messages.map(m => ({ type: 'message' as const, data: m, timestamp: new Date(m.created_at).getTime() })),
    ...polls.map(p => ({ type: 'poll' as const, data: p, timestamp: new Date(p.created_at).getTime() }))
  ].sort((a, b) => b.timestamp - a.timestamp);

  return (
    <div className="space-y-4">
      {timeline.map((item) => (
        item.type === 'message' ? (
          <MessageItem
            key={`message-${item.data.id}`}
            message={item.data}
            isAdmin={isAdmin}
            currentUserId={currentUserId}
            onTogglePin={onTogglePin}
            onDelete={onDelete}
            onAddComment={onAddComment}
          />
        ) : (
          <PollItem
            key={`poll-${item.data.id}`}
            poll={item.data}
            isAdmin={isAdmin}
            onVote={onVotePoll}
            onDelete={onDeletePoll}
          />
        )
      ))}
    </div>
  );
}