import React from 'react';
import { useCommunity } from '../../hooks/useCommunity';
import { PinnedMessages } from './PinnedMessages';
import { MessageList } from './MessageList';
import { NewMessageForm } from './NewMessageForm';
import { CategoryFilter } from './CategoryFilter';

export default function Community() {
  const {
    messages,
    pinnedMessages,
    polls,
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
    addComment,
    createPoll,
    votePoll,
    deletePoll,
    toggleLike,
  } = useCommunity();

  const LoadingMessageSkeleton = () => (
    <div className="bg-gray-800 rounded-lg p-4 animate-pulse">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gray-700" />
          <div className="h-4 bg-gray-700 rounded w-24" />
        </div>
        <div className="h-4 bg-gray-700 rounded w-16" />
      </div>
      <div className="space-y-2">
        <div className="h-4 bg-gray-700 rounded w-3/4" />
        <div className="h-4 bg-gray-700 rounded w-1/2" />
      </div>
    </div>
  );

  return (
    <div className="p-4 sm:p-8 h-screen flex flex-col">
      <h1 className="text-2xl font-bold text-white mb-4">Community Chat</h1>
      
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-4">
          <p className="text-red-400">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-2 text-sm text-[#c9fffc] hover:text-white transition-colors"
          >
            Click to retry
          </button>
        </div>
      )}
      
      <div className="flex-1 overflow-y-auto mb-4">
        <CategoryFilter
          categories={categories}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          isAdmin={isAdmin}
        />

        <PinnedMessages
          messages={pinnedMessages}
          isAdmin={isAdmin}
          currentUserId={currentUser?.id}
          onTogglePin={togglePin}
          onDelete={deleteMessage}
          onToggleLike={toggleLike}
          onAddComment={addComment}
        />

        {loading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <LoadingMessageSkeleton key={i} />
            ))}
          </div>
        ) : (
          <MessageList
            messages={messages}
            isAdmin={isAdmin}
            polls={polls}
            currentUserId={currentUser?.id}
            onTogglePin={togglePin}
            onDelete={deleteMessage}
            onToggleLike={toggleLike}
            onAddComment={addComment}
            onVotePoll={votePoll}
            onDeletePoll={deletePoll}
          />
        )}
      </div>

      <NewMessageForm 
        onSubmit={addMessage}
        onCreatePoll={createPoll}
        isAdmin={isAdmin}
      />
    </div>
  );
}