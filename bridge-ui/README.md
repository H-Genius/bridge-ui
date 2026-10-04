# 舰桥 UI · 模板

一个**个人成长 / 人生管理**导向的舰桥式界面。
核心机制一句话：

> **你的数据 → 环境状态 → 画面氛围**

这不是 demo，是一个可以直接往下填的真工程。技术栈是主流的
**Vite + React 19 + TypeScript + Tailwind v4 + R3F**。

---

## 快速开始

```bash
npm install     # 装依赖（已装好的话可跳过）
npm run dev     # 开发服务器 → http://localhost:5173
npm run build   # 生产构建（同时做类型检查）
```

> ⚠️ 如果 `npm` 报「禁止运行脚本」，用 `npm.cmd` 代替 `npm`，
> 或者执行 `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`。

---

## 先理解三层架构（最重要）

```text
① core/     事实 → 心情     纯函数，没有 React、没有 DOM
② data/     事实本身         读写数据的唯一出口
③ 视觉层    心情 → 像素      组件 + 样式 + 3D
```

| 层 | 只干这个 | 绝不干这个 | 大白话 |
|---|---|---|---|
| **core** | 算「现在该是什么心情」 | 不存数据、不画界面 | 舰长的判断 |
| **data** | 存「有哪些目标、今天做了什么」 | 不算心情、不管显示 | 航海日志 |
| **视觉** | 把心情画出来 | 不碰数据、不做判断 | 仪表盘 |

**一条铁律**：`core/` 里**不许出现 React**。
因为它是纯函数——给同样的输入永远算出同样的结果，所以能单独测试。

---

## 目录结构

```text
src/
├── core/                  【纯逻辑】没有 React，可以单独测试
│   ├── ambience.ts        ★ 环境状态机 —— 整个应用的心脏
│   ├── scene.ts           ★★ 状态 → 视觉参数（你最常改这个文件）
│   └── derive.ts          各种推导（逾期数、进度、该联系谁）
│
├── data/                  【数据】只存事实
│   ├── types.ts           数据结构定义
│   ├── repo.ts            读写（唯一的出口）
│   └── seed.ts            首次运行的示例数据
│
├── state/
│   └── store.ts           全局状态（zustand）+ 模块注册表
│
├── scene3d/               【3D】悬窗
│   ├── bridge.ts          ★ 渲染桥：状态 → 3D 参数的翻译官
│   └── Starfield3D.tsx    R3F 场景（星海 / 行星 / 空间站）
│
├── shell/                 【外壳】舰桥的「船体」
│   ├── Window.tsx         悬窗
│   ├── TopBar.tsx         顶部状态条
│   ├── Console.tsx        底部控制台 + 九个导航
│   ├── PetTerminal.tsx    AI 副官（右下角）
│   ├── petContext.ts      ★ 副官的上下文构建器
│   └── useAmbienceVars.ts 把状态写进 CSS 变量的 hook
│
├── pages/                 【九个模块】
│   ├── index.tsx          ★ 模块注册表（加新模块改这里）
│   ├── CockpitPage.tsx    驾驶舱
│   ├── TodayPage.tsx      今日
│   └── ...                其余七个
│
├── components/            【零件】可复用的界面小块
│   ├── Panel.tsx          磨砂面板
│   ├── ProgressBar.tsx    进度条
│   └── GoalRing.tsx       环形进度
│
└── theme/
    └── globals.css        ★★ 设计变量（改这里换整套皮肤）
```

---

## 你要填的地方（按优先级）

### ① `core/scene.ts` —— 最常改的文件

想改观感？只改这张表。**不要动任何逻辑代码。**

```ts
calm: {
  label: '平稳航行',
  sky: ['#0a1420', '#0d1b2a', '#060a12'],  // 天空三色
  brightness: 1,                            // 整体亮度
  starSpeed: 1,                             // 3D 星星速度
  planet: 0,                                // 行星是否出现
  accent: '#4fc3f7',                        // 点缀色
  // ...
}
```

### ② `theme/globals.css` —— 设计变量

颜色、圆角、磨砂强度、过渡曲线都在这里。

```css
--blur: 10px;   /* ★ 薄玻璃 > 厚玻璃。20px 会把背景糊成浆 */
--ease: cubic-bezier(0.22, 1, 0.36, 1);  /* ★ 顺滑感的秘诀 */
```

### ③ `core/ambience.ts` —— 状态阈值

```ts
export const TUNING = {
  celebrateWindowMin: 15,      // 完成后的庆祝窗口
  warningOverdueThreshold: 5,  // 逾期几个算异常
  nightFrom: 1, nightTo: 5,    // 深夜时段
  busyEnterRatio: 0.5,         // 忙碌阈值（进入）
  busyExitRatio: 0.35,         // ★ 不同值 = 迟滞，防止状态抖动
}
```

### ④ `data/seed.ts` —— 换成你自己的数据

首次打开时看到什么，由这里决定。

### ⑤ 加一个新模块（三步）

