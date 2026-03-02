import React, { useState, useEffect } from 'react';
import { apiGet, apiPost, formatDateTime } from '../utils/api';
import { useToast } from './Toast';

export default function EssayManager() {
  const [essayData, setEssayData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [editFrom, setEditFrom] = useState('Hexo');
  const [isCreating, setIsCreating] = useState(false);
  const toast = useToast();

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchEssays(); }, []);

  const fetchEssays = async () => {
    try { setEssayData(await apiGet('/api/essays') || []); }
    catch { toast.error('加载随笔失败'); }
    finally { setLoading(false); }
  };

  const getEssayList = () => essayData[0]?.essay_list || [];

  const saveEssays = async (newList) => {
    const newData = essayData.length > 0
      ? essayData.map((s, i) => i === 0 ? { ...s, essay_list: newList } : s)
      : [{ title: '闲言碎语', subTitle: '记录生活点滴', essay_list: newList }];
    try {
      await apiPost('/api/essays', newData);
      setEssayData(newData);
      toast.success('保存成功');
    } catch { toast.error('保存失败'); }
  };

  const handleCreate = async () => {
    if (!editContent.trim()) return;
    const newEssay = {
      id: `essay-${Date.now()}`,
      content: editContent,
      date: new Date().toISOString().replace('T', ' ').replace(/\.\d{3}Z$/, ''),
      from: editFrom,
    };
    await saveEssays([...getEssayList(), newEssay]);
    setEditContent('');
    setIsCreating(false);
  };

  const handleUpdate = async (id) => {
    const list = getEssayList().map(e => e.id === id ? { ...e, content: editContent, from: editFrom } : e);
    await saveEssays(list);
    setEditing(null);
    setEditContent('');
  };

  const handleDelete = async (id) => {
    if (!confirm('确定删除这条随笔？')) return;
    await saveEssays(getEssayList().filter(e => e.id !== id));
  };

  const essays = getEssayList();
  const sectionInfo = essayData[0] || {};

  if (loading) return (
    <div className="space-y-4">
      <div className="skeleton h-20 rounded-2xl" />
      {[...Array(3)].map((_, i) => <div key={i} className="skeleton h-28 rounded-xl" />)}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>随笔管理</h2>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>共 {essays.length} 条随笔</p>
        </div>
        <button onClick={() => { setIsCreating(true); setEditContent(''); setEditFrom('Hexo'); }} className="btn btn-primary">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
          </svg>
          发布随笔
        </button>
      </div>

      {sectionInfo.title && (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 p-5 text-white">
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/4 blur-xl" />
          <h3 className="font-bold text-lg relative z-10">{sectionInfo.title}</h3>
          {sectionInfo.subTitle && <p className="text-amber-100 text-sm mt-1 relative z-10">{sectionInfo.subTitle}</p>}
        </div>
      )}

      {isCreating && (
        <div className="glass p-5 anim-fade-in">
          <h3 className="font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>✨ 新随笔</h3>
          <textarea value={editContent} onChange={e => setEditContent(e.target.value)} placeholder="记录此刻的想法..." rows={4} className="input resize-none mb-3" autoFocus />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <label className="text-xs" style={{ color: 'var(--text-muted)' }}>来源:</label>
              <select value={editFrom} onChange={e => setEditFrom(e.target.value)} className="input input-sm w-auto">
                {['Hexo', '手机', '电脑', 'iPad'].map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setIsCreating(false)} className="btn btn-ghost text-sm">取消</button>
              <button onClick={handleCreate} className="btn btn-primary text-sm">发布</button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {essays.length === 0 ? (
          <div className="text-center py-16" style={{ color: 'var(--text-muted)' }}>
            <svg className="w-12 h-12 mx-auto mb-3 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
            <p className="text-sm">暂无随笔</p>
          </div>
        ) : (
          [...essays].reverse().map(essay => (
            <div key={essay.id} className="glass p-5 group transition-all">
              {editing === essay.id ? (
                <div>
                  <textarea value={editContent} onChange={e => setEditContent(e.target.value)} rows={3} className="input resize-none mb-3" autoFocus />
                  <div className="flex items-center justify-between">
                    <select value={editFrom} onChange={e => setEditFrom(e.target.value)} className="input input-sm w-auto">
                      {['Hexo', '手机', '电脑', 'iPad'].map(v => <option key={v} value={v}>{v}</option>)}
                    </select>
                    <div className="flex gap-2">
                      <button onClick={() => { setEditing(null); setEditContent(''); }} className="btn btn-ghost text-sm">取消</button>
                      <button onClick={() => handleUpdate(essay.id)} className="btn btn-primary text-sm">保存</button>
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--text-primary)' }}>{essay.content}</p>
                  <div className="flex items-center justify-between mt-3 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
                    <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--text-muted)' }}>
                      <span>{formatDateTime(essay.date)}</span>
                      {essay.from && <span className="badge badge-muted">{essay.from}</span>}
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => { setEditing(essay.id); setEditContent(essay.content); setEditFrom(essay.from || 'Hexo'); }} className="text-xs px-2 py-1 rounded-lg transition-colors" style={{ color: 'var(--accent)' }}>编辑</button>
                      <button onClick={() => handleDelete(essay.id)} className="text-xs px-2 py-1 rounded-lg transition-colors" style={{ color: 'var(--danger)' }}>删除</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
