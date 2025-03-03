import React, { useState } from 'react';
import { Poll } from '../../types/community';
import { Loader2, Trash2, Users } from 'lucide-react';
import { formatTimeShort } from '../../utils/formatters';

interface PollItemProps {
  poll: Poll;
  isAdmin: boolean;
  onVote: (pollId: string, optionId: string) => Promise<boolean>;
  onDelete: (pollId: string) => Promise<boolean>;
}

export function PollItem({
  poll,
  isAdmin,
  onVote,
  onDelete,
}: PollItemProps) {
  const [votingPollId, setVotingPollId] = useState<string | null>(null);

  const handleVote = async (pollId: string, optionId: string) => {
    setVotingPollId(pollId);
    await onVote(pollId, optionId);
    setVotingPollId(null);
  };

  return (
    <div className="bg-gray-800 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-700 flex-shrink-0">
            {poll.profiles?.avatar_url ? (
              <img
                src={poll.profiles.avatar_url}
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
            <span className="text-[#c9fffc] font-medium">
              {poll.profiles?.display_name || poll.profiles?.email}
            </span>
            {poll.profiles?.is_admin && (
              <span className="text-xs text-[#c9fffc]/60 ml-2">Admin</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-gray-400 text-sm">
            {formatTimeShort(poll.created_at)}
          </span>
          {isAdmin && (
            <button
              onClick={() => onDelete(poll.id)}
              className="p-1 text-red-400 hover:bg-red-500/10 rounded-full transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div className="mb-4">
        <h3 className="text-white font-medium mb-2">{poll.question}</h3>
        {poll.expires_at && (
          <span className="text-xs text-gray-400">
            Expires {formatTimeShort(poll.expires_at)}
          </span>
        )}
        {!poll.is_active && (
          <span className="text-xs text-red-400 ml-2">
            Ended
          </span>
        )}
      </div>

      <div className="space-y-2">
        {poll.options.map((option) => {
          const percentage = poll.total_votes > 0
            ? Math.round((option.votes / poll.total_votes) * 100)
            : 0;

          return (
            <button
              key={option.id}
              onClick={() => !poll.user_vote && handleVote(poll.id, option.id)}
              disabled={!!poll.user_vote || votingPollId === poll.id || !poll.is_active}
              className={`w-full relative ${
                poll.user_vote
                  ? 'cursor-default'
                  : poll.is_active
                  ? 'hover:bg-gray-700 cursor-pointer'
                  : 'cursor-not-allowed opacity-75'
              } bg-gray-750 rounded-lg p-3 text-left transition-colors`}
            >
              <div
                className={`absolute inset-0 rounded-lg ${
                  poll.user_vote === option.id
                    ? 'bg-[#c9fffc]/20'
                    : 'bg-gray-700/50'
                }`}
                style={{ width: `${percentage}%` }}
              />
              <div className="relative flex items-center justify-between">
                <span className="text-white">{option.text}</span>
                <span className="text-sm text-gray-400">
                  {percentage}%
                </span>
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-3 text-sm text-gray-400">
        {poll.total_votes} votes
      </div>
    </div>
  );
}