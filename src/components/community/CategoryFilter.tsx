import React from 'react';
import { ChatCategory } from '../../types/community';
import { Plus, X, Loader2, Trash2, ChevronDown } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface CategoryFilterProps {
  categories: ChatCategory[];
  selectedCategory: string | null;
  onSelectCategory: (categoryId: string | null) => void;
  isAdmin: boolean;
}

const sortCategories = (categories: ChatCategory[]) => {
  return [...categories].sort((a, b) => {
    // Check if either category name contains "general" (case insensitive)
    const aIsGeneral = a.name.toLowerCase().includes('general');
    const bIsGeneral = b.name.toLowerCase().includes('general');
    
    if (aIsGeneral && !bIsGeneral) return -1;
    if (!aIsGeneral && bIsGeneral) return 1;
    
    // If neither or both contain "general", sort alphabetically
    return a.name.localeCompare(b.name);
  });
};

export function CategoryFilter({
  categories,
  selectedCategory,
  onSelectCategory,
  isAdmin,
}: CategoryFilterProps) {
  const sortedCategories = sortCategories(categories);
  const [showNewCategoryModal, setShowNewCategoryModal] = React.useState(false);
  const [newCategory, setNewCategory] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [showDeleteModal, setShowDeleteModal] = React.useState(false);
  const [categoryToDelete, setCategoryToDelete] = React.useState<ChatCategory | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [showDropdown, setShowDropdown] = React.useState(false);

  const handleAddCategory = async () => {
    if (!newCategory.trim()) return;
    
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('chat_categories')
        .insert({
          name: newCategory.trim(),
        });

      if (error) throw error;
      setShowNewCategoryModal(false);
      setNewCategory('');
    } catch (err) {
      console.error('Error adding category:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCategory = async () => {
    if (!categoryToDelete) return;
    
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('chat_categories')
        .delete()
        .eq('id', categoryToDelete.id);

      if (error) throw error;
      
      // Reset selected category if we're deleting the currently selected one
      if (selectedCategory === categoryToDelete.id) {
        onSelectCategory(null);
      }
      
      setShowDeleteModal(false);
      setCategoryToDelete(null);
    } catch (err) {
      console.error('Error deleting category:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      {/* Mobile Dropdown */}
      <div className="md:hidden relative mb-6">
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className="w-full bg-gray-800 text-white rounded-lg px-4 py-3 flex items-center justify-between hover:bg-gray-700 transition-colors"
        >
          <div className="flex items-center gap-2">
            <span>
              {categories.find(c => c.id === selectedCategory)?.name || categories[0]?.name || 'Loading...'}
            </span>
          </div>
          <ChevronDown className={`w-5 h-5 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
        </button>
        
        {showDropdown && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setShowDropdown(false)}
            />
            <div className="absolute top-full left-0 right-0 mt-2 bg-gray-800 rounded-lg shadow-lg overflow-hidden z-50">
              {sortedCategories.map(category => (
                <div key={category.id} className="relative group">
                  <button
                    onClick={() => {
                      onSelectCategory(category.id);
                      setShowDropdown(false);
                    }}
                    className={`w-full px-4 py-3 flex items-center gap-2 text-left transition-colors ${
                      selectedCategory === category.id
                        ? 'bg-[#c9fffc] text-gray-900 font-medium'
                        : 'text-white hover:bg-gray-700'
                    }`}
                  >
                    {category.name}
                  </button>
                  {isAdmin && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setCategoryToDelete(category);
                        setShowDeleteModal(true);
                        setShowDropdown(false);
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-red-400 hover:text-red-300"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
              {isAdmin && (
                <button
                  onClick={() => {
                    setShowNewCategoryModal(true);
                    setShowDropdown(false);
                  }}
                  className="w-full px-4 py-3 text-[#c9fffc] hover:bg-gray-700 transition-colors flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Category
                </button>
              )}
            </div>
          </>
        )}
      </div>

      {/* Desktop Categories */}
      <div className="hidden md:flex items-center gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
        {/* <button
          onClick={() => onSelectCategory(null)}
          className={`shrink-0 px-4 py-2 rounded-full transition-colors ${
            selectedCategory === null
              ? 'bg-[#c9fffc] text-gray-900 font-medium'
              : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
          }`}
        >
          All
        </button> */}
        {sortedCategories.map(category => (
          <div key={category.id} className="relative group shrink-0">
            <button
              onClick={() => onSelectCategory(category.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full transition-colors ${
                selectedCategory === category.id
                  ? 'bg-[#c9fffc] text-gray-900 font-medium'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}>
                {category.name}
              </button>
            {isAdmin && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setCategoryToDelete(category);
                  setShowDeleteModal(true);
                }}
                className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
              >
                <Trash2 className="w-3 h-3 text-white" />
              </button>
            )}
          </div>
        ))}
        {isAdmin && (
          <button
            onClick={() => setShowNewCategoryModal(true)}
            className="shrink-0 w-8 h-8 rounded-full bg-[#c9fffc] text-gray-900 flex items-center justify-center hover:bg-[#a0fcf9] transition-colors"
          >
            <Plus className="w-5 h-5" />
          </button>
        )}
        <style>{`
          .scrollbar-hide::-webkit-scrollbar {
            display: none;
          }
          .scrollbar-hide {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
        `}</style>
      </div>

      {/* New Category Modal */}
      {showNewCategoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white">Add New Category</h2>
              <button
                onClick={() => setShowNewCategoryModal(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <input
              type="text"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              placeholder="Category name"
              className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-[#c9fffc]"
            />
            <button
              onClick={handleAddCategory}
              disabled={isSubmitting || !newCategory.trim()}
              className="w-full bg-[#c9fffc] text-gray-900 rounded-lg px-4 py-2 font-medium hover:bg-[#a0fcf9] focus:outline-none focus:ring-2 focus:ring-[#c9fffc] disabled:opacity-50"
            >
              {isSubmitting ? (
                <Loader2 className="w-5 h-5 animate-spin mx-auto" />
              ) : (
                'Add Category'
              )}
            </button>
          </div>
        </div>
      )}

      {/* Delete Category Modal */}
      {showDeleteModal && categoryToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-bold text-white mb-4">Delete Category</h2>
            <p className="text-gray-300 mb-6">
              Are you sure you want to delete the category "{categoryToDelete.name}"? This action cannot be undone.
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setCategoryToDelete(null);
                }}
                className="flex-1 bg-gray-700 text-white rounded-lg px-4 py-2 hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteCategory}
                disabled={isDeleting}
                className="flex-1 bg-red-500 text-white rounded-lg px-4 py-2 hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                {isDeleting ? (
                  <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                ) : (
                  'Delete'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}