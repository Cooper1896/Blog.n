import React, { useState, useEffect } from 'react';
import { apiGet, apiPost, apiDelete, formatDate } from '../utils/api';
import { useToast } from './Toast';

export default function PostList({ onEdit }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [viewMode, setViewMode] = useState('card');
  const [isCreating, setIsCreating] = useState(false);
  const [newPostTitle, setNewPostTitle] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [selected, setSelected] = useState(new Set());
  const toast = useToast();

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchPosts(); }, []);

  const fetchPosts = async () => {
    try { setPosts(await apiGet('/api/posts')); }
    catch { toast.error('加载文章失败'); }
    finally { setLoading(false); }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newPostTitle.trim()) return;
    try {
      const data = await apiPost('/api/posts', { title: newPostTitle });
      if (data.success) {
        toast.success('文章创建成功');
        setNewPostTitle('');
        setIsCreating(false);
        fetchPosts();
        onEdit(data.filename);
      }
    } catch (err) { toast.error('创建失败: ' + err.message); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await apiDelete(`/api/posts/${encodeURIComponent(deleteTarget)}`);
      toast.success('文章已删除');
      setDeleteTarget(null);
      fetchPosts();
    } catch { toast.error('删除失败'); }
  };

  const handleBatchDelete = async () => {
    if (selected.size === 0) return;
    if (!confirm(`确定删除选中的 ${selected.size} 篇文章？`)) return;
    let ok = 0;
    for (const fn of selected) {
      try { await apiDelete(`/api/posts/${encodeURIComponent(fn)}`); ok++; } catch { /* ignore */ }
    }
    toast.success(`已删除 ${ok} 篇文章`);
    setSelected(new Set());
    fetchPosts();
  };

  const toggleSelect = (fn) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(fn) ? next.delete(fn) : next.add(fn);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === filtered.length) setSelected(new Set());
    else setSelected(new Set(filtered.map(p => p.filename)));
  };

  const allCategories = [...new Set(posts.flatMap(p => Array.isArray(p.categories) ? p.categories : p.categories ? [p.categories] : []))];

  const filtered = posts.filter(p => {
    const matchSearch = !search || p.title.toLowerCase().includes(search.toLowerCase());
    const matchCat = !filterCat || (Array.isArray(p.categories) ? p.categories.includes(filterCat) : p.categories === filterCat);
    return matchSearch && matchCat;
  }).sort((a, b) => {
    if (sortBy === 'title') return a.title.localeCompare(b.title);
    if (sortBy === 'words') return b.wordCount - a.wordCount;
    return new Date(b.date) - new Date(a.date);
  });

  if (loading) return (
    <div className="space-y-4">
      <div className="skeleton h-12 rounded-xl" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => <div key={i} className="skeleton h-56 rounded-xl" />)}
      </div>
    </div>
  );

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>文章管理</h2>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>共 {posts.length} 篇文章</p>
        </div>
        <div className="flex gap-2">
          {selected.size > 0 && (
            <button onClick={handleBatchDelete} className="btn btn-danger text-sm">
              删除 ({selected.size})
            </button>
          )}
          <button onClick={() => setIsCreating(true)} className="btn btn-primary">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            新建文章
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="glass p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <div className="relative flex-1 w-full">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="搜索文章..." className="input pl-9" />
          </div>
          <select value={filterCat} onChange={e => setFilterCat(e.target.value)} className="input w-auto" style={{ minWidth: '120px' }}>
            <option value="">全部分类</option>
            {allCategories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="input w-auto" style={{ minWidth: '120px' }}>
            <option value="date">按日期</option>
            <option value="title">按标题</option>
            <option value="words">按字数</option>
          </select>
          <div className="flex p-0.5 rounded-lg" style={{ background: 'var(--bg-hover)' }}>
            {[
              { id: 'card', icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z' },
              { id: 'table', icon: 'M4 6h16M4 10h16M4 14h16M4 18h16' },
            ].map(v => (
              <button key={v.id} onClick={() => setViewMode(v.id)} className="p-1.5 rounded-md transition-all" style={{ background: viewMode === v.id ? 'var(--bg-card-solid)' : 'transparent', boxShadow: viewMode === v.id ? 'var(--shadow-xs)' : 'none' }}>
                <svg className="w-4 h-4" style={{ color: 'var(--text-muted)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={v.icon} />
                </svg>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Card View */}
      {viewMode === 'card' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 stagger">
          {filtered.map(post => (
            <div key={post.filename} className="glass overflow-hidden group hover:shadow-lg transition-all duration-300 cursor-pointer" onClick={() => onEdit(post.filename)}>
              <div className="h-36 relative overflow-hidden" style={{ background: 'var(--bg-hover)' }}>
                {post.cover ? (
                  <img src={post.cover} alt={post.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" onError={e => { e.target.style.display = 'none'; }} />
                ) : (
                  <div className="w-full h-full flex items-center justify-center" style={{ color: 'var(--text-muted)' }}>
                    <svg className="w-10 h-10 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
                {post.draft && <span className="badge badge-warning absolute top-2 left-2">草稿</span>}
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => { e.stopPropagation(); toggleSelect(post.filename); }}>
                  <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${selected.has(post.filename) ? 'bg-[var(--accent)] border-[var(--accent)]' : 'border-white/60 bg-black/20'}`}>
                    {selected.has(post.filename) && <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>}
                  </div>
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-semibold line-clamp-1 mb-1 group-hover:text-[var(--accent)] transition-colors" style={{ color: 'var(--text-primary)' }}>{post.title}</h3>
                <p className="text-xs flex items-center gap-2" style={{ color: 'var(--text-muted)' }}>
                  <span>{formatDate(post.date)}</span>
                  <span>·</span>
                  <span>{post.wordCount} 字</span>
                </p>
                <div className="flex items-center justify-between mt-3">
                  <div className="flex gap-1 flex-wrap">
                    {(Array.isArray(post.tags) ? post.tags : []).slice(0, 2).map(tag => (
                      <span key={tag} className="badge badge-muted">#{tag}</span>
                    ))}
                  </div>
                  <button onClick={e => { e.stopPropagation(); setDeleteTarget(post.filename); }} className="text-xs opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: 'var(--danger)' }}>
                    删除
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Table View */}
      {viewMode === 'table' && (
        <div className="glass overflow-hidden">
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-hover)' }}>
                <th className="text-left text-xs font-medium px-5 py-3" style={{ color: 'var(--text-muted)' }}>
                  <input type="checkbox" onChange={toggleSelectAll} checked={selected.size === filtered.length && filtered.length > 0} className="rounded" />
                </th>
                <th className="text-left text-xs font-medium px-5 py-3" style={{ color: 'var(--text-muted)' }}>标题</th>
                <th className="text-left text-xs font-medium px-5 py-3 hidden md:table-cell" style={{ color: 'var(--text-muted)' }}>分类</th>
                <th className="text-left text-xs font-medium px-5 py-3 hidden lg:table-cell" style={{ color: 'var(--text-muted)' }}>字数</th>
                <th className="text-left text-xs font-medium px-5 py-3" style={{ color: 'var(--text-muted)' }}>日期</th>
                <th className="text-right text-xs font-medium px-5 py-3" style={{ color: 'var(--text-muted)' }}>操作</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(post => (
                <tr key={post.filename} className="transition-colors" style={{ borderBottom: '1px solid var(--border)' }} onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <td className="px-5 py-3">
                    <input type="checkbox" checked={selected.has(post.filename)} onChange={() => toggleSelect(post.filename)} className="rounded" />
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      {post.cover && <img src={post.cover} alt="" className="w-8 h-8 rounded-lg object-cover shrink-0" />}
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate cursor-pointer hover:text-[var(--accent)]" style={{ color: 'var(--text-primary)' }} onClick={() => onEdit(post.filename)}>{post.title}</p>
                        <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{post.filename}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3 hidden md:table-cell">
                    {(Array.isArray(post.categories) ? post.categories : post.categories ? [post.categories] : []).map(c => (
                      <span key={c} className="badge badge-accent mr-1">{c}</span>
                    ))}
                  </td>
                  <td className="px-5 py-3 text-sm hidden lg:table-cell" style={{ color: 'var(--text-secondary)' }}>{post.wordCount}</td>
                  <td className="px-5 py-3 text-sm" style={{ color: 'var(--text-secondary)' }}>{formatDate(post.date)}</td>
                  <td className="px-5 py-3 text-right">
                    <button onClick={() => onEdit(post.filename)} className="text-xs mr-2" style={{ color: 'var(--accent)' }}>编辑</button>
                    <button onClick={() => setDeleteTarget(post.filename)} className="text-xs" style={{ color: 'var(--danger)' }}>删除</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {filtered.length === 0 && !loading && (
        <div className="text-center py-16" style={{ color: 'var(--text-muted)' }}>
          <svg className="w-12 h-12 mx-auto mb-3 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-sm">{search || filterCat ? '未找到匹配的文章' : '暂无文章'}</p>
        </div>
      )}

      {/* Create Modal */}
      {isCreating && (
        <div className="modal-backdrop" onClick={() => setIsCreating(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-4" style={{ color: 'var(--text-primary)' }}>✨ 新建文章</h3>
            <form onSubmit={handleCreate}>
              <input type="text" value={newPostTitle} onChange={e => setNewPostTitle(e.target.value)} placeholder="输入文章标题..." className="input mb-5" autoFocus />
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setIsCreating(false)} className="btn btn-ghost">取消</button>
                <button type="submit" className="btn btn-primary">创建</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteTarget && (
        <div className="modal-backdrop" onClick={() => setDeleteTarget(null)}>
          <div className="modal-box text-center" onClick={e => e.stopPropagation()}>
            <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: 'var(--danger-bg)' }}>
              <svg className="w-6 h-6" style={{ color: 'var(--danger)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <h3 className="text-lg font-bold mb-1" style={{ color: 'var(--text-primary)' }}>确认删除</h3>
            <p className="text-sm mb-5" style={{ color: 'var(--text-secondary)' }}>删除 "{deleteTarget}" 后不可恢复</p>
            <div className="flex gap-2 justify-center">
              <button onClick={() => setDeleteTarget(null)} className="btn btn-ghost">取消</button>
              <button onClick={handleDelete} className="btn btn-danger">确认删除</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
