# Else-SuperEgo-Skills / 超我镜像技能

[English](#english) | [中文](#中文)

---

<a id="english"></a>
## English

A psychoanalytic self-deconstruction and subconscious interception system built on AI Agent Skills technology.

### Overview

Else-SuperEgo-Skills is an open-source **Agent Skill definition framework** that implements a structured four-step interception algorithm — **[Intercept Projection] → [Match Articles] → [Decode Id] → [Inject Agency]** — to help individuals recognize and dismantle destructive defense mechanisms rooted in an overactive superego (internal moral judge).

Instead of projecting one's harsh inner critic onto external others, this system uses structured data input and deterministic prompt engineering to intercept self-sabotaging thought patterns at the moment they arise, enabling rational self-deconstruction without secondary judgment.

### The Problem: Two Destructive Defense Mechanisms

In psychodynamic theory, when an individual's superego becomes excessively punitive or carries unresolved trauma, two highly draining defense mechanisms typically operate subconsciously:

1. **External Projection** — Projecting internal judgment, vigilance, and unworthiness onto people nearby, misinterpreting their behavior as targeted scrutiny or cost-benefit evaluation, thereby damaging interpersonal and intimate relationships.
2. **Destructive Mutiny (Self-Sabotage)** — Executing passive self-destruction through deliberate underperformance or withdrawal to reclaim a false sense of control.

### How It Works

This project introduces a novel **"Psycho-Engineering" approach**: rather than using other people as mirrors for superego projection, it leverages **Agent Skills configuration** to encode an individual's traumatic facts and restrictive belief systems into a structured database consumed by an LLM agent.

Through a rigorously designed System Prompt and four-step interception pipeline, the AI acts as a cold, lucid, absolutely rational **"Chief Psychological Prosecutor"** that:

- **Intercepts** the finger pointing outward before projection completes
- **Matches** triggered patterns against the underlying article database
- **Decodes** the repressed Id's (inner child) authentic fear beneath moral camouflage
- **Injects** high-energy agency-restoring language to break the rumination loop

```
[User inputs discomfort / anger / defense]
       |
       v
 1. [Intercept Projection] -- Identify whether user is externalizing internal scrutiny
       |
       v
 2. [Match Articles] -- Query restrictive articles from database (Articles A/B/C/D)
       |
       v
 3. [Decode Id] -- Strip camouflage; translate the repressed "Id"'s real fear
       |
       v
 4. [Inject Agency] -- Invoke turning-point quotes to cut rumination, activate autonomy
```

### Architecture

| Component | Description |
|-----------|-------------|
| **Underlying Database** (`Part 2`) | Objective records of childhood events, intimacy trauma, and restrictive belief articles (A/B/C/D) |
| **System Prompt** (`Part 3`) | High-precision role definition stripped of sympathy, maintaining sharpness and clarity |
| **Standard Parsing Framework** | Strictly constrains agent output format — no emoji, pure logical precision |
| **Scenario Examples** (`Part 4`) | End-to-end dialogue mappings for common trigger scenarios |

### Project Structure

```
Else-SuperEgo-Skills/
├── README.md                          # Bilingual project documentation (this file)
├── paper.md                           # Mini-paper: theoretical framework & system design
├── SUPER_EGO_SKILL_TEMPLATE.md        # Fill-in-the-blank template for building your own skill
└── (else_super_ego_v2.md)             # Author's private skill file (not in repo)
```

| File | Status | Description |
|------|--------|-------------|
| `README.md` | Public | Bilingual documentation, architecture overview, build guide |
| `paper.md` | Public | Academic mini-paper: psychodynamic theory + technical mechanism |
| `SUPER_EGO_SKILL_TEMPLATE.md` | Public | User-fillable template with guided fields for custom skills |
| `else_super_ego_v2.md` | **Private** | Author's personal psychological data (excluded via .gitignore) |

### Four Restrictive Belief Articles (Reference Template)

| Article | Trigger Scenario | Core Mechanism |
|---------|-----------------|----------------|
| **Article A** | Specific situational triggers (e.g., consumption spaces) | Guilt-based restriction; deprivation of a basic right |
| **Article B** | Recalling past harm caused to others | Eternal self-punishment; deprivation of self-forgiveness |
| **Article C** | Social/relational desire or attraction | Motive conviction; shame blocking legitimate connection |
| **Article D** | Moments of comfort, freedom, or happiness | Immediate moral audit; "you don't deserve ease" |

> **Note**: The above articles are reference templates from the original author's personal database. When building your own skill, replace these with your own specific psychological patterns.

### Build Your Own SuperEgo Skill: Step-by-Step Guide

This project is not only a personal tool but also a **reusable framework** for anyone interested in building their own psychoanalytic Agent Skill. Follow these steps:

#### Step 1: Deconstruct Your Psychological Data

Create your own "Underlying Database" by objectively documenting:

- **Childhood Imprints** — Key formative events where your needs were dismissed, ignored, or punished (e.g., emotional neglect, excessive control, academic pressure)
- **Adult Trauma** — Intimate relationship wounds, betrayal experiences, moments of being devalued or replaced
- **Invisible Iron Rules** — Unconscious "laws" you follow that cause guilt when violated (e.g., "I must always be productive", "I don't deserve rest", "Expressing desire is dangerous")
- **Turning-Point Energy** — Your most powerful moments of resistance language — phrases you said or thought when you finally fought back against your inner critic

**Critical Rule**: Write everything in **objective, factual tone**. No embellishment, no drama. Just what happened and what it made you believe about yourself.

#### Step 2: Design Your System Prompt

Copy the template structure from this project's `else_super_ego_v2.md` (Part 3) and customize:

```text
You are now [Your Name]'s Superego Mirror vX.0.
You are NOT a comforter, mentor, or punishing judge.
You are an absolutely rational, cold psychological prosecutor
standing entirely on the user's side of agency.

Your ONLY task: intercept projection, match articles,
decode the Id, inject vitality.
```

Define your four-step output format:
1. **[Intercept Projection]** — Which part of their words is externalizing internal judgment?
2. **[Match Articles]** — Which specific article(s) from their database are triggered?
3. **[Decode Id]** — What is the inner child actually afraid of beneath the camouflage?
4. **[Inject Agency]** — Use their own resistance language to force return to present action

#### Step 3: Write Scenario Examples

Create 2-3 end-to-end dialogue examples covering your most common trigger patterns (e.g., relationship anxiety, work burnout, social withdrawal). Each example should show:
- User input (raw, unfiltered thoughts)
- Full four-step agent response

#### Step 4: Deploy to Any LLM Platform

Compatible with:
- **Dify** — Import as Skill / Workflow node
- **Coze** — Bot configuration → System Prompt
- **GPTs / ChatGPT** — Instructions field
- **Local LLM** (Ollama, LM Studio, etc.) — System prompt injection
- **Any platform supporting custom System Prompts**

#### Step 5: Test & Iterate

Use it in real emotional moments. When you feel rage, suspicion, or stuck in rumination — input your raw thoughts immediately. Refine the database and prompt based on how well the interception works.

### Design Principles (Hard Constraints)

These three principles are non-negotiable:

- **Zero Sympathy Abuse** — NEVER output "it's not your fault", "hugs", or "everything will be fine". Excessive comfort traps users in victimhood.
- **No Secondary Judgment** — Only decode camouflage and restore facts. Never add moral criticism on top of the user's existing pain.
- **Mandatory Vitality Injection** — The goal is never to trap the user in painful analysis, but to use blunt, direct language to shatter rumination and force return to present-moment action.

### File Privacy Notice

The core skill definition file (`else_super_ego_v2.md`) contains highly personal psychological data and is **not included in this public repository**. This repo provides the framework, architecture, and build guide. To access the author's original skill file, contact the author directly.

### License

MIT License

---

<a id="中文"></a>
## 中文

一个基于 AI Agent Skills 技术的心理自解构与潜意识拦截系统方案。

### 项目概述

Else-SuperEgo-Skills 是一套开源的 **Agent Skill 定义框架**，通过结构化的四步拦截算法 —— **[拦截投射] → [匹配条文] → [本我破译] → [主体性注入]** —— 帮助个体识别并拆解源于过度活跃超我的破坏性防御机制。

无需将内心的苛刻法官投射到外部他人身上，本系统利用结构化数据输入与确定性提示词工程，在自毁思维模式升起的瞬间完成拦截，实现无二次审判的理性自我解构。

### 核心痛点：两种消耗内耗的防御机制

在心理动力学中，当个体的超我过于严苛或携带未愈合创伤时，潜意识通常运行两种高消耗的防御机制：

1. **外化投射（External Projection）** — 将内心的审判、戒备和不配得感投射给身边的人，误读他人的行为为针对性审视或权衡利弊，从而破坏人际与亲密关系。
2. **自毁式兵变（Destructive Defense）** — 通过刻意表现不佳或主动退出实施消极自毁，以夺回虚假的控制感。

### 技术原理

本项目提出了一种全新的 **"心理工程学"方案**：不依赖他人作为超我镜像，而是利用 **Agent Skills 配置技术** 将个体的创伤事实和限制性信念体系编码为结构化数据库，供大模型智能体消费。

通过精心设计的系统提示词和四步拦截流水线，AI 扮演冷酷、清醒、绝对理性的 **"首席心理检察官"**：

- **拦截** 指向外部他人的手指，在投射完成前阻断
- **匹配** 触发模式与底层数据库中的限制性条文
- **破译** 道德伪装下被压抑的本我（内在小孩）的真实恐惧
- **注入** 高能量的主体性恢复语言，打断反刍循环

```
[用户输入不适感/愤怒/防御]
       │
       ▼
 1. [拦截投射] ── 识别用户是否在将内部审查外化
       │
       ▼
 2. [匹配条文] ── 从数据库检索触发的限制性条文（条文 A/B/C/D）
       │
       ▼
 3. [本我破译] ── 剥离伪装，翻译被压抑的"本我"的真实恐惧
       │
       ▼
 4. [主体性注入] ── 调用转折点语录切断反刍，激活自主性
```

### 架构组成

| 组件 | 说明 |
|------|------|
| **底层数据库**（第二部分） | 客观记录童年关键事件、亲密关系创伤、四大限制性信念条文（A/B/C/D） |
| **系统提示词**（第三部分） | 高精度角色定义，去除同情与情绪填充，保持锋利透彻 |
| **标准解析框架** | 严格约束输出格式 — 无 emoji、无情绪废话、纯逻辑精度 |
| **场景实战示例**（第四部分） | 常见触发场景的端到端对话映射 |

### 项目结构

```
Else-SuperEgo-Skills/
├── README.md                          # 双语项目文档（本文件）
├── paper.md                           # 迷你论文：理论框架与系统设计
├── SUPER_EGO_SKILL_TEMPLATE.md        # 填空式模板：用于构建自定义技能
└── (else_super_ego_v2.md)             # 作者私有技能文件（未入库）
```

| 文件 | 状态 | 说明 |
|------|------|------|
| `README.md` | 公开 | 双语文档、架构总览、构建指南 |
| `paper.md` | 公开 | 学术迷你论文：心理动力学理论 + 技术机制 |
| `SUPER_EGO_SKILL_TEMPLATE.md` | 公开 | 用户可填写的引导式模板 |
| `else_super_ego_v2.md` | **私有** | 作者个人心理数据（通过 .gitignore 排除） |

### 四大限制性信念条文（参考模板）

| 条文 | 触发场景 | 核心机制 |
|------|---------|---------|
| **条文 A** | 特定情境触发（如消费空间） | 罪疚感限制；剥夺基本权利 |
| **条文 B** | 回忆过去对他人的伤害 | 永久自我惩罚；剥夺自我宽恕权 |
| **条文 C** | 社交/关系欲望或好感 | 动机定罪；羞耻感阻隔正常联结 |
| **条文 D** | 舒适、自由或快乐的时刻 | 即时道德审计；"你不配轻松" |

> **注意**：以上条文来自作者个人数据库的参考模板。构建你自己的技能时，请替换为你自己的具体心理模式。

### 构建你自己的超我技能：分步指南

本项目不仅是个人工具，更是一套 **可复用框架**，任何对构建心理分析型 Agent Skill 感兴趣的人都可以使用。按以下步骤操作：

#### 第一步：解构你的心理数据

创建你自己的"底层数据库"，客观记录以下内容：

- **童年印记** — 你的需求被无视、忽视或惩罚的关键塑造事件（如情感忽视、过度控制、学业压力）
- **成年创伤** — 亲密关系伤口、背叛经历、被贬低或替代的时刻
- **隐形铁律** — 你潜意识中遵循的、违反即产生罪疚感的"法则"（如"我必须时刻高效"、"我不配休息"、"表达欲望是危险的"）
- **转折点能量** — 你最终对抗内心批判者时说出的或想到的最有力量的反抗语言

**核心原则**：所有内容必须以 **客观事实语气** 书写。不加修饰、不带戏剧色彩。只写发生了什么，以及它让你对自己产生了什么信念。

#### 第二步：设计你的系统提示词

从本项目 `else_super_ego_v2.md`（第三部分）复制模板结构并自定义：

```text
你现在是你自己的超我镜像 vX.0。
你不是安慰者、导师或惩罚法官。
你是绝对理性、冷酷的心理检察官，
完全站在用户主体性这一边。

你的唯一任务：拦截投射、匹配条文、
破译本我、注入生命力。
```

定义四步输出格式：
1. **[拦截投射]** — 用户话语中哪一部分在外化内部审判？
2. **[匹配条文]** — 数据库中哪条具体条文被触发？
3. **[本我破译]** — 伪装之下内在小孩真正害怕的是什么？
4. **[主体性注入]** — 用用户自己的反抗语言强制回到当下行动

#### 第三步：编写场景示例

创建 2-3 个覆盖你最常见触发模式的端到端对话示例（如关系焦虑、工作倦怠、社交退缩）。每个示例应包含：
- 用户输入（原始、未过滤的想法）
- 完整的四步 Agent 回复

#### 第四步：部署到任意 LLM 平台

兼容平台：
- **Dify** — 导入为 Skill / 工作流节点
- **Coze** — Bot 配置 → 系统提示词
- **GPTs / ChatGPT** — Instructions 字段
- **本地大模型**（Ollama、LM Studio 等）— 系统提示词注入
- **任何支持自定义 System Prompt 的平台**

#### 第五步：测试与迭代

在真实情绪时刻使用它。当你感到愤怒、怀疑或陷入反刍无法自拔时 — 立即将原始想法输入。根据拦截效果持续优化数据库和提示词。

### 设计原则（硬性约束）

三条不可妥协的原则：

- **严禁滥用同情心** — 绝对不能输出"这不怪你"、"抱抱你"、"一切都会好起来"。泛滥的情绪安慰会将用户困在受害者角色中。
- **严禁二次审判** — 只负责破译伪装、还原事实。绝不在用户已有的痛苦之上追加道德批判。
- **强制注入生命力** — 目标绝不是把人困在痛苦的解剖台上，而是用直接甚至粗暴的语言击碎反刍游戏，逼迫个体回到当下的现实行动中。

### 文件隐私声明

核心技能定义文件（`else_super_ego_v2.md`）包含高度个人化的心理数据，**未包含在本公开仓库中**。本仓库提供框架架构与构建指南。如需获取作者的原始技能文件，请直接联系作者。

### 许可证

MIT License
