import React, { useState, useEffect, useRef } from 'react';
import { apiGet, apiPost, apiUpload } from '../utils/api';
import { useToast } from './Toast';

export default function MusicManager() {
  const [songs, setSongs] = useState([]);
  const [musicFiles, setMusicFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', artist: '', url: '', cover: '', lrc: '' });
  const [isCreating, setIsCreating] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const toast = useToast();

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [musicData, filesData] = await Promise.all([
        apiGet('/api/music'),
        apiGet('/api/music/files').catch(() => []),
      ]);
      setSongs(musicData || []);
      setMusicFiles(filesData || []);
    } catch { toast.error('加载音乐数据失败'); }
    finally { setLoading(false); }
  };

  const saveSongs = async (newSongs) => {
    try {
      await apiPost('/api/music', newSongs);
      setSongs(newSongs);
      toast.success('音乐数据已保存');
    } catch { toast.error('保存失败'); }
  };

  const handleCreate = async () => {
    if (!editForm.name.trim()) return toast.warning('请输入歌曲名称');
    await saveSongs([...songs, { ...editForm }]);
    setEditForm({ name: '', artist: '', url: '', cover: '', lrc: '' });
    setIsCreating(false);
  };

  const handleUpdate = async (index) => {
    const newSongs = [...songs];
    newSongs[index] = { ...editForm };
    await saveSongs(newSongs);
    setEditing(null);
  };

  const handleDelete = async (index) => {
    if (!confirm(`确定删除 "${songs[index].name}"？`)) return;
    const newSongs = songs.filter((_, i) => i !== index);
    await saveSongs(newSongs);
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const data = await apiPost('/api/music/generate', {});
      toast.success(data.message || '音乐列表已重新生成');
      fetchData();
    } catch (err) { toast.error('生成失败: ' + err.message); }
    finally { setGenerating(false); }
  };

  const handleUploadMusic = async (files) => {
    if (!files?.length) return;
    setUploading(true);
    try {
      for (const file of files) {
        const formData = new FormData();
        formData.append('file', file);
        await apiUpload('/api/music/upload', formData);
      }
      toast.success(`成功上传 ${files.length} 个文件`);
      fetchData();
    } catch { toast.error('上传失败'); }
    finally { setUploading(false); }
  };

  const startEdit = (index) => {
    setEditing(index);
    setEditForm({ ...songs[index] });
  };

  if (loading) return (
    <div className="space-y-4">
      <div className="skeleton h-20 rounded-2xl" />
      {[...Array(3)].map((_, i) => <div key={i} className="skeleton h-20 rounded-xl" />)}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>音乐管理</h2>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>共 {songs.length} 首歌曲</p>
        </div>
        <div className="flex gap-2">
          <input ref={fileInputRef} type="file" onChange={e => handleUploadMusic(e.target.files)} className="hidden" accept=".mp3,.lrc,.jpg,.jpeg,.png,.webp" multiple />
          <button onClick={() => fileInputRef.current?.click()} disabled={uploading} className="btn btn-outline text-sm">
            {uploading ? '上传中...' : '📁 上传文件'}
          </button>
          <button onClick={handleGenerate} disabled={generating} className="btn btn-outline text-sm">
            {generating ? '生成中...' : '🔄 自动扫描'}
          </button>
          <button onClick={() => { setIsCreating(true); setEditForm({ name: '', artist: '', url: '', cover: '', lrc: '' }); }} className="btn btn-primary text-sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            添加歌曲
          </button>
        </div>
      </div>

      {/* Info Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 p-5 text-white">
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/4 blur-xl" />
        <div className="flex items-center gap-4 relative z-10">
          <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center text-2xl shrink-0">🎵</div>
          <div>
            <h3 className="font-bold">本地音乐馆</h3>
            <p className="text-indigo-200 text-sm mt-0.5">管理 source/music/ 目录下的音乐文件，支持自动扫描 MP3 并关联歌词和封面</p>
          </div>
        </div>
      </div>

      {/* Music Files Info */}
      {musicFiles.length > 0 && (
        <div className="glass p-4">
          <h4 className="text-xs font-semibold mb-2" style={{ color: 'var(--text-muted)' }}>📂 music/ 目录文件</h4>
          <div className="flex flex-wrap gap-1.5">
            {musicFiles.map(f => (
              <span key={f} className={`badge ${f.endsWith('.mp3') ? 'badge-accent' : f.endsWith('.lrc') ? 'badge-success' : 'badge-info'}`}>
                {f}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Create Form */}
      {isCreating && (
        <div className="glass p-5 anim-fade-in">
          <h3 className="font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>🎵 添加新歌曲</h3>
          <SongForm form={editForm} setForm={setEditForm} />
          <div className="flex justify-end gap-2 mt-4">
            <button onClick={() => setIsCreating(false)} className="btn btn-ghost text-sm">取消</button>
            <button onClick={handleCreate} className="btn btn-primary text-sm">添加</button>
          </div>
        </div>
      )}

      {/* Song List */}
      <div className="space-y-3">
        {songs.length === 0 ? (
          <div className="text-center py-16" style={{ color: 'var(--text-muted)' }}>
            <div className="text-4xl mb-3">🎵</div>
            <p className="text-sm">暂无歌曲，点击上方添加或使用自动扫描</p>
          </div>
        ) : (
          songs.map((song, index) => (
            <div key={index} className="glass p-4 group transition-all">
              {editing === index ? (
                <div>
                  <SongForm form={editForm} setForm={setEditForm} />
                  <div className="flex justify-end gap-2 mt-4">
                    <button onClick={() => setEditing(null)} className="btn btn-ghost text-sm">取消</button>
                    <button onClick={() => handleUpdate(index)} className="btn btn-primary text-sm">保存</button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-4">
                  {/* Cover */}
                  <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 shadow-sm" style={{ background: 'var(--bg-hover)' }}>
                    {song.cover ? (
                      <img src={song.cover} alt="" className="w-full h-full object-cover" onError={e => { e.target.style.display = 'none'; }} />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xl">🎵</div>
                    )}
                  </div>
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{song.name}</h4>
                    <p className="text-sm truncate" style={{ color: 'var(--text-secondary)' }}>{song.artist || '未知歌手'}</p>
                    <div className="flex gap-2 mt-1">
                      {song.url && <span className="badge badge-accent">MP3</span>}
                      {song.lrc && <span className="badge badge-success">LRC</span>}
                      {song.cover && <span className="badge badge-info">封面</span>}
                    </div>
                  </div>
                  {/* Actions */}
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <button onClick={() => startEdit(index)} className="btn btn-ghost text-xs" style={{ color: 'var(--accent)' }}>编辑</button>
                    <button onClick={() => handleDelete(index)} className="btn btn-ghost text-xs" style={{ color: 'var(--danger)' }}>删除</button>
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

function SongForm({ form, setForm }) {
  const update = (key, val) => setForm(prev => ({ ...prev, [key]: val }));
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      <div>
        <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>歌曲名称 *</label>
        <input type="text" value={form.name} onChange={e => update('name', e.target.value)} className="input input-sm" placeholder="歌曲名" />
      </div>
      <div>
        <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>歌手</label>
        <input type="text" value={form.artist} onChange={e => update('artist', e.target.value)} className="input input-sm" placeholder="歌手名" />
      </div>
      <div>
        <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>音频 URL</label>
        <input type="text" value={form.url} onChange={e => update('url', e.target.value)} className="input input-sm" placeholder="/music/song.mp3" />
      </div>
      <div>
        <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>封面 URL</label>
        <input type="text" value={form.cover} onChange={e => update('cover', e.target.value)} className="input input-sm" placeholder="/music/cover.jpg" />
      </div>
      <div className="md:col-span-2">
        <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>歌词 URL</label>
        <input type="text" value={form.lrc} onChange={e => update('lrc', e.target.value)} className="input input-sm" placeholder="/music/song.lrc" />
      </div>
    </div>
  );
}
