// 初始化闲言碎语的独立评论系统
(function() {
  'use strict';
  
  // 延迟执行，等待评论库加载
  function initEssayComments() {
    const essayCommentBoxes = document.querySelectorAll('.essay-comment-box');
    
    if (essayCommentBoxes.length === 0) {
      console.log('[Essay Comments] 未找到评论容器');
      return;
    }
    
    console.log('[Essay Comments] 找到 ' + essayCommentBoxes.length + ' 个评论容器');
    
    essayCommentBoxes.forEach((box, index) => {
      const essayPath = box.querySelector('[data-essay-path]')?.getAttribute('data-essay-path');
      
      if (!essayPath) {
        console.warn('[Essay Comments] 评论容器 ' + index + ' 缺少 data-essay-path 属性');
        return;
      }
      
      // 处理 Twikoo
      const twikooWrap = box.querySelector('#essay-twikoo-wrap');
      if (twikooWrap && window.twikoo) {
        try {
          // 清空之前的内容
          twikooWrap.innerHTML = '';
          
          // 初始化 Twikoo
          window.twikoo.init({
            el: twikooWrap,
            envId: window.TWIKOO_ENV_ID || 'blog-p7dg4ens8-brizens-projects.vercel.app',
            region: '',
            path: essayPath,
            onCommentLoaded: function() {
              console.log('[Essay Comments] Twikoo 已加载，路径:', essayPath);
            }
          });
        } catch (e) {
          console.error('[Essay Comments] Twikoo 初始化失败:', e, '路径:', essayPath);
        }
      }
      
      // 处理 Waline
      const walineWrap = box.querySelector('#essay-waline-wrap');
      if (walineWrap && window.Waline) {
        try {
          // 清空之前的内容
          walineWrap.innerHTML = '';
          
          // 初始化 Waline
          const WalineClass = window.Waline.default || window.Waline;
          new WalineClass({
            el: walineWrap,
            serverURL: 'https://hexocomment-sigma.vercel.app/',
            path: essayPath,
            pageSize: 10,
            avatar: 'mp',
            lang: 'zh-CN'
          });
          console.log('[Essay Comments] Waline 已加载，路径:', essayPath);
        } catch (e) {
          console.error('[Essay Comments] Waline 初始化失败:', e, '路径:', essayPath);
        }
      }
    });
  }
  
  // 等待 DOM 和评论库加载完成
  function waitAndInit() {
    // 检查是否已加载评论库
    if ((window.twikoo && typeof window.twikoo.init === 'function') || 
        (window.Waline && typeof window.Waline === 'function')) {
      // 评论库已加载，立即初始化
      setTimeout(initEssayComments, 100);
    } else if (document.readyState !== 'loading') {
      // DOM 已加载，继续等待评论库
      setTimeout(waitAndInit, 300);
    } else {
      // DOM 未加载，等待 DOMContentLoaded
      document.addEventListener('DOMContentLoaded', function() {
        setTimeout(waitAndInit, 500);
      }, { once: true });
    }
  }
  
  // 立即开始等待
  waitAndInit();
  
  // 页面加载完成后再次尝试初始化
  window.addEventListener('load', function() {
    console.log('[Essay Comments] 页面加载完成，重新检查评论');
    setTimeout(initEssayComments, 500);
  });
  
  // 支持 PJAX 动态加载
  if (document.addEventListener) {
    document.addEventListener('pjax:complete', function() {
      console.log('[Essay Comments] PJAX 加载完成，重新初始化');
      setTimeout(initEssayComments, 500);
    });
  }
})();
