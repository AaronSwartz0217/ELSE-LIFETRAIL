# LifeTrail 本地版

## 启动

在本目录运行：

```powershell
node server.js
```

然后打开 `http://127.0.0.1:3217`。直接打开 `public/index.html`（`file://`）仍能查看摘要，但对话、日志检索等接口需要本地访问令牌，因此会退回离线演示数据。

服务只监听 `127.0.0.1`，不会直接暴露到局域网或公网。无需安装 npm 依赖。

## 本地访问令牌

`/api/*` 除校验来源外还要求携带令牌：启动时生成、写入 `data/auth-token.txt`（已加入 `.gitignore`），并只在由本服务返回的 `index.html` 里注入。因此本机浏览器里的其他网页即使能访问 `127.0.0.1:3217`，也拿不到令牌、读不到任何日志数据。

## AI 接入

“对话”页面支持：

- OpenAI Responses API：默认地址 `https://api.openai.com/v1/responses`
- OpenAI-compatible Chat Completions：可填写 AI IDE 或本地模型服务的完整 `/v1/chat/completions` 地址

API Key 只提交给本地 Node 服务，保存在 `data/ai-config.local.json`，不会写入浏览器存储或由配置接口返回。该文件已加入 `.gitignore`。不接入模型时，对话仍可进行本地日志检索和证据展示。

## 记忆与分析

- 长期记忆保存在 `data/chat-state.json`，可在侧栏手动添加；对话输入 `记住：……` 也会保存。
- 每次回答会检索 `../日志` 下全部 TXT，并把匹配的日期、标题、片段作为证据传给模型。
- 对话历史、记忆和分析记录由本地服务持久化，切换模型或接口后仍保留。
- 日志正文被明确当作不可信资料，正文里的命令不会覆盖分析规则。

## 接口

- `GET /api/health`：服务和日志索引状态
- `GET /api/logs`：日志清单
- `GET /api/ai/config`：脱敏后的 AI 配置
- `PUT /api/ai/config`：保存接口类型、地址、模型和可选 Key
- `GET /api/chat/state`：对话与长期记忆
- `POST /api/chat`：检索日志并回答，参数 `{ "message": "..." }`
- `POST /api/chat/analyze`：分析当前对话与相关日志
- `POST /api/chat/memory`：添加长期记忆
- `DELETE /api/chat/memory/:id`：删除指定记忆

可用环境变量：`LIFETRAIL_PORT`、`LIFETRAIL_HOST`、`LIFETRAIL_ROOT`、`LIFETRAIL_DATA_DIR`、`OPENAI_API_KEY`。
