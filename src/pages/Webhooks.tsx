import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Pencil, Trash2, Loader2, X, Webhook } from 'lucide-react';

type Webhook = {
  id: string;
  url: string;
  type: string;
  created_at: string;
};

export default function Webhooks() {
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedWebhook, setSelectedWebhook] = useState<Webhook | null>(null);
  const [editForm, setEditForm] = useState({
    url: '',
    type: ''
  });

  useEffect(() => {
    fetchWebhooks();
  }, []);

  const fetchWebhooks = async () => {
    try {
      const { data, error } = await supabase
        .from('webhooks')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setWebhooks(data);
    } catch (err) {
      console.error('Error fetching webhooks:', err);
      setError('Failed to load webhooks');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (webhook: Webhook) => {
    setSelectedWebhook(webhook);
    setEditForm({
      url: webhook.url,
      type: webhook.type
    });
    setShowEditModal(true);
  };

  const handleDelete = (webhook: Webhook) => {
    setSelectedWebhook(webhook);
    setShowDeleteModal(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedWebhook) return;

    try {
      const { error } = await supabase
        .from('webhooks')
        .update({
          url: editForm.url,
          type: editForm.type
        })
        .eq('id', selectedWebhook.id);

      if (error) throw error;

      setWebhooks(prev => prev.map(webhook => 
        webhook.id === selectedWebhook.id 
          ? { ...webhook, ...editForm }
          : webhook
      ));
      setShowEditModal(false);
    } catch (err) {
      console.error('Error updating webhook:', err);
      setError('Failed to update webhook');
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedWebhook) return;

    try {
      const { error } = await supabase
        .from('webhooks')
        .delete()
        .eq('id', selectedWebhook.id);

      if (error) throw error;

      setWebhooks(prev => prev.filter(webhook => webhook.id !== selectedWebhook.id));
      setShowDeleteModal(false);
    } catch (err) {
      console.error('Error deleting webhook:', err);
      setError('Failed to delete webhook');
    }
  };

  const handleAddWebhook = async () => {
    try {
      const { error } = await supabase
        .from('webhooks')
        .insert({
          url: editForm.url,
          type: editForm.type
        });

      if (error) throw error;

      setShowEditModal(false);
      setEditForm({ url: '', type: '' });
      fetchWebhooks();
    } catch (err) {
      console.error('Error adding webhook:', err);
      setError('Failed to add webhook');
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-white animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-white">Webhook Management</h1>
        <button
          onClick={() => {
            setSelectedWebhook(null);
            setEditForm({ url: '', type: '' });
            setShowEditModal(true);
          }}
          className="bg-[#c9fffc] text-gray-900 rounded-lg px-4 py-2 font-medium hover:bg-[#a0fcf9] transition-colors"
        >
          Add Webhook
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-4">
          <p className="text-red-400">{error}</p>
        </div>
      )}

      <div className="grid gap-4">
        {webhooks.map(webhook => (
          <div
            key={webhook.id}
            className="bg-gray-800 rounded-lg p-4"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Webhook className="w-5 h-5 text-[#c9fffc]" />
                <span className="text-[#c9fffc] font-medium">{webhook.type}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleEdit(webhook)}
                  className="p-2 text-[#c9fffc] hover:bg-[#c9fffc]/10 rounded-lg transition-colors"
                >
                  <Pencil className="w-5 h-5" />
                </button>
                <button
                  onClick={() => handleDelete(webhook)}
                  className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
            <p className="text-gray-300 font-mono text-sm break-all">{webhook.url}</p>
          </div>
        ))}
      </div>

      {/* Add/Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white">
                {selectedWebhook ? 'Edit Webhook' : 'Add Webhook'}
              </h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Type
                </label>
                <input
                  type="text"
                  value={editForm.type}
                  onChange={(e) => setEditForm(prev => ({ ...prev, type: e.target.value }))}
                  placeholder="e.g., auth_webhook"
                  className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#c9fffc]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  URL
                </label>
                <input
                  type="url"
                  value={editForm.url}
                  onChange={(e) => setEditForm(prev => ({ ...prev, url: e.target.value }))}
                  placeholder="https://example.com/webhook"
                  className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#c9fffc]"
                />
              </div>
              <button
                onClick={selectedWebhook ? handleSaveEdit : handleAddWebhook}
                disabled={!editForm.url || !editForm.type}
                className="w-full bg-[#c9fffc] text-gray-900 rounded-lg px-4 py-2 font-medium hover:bg-[#a0fcf9] transition-colors disabled:opacity-50"
              >
                {selectedWebhook ? 'Save Changes' : 'Add Webhook'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && selectedWebhook && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-white mb-4">Delete Webhook</h2>
            <p className="text-gray-300 mb-6">
              Are you sure you want to delete this webhook? This action cannot be undone.
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 bg-gray-700 text-white rounded-lg px-4 py-2 hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="flex-1 bg-red-500 text-white rounded-lg px-4 py-2 hover:bg-red-600 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}