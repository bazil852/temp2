import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, Routes, Route, useLocation } from 'react-router-dom';
import { Download, Plus, X, Pencil, Upload, Bot,ChevronDown, Link, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

type Category = {
  id: string;
  name: string;
};

type Blueprint = {
  id: string;
  title: string;
  description: string;
  logo_url: string | null;
  download_url: string;
  categories: string[];
};

function BlueprintModal() {
  const { blueprintId } = useParams();
  const navigate = useNavigate();
  const [blueprint, setBlueprint] = useState<Blueprint | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBlueprint = async () => {
      try {
        const { data, error } = await supabase
          .from('blueprints')
          .select(`
            *,
            blueprint_categories!inner (
              category_id
            )
          `)
          .eq('id', blueprintId)
          .single();

        if (error) throw error;

        if (data) {
          setBlueprint({
            ...data,
            categories: data.blueprint_categories.map((bc: any) => bc.category_id)
          });
        }
      } catch (err) {
        console.error('Error fetching blueprint:', err);
        setError('Failed to load blueprint');
      } finally {
        setLoading(false);
      }
    };

    if (blueprintId) {
      fetchBlueprint();
    }
  }, [blueprintId]);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-gray-800 rounded-lg p-8 w-full max-w-2xl mx-4">
          <div className="animate-pulse space-y-4">
            <div className="h-16 w-16 bg-gray-700 rounded-lg mx-auto" />
            <div className="h-8 bg-gray-700 rounded-lg w-3/4 mx-auto" />
            <div className="space-y-2">
              <div className="h-4 bg-gray-700 rounded-lg" />
              <div className="h-4 bg-gray-700 rounded-lg w-5/6" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !blueprint) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-gray-800 rounded-lg p-8 w-full max-w-2xl mx-4">
          <div className="text-center">
            <p className="text-red-400 mb-4">{error || 'Blueprint not found'}</p>
            <button
              onClick={() => navigate('/blueprints')}
              className="text-[#c9fffc] hover:text-white transition-colors"
            >
              Go back to Blueprints
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-8 w-full max-w-2xl mx-4 relative">
        <button
          onClick={() => navigate('/blueprints')}
          className="absolute top-4 right-4 text-gray-400 hover:text-white"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="flex flex-col items-center mb-6">
          {blueprint.logo_url ? (
            <img
              src={blueprint.logo_url}
              alt={`${blueprint.title} logo`}
              className="w-20 h-20 object-contain mb-4"
            />
          ) : (
            <div className="w-20 h-20 bg-gray-700 rounded-lg flex items-center justify-center mb-4">
              <Bot className="w-10 h-10 text-gray-400" />
            </div>
          )}
          <h2 className="text-2xl font-bold text-white text-center">
            {blueprint.title}
          </h2>
        </div>

        <p className="text-gray-300 text-center mb-8">
          {blueprint.description}
        </p>

        <a
          href={blueprint.download_url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 bg-[#c9fffc] text-gray-900 px-6 py-3 rounded-lg hover:bg-[#a0fcf9] transition-colors w-full font-medium"
        >
          <Download className="w-5 h-5" />
          Download Blueprint
        </a>
      </div>
    </div>
  );
}


