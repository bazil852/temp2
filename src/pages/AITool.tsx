import React, { useState, useEffect, useRef } from 'react';
import { Bot, Plus, X, Upload, Pencil, ChevronDown } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { supabase } from '../lib/supabase';

type Category = {
  id: string;
  name: string;
};

type AITool = {
  id: string;
  title: string;
  description: string;
  logo_url: string | null;
  categories: string[];
  tool_url: string;
};

export default function AITool() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [tools, setTools] = useState<AITool[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [showNewCategoryModal, setShowNewCategoryModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [showNewToolModal, setShowNewToolModal] = useState(false);
  const [editingTool, setEditingTool] = useState<AITool | null>(null);
  const [newCategory, setNewCategory] = useState('');
  const [selectedLogo, setSelectedLogo] = useState<File | null>(null);
  const [newTool, setNewTool] = useState<Partial<AITool>>({
    title: '',
    description: '',
    tool_url: '',
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loadingClasses, setLoadingClasses] = useState<number[]>([1, 2, 3, 4, 5, 6]);
  

  useEffect(() => {
    const initializeData = async () => {
      try {
        setLoading(true);
        
        // Check if user is admin
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('is_admin')
            .eq('id', user.id)
            .single();
          
          setIsAdmin(profile?.is_admin || false);
        }

        await Promise.all([fetchCategories(), fetchTools()]);
        setError(null);
      } catch (err) {
        console.error('Error initializing data:', err);
        setError('Failed to load data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    initializeData();
  }, []);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('ai_categories')
        .select('*')
        .order('name');
      
      if (error) throw error;
      setCategories(data || []);
    } catch (err) {
      console.error('Error fetching categories:', err);
      setError('Failed to load categories');
    }
  };

  const fetchTools = async () => {
    try {
      const { data, error } = await supabase
        .from('ai_tools')
        .select(`
          *,
          ai_tool_categories!inner (
            category_id
          )
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Transform the data to include categories array
      const toolsWithCategories = data?.map(tool => ({
        ...tool,
        categories: tool.ai_tool_categories.map((tc: any) => tc.category_id)
      })) || [];
      
      setTools(toolsWithCategories);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching tools:', err);
      setError('Failed to load tools');
      setLoading(false);
    }
  };

  const handleAddCategory = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      const { error } = await supabase
        .from('ai_categories')
        .insert({
          name: newCategory,
          user_id: user.id,
        });

      if (error) throw error;

      setShowNewCategoryModal(false);
      setNewCategory('');
      fetchCategories();
    } catch (err) {
      console.error('Error adding category:', err);
      setError('Failed to add category');
    }
  };

  const handleDeleteCategory = async () => {
    try {
      if (!categoryToDelete) return;
      console.log('Deleting category:', categoryToDelete.id);
      setLoading(true);

      const { data, error } = await supabase
        .from('ai_categories')
        .delete()
        .eq('id', categoryToDelete.id)
        .select();

      if (error) {
        console.error('Delete error:', error);
        throw error;
      }
      
      console.log('Delete result:', data);

      setSelectedCategory(null);
      setShowDeleteModal(false);
      setCategoryToDelete(null);
      
      console.log('Refreshing data...');
      await Promise.all([
        fetchCategories(),
        fetchTools()
      ]).catch(err => {
        console.error('Refresh error:', err);
        throw err;
      });
      
      console.log('Delete completed successfully');
    } catch (err) {
      console.error('Error deleting category:', err);
      setError('Failed to delete category');
    } finally {
      setLoading(false);
    }
  };

  const handleLogoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
        alert('Logo size must be less than 2MB');
        return;
      }
      if (!file.type.startsWith('image/')) {
        alert('Only image files are allowed');
        return;
      }
      setSelectedLogo(file);
    }
  };

  const handleAddTool = async () => {
    try {
      if (!newTool.title || !newTool.description || selectedCategories.length === 0) {
        throw new Error('Please fill in all required fields');
      }
      
      if (!newTool.tool_url) {
        throw new Error('Tool URL is required');
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      let logoUrl = '';
      if (selectedLogo) {
        const fileExt = selectedLogo.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('ai-tool-logos')
          .upload(fileName, selectedLogo);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('ai-tool-logos')
          .getPublicUrl(fileName);
        
        logoUrl = publicUrl;
      }

      const { data: createdTool, error: toolError } = await supabase
        .from('ai_tools')
        .insert({
          title: newTool.title,
          description: newTool.description,
          logo_url: logoUrl || null,
          tool_url: newTool.tool_url,
          user_id: user.id,
        })
        .select()
        .single();

      if (toolError) throw toolError;

      // Insert category relationships
      const categoryRelations = selectedCategories.map(categoryId => ({
        tool_id: createdTool.id,
        category_id: categoryId
      }));

      const { error: categoryError } = await supabase
        .from('ai_tool_categories')
        .insert(categoryRelations);

      if (categoryError) throw categoryError;

      setShowNewToolModal(false);
      setNewTool({
        title: '',
        description: '',
        tool_url: '',
      });
      setSelectedLogo(null);
      setSelectedCategories([]);
      fetchTools();
    } catch (err) {
      console.error('Error adding tool:', err);
      setError(err instanceof Error ? err.message : 'Failed to add tool');
    }
  };

  const handleEditTool = async () => {
    try {
      if (!editingTool?.title || !editingTool?.description || selectedCategories.length === 0) {
        throw new Error('Please fill in all required fields');
      }
      
      if (!editingTool.tool_url) {
        throw new Error('Tool URL is required');
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      let logoUrl = editingTool.logo_url;
      if (selectedLogo) {
        const fileExt = selectedLogo.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('ai-tool-logos')
          .upload(fileName, selectedLogo);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('ai-tool-logos')
          .getPublicUrl(fileName);
        
        logoUrl = publicUrl;
      }

      // Update tool
      const { error: toolError } = await supabase
        .from('ai_tools')
        .update({
          title: editingTool.title,
          description: editingTool.description,
          logo_url: logoUrl,
          tool_url: editingTool.tool_url,
        })
        .eq('id', editingTool.id);

      if (toolError) throw toolError;

      // Delete existing category relationships
      const { error: deleteError } = await supabase
        .from('ai_tool_categories')
        .delete()
        .eq('tool_id', editingTool.id);

      if (deleteError) throw deleteError;

      // Insert new category relationships
      const categoryRelations = selectedCategories.map(categoryId => ({
        tool_id: editingTool.id,
        category_id: categoryId
      }));

      const { error: categoryError } = await supabase
        .from('ai_tool_categories')
        .insert(categoryRelations);

      if (categoryError) throw categoryError;

      setEditingTool(null);
      setShowNewToolModal(false);
      setSelectedLogo(null);
      setSelectedCategories([]);
      await fetchTools();
    } catch (err) {
      console.error('Error updating tool:', err);
      setError(err instanceof Error ? err.message : 'Failed to update tool');
    } finally {
      setShowNewToolModal(false);
    }
  };

  const getFilteredTools = () => {
    let filtered = tools;
    if (selectedCategory) {
      filtered = filtered.filter(t => t.categories.includes(selectedCategory));
    }
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(t => t.title.toLowerCase().includes(query));
    }
    return filtered;
  };

  const LoadingClassSkeleton = () => (
    <div className="bg-gray-800 rounded-lg overflow-hidden animate-pulse">
      <div className="aspect-video bg-gray-700" />
      <div className="p-6 space-y-3">
        <div className="h-5 bg-gray-700 rounded-full w-1/4" />
        <div className="h-6 bg-gray-700 rounded-lg w-3/4" />
        <div className="space-y-2">
          <div className="h-4 bg-gray-700 rounded-lg w-full" />
          <div className="h-4 bg-gray-700 rounded-lg w-2/3" />
        </div>
        <div className="flex justify-between items-center pt-2">
          <div className="h-4 bg-gray-700 rounded-full w-20" />
          <div className="flex gap-2">
            <div className="w-8 h-8 bg-gray-700 rounded-full" />
            <div className="w-8 h-8 bg-gray-700 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold text-white mb-6">Classroom</h1>
        <div className="flex items-center gap-2 mb-8 animate-pulse">
          <div className="w-16 h-10 bg-gray-800 rounded-full" />
          <div className="w-24 h-10 bg-gray-800 rounded-full" />
          <div className="w-20 h-10 bg-gray-800 rounded-full" />
          <div className="w-8 h-8 bg-gray-800 rounded-full" />
        </div>
        <div className="mb-6">
          <div className="w-full h-12 bg-gray-800 rounded-lg" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {loadingClasses.map((index) => (
            <LoadingClassSkeleton key={index} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 max-w-full overflow-x-hidden">
      <h1 className="text-2xl font-bold text-white mb-6">AI Tools</h1>
      
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-4">
          <p className="text-red-400">{error}</p>
        </div>
      )}
      
      {/* Mobile Dropdown */}
      <div className="md:hidden relative mb-8">
        <div className="relative">
          <button
            onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
            className="w-full bg-gray-800 text-white rounded-lg px-4 py-3 flex items-center justify-between hover:bg-gray-700 transition-colors"
          >
            <span>
              {selectedCategory 
                ? categories.find(c => c.id === selectedCategory)?.name 
                : 'All Categories'}
            </span>
            <ChevronDown className={`w-5 h-5 transition-transform ${showCategoryDropdown ? 'rotate-180' : ''}`} />
          </button>
          
          {showCategoryDropdown && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-gray-800 rounded-lg shadow-lg overflow-hidden z-50">
              <button
                onClick={() => {
                  setSelectedCategory(null);
                  setShowCategoryDropdown(false);
                }}
                className={`w-full px-4 py-3 text-left transition-colors ${
                  selectedCategory === null
                    ? 'bg-[#c9fffc] text-gray-900 font-medium'
                    : 'text-white hover:bg-gray-700'
                }`}
              >
                All Categories
              </button>
              {categories.map(category => (
                <div key={category.id} className="relative group">
                  <button
                    onClick={() => {
                      setSelectedCategory(category.id);
                      setShowCategoryDropdown(false);
                    }}
                    className={`w-full px-4 py-3 text-left transition-colors ${
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
                        setShowCategoryDropdown(false);
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-red-400 hover:text-red-300"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
              {isAdmin && (
                <button
                  onClick={() => {
                    setShowNewCategoryModal(true);
                    setShowCategoryDropdown(false);
                  }}
                  className="w-full px-4 py-3 text-[#c9fffc] hover:bg-gray-700 transition-colors flex items-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Add Category
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Desktop Categories */}
      <div className="hidden md:flex items-center gap-2 mb-8 overflow-x-auto pb-2 scrollbar-hide">
        <button
          onClick={() => setSelectedCategory(null)}
          className={`shrink-0 px-4 py-2 rounded-full transition-colors ${
            selectedCategory === null
              ? 'bg-[#c9fffc] text-gray-900 font-medium'
              : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
          }`}
        >
          All
        </button>
        {categories.map(category => (
          <div key={category.id} className="relative group shrink-0">
            <button
              onClick={() => setSelectedCategory(category.id)}
              className={`px-4 py-2 rounded-full transition-colors ${
                selectedCategory === category.id
                  ? 'bg-[#c9fffc] text-gray-900 font-medium'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              {category.name}
            </button>
            {isAdmin && (<button
              onClick={(e) => {
                e.stopPropagation();
                setCategoryToDelete(category);
                setShowDeleteModal(true);
              }}
              className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
            >
              <X className="w-3 h-3 text-white" />
            </button>)}
          </div>
        ))}
        {isAdmin && (<button
          onClick={() => setShowNewCategoryModal(true)}
          className="shrink-0 w-8 h-8 rounded-full bg-[#c9fffc] text-gray-900 flex items-center justify-center hover:bg-[#a0fcf9] transition-colors"
        >
          <Plus className="w-5 h-5" />
        </button>)}
      </div>
      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
      
      <div className="mb-6">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search AI tools..."
          className="w-full bg-gray-800 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#c9fffc]"
        />
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {isAdmin && (
          <button
            onClick={() => setShowNewToolModal(true)}
            className="bg-gray-800 rounded-lg aspect-video flex items-center justify-center hover:bg-gray-750 transition-colors group"
          >
            <Plus className="w-12 h-12 text-[#c9fffc] group-hover:scale-110 transition-transform" />
          </button>
        )}
        {getFilteredTools().map((tool) => (
          <div key={tool.id} className="bg-gray-800 rounded-lg p-6 hover:bg-gray-750 transition-colors relative group flex flex-col min-h-[280px]">
            <div className="flex flex-col items-center mb-4">
              {tool.logo_url ? (
                <img
                  src={tool.logo_url}
                  alt={`${tool.title} logo`}
                  className="w-16 h-16 object-contain mb-2"
                />
              ) : (
                <div className="w-16 h-16 bg-gray-700 rounded-lg flex items-center justify-center mb-2">
                  <Bot className="w-8 h-8 text-gray-400" />
                </div>
              )}
              <h2 className="text-xl font-semibold text-white text-center">{tool.title}</h2>
            </div>
            <div className="flex-1">
              <div className="prose prose-invert prose-sm max-w-none prose-p:text-gray-300 prose-a:text-[#c9fffc] prose-code:text-[#c9fffc] prose-code:bg-[#c9fffc]/10 prose-code:px-1 prose-code:py-0.5 prose-code:rounded">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{tool.description}</ReactMarkdown>
              </div>
            </div>
            <div className="mt-auto pt-4">
              <a
                href={tool.tool_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 bg-[#c9fffc] text-gray-900 px-4 py-2 rounded-lg hover:bg-[#a0fcf9] transition-colors w-full"
              >
                <Bot className="w-4 h-4" />
                Open Tool
              </a>
            </div>
            {isAdmin && (
              <button
                onClick={() => {
                  setEditingTool(tool);
                  setSelectedCategories(tool.categories);
                  setShowNewToolModal(true);
                }}
                className="absolute bottom-4 right-4 p-2 bg-gray-700 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-600"
              >
                <Pencil className="w-4 h-4 text-[#c9fffc]" />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* New Category Modal */}
      {showNewCategoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
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
              disabled={!newCategory.trim()}
              className="w-full bg-[#c9fffc] text-gray-900 rounded-lg px-4 py-2 font-medium hover:bg-[#a0fcf9] focus:outline-none focus:ring-2 focus:ring-[#c9fffc] disabled:opacity-50"
            >
              Add Category
            </button>
          </div>
        </div>
      )}

      {/* New Tool Modal */}
      {showNewToolModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white">
                {editingTool ? 'Edit AI Tool' : 'Add New AI Tool'}
              </h2>
              <button
                onClick={() => {
                  setShowNewToolModal(false);
                  setEditingTool(null);
                  setSelectedCategories([]);
                  setSelectedLogo(null);
                }}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Tool Logo
                </label>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gray-700 rounded-lg flex items-center justify-center">
                    {selectedLogo ? (
                      <img
                        src={URL.createObjectURL(selectedLogo)}
                        alt="Selected logo"
                        className="w-full h-full object-contain"
                      />
                    ) : editingTool?.logo_url ? (
                      <img
                        src={editingTool.logo_url}
                        alt="Current logo"
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <Bot className="w-8 h-8 text-gray-400" />
                    )}
                  </div>
                  <div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoSelect}
                      ref={fileInputRef}
                      className="hidden"
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-2 bg-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
                    >
                      <Upload className="w-4 h-4" />
                      Upload Logo
                    </button>
                    <p className="text-xs text-gray-400 mt-1">
                      Max size: 2MB
                    </p>
                  </div>
                </div>
              </div>
              <input
                type="text"
                value={editingTool?.title || newTool.title}
                onChange={(e) => {
                  if (editingTool) {
                    setEditingTool({ ...editingTool, title: e.target.value });
                  } else {
                    setNewTool({ ...newTool, title: e.target.value });
                  }
                }}
                placeholder="Tool title"
                className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#c9fffc]"
              />
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">
                  Description
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  <button
                    type="button"
                    onClick={() => {
                      const textarea = document.getElementById('toolDescription') as HTMLTextAreaElement;
                      const start = textarea.selectionStart;
                      const end = textarea.selectionEnd;
                      const text = editingTool?.description || newTool.description;
                      const newText = text.substring(0, start) + '**' + text.substring(start, end) + '**' + text.substring(end);
                      if (editingTool) {
                        setEditingTool({ ...editingTool, description: newText });
                      } else {
                        setNewTool({ ...newTool, description: newText });
                      }
                    }}
                    className="px-2 py-1 bg-gray-700 text-gray-300 rounded hover:bg-gray-600 text-sm font-medium"
                  >
                    Bold
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const textarea = document.getElementById('toolDescription') as HTMLTextAreaElement;
                      const start = textarea.selectionStart;
                      const end = textarea.selectionEnd;
                      const text = editingTool?.description || newTool.description;
                      const newText = text.substring(0, start) + '*' + text.substring(start, end) + '*' + text.substring(end);
                      if (editingTool) {
                        setEditingTool({ ...editingTool, description: newText });
                      } else {
                        setNewTool({ ...newTool, description: newText });
                      }
                    }}
                    className="px-2 py-1 bg-gray-700 text-gray-300 rounded hover:bg-gray-600 text-sm font-medium"
                  >
                    Italic
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const textarea = document.getElementById('toolDescription') as HTMLTextAreaElement;
                      const start = textarea.selectionStart;
                      const end = textarea.selectionEnd;
                      const text = editingTool?.description || newTool.description;
                      const newText = text.substring(0, start) + '`' + text.substring(start, end) + '`' + text.substring(end);
                      if (editingTool) {
                        setEditingTool({ ...editingTool, description: newText });
                      } else {
                        setNewTool({ ...newTool, description: newText });
                      }
                    }}
                    className="px-2 py-1 bg-gray-700 text-gray-300 rounded hover:bg-gray-600 text-sm font-medium"
                  >
                    Code
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const textarea = document.getElementById('toolDescription') as HTMLTextAreaElement;
                      const start = textarea.selectionStart;
                      const end = textarea.selectionEnd;
                      const text = editingTool?.description || newTool.description;
                      const newText = text.substring(0, start) + '[' + text.substring(start, end) + '](url)' + text.substring(end);
                      if (editingTool) {
                        setEditingTool({ ...editingTool, description: newText });
                      } else {
                        setNewTool({ ...newTool, description: newText });
                      }
                    }}
                    className="px-2 py-1 bg-gray-700 text-gray-300 rounded hover:bg-gray-600 text-sm font-medium"
                  >
                    Link
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const textarea = document.getElementById('toolDescription') as HTMLTextAreaElement;
                      const start = textarea.selectionStart;
                      const text = editingTool?.description || newTool.description;
                      const newText = text.substring(0, start) + '\n\n' + text.substring(start);
                      if (editingTool) {
                        setEditingTool({ ...editingTool, description: newText });
                      } else {
                        setNewTool({ ...newTool, description: newText });
                      }
                    }}
                    className="px-2 py-1 bg-gray-700 text-gray-300 rounded hover:bg-gray-600 text-sm font-medium"
                  >
                    New Line
                  </button>
                </div>
                <textarea
                  id="toolDescription"
                  value={editingTool?.description || newTool.description}
                  onChange={(e) => {
                    if (editingTool) {
                      setEditingTool({ ...editingTool, description: e.target.value });
                    } else {
                      setNewTool({ ...newTool, description: e.target.value });
                    }
                  }}
                  placeholder="Tool description (supports markdown formatting)"
                  rows={6}
                  className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#c9fffc] font-mono text-sm"
                />
                <p className="text-xs text-gray-400">
                  Supports markdown: **bold**, *italic*, `code`, and [links](url)
                </p>
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">
                  Categories (select multiple)
                </label>
                <div className="flex flex-wrap gap-2">
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => {
                        setSelectedCategories(prev =>
                          prev.includes(category.id)
                            ? prev.filter(id => id !== category.id)
                            : [...prev, category.id]
                        );
                      }}
                      className={`px-3 py-1 rounded-full text-sm transition-colors ${
                        selectedCategories.includes(category.id)
                          ? 'bg-[#c9fffc] text-gray-900'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      {category.name}
                    </button>
                  ))}
                </div>
              </div>
              <input
                type="url"
                value={editingTool?.tool_url || newTool.tool_url}
                onChange={(e) => {
                  if (editingTool) {
                    setEditingTool({ ...editingTool, tool_url: e.target.value });
                  } else {
                    setNewTool({ ...newTool, tool_url: e.target.value });
                  }
                }}
                placeholder="Tool URL (e.g., https://tool-website.com)"
                className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#c9fffc]"
              />
              <button
                onClick={editingTool ? handleEditTool : handleAddTool}
                disabled={
                  editingTool
                    ? !editingTool.title || !editingTool.description || selectedCategories.length === 0 || !editingTool.tool_url
                    : !newTool.title || !newTool.description || selectedCategories.length === 0 || !newTool.tool_url
                }
                className="w-full bg-[#c9fffc] text-gray-900 rounded-lg px-4 py-2 font-medium hover:bg-[#a0fcf9] focus:outline-none focus:ring-2 focus:ring-[#c9fffc] disabled:opacity-50"
              >
                {editingTool ? 'Save Changes' : 'Add Tool'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Category Modal */}
      {showDeleteModal && categoryToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4 m-4">
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