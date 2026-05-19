# Easy API 文件上传功能设计文档

## 日期
2025-08-18

## 背景
Easy API 是一个轻量级 API 测试工具，目前支持基本的 HTTP 请求方法、请求头设置、请求体编辑和响应展示。用户需要增强 API 调用功能，支持文件传输（PDF/PNG/JPG/TIFF），并生成对应的 cURL 命令预览。

## 目标
1. 在 Form Data 模式下支持文件上传（PDF/PNG/JPG/TIFF）
2. 支持添加额外的表单文本字段
3. 生成对应的 cURL 命令预览

## 设计方案

### 1. UI 结构变更（Body 标签页）

当用户在 Body 类型下拉框选择 `Form Data` 时，界面替换为表单构建器：

```
+------------------------------------------+
|  [Form Data ▼]                           |
+------------------------------------------+
|                                          |
|  +----------------+-------------------+   |
|  | Key            | Value             |   |
|  +----------------+-------------------+   |
|  | docType        | CONTRACT          |   |
|  +----------------+-------------------+   |
|                                          |
|  +----------------+-------------------+   |
|  | file           | [选择文件] contract.pdf |
|  +----------------+-------------------+   |
|                                          |
|  [+ 添加文本字段]  [+ 添加文件字段]          |
|                                          |
+------------------------------------------+
```

**字段类型：**
- **文本字段**：Key-Value 输入框，对应普通表单字段
- **文件字段**：Key + File Input（限制类型：`.pdf`, `.png`, `.jpg`, `.jpeg`, `.tiff`）

### 2. 请求发送逻辑

当 Body 类型为 `Form Data` 时：
- 使用 `FormData` API 构建请求体
- 自动移除用户手动设置的 `Content-Type` 头（浏览器会自动设置带 boundary 的 `multipart/form-data`）
- 通过 `fetch()` 发送

### 3. cURL 命令生成

在请求区域下方新增 **cURL 预览** 区域，实时根据当前请求配置生成 cURL 命令：

```bash
curl -X POST http://localhost:4004/external-api/submit \
  -H "Authorization: Bearer <token>" \
  -F "file=@contract.pdf;type=application/pdf" \
  -F "docType=CONTRACT"
```

**特性：**
- 一键复制按钮
- 支持所有请求方法、请求头、Body 类型
- Form Data 类型使用 `-F` 参数

### 4. 文件类型限制

文件选择器 `accept` 属性限制：
- `.pdf` → `application/pdf`
- `.png` → `image/png`
- `.jpg`, `.jpeg` → `image/jpeg`
- `.tiff` → `image/tiff`

选择非法类型时提示用户。

### 5. 响应处理

文件上传的响应处理与现有逻辑一致：
- JSON 响应自动格式化
- 文本响应直接展示
- 状态码和时间统计

## 技术实现

### 文件变更
- `index.html`：添加 Form Data 表单构建器 UI、cURL 预览区域
- `script.js`：添加表单构建器逻辑、文件处理、cURL 生成
- `style.css`：添加表单构建器和 cURL 预览区域样式

### 关键实现点
1. 动态添加/删除表单字段（文本和文件）
2. 文件类型验证
3. FormData 对象构建
4. cURL 命令字符串生成
5. 自动处理 Content-Type 头