1. `state/store.ts` 的 `NAV_ITEMS` 加名字
2. `pages/` 下建组件（参考 `TodayPage.tsx`）
3. `pages/index.tsx` 的 `PAGES` 表里注册

---

## 三条解耦铁律

### 铁律 1：`core/` 里没有 React

```ts
// ✅ 纯函数，可以在 node 里直接跑
export function deriveAmbience(input: AmbienceInput): Ambience { ... }

// ❌ 绝不在 core 里出现：
import { useState } from 'react'
```

### 铁律 2：组件不认识数据细节

```tsx
// ❌ 错误：组件自己去算业务
function Status({ actions }) {
  const overdue = actions.filter(a => !a.done && isPast(a.date)).length
}

// ✅ 正确：外面算好，组件只画
function Status({ overdue }: { overdue: number }) { ... }
```

> **大白话**：仪表盘不该自己去测油量，它只负责显示指针位置。

### 铁律 3：只有 `data/repo.ts` 碰存储

```ts
// ✅ 所有读写都走这一层
repo.toggleAction(id)

// ❌ 组件里不许出现
localStorage.getItem('goals')
```

**为什么？** 将来从 localStorage 换成 IndexedDB 或云同步，
**只改一个文件**，其他代码一行不用动。

---

## 3D 悬窗是怎么接的

```text
状态层说「cruising」
   ↓ scene3d/bridge.ts（翻译官）
3D 层听到「速度 2.4、星数 9000」
   ↓ Starfield3D.tsx
星星拉成星轨
```

**`bridge.ts` 是两边唯一的接头。** 为什么要它？

| 没有它 | 有它 |
|---|---|
| 改个阈值就要动 3D 代码 | 只改 `scene.ts` |
| 3D 出问题要怀疑状态算错 | 两边可独立验证 |

**R3F 的价值**：状态一变，`<Canvas>` 里的属性跟着变，场景自动更新。
你不需要写任何「同步逻辑」。

### 3D 的三个坑（都已在代码里规避）

| 坑 | 怎么躲的 |
|---|---|
| 画布落在带 `filter` 的祖先下 → 强制软件合成、掉帧 | `body` 刻意不加 `filter`，亮度由 3D 自己控制 |
| 卸载时不 dispose → 内存泄漏 | 每个组件都有 `useEffect` 清理 |
| pixelRatio 不设上限 → 4K 屏上爆 | `dpr={[1, 2]}` |

### 磨砂不模糊 3D

```text
① 3D 画布
② 静态渐变层 .scrim   ← 磨砂面板模糊的是这一层
③ 磨砂面板
```

直接模糊画布会让**每帧全屏采样**，是性能悬崖。
模糊静态层成本≈0，**视觉几乎无差**。

---

## AI 副官怎么升级

现在是**桌宠式**（只会说，不会动手）。升级路线：

| 步骤 | 做什么 |
|---|---|
| 1 | 桌宠式 + 带上下文 ← **现在这里** |
| 2 | 接真模型（改 `PetTerminal.tsx` 的 `reply()`） |
| 3 | 加工具：能替你改数据 |
| 4 | 闭环：副官操作 → 状态变 → 氛围变 |

⚠️ **API 密钥绝不能写在前端代码里**——前端代码是公开的。
正确做法：让用户自己在设置里填（存本地），或走自己的小后端中转。

---

## 常见问题

**Q：改了代码页面没变？**
Vite 有热更新，一般保存就生效。3D 部分如果没反应，硬刷新一下。

**Q：数据在哪？**
浏览器 localStorage，key 是 `bridge-ui:data`。
换设备用「系统」页的导出 / 导入。

**Q：怎么换配色？**
改 `theme/globals.css` 的 `@theme` 块，以及 `core/scene.ts` 里每个状态的 `accent`。

**Q：3D 太卡怎么办？**
在 `scene3d/bridge.ts` 里调小 `starCount`，或者把 `Starfield3D` 换成纯 CSS 星点
（`Window.tsx` 里已经留了降级路径）。

**Q：`npm run build` 报 chunk 太大？**
那是警告不是错误。`Starfield3D` 是懒加载的，已经做了代码分割，
首屏只有 ~258KB，3D 那 916KB 是打开时才加载。

---

## 技术栈

| 包 | 版本 | 用途 |
|---|---|---|
| vite | 8.x | 开发服务器 + 构建 |
| react | 19.x | 界面 |
| typescript | 6.x | 类型检查 |
| tailwindcss | 4.x | 样式（CSS-first 配置） |
| zustand | 5.x | 全局状态 |
| three + @react-three/fiber | 0.186 / 9.x | 3D 场景 |
| lucide-react | 1.x | 图标 |

---

## 下一步可以做的

- [ ] 把 `data/seed.ts` 换成你真实的记录
- [ ] 九个模块逐个填细（每个文件里都有 `★ 你要填的地方` 注释）
- [ ] 加数据录入界面（现在只能靠改 seed 或导入 JSON）
- [ ] 接真模型给 AI 副官
- [ ] 加图表（装 `recharts`，用动态 import 按需加载）
- [ ] 手机适配（现在是桌面优先，窄屏会收成单栏）