export default function Blueprints() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [blueprints, setBlueprints] = useState<Blueprint[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewCategoryModal, setShowNewCategoryModal] = useState(false);
  const [showNewBlueprintModal, setShowNewBlueprintModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [selectedLogo, setSelectedLogo] = useState<File | null>(null);
  const [newCategory, setNewCategory] = useState('');
    const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [editingBlueprint, setEditingBlueprint] = useState<Blueprint | null>(null);
  const [newBlueprint, setNewBlueprint] = useState<Partial<Blueprint>>({
    title: '',
    description: '',
    logo_url: null,
    download_url: '',
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [copiedBlueprintId, setCopiedBlueprintId] = useState<string | null>(null);

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

        await Promise.all([fetchCategories(), fetchBlueprints()]);
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
        .from('automation_categories')
        .select('*')
        .order('name');
      
      if (error) throw error;
      setCategories(data || []);
    } catch (err) {
      console.error('Error fetching categories:', err);
      setError('Failed to load categories');
    }
  };

  const fetchBlueprints = async () => {
    try {
      const { data, error } = await supabase
        .from('blueprints').select(`
          *,
          blueprint_categories (
            category_id
          )
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      const blueprintsWithCategories = data?.map(blueprint => ({
        ...blueprint,
        categories: blueprint.blueprint_categories.map((bc: any) => bc.category_id)
      })).filter(blueprint => blueprint.blueprint_categories) || [];
      
      setBlueprints(blueprintsWithCategories);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching blueprints:', err);
      setError('Failed to load blueprints');
      setLoading(false);
    }
  };

  const handleAddCategory = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      const { error } = await supabase
        .from('automation_categories')
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
      setLoading(true);

      const { error } = await supabase
        .from('automation_categories')
        .delete()
        .eq('id', categoryToDelete.id);

      if (error) throw error;

      setSelectedCategory(null);
      setShowDeleteModal(false);
      setCategoryToDelete(null);
      await Promise.all([
        fetchCategories(),
        fetchBlueprints()
      ]);
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

  const handleAddBlueprint = async () => {
    try {
      if (!newBlueprint.title || !newBlueprint.description || !newBlueprint.download_url || selectedCategories.length === 0) {
        throw new Error('Please fill in all required fields');
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      let logoUrl = '';
      if (selectedLogo) {
        const fileExt = selectedLogo.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('blueprint-logos')
          .upload(fileName, selectedLogo);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('blueprint-logos')
          .getPublicUrl(fileName);
        
        logoUrl = publicUrl;
      }

      const { data: createdBlueprint, error: blueprintError } = await supabase
        .from('blueprints')
        .insert({
          title: newBlueprint.title,
          description: newBlueprint.description,
          logo_url: logoUrl || null,
          download_url: newBlueprint.download_url,
          user_id: user.id,
        })
        .select()
        .single();

      if (blueprintError) throw blueprintError;

      // Insert category relationships
      const categoryRelations = selectedCategories.map(categoryId => ({
        blueprint_id: createdBlueprint.id,
        category_id: categoryId
      }));

      const { error: categoryError } = await supabase
        .from('blueprint_categories')
        .insert(categoryRelations);

      if (categoryError) throw categoryError;

      setSelectedCategories([]);
      fetchBlueprints();
    } catch (err) {
      console.error('Error adding blueprint:', err);
      setError(err instanceof Error ? err.message : 'Failed to add blueprint');
    }
  };

  const handleEditBlueprint = async () => {
    try {
      if (!editingBlueprint?.title || !editingBlueprint?.description || !editingBlueprint?.download_url || selectedCategories.length === 0) {
        throw new Error('Please fill in all required fields');
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      let logoUrl = editingBlueprint.logo_url;
      if (selectedLogo) {
        const fileExt = selectedLogo.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('blueprint-logos')
          .upload(fileName, selectedLogo);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('blueprint-logos')
          .getPublicUrl(fileName);
        
        logoUrl = publicUrl;
      }

      // Update blueprint
      const { error: blueprintError } = await supabase
        .from('blueprints')
        .update({
          title: editingBlueprint.title,
          description: editingBlueprint.description,
          logo_url: logoUrl,
          download_url: editingBlueprint.download_url,
        })
        .eq('id', editingBlueprint.id);

      if (blueprintError) throw blueprintError;

      try {
        // Delete existing category relationships
        await supabase
          .from('blueprint_categories')
          .delete()
          .eq('blueprint_id', editingBlueprint.id);

        // Insert new category relationships
        const categoryRelations = selectedCategories.map(categoryId => ({
          blueprint_id: editingBlueprint.id,
          category_id: categoryId
        }));

        const { error: categoryError } = await supabase
          .from('blueprint_categories')
          .insert(categoryRelations);

        if (categoryError) throw categoryError;
      } catch (categoryError) {
        console.error('Error updating categories:', categoryError);
        throw new Error('Failed to update blueprint categories');
      }

      setEditingBlueprint(null);
      setSelectedCategories([]);
      setShowNewBlueprintModal(false);
      setShowNewBlueprintModal(false);
      fetchBlueprints();
    } catch (err) {
      console.error('Error updating blueprint:', err);
      setError(err instanceof Error ? err.message : 'Failed to update blueprint');
    }
  };

  const getFilteredBlueprints = () => {
    let filtered = blueprints;
    if (selectedCategory) {
      filtered = filtered.filter(b => b.categories.includes(selectedCategory));
    }
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(b => b.title.toLowerCase().includes(query));
    }
    return filtered;
  };

  const copyBlueprintLink = async (blueprintId: string) => {
    const url = `${window.location.origin}/blueprints/${blueprintId}`;
    await navigator.clipboard.writeText(url);
    setCopiedBlueprintId(blueprintId);
    setTimeout(() => setCopiedBlueprintId(null), 2000);
  };

  // If we're on a specific blueprint route, render the BlueprintModal
  if (location.pathname !== '/blueprints') {
    return (
      <Routes>
        <Route path="/:blueprintId" element={<BlueprintModal />} />
      </Routes>
    );
  }

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
    <div className="p-4 sm:p-8">
      <h1 className="text-2xl font-bold text-white mb-6">Automation Blueprints</h1>
      
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
          placeholder="Search blueprints..."
          className="w-full bg-gray-800 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#c9fffc]"
        />
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {isAdmin && (
          <button
            onClick={() => setShowNewBlueprintModal(true)}
            className="bg-gray-800 rounded-lg aspect-video flex items-center justify-center hover:bg-gray-750 transition-colors group"
          >
            <Plus className="w-12 h-12 text-[#c9fffc] group-hover:scale-110 transition-transform" />
          </button>
        )}
        {getFilteredBlueprints().map((blueprint) => (
          <div key={blueprint.id} className="bg-gray-800 rounded-lg p-6 hover:bg-gray-750 transition-colors relative group flex flex-col min-h-[280px]">
            <div className="flex flex-col items-center mb-4">
              {blueprint.logo_url ? (
                <img
                  src={blueprint.logo_url}
                  alt={`${blueprint.title} logo`}
                  className="w-16 h-16 object-contain mb-2"
                />
              ) : (
                <div className="w-16 h-16 bg-gray-700 rounded-lg flex items-center justify-center mb-2">
                  <Bot className="w-8 h-8 text-gray-400" />
                </div>
              )}
              <h2 className="text-xl font-semibold text-white text-center">{blueprint.title}</h2>
            </div>
            <div className="flex-1">
              <div className="prose prose-invert prose-sm max-w-none prose-p:text-gray-300 prose-a:text-[#c9fffc] prose-code:text-[#c9fffc] prose-code:bg-[#c9fffc]/10 prose-code:px-1 prose-code:py-0.5 prose-code:rounded">
                              <ReactMarkdown remarkPlugins={[remarkGfm]}>{blueprint.description}</ReactMarkdown>
              </div>
            </div>
            <div className="mt-auto pt-4">
              <a
                href={blueprint.download_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 bg-[#c9fffc] text-gray-900 px-4 py-2 rounded-lg hover:bg-[#a0fcf9] transition-colors w-full"
              >
                <Download className="w-4 h-4" />
                Download Blueprint
              </a>
              <button
  onClick={(e) => {
    e.stopPropagation();
    copyBlueprintLink(blueprint.id);
  }}
  className="absolute top-4 right-4 p-2 bg-gray-700 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-600"
>
  {copiedBlueprintId === blueprint.id ? (
    <Check className="w-4 h-4 text-green-400" />
  ) : (
    <Link className="w-4 h-4 text-[#c9fffc]" />
  )}
</button>

            </div>
            {isAdmin && (
              <button
                onClick={() => {
                  setEditingBlueprint(blueprint);
                  setSelectedCategories(blueprint.categories);
                  setShowNewBlueprintModal(true);
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
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
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

      {/* New Blueprint Modal */}
      {showNewBlueprintModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white">
                {editingBlueprint ? 'Edit Blueprint' : 'Add New Blueprint'}
              </h2>
              <button
                onClick={() => {
                  setShowNewBlueprintModal(false);
                  setEditingBlueprint(null);
                  setSelectedCategories([]);
                }}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Blueprint Logo
                </label>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gray-700 rounded-lg flex items-center justify-center">
                    {selectedLogo ? (
                      <img
                        src={URL.createObjectURL(selectedLogo)}
                        alt="Selected logo"
                        className="w-full h-full object-contain"
                      />
                    ) : editingBlueprint?.logo_url ? (
                      <img
                        src={editingBlueprint.logo_url}
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
                value={editingBlueprint?.title || newBlueprint.title}
                onChange={(e) => {
                  if (editingBlueprint) {
                    setEditingBlueprint({ ...editingBlueprint, title: e.target.value });
                  } else {
                    setNewBlueprint({ ...newBlueprint, title: e.target.value });
                  }
                }}
                placeholder="Blueprint title"
                className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#c9fffc]"
              />
              <div className="flex flex-wrap gap-2 mb-2">
                  <button
                    type="button"
                    onClick={() => {
                      const textarea = document.getElementById('toolDescription') as HTMLTextAreaElement;
                      const start = textarea.selectionStart;
                      const end = textarea.selectionEnd;
                      const text = editingBlueprint?.description || newBlueprint.description;
                      const newText = text.substring(0, start) + '**' + text.substring(start, end) + '**' + text.substring(end);
                      if (editingBlueprint) {
                        setEditingBlueprint({ ...editingBlueprint, description: newText });
                      } else {
                        setNewBlueprint({ ...newBlueprint, description: newText });
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
                      const text = editingBlueprint?.description || newBlueprint.description;
                      const newText = text.substring(0, start) + '*' + text.substring(start, end) + '*' + text.substring(end);
                      if (editingBlueprint) {
                        setEditingBlueprint({ ...editingBlueprint, description: newText });
                      } else {
                        setNewBlueprint({ ...newBlueprint, description: newText });
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
                      const text = editingBlueprint?.description || newBlueprint.description;
                      const newText = text.substring(0, start) + '`' + text.substring(start, end) + '`' + text.substring(end);
                      if (editingBlueprint) {
                        setEditingBlueprint({ ...editingBlueprint, description: newText });
                      } else {
                        setNewBlueprint({ ...newBlueprint, description: newText });
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
                      const text = editingBlueprint?.description || newBlueprint.description;
                      const newText = text.substring(0, start) + '[' + text.substring(start, end) + '](url)' + text.substring(end);
                      if (editingBlueprint) {
                        setEditingBlueprint({ ...editingBlueprint, description: newText });
                      } else {
                        setNewBlueprint({ ...newBlueprint, description: newText });
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
                      const text = editingBlueprint?.description || newBlueprint.description;
                      const newText = text.substring(0, start) + '\n\n' + text.substring(start);
                      if (editingBlueprint) {
                        setEditingBlueprint({ ...editingBlueprint, description: newText });
                      } else {
                        setNewBlueprint({ ...newBlueprint, description: newText });
                      }
                    }}
                    className="px-2 py-1 bg-gray-700 text-gray-300 rounded hover:bg-gray-600 text-sm font-medium"
                  >
                    New Line
                  </button>
                </div>
                <textarea
                  id="toolDescription"
                  value={editingBlueprint?.description || newBlueprint.description}
                  onChange={(e) => {
                    if (editingBlueprint) {
                      setEditingBlueprint({ ...editingBlueprint, description: e.target.value });
                    } else {
                      setNewBlueprint({ ...newBlueprint, description: e.target.value });
                    }
                  }}
                  placeholder="Tool description (supports markdown formatting)"
                  rows={6}
                  className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#c9fffc] font-mono text-sm"
                />
                <p className="text-xs text-gray-400">
                  Supports markdown: **bold**, *italic*, `code`, and [links](url)
                </p>
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
                type="text"
                value={editingBlueprint?.download_url || newBlueprint.download_url}
                onChange={(e) => {
                  if (editingBlueprint) {
                    setEditingBlueprint({ ...editingBlueprint, download_url: e.target.value });
                  } else {
                    setNewBlueprint({ ...newBlueprint, download_url: e.target.value });
                  }
                }}
                placeholder="Download URL"
                className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#c9fffc]"
              />
              <button
                onClick={editingBlueprint ? handleEditBlueprint : handleAddBlueprint}
                disabled={
                  editingBlueprint
                    ? !editingBlueprint.title || !editingBlueprint.description || !editingBlueprint.download_url || selectedCategories.length === 0
                    : !newBlueprint.title || !newBlueprint.description || !newBlueprint.download_url || selectedCategories.length === 0
                }
                className="w-full bg-[#c9fffc] text-gray-900 rounded-lg px-4 py-2 font-medium hover:bg-[#a0fcf9] focus:outline-none focus:ring-2 focus:ring-[#c9fffc] disabled:opacity-50"
              >
                {editingBlueprint ? 'Save Changes' : 'Add Blueprint'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Category Modal */}
      {showDeleteModal && categoryToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
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