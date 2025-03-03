import React, { useState, useRef } from 'react';
import { Send, ImageIcon, X, Loader2, BarChart, Calendar, Plus } from 'lucide-react';

interface NewMessageFormProps {
  onSubmit: (content: string, image?: File) => Promise<boolean>;
  onCreatePoll?: (question: string, options: string[], expiresAt?: Date) => Promise<boolean>;
  isAdmin?: boolean;
}

export function NewMessageForm({ onSubmit, onCreatePoll, isAdmin }: NewMessageFormProps) {
  const [newMessage, setNewMessage] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showPollModal, setShowPollModal] = useState(false);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState<string[]>(['', '']);
  const [pollExpiresAt, setPollExpiresAt] = useState<string>('');
  const [isCreatingPoll, setIsCreatingPoll] = useState(false);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() && !selectedImage) return;
    
    setIsSubmitting(true);
    const success = await onSubmit(newMessage, selectedImage || undefined);
    
    if (success) {
      setNewMessage('');
      setSelectedImage(null);
    }
    setIsSubmitting(false);
  };

  const handleCreatePoll = async () => {
    if (!onCreatePoll) return;
    if (!pollQuestion.trim() || pollOptions.some(opt => !opt.trim())) return;
    
    setIsCreatingPoll(true);
    const success = await onCreatePoll(
      pollQuestion,
      pollOptions.filter(opt => opt.trim()),
      pollExpiresAt ? new Date(pollExpiresAt) : undefined
    );
    
    if (success) {
      setShowPollModal(false);
      setPollQuestion('');
      setPollOptions(['', '']);
      setPollExpiresAt('');
    }
    setIsCreatingPoll(false);
  };

  const handleAddOption = () => {
    if (pollOptions.length < 5) {
      setPollOptions([...pollOptions, '']);
    }
  };

  const handleRemoveOption = (index: number) => {
    if (pollOptions.length > 2) {
      setPollOptions(pollOptions.filter((_, i) => i !== index));
    }
  };

  return (
    <>
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="text"
        value={newMessage}
        onChange={(e) => setNewMessage(e.target.value)}
        placeholder="Type your message..."
        className="flex-1 min-w-0 bg-gray-800 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#c9fffc]"
      />
      <input
        type="file"
        accept="image/*"
        onChange={handleImageSelect}
        ref={fileInputRef}
        className="hidden"
      />
      <div className="flex items-center gap-2 shrink-0">
        {selectedImage && (
          <div className="hidden sm:flex items-center gap-2 bg-gray-800 text-white rounded-lg px-3 py-2">
            <span className="text-sm truncate max-w-[150px]">
              {selectedImage.name}
            </span>
            <button
              type="button"
              onClick={() => setSelectedImage(null)}
              className="text-gray-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="bg-gray-800 text-white rounded-lg p-2 sm:px-4 sm:py-2 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-[#c9fffc]"
        >
          <ImageIcon className="w-5 h-5" />
        </button>
      </div>
      <button
        type="submit"
        disabled={isSubmitting || (!newMessage.trim() && !selectedImage)}
        className="bg-[#c9fffc] text-gray-900 rounded-lg p-2 sm:px-4 sm:py-2 font-medium hover:bg-[#a0fcf9] focus:outline-none focus:ring-2 focus:ring-[#c9fffc] disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
      >
        {isSubmitting ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <Send className="w-5 h-5" />
        )}
      </button>
      {isAdmin && (
        <button
          type="button"
          onClick={() => setShowPollModal(true)}
          className="bg-[#c9fffc] text-gray-900 rounded-lg p-2 sm:px-4 sm:py-2 font-medium hover:bg-[#a0fcf9] focus:outline-none focus:ring-2 focus:ring-[#c9fffc] disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
        >
          <BarChart className="w-5 h-5" />
        </button>
      )}
    </form>

    {/* Create Poll Modal */}
    {showPollModal && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-white">Create New Poll</h2>
            <button
              onClick={() => setShowPollModal(false)}
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
                value={pollQuestion}
                onChange={(e) => setPollQuestion(e.target.value)}
                placeholder="What's your question?"
                className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#c9fffc]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Options
              </label>
              <div className="space-y-2">
                {pollOptions.map((option, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      value={option}
                      onChange={(e) => {
                        const newOptions = [...pollOptions];
                        newOptions[index] = e.target.value;
                        setPollOptions(newOptions);
                      }}
                      placeholder={`Option ${index + 1}`}
                      className="flex-1 bg-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#c9fffc]"
                    />
                    {pollOptions.length > 2 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveOption(index)}
                        className="p-2 text-red-400 hover:text-red-300"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              {pollOptions.length < 5 && (
                <button
                  type="button"
                  onClick={handleAddOption}
                  className="mt-2 text-sm text-[#c9fffc] hover:text-white transition-colors"
                >
                  <Plus className="w-4 h-4 inline-block mr-1" />
                  Add Option
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
                  value={pollExpiresAt}
                  onChange={(e) => setPollExpiresAt(e.target.value)}
                  className="w-full bg-gray-700 text-white rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#c9fffc]"
                />
              </div>
            </div>

            <button
              onClick={handleCreatePoll}
              disabled={isCreatingPoll || !pollQuestion.trim() || pollOptions.some(opt => !opt.trim())}
              className="w-full bg-[#c9fffc] text-gray-900 rounded-lg px-4 py-2 font-medium hover:bg-[#a0fcf9] focus:outline-none focus:ring-2 focus:ring-[#c9fffc] disabled:opacity-50"
            >
              {isCreatingPoll ? (
                <Loader2 className="w-5 h-5 animate-spin mx-auto" />
              ) : (
                'Create Poll'
              )}
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}