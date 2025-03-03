import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Pencil, Trash2, Users as UsersIcon, Loader2, X, Check } from 'lucide-react';

type User = {
  id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  is_admin: boolean;
  created_at: string;
  niche: string | null;
};

export default function Users() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState({
    display_name: '',
    niche: '',
    is_admin: false
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setEditForm({
      display_name: user.display_name || '',
      niche: user.niche || '',
      is_admin: user.is_admin
    });
    setShowEditModal(true);
  };

  const handleDelete = (user: User) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedUser) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          display_name: editForm.display_name,
          niche: editForm.niche,
          is_admin: editForm.is_admin
        })
        .eq('id', selectedUser.id);

      if (error) throw error;

      setUsers(prev => prev.map(user => 
        user.id === selectedUser.id 
          ? { ...user, ...editForm }
          : user
      ));
      setShowEditModal(false);
    } catch (err) {
      console.error('Error updating user:', err);
      setError('Failed to update user');
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedUser) return;

    try {
      const { error } = await supabase
        .auth.admin.deleteUser(selectedUser.id);

      if (error) throw error;

      setUsers(prev => prev.filter(user => user.id !== selectedUser.id));
      setShowDeleteModal(false);
    } catch (err) {
      console.error('Error deleting user:', err);
      setError('Failed to delete user');
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
      <h1 className="text-2xl font-bold text-white mb-6">User Management</h1>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-4">
          <p className="text-red-400">{error}</p>
        </div>
      )}

      <div className="grid gap-4">
        {users.map(user => (
          <div
            key={user.id}
            className="bg-gray-800 rounded-lg p-4 flex items-center justify-between"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-700 flex-shrink-0">
                {user.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt={user.display_name || 'User avatar'}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-500">
                    <UsersIcon className="w-6 h-6" />
                  </div>
                )}
              </div>
              <div>
                <h3 className="text-white font-medium">
                  {user.display_name || user.email}
                  {user.is_admin && (
                    <span className="ml-2 text-xs text-[#c9fffc]">Admin</span>
                  )}
                </h3>
                <p className="text-gray-400 text-sm">{user.email}</p>
                {user.niche && (
                  <p className="text-gray-400 text-sm">Niche: {user.niche}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleEdit(user)}
                className="p-2 text-[#c9fffc] hover:bg-[#c9fffc]/10 rounded-lg transition-colors"
              >
                <Pencil className="w-5 h-5" />
              </button>
              <button
                onClick={() => handleDelete(user)}
                className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Edit Modal */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white">Edit User</h2>
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
                  Display Name
                </label>
                <input
                  type="text"
                  value={editForm.display_name}
                  onChange={(e) => setEditForm(prev => ({ ...prev, display_name: e.target.value }))}
                  className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#c9fffc]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Niche
                </label>
                <input
                  type="text"
                  value={editForm.niche}
                  onChange={(e) => setEditForm(prev => ({ ...prev, niche: e.target.value }))}
                  className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#c9fffc]"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isAdmin"
                  checked={editForm.is_admin}
                  onChange={(e) => setEditForm(prev => ({ ...prev, is_admin: e.target.checked }))}
                  className="rounded bg-gray-700 border-gray-600 text-[#c9fffc] focus:ring-[#c9fffc]"
                />
                <label htmlFor="isAdmin" className="text-sm font-medium text-gray-300">
                  Admin Access
                </label>
              </div>
              <button
                onClick={handleSaveEdit}
                className="w-full bg-[#c9fffc] text-gray-900 rounded-lg px-4 py-2 font-medium hover:bg-[#a0fcf9] transition-colors"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-white mb-4">Delete User</h2>
            <p className="text-gray-300 mb-6">
              Are you sure you want to delete {selectedUser.display_name || selectedUser.email}? This action cannot be undone.
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