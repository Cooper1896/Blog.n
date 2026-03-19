import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  const [isDragging, setIsDragging] = useState(false);
  const [droppedFiles, setDroppedFiles] = useState([]);
  const [showDropForm, setShowDropForm] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const fileInputRef = useRef(null);
  const dragCounterRef = useRef(0);
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

  // ========== Drag & Drop ==========
  const handleDragEnter = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current++;
    if (e.dataTransfer.items?.length) setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current--;
    if (dragCounterRef.current === 0) setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const inferSongInfo = (filename) => {
    const nameWithoutExt = filename.replace(/\.[^.]+$/, '');
    const parts = nameWithoutExt.split(/[-–—_]/).map(s => s.trim()).filter(Boolean);
    if (parts.length >= 2) {
      return { name: parts[0], artist: parts[1] };
    }
    return { name: nameWithoutExt, artist: '' };
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    dragCounterRef.current = 0;

    const files = Array.from(e.dataTransfer.files);
    const validExts = ['.mp3', '.flac', '.wav', '.ogg', '.m4a', '.lrc', '.jpg', '.jpeg', '.png', '.webp'];
    const validFiles = files.filter(f => validExts.some(ext => f.name.toLowerCase().endsWith(ext)));

    if (validFiles.length === 0) {
      toast.warning('请拖入音频文件（MP3/FLAC/WAV等）、歌词(LRC)或封面图片');
      return;
    }

    // 按类型分组
    const audioFiles = validFiles.filter(f => /\.(mp3|flac|wav|ogg|m4a)$/i.test(f.name));
    const lrcFiles = validFiles.filter(f => /\.lrc$/i.test(f.name));
    const imgFiles = validFiles.filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f.name));

    // 为每个音频文件生成预填表单
    const entries = audioFiles.length > 0 ? audioFiles.map(af => {
      const info = inferSongInfo(af.name);
      const baseName = af.name.replace(/\.[^.]+$/, '');
      const matchedLrc = lrcFiles.find(l => l.name.replace(/\.lrc$/i, '') === baseName);
      const matchedImg = imgFiles.length === 1 ? imgFiles[0] : imgFiles.find(i => i.name.replace(/\.[^.]+$/, '') === baseName);
      return {
        audioFile: af,
        lrcFile: matchedLrc || null,
        coverFile: matchedImg || null,
        form: {
          name: info.name,
          artist: info.artist,
          url: `/music/${af.name}`,
          cover: matchedImg ? `/music/${matchedImg.name}` : '',
          lrc: matchedLrc ? `/music/${matchedLrc.name}` : '',
        },
      };
    }) : [{
      audioFile: null,
      lrcFile: lrcFiles[0] || null,
      coverFile: imgFiles[0] || null,
      form: {
        name: '',
        artist: '',
        url: '',
        cover: imgFiles[0] ? `/music/${imgFiles[0].name}` : '',
        lrc: lrcFiles[0] ? `/music/${lrcFiles[0].name}` : '',
      },
    }];

    setDroppedFiles(entries);
    setShowDropForm(true);
  }, [toast]);

  const handleDropFormChange = (index, key, value) => {
    setDroppedFiles(prev => {
      const updated = [...prev];
      if (key === null && typeof value === 'object') {
        // Full form object update from SongForm setForm callback
        updated[index] = { ...updated[index], form: value };
      } else {
        updated[index] = { ...updated[index], form: { ...updated[index].form, [key]: value } };
      }
      return updated;
    });
  };

  const handleDropFormRemove = (index) => {
    setDroppedFiles(prev => prev.filter((_, i) => i !== index));
    if (droppedFiles.length <= 1) {
      setShowDropForm(false);
      setDroppedFiles([]);
    }
  };

  const handleDropConfirm = async () => {
    if (droppedFiles.length === 0) return;
    setUploading(true);
    try {
      // 1. 上传所有文件
      const allFiles = new Set();
      for (const entry of droppedFiles) {
        if (entry.audioFile) allFiles.add(entry.audioFile);
        if (entry.lrcFile) allFiles.add(entry.lrcFile);
        if (entry.coverFile) allFiles.add(entry.coverFile);
      }
      const uniqueFiles = [...allFiles];
      setUploadProgress(`上传文件中 (0/${uniqueFiles.length})...`);
      for (let i = 0; i < uniqueFiles.length; i++) {
        const formData = new FormData();
        formData.append('file', uniqueFiles[i]);
        await apiUpload('/api/music/upload', formData);
        setUploadProgress(`上传文件中 (${i + 1}/${uniqueFiles.length})...`);
      }

      // 2. 保存歌曲信息
      const newSongs = droppedFiles
        .filter(e => e.form.name.trim())
        .map(e => ({ ...e.form }));
      if (newSongs.length > 0) {
        await saveSongs([...songs, ...newSongs]);
      }

      toast.success(`成功添加 ${newSongs.length} 首歌曲`);
      setShowDropForm(false);
      setDroppedFiles([]);
      fetchData();
    } catch (err) {
      toast.error('处理失败: ' + err.message);
    } finally {
      setUploading(false);
      setUploadProgress('');
    }
  };

  if (loading) return (
    <div className="space-y-4">
      <div className="skeleton h-20 rounded-2xl" />
      {[...Array(3)].map((_, i) => <div key={i} className="skeleton h-20 rounded-xl" />)}
    </div>
  );

  return (
    <div
      className="space-y-6 relative"
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* Drag Overlay */}
      {isDragging && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" style={{ pointerEvents: 'none' }}>
          <div className="flex flex-col items-center gap-4 p-10 rounded-3xl border-2 border-dashed" style={{ borderColor: 'var(--accent)', background: 'var(--bg-primary)' }}>
            <div className="text-6xl animate-bounce">🎵</div>
            <p className="text-xl font-bold" style={{ color: 'var(--accent)' }}>释放以添加音乐</p>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>支持 MP3/FLAC/WAV/OGG/M4A、LRC 歌词、封面图片</p>
          </div>
        </div>
      )}

      {/* Drop Upload Form Modal */}
      {showDropForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={(e) => { if (e.target === e.currentTarget) { setShowDropForm(false); setDroppedFiles([]); } }}>
          <div className="w-full max-w-3xl max-h-[85vh] overflow-y-auto rounded-2xl shadow-2xl p-6" style={{ background: 'var(--bg-primary)' }}>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>🎵 拖入的音乐文件</h3>
                <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>已自动识别歌曲信息，你可以修改后确认添加</p>
              </div>
              <button onClick={() => { setShowDropForm(false); setDroppedFiles([]); }} className="btn btn-ghost text-lg">✕</button>
            </div>

            <div className="space-y-4">
              {droppedFiles.map((entry, idx) => (
                <div key={idx} className="glass p-4 anim-fade-in">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🎶</span>
                      <span className="text-xs font-mono px-2 py-0.5 rounded" style={{ background: 'var(--bg-hover)', color: 'var(--text-secondary)' }}>
                        {entry.audioFile?.name || '仅附件'}
                      </span>
                      {entry.lrcFile && <span className="badge badge-success">LRC</span>}
                      {entry.coverFile && <span className="badge badge-info">封面</span>}
                    </div>
                    {droppedFiles.length > 1 && (
                      <button onClick={() => handleDropFormRemove(idx)} className="btn btn-ghost text-xs" style={{ color: 'var(--danger)' }}>移除</button>
                    )}
                  </div>
                  <SongForm form={entry.form} setForm={(updater) => {
                    const val = typeof updater === 'function' ? updater(entry.form) : updater;
                    handleDropFormChange(idx, null, val);
                  }} />
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => { setShowDropForm(false); setDroppedFiles([]); }} className="btn btn-ghost" disabled={uploading}>取消</button>
              <button onClick={handleDropConfirm} className="btn btn-primary" disabled={uploading}>
                {uploading ? (uploadProgress || '处理中...') : `确认添加 ${droppedFiles.filter(e => e.form.name.trim()).length} 首歌曲`}
              </button>
            </div>
          </div>
        </div>
      )}

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
            <p className="text-indigo-300 text-xs mt-1">💡 可直接拖拽音乐文件到页面任意位置快速添加</p>
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
  const update = (key, val) => {
    if (typeof setForm === 'function') {
      setForm(prev => {
        if (typeof prev === 'object' && prev !== null) {
          return { ...prev, [key]: val };
        }
        return { ...form, [key]: val };
      });
    }
  };
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
