# 闲言碎语独立评论功能使用指南

## 功能说明

现在，每条闲言碎语内容都可以拥有独立的评论区，访客可以在每条碎语下方单独评论，而不是只能在页面底部评论。

## 数据文件配置

编辑 `source/_data/essay.yml` 文件，为每条闲言碎语添加：

1. **唯一的 `id` 字段**：用于标识每条评论区
2. 其他原有字段保持不变

### 配置示例

```yaml
- title: 闲言碎语
  subTitle: 记录生活点滴
  top_background: ""
  limit: 10
  buttonLink: /about/
  buttonText: 关于本人
  tips: 这里记录了一些碎碎念...
  essay_list:
    - id: essay-001                          # ⬅️ 新增：唯一 ID
      content: 这是第一条碎语
      date: 2025-05-03 12:00:00
      from: Hexo

    - id: essay-002                          # ⬅️ 新增：唯一 ID
      content: 这是第二条碎语
      date: 2025-05-04 12:00:00
      from: Hexo
      image:
        - /path/to/image.jpg
```

## ID 命名规范

建议使用以下格式为 ID 命名：

- `essay-001`, `essay-002`, `essay-003` ...
- `essay-20250503`, `essay-20250504` ...
- 或其他有意义的标识符

**重要**：每个 ID 必须唯一，否则多个评论区会共享同一个评论列表。

## 文件修改说明

本功能涉及以下文件的修改：

### 1. 数据文件

- `source/_data/essay.yml` - 为每条闲言碎语添加 `id` 字段

### 2. 模板文件

- `themes/anzhiyu/layout/includes/page/essay.pug` - 为每条内容添加独立评论容器

### 3. 样式文件

- `themes/anzhiyu/source/css/_extra/essay_page/essay_page.css` - 评论区样式

### 4. 脚本文件

- `themes/anzhiyu/source/js/essay-comments-init.js` - 评论系统初始化脚本
- `themes/anzhiyu/_config.yml` - 注入评论初始化脚本

## 工作原理

1. **模板渲染**：当渲染闲言碎语时，每条内容下方会生成一个独立的评论容器
2. **ID 映射**：评论区的 `path` 参数使用 `essay_` + 内容 `id` 作为唯一标识
3. **脚本初始化**：页面加载完成后，脚本会为每个评论容器初始化相应的评论系统（Twikoo 或 Waline）
4. **独立评论**：每个容器中的评论完全独立，互不干扰

## 支持的评论系统

目前支持以下评论系统：

- **Twikoo** - 已在主题配置中启用
- **Waline** - 已在主题配置中启用
- 其他系统需要手动适配

## 故障排查

如果评论区未显示或无法加载：

1. **检查浏览器控制台**：查看是否有错误提示
2. **确认 `id` 字段**：确保每条闲言碎语都有唯一的 `id`
3. **清除缓存**：`hexo clean && hexo generate`
4. **检查配置**：确保评论系统已在主题配置中启用

## 添加新的闲言碎语

添加新的闲言碎语时，必须：

1. 在 `essay_list` 中添加新项
2. **为新项添加唯一的 `id` 字段**
3. 包含其他必要的字段（`content`, `date`, `from` 等）

示例：

```yaml
- id: essay-003                    # 新增唯一 ID
  content: 新的碎语内容
  date: 2025-11-27 10:00:00
  from: 来源
```

## 注意事项

- 不要重复使用相同的 `id`
- `id` 应该简短且有意义
- 删除闲言碎语时也应该删除对应的 `id`
- 修改后需要重新构建网站：`hexo generate`
