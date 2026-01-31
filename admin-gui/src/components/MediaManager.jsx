import React, { useState, useEffect } from 'react';

export default function MediaManager() {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchImages();
  }, []);

  const fetchImages = async () => {
    try {
      const res = await fetch('http://localhost:3001/api/media');
      const data = await res.json();
      setImages(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching images:', error);
      setLoading(false);
    }
  };

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('http://localhost:3001/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        fetchImages(); // Refresh list
        alert('上传成功');
      } else {
        alert('上传失败');
      }
    } catch (error) {
      console.error('Error uploading:', error);
      alert('上传出错');
    } finally {
      setUploading(false);
    }
  };

  const copyToClipboard = (url) => {
    navigator.clipboard.writeText(url);
    alert('链接已复制到剪贴板');
  };

  if (loading) return (
    <div className="flex justify-center items-center h-full">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
    </div>
  );

  return (
    <div className="h-full flex flex-col bg-white rounded-2xl shadow-sm overflow-hidden">
      <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 bg-white">
        <h2 className="text-xl font-bold text-gray-800">媒体库</h2>
        <div className="relative">
          <input
            type="file"
            onChange={handleUpload}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            accept="image/*"
            disabled={uploading}
          />
          <button className={`px-6 py-2 rounded-xl text-white font-medium shadow-lg shadow-blue-500/30 transition-all transform active:scale-95 ${
            uploading ? 'bg-blue-400 cursor-wait' : 'bg-blue-500 hover:bg-blue-600 hover:-translate-y-0.5'
          }`}>
            {uploading ? '上传中...' : '上传图片'}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {images.length === 0 ? (
          <div className="text-center text-gray-400 mt-20">
            <p>暂无图片，点击右上角上传</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
            {images.map((img, index) => (
              <div key={index} className="group relative aspect-square bg-gray-100 rounded-xl overflow-hidden border border-gray-200 hover:shadow-md transition-all">
                <img src={`http://localhost:3001${img.url}`} alt={img.name} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-center items-center gap-2">
                  <button 
                    onClick={() => copyToClipboard(img.url)}
                    className="px-3 py-1 bg-white text-gray-800 text-xs rounded-lg font-medium hover:bg-gray-100"
                  >
                    复制链接
                  </button>
                  <span className="text-white text-xs px-2 truncate max-w-full">{img.name}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
