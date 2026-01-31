import React, { useState, useEffect } from 'react';

export default function PostList({ onEdit }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newPostTitle, setNewPostTitle] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const res = await fetch('http://localhost:3001/api/posts');
      const data = await res.json();
      // Sort by date desc
      data.sort((a, b) => new Date(b.date) - new Date(a.date));
      setPosts(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching posts:', error);
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newPostTitle.trim()) return;

    try {
      const res = await fetch('http://localhost:3001/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newPostTitle }),
      });
      const data = await res.json();
      if (data.success) {
        setNewPostTitle('');
        setIsCreating(false);
        fetchPosts();
        onEdit(data.filename);
      } else {
        alert('Failed to create post: ' + data.error);
      }
    } catch (error) {
      console.error('Error creating post:', error);
    }
  };

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
    </div>
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">文章列表</h2>
          <p className="text-gray-500 mt-1">共 {posts.length} 篇文章</p>
        </div>
        <button
          onClick={() => setIsCreating(true)}
          className="bg-blue-500 text-white px-6 py-3 rounded-xl shadow-lg shadow-blue-500/30 hover:bg-blue-600 transition-all transform hover:-translate-y-1 flex items-center font-medium"
        >
          <span className="mr-2 text-xl">+</span> 新建文章
        </button>
      </div>

      {isCreating && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md transform transition-all scale-100">
            <h3 className="text-xl font-bold mb-4 text-gray-800">新建文章</h3>
            <form onSubmit={handleCreate}>
              <input
                type="text"
                value={newPostTitle}
                onChange={(e) => setNewPostTitle(e.target.value)}
                placeholder="输入文章标题..."
                className="w-full border border-gray-200 p-3 rounded-xl mb-6 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                autoFocus
              />
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-100 font-medium"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 shadow-md shadow-blue-500/20 font-medium"
                >
                  创建
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {posts.map((post) => (
          <div 
            key={post.filename} 
            className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden group border border-gray-100 flex flex-col h-full"
          >
            <div className="h-48 bg-gray-100 relative overflow-hidden">
              {post.cover ? (
                <img 
                  src={post.cover} 
                  alt={post.title} 
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  onError={(e) => {e.target.style.display='none'}}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 text-blue-200">
                  <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              )}
              <div className="absolute top-3 right-3">
                <span className="bg-white/90 backdrop-blur-sm px-2 py-1 rounded-md text-xs font-medium text-gray-600 shadow-sm">
                  {post.filename}
                </span>
              </div>
            </div>
            
            <div className="p-5 flex-1 flex flex-col">
              <h3 className="text-lg font-bold text-gray-800 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
                {post.title}
              </h3>
              
              <div className="flex items-center text-sm text-gray-400 mb-4">
                <span className="mr-4 flex items-center">
                  📅 {post.date ? new Date(post.date).toLocaleDateString() : 'No Date'}
                </span>
              </div>

              <div className="mt-auto pt-4 border-t border-gray-50 flex justify-between items-center">
                <div className="flex gap-2">
                  {post.categories && Array.isArray(post.categories) && post.categories.slice(0, 2).map(cat => (
                    <span key={cat} className="text-xs bg-blue-50 text-blue-500 px-2 py-1 rounded-md">
                      {cat}
                    </span>
                  ))}
                </div>
                <button
                  onClick={() => onEdit(post.filename)}
                  className="text-blue-500 hover:text-blue-700 font-medium text-sm px-3 py-1 rounded-lg hover:bg-blue-50 transition-colors"
                >
                  编辑 &rarr;
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
