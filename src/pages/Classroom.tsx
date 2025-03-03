import React, { useState, useEffect } from 'react';
import { useNavigate, Routes, Route, useParams, useLocation } from 'react-router-dom';
import { Plus, X, Play, Pencil, Link, Check,ChevronDown } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { formatDistanceToNow } from 'date-fns';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

type Category = {
  id: string;
  name: string;
};

type ClassData = {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  video_url: string;
  categories: string[];
  created_at: string;
};

function ClassView() {
  const { classId } = useParams();
  const [class_, setClass] = useState<ClassData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchClass = async () => {
      try {
        const { data, error } = await supabase
          .from('classes')
          .select(`
            *,
            class_categories!inner (
              category_id
            )
          `)
          .eq('id', classId)
          .single();

        if (error) throw error;

        if (data) {
          setClass({
            ...data,
            categories: data.class_categories.map((cc: any) => cc.category_id)
          });
        }
      } catch (err) {
        console.error('Error fetching class:', err);
        setError('Failed to load class');
      } finally {
        setLoading(false);
      }
    };

    if (classId) {
      fetchClass();
    }
  }, [classId]);

  const getYouTubeVideoId = (url: string) => {
    if (!url) return null;
    
    try {
      const urlObj = new URL(url);
      let videoId = '';
      
      if (urlObj.hostname.includes('youtube.com')) {
        videoId = urlObj.searchParams.get('v') || '';
      } else if (urlObj.hostname === 'youtu.be') {
        videoId = urlObj.pathname.slice(1);
      }
      
      return videoId.match(/^[a-zA-Z0-9_-]{11}$/) ? videoId : null;
    } catch {
      return null;
    }
  };

  const getEmbedUrl = (videoUrl: string) => {
    const videoId = getYouTubeVideoId(videoUrl);
    if (!videoId) return '';
    return `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1&origin=${encodeURIComponent(window.location.origin)}`;
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (error || !class_) {
    return (
      <div className="p-8">
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
          <p className="text-red-400">{error || 'Class not found'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="aspect-video w-full bg-black rounded-lg overflow-hidden mb-6">
          <iframe
            src={getEmbedUrl(class_.video_url)}
            style={{ width: '100%', height: '100%', border: 0 }}
            title={class_.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          ></iframe>
        </div>
        <h1 className="text-2xl font-bold text-white mb-4">{class_.title}</h1>
        <p className="text-gray-300">{class_.description}</p>
      </div>
    </div>
  );
}

export default function Classroom() {
  const location = useLocation();
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showNewCategoryModal, setShowNewCategoryModal] = useState(false);
  const [showNewClassModal, setShowNewClassModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [newCategory, setNewCategory] = useState('');
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [editingClass, setEditingClass] = useState<ClassData | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<ClassData | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [newClass, setNewClass] = useState<Partial<ClassData>>({
    title: '',
    description: '',
    video_url: '',
    thumbnail: '',
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [copiedClassId, setCopiedClassId] = useState<string | null>(null);
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

        await Promise.all([fetchCategories(), fetchClasses()]);
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
        .from('categories')
        .select('*')
        .order('name');
      
      if (error) throw error;
      setCategories(data || []);
    } catch (err) {
      console.error('Error fetching categories:', err);
      setError('Failed to load categories');
    }
  };

  const fetchClasses = async () => {
    try {
      const { data, error } = await supabase
        .from('classes')
        .select(`
          *,
          class_categories!inner (
            category_id
          )
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      const classesWithCategories = data?.map(class_ => ({
        ...class_,
        categories: class_.class_categories.map((cc: any) => cc.category_id)
      })) || [];
      
      setClasses(classesWithCategories);
    } catch (err) {
      console.error('Error fetching classes:', err);
      setError('Failed to load classes');
    }
  };

  const handleAddCategory = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      const { error } = await supabase
        .from('categories')
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
        .from('categories')
        .delete()
        .eq('id', categoryToDelete.id);

      if (error) throw error;

      setSelectedCategory(null);
      setShowDeleteModal(false);
      setCategoryToDelete(null);
      await Promise.all([
        fetchCategories(),
        fetchClasses()
      ]);
    } catch (err) {
      console.error('Error deleting category:', err);
      setError('Failed to delete category');
    } finally {
      setLoading(false);
    }
  };

  const getYouTubeVideoId = (url: string) => {
    if (!url) return null;
    
    try {
      const urlObj = new URL(url);
      let videoId = '';
      
      if (urlObj.hostname.includes('youtube.com')) {
        videoId = urlObj.searchParams.get('v') || '';
      } else if (urlObj.hostname === 'youtu.be') {
        videoId = urlObj.pathname.slice(1);
      }
      
      return videoId.match(/^[a-zA-Z0-9_-]{11}$/) ? videoId : null;
    } catch {
      return null;
    }
  };

  const getEmbedUrl = (videoUrl: string) => {
    const videoId = getYouTubeVideoId(videoUrl);
    if (!videoId) return '';
    return `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1&origin=${encodeURIComponent(window.location.origin)}`;
  };

  const handleAddClass = async () => {
    try {
      if (!newClass.title || !newClass.description || !newClass.video_url || selectedCategories.length === 0) {
        throw new Error('Please fill in all required fields');
      }

      const videoId = getYouTubeVideoId(newClass.video_url);
      if (!videoId) {
        throw new Error('Please enter a valid YouTube URL');
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      const thumbnail = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;

      const { data: createdClass, error: classError } = await supabase
        .from('classes')
        .insert({
          title: newClass.title,
          description: newClass.description,
          video_url: newClass.video_url,
          thumbnail,
          user_id: user.id,
        })
        .select()
        .single();

      if (classError) throw classError;

      // Insert category relationships
      const categoryRelations = selectedCategories.map(categoryId => ({
        class_id: createdClass.id,
        category_id: categoryId
      }));

      const { error: categoryError } = await supabase
        .from('class_categories')
        .insert(categoryRelations);

      if (categoryError) throw categoryError;

      setSelectedCategories([]);
      setShowNewClassModal(false);
      setNewClass({
        title: '',
        description: '',
        video_url: '',
        thumbnail: '',
      });
      fetchClasses();
    } catch (err) {
      console.error('Error adding class:', err);
      setError(err instanceof Error ? err.message : 'Failed to add class');
    }
  };

  const handleEditClass = async () => {
    try {
      if (!editingClass?.title || !editingClass?.description || !editingClass?.video_url || selectedCategories.length === 0) {
        throw new Error('Please fill in all required fields');
      }

      const videoId = getYouTubeVideoId(editingClass.video_url);
      if (!videoId) {
        throw new Error('Please enter a valid YouTube URL');
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      const thumbnail = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
      console.log ("Working: ");
      // Update class
      const { error: classError } = await supabase
        .from('classes')
        .update({
          title: editingClass.title,
          description: editingClass.description,
          video_url: editingClass.video_url,
          thumbnail,
        })
        .eq('id', editingClass.id);

      if (classError) throw classError;

      // Delete existing category relationships
      const { error: deleteError } = await supabase
        .from('class_categories')
        .delete()
        .eq('class_id', editingClass.id);

      if (deleteError) throw deleteError;

      // Insert new category relationships
      const categoryRelations = selectedCategories.map(categoryId => ({
        class_id: editingClass.id,
        category_id: categoryId
      }));

      const { error: categoryError } = await supabase
        .from('class_categories')
        .insert(categoryRelations);

      if (categoryError) throw categoryError;

      setEditingClass(null);
      setSelectedCategories([]);
      setShowNewClassModal(false);
      fetchClasses();
    } catch (err) {
      console.error('Error updating class:', err);
      setError(err instanceof Error ? err.message : 'Failed to update class');
    }
  };

  const getFilteredClasses = () => {
    let filtered = classes;
    if (selectedCategory) {
      filtered = filtered.filter(c => c.categories.includes(selectedCategory));
    }
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(c => c.title.toLowerCase().includes(query));
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

  const formatTime = (timestamp: string) => {
    return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
  };

  const copyClassLink = async (classId: string) => {
    const url = `${window.location.origin}/classroom/${classId}`;
    await navigator.clipboard.writeText(url);
    setCopiedClassId(classId);
    setTimeout(() => setCopiedClassId(null), 2000);
  };

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

  // If we're on a specific class route, render the ClassView
  if (location.pathname !== '/classroom') {
    return (
      <Routes>
        <Route path="/:classId" element={<ClassView />} />
      </Routes>
    );
  }

  return (
    <div className="p-4 sm:p-8">
      <h1 className="text-2xl font-bold text-white mb-6">Classroom</h1>

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
          placeholder="Search classes..."
          className="w-full bg-gray-800 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#c9fffc]"
        />
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {isAdmin  && (
          <button
            onClick={() => setShowNewClassModal(true)}
            className="bg-gray-800 rounded-lg aspect-video flex items-center justify-center hover:bg-gray-750 transition-colors group"
          >
            <Plus className="w-12 h-12 text-[#c9fffc] group-hover:scale-110 transition-transform" />
          </button>
        )}
        {getFilteredClasses().map((class_) => (
          <div
            key={class_.id}
            className="bg-gray-800 rounded-lg overflow-hidden hover:bg-gray-750 transition-colors group relative"
            onClick={() => navigate(`/classroom/${class_.id}`)}
          >
            <div 
              className="aspect-video relative cursor-pointer"
            >
              <img
                src={class_.thumbnail}
                alt={class_.title}
                className="w-full h-full object-cover group-hover:opacity-75 transition-opacity"
              />
              <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="w-16 h-16 rounded-full bg-white bg-opacity-90 flex items-center justify-center cursor-pointer hover:scale-105 transition-transform">
                  <Play className="w-8 h-8 text-gray-900 ml-1" />
                </div>
              </div>
            </div>
            <div className="p-6">
              <span className="text-sm font-medium text-[#c9fffc] mb-2 inline-block">
                {categories.filter(c => class_.categories.includes(c.id)).map(c => c.name).join(', ')}
              </span>
              <h3 className="text-lg font-medium text-white mb-2">{class_.title}</h3>
              <div className="prose prose-invert prose-sm max-w-none prose-p:text-gray-300 prose-a:text-[#c9fffc] prose-code:text-[#c9fffc] prose-code:bg-[#c9fffc]/10 prose-code:px-1 prose-code:py-0.5 prose-code:rounded">
                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{class_.description}</ReactMarkdown>
                            </div>
              <div className="mt-2 flex justify-between items-center">
                <span className="text-gray-400 text-sm">
                  {formatTime(class_.created_at)}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      copyClassLink(class_.id);
                    }}
                    className="p-2 bg-gray-700 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-600"
                  >
                    {copiedClassId === class_.id ? (
                      <Check className="w-4 h-4 text-green-400" />
                    ) : (
                      <Link className="w-4 h-4 text-[#c9fffc]" />
                    )}
                  </button>
                  {isAdmin && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingClass(class_);
                        setSelectedCategories(class_.categories);
                        setShowNewClassModal(true);
                      }}
                      className="p-2 bg-gray-700 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-600"
                    >
                      <Pencil className="w-4 h-4 text-[#c9fffc]" />
                    </button>
                  )}
                </div>
              </div>
            </div>
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

      {/* New Class Modal */}
      {showNewClassModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white">
                {editingClass ? 'Edit Class' : 'Add New Class'}
              </h2>
              <button
                onClick={() => {
                  setShowNewClassModal(false);
                  setEditingClass(null);
                  setSelectedCategories([]);
                }}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <input
                type="text"
                value={editingClass?.title || newClass.title}
                onChange={(e) => {
                  if (editingClass) {
                    setEditingClass({ ...editingClass, title: e.target.value });
                  } else {
                    setNewClass({ ...newClass, title: e.target.value });
                  }
                }}
                placeholder="Class title"
                className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#c9fffc]"
              />
              <div className="flex flex-wrap gap-2 mb-2">
                  <button
                    type="button"
                    onClick={() => {
                      const textarea = document.getElementById('toolDescription') as HTMLTextAreaElement;
                      const start = textarea.selectionStart;
                      const end = textarea.selectionEnd;
                      const text = editingClass?.description || newClass.description;
                      const newText = text.substring(0, start) + '**' + text.substring(start, end) + '**' + text.substring(end);
                      if (editingClass) {
                        setEditingClass({ ...editingClass, description: newText });
                      } else {
                        setNewClass({ ...newClass, description: newText });
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
                      const text = editingClass?.description || newClass.description;
                      const newText = text.substring(0, start) + '*' + text.substring(start, end) + '*' + text.substring(end);
                      if (editingClass) {
                        setEditingClass({ ...editingClass, description: newText });
                      } else {
                        setNewClass({ ...newClass, description: newText });
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
                      const text = editingClass?.description || newClass.description;
                      const newText = text.substring(0, start) + '`' + text.substring(start, end) + '`' + text.substring(end);
                      if (editingClass) {
                        setEditingClass({ ...editingClass, description: newText });
                      } else {
                        setNewClass({ ...newClass, description: newText });
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
                      const text = editingClass?.description || newClass.description;
                      const newText = text.substring(0, start) + '[' + text.substring(start, end) + '](url)' + text.substring(end);
                      if (editingClass) {
                        setEditingClass({ ...editingClass, description: newText });
                      } else {
                        setNewClass({ ...newClass, description: newText });
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
                      const text = editingClass?.description || newClass.description;
                      const newText = text.substring(0, start) + '\n\n' + text.substring(start);
                      if (editingClass) {
                        setEditingClass({ ...editingClass, description: newText });
                      } else {
                        setNewClass({ ...newClass, description: newText });
                      }
                    }}
                    className="px-2 py-1 bg-gray-700 text-gray-300 rounded hover:bg-gray-600 text-sm font-medium"
                  >
                    New Line
                  </button>
                </div>
                <textarea
                  id="toolDescription"
                  value={editingClass?.description || newClass.description}
                  onChange={(e) => {
                    if (editingClass) {
                      setEditingClass({ ...editingClass, description: e.target.value });
                    } else {
                      setNewClass({ ...newClass, description: e.target.value });
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
                value={editingClass?.video_url || newClass.video_url}
                onChange={(e) => {
                  if (editingClass) {
                    setEditingClass({ ...editingClass, video_url: e.target.value });
                  } else {
                    setNewClass({ ...newClass, video_url: e.target.value });
                  }
                }}
                placeholder="YouTube video URL"
                pattern="^https:\/\/(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[a-zA-Z0-9_-]{11}$"
                title="Please enter a valid YouTube URL (e.g., https://youtube.com/watch?v=... or https://youtu.be/...)"
                className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#c9fffc]"
              />
              <button
                onClick={editingClass ? handleEditClass : handleAddClass}
                disabled={
                  editingClass
                    ? !editingClass.title || !editingClass.description || !editingClass.video_url || selectedCategories.length === 0
                    : !newClass.title || !newClass.description || !newClass.video_url || selectedCategories.length === 0
                }
                className="w-full bg-[#c9fffc] text-gray-900 rounded-lg px-4 py-2 font-medium hover:bg-[#a0fcf9] focus:outline-none focus:ring-2 focus:ring-[#c9fffc] disabled:opacity-50"
              >
                {editingClass ? 'Save Changes' : 'Add Class'}
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