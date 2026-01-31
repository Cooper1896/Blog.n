var posts=["2025/11/26/hello-world/","2025/11/26/Twikko/","2025/10/24/Artificial Intelligence/","2025/11/28/web_est/","2025/11/26/unlocked_bl_sh/"];function toRandomPost(){
    pjax.loadUrl('/'+posts[Math.floor(Math.random() * posts.length)]);
  };