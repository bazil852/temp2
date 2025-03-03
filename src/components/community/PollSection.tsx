import React, { useState } from 'react';
import { Poll } from '../../types/community';
import { BarChart as ChartBar, Plus, Loader2, Calendar, X, Trash2 } from 'lucide-react';
import { formatTimeShort } from '../../utils/formatters';

interface PollSectionProps {
  polls: Poll[];
  isAdmin: boolean;
  onCreatePoll: (question: string, options: string[], expiresAt?: Date) => Promise<boolean>;
  onVote: (pollId: string, optionId: string) => Promise<boolean>;
  onDelete: (pollId: string) => Promise<boolean>;
}

export function PollSection({
  polls,
  isAdmin,
  onCreatePoll,
  onVote,
  onDelete,
}: PollSectionProps) {
  const [showNewPollModal, setShowNewPollModal] = useState(false);
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState<string[]>(['', '']);
  const [expiresAt, setExpiresAt] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [votingPollId, setVotingPollId] = useState<string | null>(null);

  const handleAddOption = () => {
    setOptions([...options, '']);
  };

  const handleRemoveOption = (index: number) => {
    setOptions(options.filter((_, i) => i !== index));
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleCreatePoll = async () => {
    if (!question.trim() || options.some(opt => !opt.trim())) return;
    
    setIsSubmitting(true);
    const success = await onCreatePoll(
      question,
      options.filter(opt => opt.trim()),
      expiresAt ? new Date(expiresAt) : undefined
    );
    
    if (success) {
      setShowNewPollModal(false);
      setQuestion('');
      setOptions(['', '']);
      setExpiresAt('');
    }
    setIsSubmitting(false);
  };

  const handleVote = async (pollId: string, optionId: string) => {
    setVotingPollId(pollId);
    await onVote(pollId, optionId);
    setVotingPollId(null);
  };

  if (polls.length === 0 && !isAdmin) return null;

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-[#c9fffc]">
          <ChartBar className="w-5 h-5" />
          <span className="text-sm font-medium">Community Polls</span>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowNewPollModal(true)}
            className="flex items-center gap-2 text-sm text-[#c9fffc] hover:text-white transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create Poll
          </button>
        )}
      </div>

      <div className="space-y-4">
        {polls.map((poll) => (
          <div
            key={poll.id}
            className="bg-gray-800 rounded-lg p-4"
          >
            <div className="flex items-center justify-between gap-4 mb-4">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <span className="text-white font-medium">{poll.question}</span>
                {poll.expires_at && (
                  <span className="text-xs text-gray-400">
                    Expires {formatTimeShort(poll.expires_at)}
                  </span>
                )}
                {!poll.is_active && (
                  <span className="text-xs text-red-400">
                    Ended
                  </span>
                )}
              </div>
              <div className="flex items-center gap-4 shrink-0">
                <span className="text-sm text-gray-400">
                  {poll.total_votes} votes
                </span>
                {isAdmin && (
                  <button
                    onClick={() => onDelete(poll.id)}
                    className="text-red-400 hover:text-red-300 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
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
          </div>
        ))}
      </div>

      {showNewPollModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md m-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white">Create New Poll</h2>
              <button
                onClick={() => setShowNewPollModal(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Question
                </label>
                <input
                  type="text"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="What's your question?"
                  className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#c9fffc]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Options
                </label>
                <div className="space-y-2">
                  {options.map((option, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="text"
                        value={option}
                        onChange={(e) => handleOptionChange(index, e.target.value)}
                        placeholder={`Option ${index + 1}`}
                        className="flex-1 bg-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#c9fffc]"
                      />
                      {options.length > 2 && (
                        <button
                          onClick={() => handleRemoveOption(index)}
                          className="p-2 text-red-400 hover:text-red-300"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                {options.length < 5 && (
                  <button
                    onClick={handleAddOption}
                    className="mt-2 text-sm text-[#c9fffc] hover:text-white transition-colors"
                  >
                    + Add Option
                  </button>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Expires At (Optional)
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="datetime-local"
                    value={expiresAt}
                    onChange={(e) => setExpiresAt(e.target.value)}
                    className="w-full bg-gray-700 text-white rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#c9fffc]"
                  />
                </div>
              </div>

              <button
                onClick={handleCreatePoll}
                disabled={isSubmitting || !question.trim() || options.some(opt => !opt.trim())}
                className="w-full bg-[#c9fffc] text-gray-900 rounded-lg px-4 py-2 font-medium hover:bg-[#a0fcf9] focus:outline-none focus:ring-2 focus:ring-[#c9fffc] disabled:opacity-50"
              >
                {isSubmitting ? (
                  <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                ) : (
                  'Create Poll'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}