# 舰桥 UI · 架构说明

> 一份可执行的架构文档。每张图都是 **draw.io 图源**，复制到 [draw.io](https://app.diagrams.net) 或 VS Code 的 *Draw.io Integration* 插件即可编辑导出。

| 项目 | 值 |
|---|---|
| 技术栈 | Vite 8 · React 19 · TypeScript 6 · Tailwind v4 · R3F · Zustand |
| 源码规模 | 47 个文件 · 4422 行 |
| 依赖数 | 9 个（运行时） |
| 构建产物 | 首屏 ~275 KB · 3D 懒加载块 ~1031 KB |
| 存储 | localStorage（唯一出口 `data/repo.ts`） |
| 后端 | **已预留**，当前无请求（`services/` 层，未配则走 mock） |

---

## 1. 三层架构

一句话：**把「存数据」「做判断」「画界面」拆成三层，各管一摊。**

数据像水一样从上往下流，**反向依赖一律禁止**。

```drawio
<mxfile host="app.diagrams.net">
  <diagram name="三层架构" id="layer3">
    <mxGraphModel dx="900" dy="600" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="1100" pageHeight="760" math="0" shadow="0">
      <root>
        <mxCell id="0" />
        <mxCell id="1" parent="0" />

        <mxCell id="L1" value="① 数据层 · 事实&#10;━━━━━━━━━━━━━━━&#10;data/types.ts&#10;data/repo.ts  ← 唯一读写出口&#10;data/seed.ts" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#e3f2fd;strokeColor=#1565c0;fontSize=13;align=left;spacingLeft=14;verticalAlign=top;spacingTop=10;" vertex="1" parent="1">
          <mxGeometry x="40" y="480" width="300" height="130" as="geometry" />
        </mxCell>

        <mxCell id="L2" value="② 状态层 · 心情&#10;━━━━━━━━━━━━━━━&#10;core/ambience.ts   状态机（纯函数）&#10;core/scene.ts       状态 → 视觉参数&#10;core/derive.ts      派生计算&#10;state/store.ts      Zustand 全局状态" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#fff3e0;strokeColor=#e65100;strokeWidth=2;fontSize=13;align=left;spacingLeft=14;verticalAlign=top;spacingTop=10;" vertex="1" parent="1">
          <mxGeometry x="400" y="480" width="320" height="130" as="geometry" />
        </mxCell>

        <mxCell id="L3" value="③ 视觉层 · 画面&#10;━━━━━━━━━━━━━━━&#10;scene3d/   3D 悬窗（8 个模块）&#10;shell/     船体（顶栏/控制台/悬窗/AI 副官）&#10;pages/     九个模块页&#10;components/  可复用零件&#10;theme/     设计令牌" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#e8f5e9;strokeColor=#2e7d32;fontSize=13;align=left;spacingLeft=14;verticalAlign=top;spacingTop=10;" vertex="1" parent="1">
          <mxGeometry x="780" y="480" width="280" height="130" as="geometry" />
        </mxCell>

        <mxCell id="svc" value="services/ · 网络出口（预留）&#10;api.ts · ai.ts" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#f3e5f5;strokeColor=#6a1b9a;fontSize=12;dashed=1;" vertex="1" parent="1">
          <mxGeometry x="400" y="640" width="320" height="46" as="geometry" />
        </mxCell>

        <mxCell id="e1" value="推导（纯函数）" style="endArrow=block;html=1;strokeColor=#1565c0;strokeWidth=2;fontSize=12;fontColor=#1565c0;" edge="1" parent="1" source="L1" target="L2">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>
        <mxCell id="e2" value="渲染" style="endArrow=block;html=1;strokeColor=#e65100;strokeWidth=2;fontSize=12;fontColor=#e65100;" edge="1" parent="1" source="L2" target="L3">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>
        <mxCell id="e3" value="只读" style="endArrow=open;html=1;dashed=1;strokeColor=#6a1b9a;fontSize=11;fontColor=#6a1b9a;" edge="1" parent="1" source="svc" target="L3">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>

        <mxCell id="legend" value="★ 铁律：箭头只能向下（数据 → 心情 → 像素），反向依赖禁止。&#10;core/ 里不允许出现 React —— 所以状态机可以在 node 里直接跑测试。" style="text;html=1;fontSize=12;align=left;fontColor=#444;" vertex="1" parent="1">
          <mxGeometry x="40" y="700" width="700" height="40" as="geometry" />
        </mxCell>
      </root>
    </mxGraphModel>
  </diagram>
</mxfile>
```

### 为什么非要分三层

| 层 | 只干这个 | 绝不干这个 | 大白话 |
|---|---|---|---|
| **数据层** | 存**事实**（有哪些目标、今天做了什么） | 不算「心情」，不管怎么显示 | 航海日志 |
| **状态层** | 算**心情**（现在该显示什么氛围） | 不存数据，不画界面 | 舰长的判断 |
| **视觉层** | 画（把状态变成像素） | 不碰数据，不做判断 | 仪表盘 |

**好处**：想换背景风格 → 只改视觉层；想加数据源 → 只改数据层；想验证「什么时候该显示忙碌」→ 给状态层写单元测试，不用打开浏览器。

### 已验证的解耦铁律

| 铁律 | 检查方式 | 结果 |
|---|---|---|
| `core/` 里没有 React | 扫 `core/*.ts` 的 react import | ✅ 零命中 |
| 组件不碰 `localStorage` | 扫 `*.tsx` 的 localStorage | ✅ 零命中 |
| 只有 `data/repo.ts` 碰存储 | 扫 `localStorage.setItem` | ✅ 仅 repo.ts |

---

## 2. 核心链路：数据 → 心情 → 画面

这是整个应用的心脏。

```drawio
<mxfile host="app.diagrams.net">
  <diagram name="核心链路" id="pipeline">
    <mxGraphModel dx="900" dy="600" grid="1" gridSize="10" pageWidth="1200" pageHeight="820">
      <root>
        <mxCell id="0" />
        <mxCell id="1" parent="0" />

        <mxCell id="t1" value="你的数据&#10;目标 / 行动 / 项目 / 技能 / 人际" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#e3f2fd;strokeColor=#1565c0;fontSize=13;fontStyle=1" vertex="1" parent="1">
          <mxGeometry x="60" y="60" width="220" height="70" as="geometry" />
        </mxCell>
        <mxCell id="t2" value="deriveAmbience()&#10;core/ambience.ts&#10;纯函数 · 阈值判定" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#fff3e0;strokeColor=#e65100;strokeWidth=2;fontSize=13;fontStyle=1" vertex="1" parent="1">
          <mxGeometry x="60" y="200" width="220" height="80" as="geometry" />
        </mxCell>
        <mxCell id="t3" value="环境状态（5 态）&#10;平稳 / 高速 / 抵达 / 深夜 / 异常" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#fff3e0;strokeColor=#e65100;strokeWidth=2;fontSize=13;fontStyle=1" vertex="1" parent="1">
          <mxGeometry x="60" y="350" width="220" height="70" as="geometry" />
        </mxCell>
        <mxCell id="t4" value="SceneSpec&#10;core/scene.ts&#10;★★ 最常改的表 ★★" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#fce4ec;strokeColor=#c2185b;strokeWidth=2;fontSize=13;fontStyle=1" vertex="1" parent="1">
          <mxGeometry x="60" y="490" width="220" height="80" as="geometry" />
        </mxCell>

        <mxCell id="a1" value="StageParams&#10;scene3d/bridge.ts&#10;状态 → 3D 数字的翻译官" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#e8f5e9;strokeColor=#2e7d32;fontSize=12;align=left;spacingLeft=10" vertex="1" parent="1">
          <mxGeometry x="400" y="470" width="250" height="70" as="geometry" />
        </mxCell>
        <mxCell id="a2" value="CSS 变量&#10;shell/useAmbienceVars.ts&#10;--sky-a/b/c · --accent-dim …" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#e8f5e9;strokeColor=#2e7d32;fontSize=12;align=left;spacingLeft=10" vertex="1" parent="1">
          <mxGeometry x="400" y="580" width="250" height="70" as="geometry" />
        </mxCell>

        <mxCell id="b1" value="3D 悬窗&#10;scene3d/Starfield3D.tsx&#10;星云 · 星海 · 尘埃 · 天体 &#10;空间站 · 后处理" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#e8f5e9;strokeColor=#2e7d32;fontSize=12" vertex="1" parent="1">
          <mxGeometry x="740" y="440" width="220" height="90" as="geometry" />
        </mxCell>
        <mxCell id="b2" value="UI 层&#10;面板 · 控制台 · 顶栏&#10;（读完 CSS 变量自动生效）" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#e8f5e9;strokeColor=#2e7d32;fontSize=12" vertex="1" parent="1">
          <mxGeometry x="740" y="570" width="220" height="90" as="geometry" />
        </mxCell>

        <mxCell id="e1" style="endArrow=block;html=1;strokeWidth=2;strokeColor=#1565c0" edge="1" parent="1" source="t1" target="t2"><mxGeometry relative="1" as="geometry" /></mxCell>
        <mxCell id="e2" style="endArrow=block;html=1;strokeWidth=2;strokeColor=#e65100" edge="1" parent="1" source="t2" target="t3"><mxGeometry relative="1" as="geometry" /></mxCell>
        <mxCell id="e3" style="endArrow=block;html=1;strokeWidth=2;strokeColor=#c2185b" edge="1" parent="1" source="t3" target="t4"><mxGeometry relative="1" as="geometry" /></mxCell>
        <mxCell id="e4" style="endArrow=block;html=1;strokeWidth=2;strokeColor=#2e7d32" edge="1" parent="1" source="t4" target="a1"><mxGeometry relative="1" as="geometry" /></mxCell>
        <mxCell id="e5" style="endArrow=block;html=1;strokeWidth=2;strokeColor=#2e7d32" edge="1" parent="1" source="t4" target="a2"><mxGeometry relative="1" as="geometry" /></mxCell>
        <mxCell id="e6" style="endArrow=block;html=1;strokeWidth=1.5;strokeColor=#2e7d32" edge="1" parent="1" source="a1" target="b1"><mxGeometry relative="1" as="geometry" /></mxCell>
        <mxCell id="e7" style="endArrow=block;html=1;strokeWidth=1.5;strokeColor=#2e7d32;dashed=1" edge="1" parent="1" source="a2" target="b2"><mxGeometry relative="1" as="geometry" /></mxCell>

        <mxCell id="note" value="★ 只改 core/scene.ts 一张表，3D 和 UI 两边同时跟着变 ——&gt; 这是解耦的收益" style="text;html=1;fontSize=12;fontColor=#c2185b;fontStyle=1" vertex="1" parent="1">
          <mxGeometry x="60" y="660" width="600" height="30" as="geometry" />
        </mxCell>
      </root>
    </mxGraphModel>
  </diagram>
</mxfile>
```

### 五个状态的实际映射

| 你的情况 | 环境状态 | 悬窗变成 |
|---|---|---|
| 今天任务都做完了 | **抵达新区域** | 真实贴图的地球迎面而来 + 体积光背光 |
| 正在冲刺，一半没做完 | **高速航行** | 星星被拉成光条 + 空间站掠过 |
| 正常推进 | **平稳航行** | 安静的星海 + 月球缓慢运行 |
| 凌晨还在用 | **静谧深空** | 整体压暗，只剩微光 |
| 逾期任务堆太多 | **环境警示** | 空间站 + 橙调 + 呼吸脉冲 |

---

## 3. 目录结构与职责

```drawio
<mxfile host="app.diagrams.net">
  <diagram name="目录结构" id="dirs">
    <mxGraphModel dx="900" dy="600" grid="1" gridSize="10" pageWidth="1240" pageHeight="900">
      <root>
        <mxCell id="0" />
        <mxCell id="1" parent="0" />

        <mxCell id="core" value="core/ · 纯逻辑&#10;━━━━━━━━━━━&#10;ambience.ts   状态机&#10;scene.ts      状态→视觉参数表&#10;derive.ts     派生计算" style="rounded=0;whiteSpace=wrap;html=1;fillColor=#fff3e0;strokeColor=#e65100;strokeWidth=2;fontSize=12;align=left;spacingLeft=12;verticalAlign=top;spacingTop=8;" vertex="1" parent="1">
          <mxGeometry x="40" y="40" width="250" height="120" as="geometry" />
        </mxCell>
        <mxCell id="data" value="data/ · 事实&#10;━━━━━━━━━━━&#10;types.ts   数据结构&#10;repo.ts    唯一读写出口&#10;seed.ts    首次运行示例" style="rounded=0;whiteSpace=wrap;html=1;fillColor=#e3f2fd;strokeColor=#1565c0;fontSize=12;align=left;spacingLeft=12;verticalAlign=top;spacingTop=8;" vertex="1" parent="1">
          <mxGeometry x="40" y="190" width="250" height="120" as="geometry" />
        </mxCell>
        <mxCell id="state" value="state/&#10;━━━━━━━━━━━&#10;store.ts   Zustand&#10;NAV_ITEMS / ambience&#10;ambienceLocked" style="rounded=0;whiteSpace=wrap;html=1;fillColor=#e3f2fd;strokeColor=#1565c0;fontSize=12;align=left;spacingLeft=12;verticalAlign=top;spacingTop=8;" vertex="1" parent="1">
          <mxGeometry x="40" y="340" width="250" height="110" as="geometry" />
        </mxCell>

        <mxCell id="scene3d" value="scene3d/ · 3D 悬窗&#10;━━━━━━━━━━━━━━━&#10;Starfield3D.tsx   装配（76 行）&#10;layout.ts         构图系统&#10;bridge.ts         状态→3D 翻译&#10;objects/          10 个元素模块" style="rounded=0;whiteSpace=wrap;html=1;fillColor=#e8f5e9;strokeColor=#2e7d32;strokeWidth=2;fontSize=12;align=left;spacingLeft=12;verticalAlign=top;spacingTop=8;" vertex="1" parent="1">
          <mxGeometry x="360" y="40" width="290" height="140" as="geometry" />
        </mxCell>
        <mxCell id="shell" value="shell/ · 船体&#10;━━━━━━━━━━━━━━━&#10;Window.tsx       悬窗外壳+降级&#10;TopBar.tsx       顶部仪表带&#10;Console.tsx      底部控制台+九导航&#10;PetTerminal.tsx  AI 副官（可拖拽）&#10;useDraggablePanel.ts&#10;useAmbienceVars.ts&#10;petContext.ts" style="rounded=0;whiteSpace=wrap;html=1;fillColor=#e8f5e9;strokeColor=#2e7d32;strokeWidth=2;fontSize=12;align=left;spacingLeft=12;verticalAlign=top;spacingTop=8;" vertex="1" parent="1">
          <mxGeometry x="360" y="210" width="290" height="150" as="geometry" />
        </mxCell>
        <mxCell id="pages" value="pages/ · 九个模块&#10;━━━━━━━━━━━━━━━&#10;index.tsx   注册表 + ActivePage&#10;每个模块导出 { left, center, right }&#10;三个独立组件" style="rounded=0;whiteSpace=wrap;html=1;fillColor=#e8f5e9;strokeColor=#2e7d32;fontSize=12;align=left;spacingLeft=12;verticalAlign=top;spacingTop=8;" vertex="1" parent="1">
          <mxGeometry x="360" y="390" width="290" height="120" as="geometry" />
        </mxCell>

        <mxCell id="comp" value="components/ · 零件&#10;━━━━━━━━━━━&#10;Panel.tsx        磨砂面板&#10;GoalRing.tsx     环形进度&#10;ProgressBar.tsx  进度条" style="rounded=0;whiteSpace=wrap;html=1;fillColor=#f3e5f5;strokeColor=#6a1b9a;fontSize=12;align=left;spacingLeft=12;verticalAlign=top;spacingTop=8;" vertex="1" parent="1">
          <mxGeometry x="700" y="40" width="250" height="120" as="geometry" />
        </mxCell>
        <mxCell id="services" value="services/ · 网络（预留）&#10;━━━━━━━━━━━━━━━&#10;api.ts    请求骨架&#10;ai.ts     副官接模型&#10;index.ts  统一出口" style="rounded=0;whiteSpace=wrap;html=1;fillColor=#f3e5f5;strokeColor=#6a1b9a;strokeWidth=2;dashed=1;fontSize=12;align=left;spacingLeft=12;verticalAlign=top;spacingTop=8;" vertex="1" parent="1">
          <mxGeometry x="700" y="190" width="250" height="120" as="geometry" />
        </mxCell>
        <mxCell id="theme" value="theme/&#10;━━━━━━━━━━━&#10;globals.css&#10;设计令牌 + @utility 工具类" style="rounded=0;whiteSpace=wrap;html=1;fillColor=#f3e5f5;strokeColor=#6a1b9a;fontSize=12;align=left;spacingLeft=12;verticalAlign=top;spacingTop=8;" vertex="1" parent="1">
          <mxGeometry x="700" y="340" width="250" height="100" as="geometry" />
        </mxCell>
        <mxCell id="pub" value="public/textures/&#10;━━━━━━━━━━━&#10;地球蓝色大理石 4096×2048&#10;+法线 +高光 +夜景 +云层&#10;月球 1024×512" style="rounded=0;whiteSpace=wrap;html=1;fillColor=#fffde7;strokeColor=#f9a825;fontSize=12;align=left;spacingLeft=12;verticalAlign=top;spacingTop=8;" vertex="1" parent="1">
          <mxGeometry x="700" y="470" width="250" height="120" as="geometry" />
        </mxCell>

        <mxCell id="n1" value="数据流：data → core → state → 视觉层" style="text;html=1;fontSize=13;fontStyle=1;fontColor=#444" vertex="1" parent="1">
          <mxGeometry x="40" y="530" width="500" height="30" as="geometry" />
        </mxCell>
      </root>
    </mxGraphModel>
  </diagram>
</mxfile>
```

### 完整文件清单（47 个文件 · 4422 行）

| 目录 | 文件 | 行数 | 职责 |
|---|---|---|---|
| **core/** | ambience.ts | 90 | 状态机（纯函数） |
| | scene.ts | 194 | **状态→视觉参数表（最常改）** |
| | derive.ts | 43 | 派生计算 |
| **data/** | types.ts | 89 | 数据结构定义 |
| | repo.ts | 105 | **唯一读写出口** |
| | seed.ts | 58 | 首次运行的示例数据 |
| **state/** | store.ts | 147 | Zustand + 九个导航定义 |
| **scene3d/** | Starfield3D.tsx | 76 | 3D 场景装配 |
| | layout.ts | 85 | 构图系统 |
| | bridge.ts | 125 | 状态→3D 参数翻译 |
| | objects/ | 10 文件 | 星云/星海/尘埃/天体/空间站/光源/相机/后处理/贴图/常量 |
| **shell/** | Console.tsx | 192 | 底部控制台 + 九导航 |
| | TopBar.tsx | 185 | 顶部仪表带 |
| | PetTerminal.tsx | 250 | AI 副官（可拖拽、吸附两侧） |
| | useDraggablePanel.ts | 130 | 拖拽 hook |
| | Window.tsx | 45 | 悬窗外壳 + CSS 降级 |
| | useAmbienceVars.ts | 50 | 状态→CSS 变量 |
| | petContext.ts | 32 | 副官上下文构建 |
| **pages/** | 10 文件 | 966 | 九模块（每个导出三个组件） |
| **components/** | 3 文件 | 163 | Panel / GoalRing / ProgressBar |
| **services/** | 3 文件 | 189 | **网络出口（预留）** |
| **theme/** | globals.css | 290 | 设计令牌 + 工具类 |

---

## 4. 两个关键设计决策

### 4.1 为什么页面要拆成三个组件

早期写法是把页面当**普通函数**调用：

```ts
const { left, center, right } = render()   // ❌ 会崩
```

**这会违反 React Hooks 规则。** 页面内部的 `useBridge` 会挂到调用者（`ActivePage`）的 hook 链上。驾驶舱 4 个 hook、今日 2 个，**切换模块时 hook 数量变了**，React 立刻抛 `Rendered fewer hooks than expected`，整个应用白屏。

**正确做法**（当前实现）：每个模块导出三个真正的组件。

```ts
// pages/SkillsPage.tsx
export function SkillsPageLeft() { /* hooks 归自己管 */ }
export function SkillsPageCenter() { /* ... */ }
export function SkillsPageRight() { /* ... */ }
export const SkillsPage = { left: SkillsPageLeft, center: SkillsPageCenter, right: SkillsPageRight }
```

`ActivePage` 用 `<Left />` 真正挂载它们：

```tsx
{Left && <Left key={`${nav}-l`} />}
```

**加一个新模块只需三步**：`store.ts` 的 `NAV_ITEMS` 加名字 → `pages/` 建组件 → `pages/index.tsx` 注册。

### 4.2 为什么磨砂面板不模糊 3D 画布

```drawio
<mxfile host="app.diagrams.net">
  <diagram name="图层" id="zlayers">
    <mxGraphModel dx="900" dy="600" grid="1" gridSize="10" pageWidth="820" pageHeight="620">
      <root>
        <mxCell id="0" />
        <mxCell id="1" parent="0" />

        <mxCell id="z0" value="① sky-gradient（CSS 渐变，也是 3D 失败时的降级底色）&#10;z-0 · position:fixed · inset:0" style="rounded=0;whiteSpace=wrap;html=1;fillColor=#0d1b2a;fontColor=#ffffff;fontSize=12;align=left;spacingLeft=12" vertex="1" parent="1">
          <mxGeometry x="40" y="40" width="740" height="50" as="geometry" />
        </mxCell>
        <mxCell id="z1" value="② Canvas（R3F）+ 星云光斑层" style="rounded=0;whiteSpace=wrap;html=1;fillColor=#1565c0;fontColor=#ffffff;fontSize=12;align=left;spacingLeft=12" vertex="1" parent="1">
          <mxGeometry x="40" y="100" width="740" height="50" as="geometry" />
        </mxCell>
        <mxCell id="z2" value="③ scrim 静态渐变层 + scanlines + dust-field&#10;z-1 · ★ 磨砂面板模糊的是这一层，不是画布" style="rounded=0;whiteSpace=wrap;html=1;fillColor=#455a64;fontColor=#ffffff;fontSize=12;align=left;spacingLeft=12;fontStyle=1" vertex="1" parent="1">
          <mxGeometry x="40" y="160" width="740" height="50" as="geometry" />
        </mxCell>
        <mxCell id="z3" value="④ 舰桥 UI —— 磨砂面板 / 顶栏 / 控制台&#10;z-2 · backdrop-filter: blur(18px)" style="rounded=0;whiteSpace=wrap;html=1;fillColor=#e8f5e9;strokeColor=#2e7d32;strokeWidth=2;fontSize=12;align=left;spacingLeft=12;fontStyle=1" vertex="1" parent="1">
          <mxGeometry x="40" y="220" width="740" height="50" as="geometry" />
        </mxCell>
        <mxCell id="z4" value="⑤ AI 副官（fixed，可拖拽）&#10;z-20" style="rounded=0;whiteSpace=wrap;html=1;fillColor=#e8f5e9;strokeColor=#2e7d32;fontSize=12;align=left;spacingLeft=12" vertex="1" parent="1">
          <mxGeometry x="40" y="280" width="740" height="46" as="geometry" />
        </mxCell>

        <mxCell id="warn" value="⚠️ body 上刻意不加 filter —— 加了会让 canvas 走软件合成，3D 直接掉帧。&#10;⚠️ 直接模糊 3D 画布会让每帧全屏采样，是性能悬崖；模糊静态层成本≈0，视觉几乎无差。" style="text;html=1;fontSize=12;align=left;fontColor=#c62828;" vertex="1" parent="1">
          <mxGeometry x="40" y="350" width="740" height="50" as="geometry" />
        </mxCell>
      </root>
    </mxGraphModel>
  </diagram>
</mxfile>
```

---

## 5. 扩展点：留给你的实现空间

### 5.1 每个模块都有明确的填充位置

九个模块页顶部都有 `★ 你要填的地方` 注释，说明该模块还可以做什么。例如：

- `LearningPage.tsx` → 学习时长统计图（建议动态 `import` recharts）
- `SkillsPage.tsx` → 技能雷达图
- `PlanningPage.tsx` → 目标树（年→季→月→周）+ 拖拽调整
- `SystemPage.tsx` → 状态阈值可调、主题切换

### 5.2 三层各自的扩展方式

| 想做什么 | 改哪里 | 不用碰 |
|---|---|---|
| 换整套配色 | `theme/globals.css` 的 `@theme` 块 | 所有组件 |
| 改某个状态的氛围 | `core/scene.ts` 的 `SCENES` 表 | 3D 代码、UI |
| 调整 3D 元素位置/光照 | `scene3d/layout.ts` 的 `LAYOUT` 表 | 任何组件 |
| 调 3D 物理尺度 | `scene3d/objects/constants.ts` | 逻辑代码 |
| 换天体贴图 | `public/textures/` + `objects/bodyTextures.ts` | 场景装配 |
| 加数据字段 | `data/types.ts` + `seed.ts` | 视觉层 |
| 加导航模块 | `store.ts` `NAV_ITEMS` + `pages/` + `pages/index.tsx` | 其他模块 |
| 加自己的状态 | `core/ambience.ts` 加分支 + `core/scene.ts` 加一条 | 组件 |

### 5.3 数据层换存储

`data/repo.ts` 是**唯一**碰 `localStorage` 的文件。想换 IndexedDB / 云同步：

```ts
// 只改这一个文件的实现，其余代码一行不动
export const repo = {
  all(): AppData { /* 改这里 */ },
  save(data: AppData): void { /* 改这里 */ },
  // ...
}
```

---

## 6. 后端 API 预留（`services/` 层）

```drawio
<mxfile host="app.diagrams.net">
  <diagram name="服务层" id="services">
    <mxGraphModel dx="900" dy="600" grid="1" gridSize="10" pageWidth="1150" pageHeight="700">
      <root>
        <mxCell id="0" />
        <mxCell id="1" parent="0" />

        <mxCell id="ui" value="UI 组件&#10;PetTerminal.tsx&#10;（只调 askPet，不关心背后是什么）" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#e8f5e9;strokeColor=#2e7d32;fontSize=12" vertex="1" parent="1">
          <mxGeometry x="40" y="180" width="230" height="80" as="geometry" />
        </mxCell>

        <mxCell id="ai" value="services/ai.ts&#10;━━━━━━━━━━━━━━&#10;askPet(input): PetAnswer&#10;· 无后端 → mock 回退&#10;· 有后端 → POST /api/pet/chat&#10;&#10;类型：PetAskInput / PetAnswer" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#f3e5f5;strokeColor=#6a1b9a;strokeWidth=2;fontSize=12;align=left;spacingLeft=12;verticalAlign=top;spacingTop=8;" vertex="1" parent="1">
          <mxGeometry x="340" y="140" width="260" height="160" as="geometry" />
        </mxCell>

        <mxCell id="api" value="services/api.ts&#10;━━━━━━━━━━━━━━&#10;BASE_URL (VITE_API_BASE_URL)&#10;超时 20s · AbortController&#10;ApiError（含 status/body）&#10;hasBackend 标志&#10;http.get/post/put/delete" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#f3e5f5;strokeColor=#6a1b9a;strokeWidth=2;fontSize=12;align=left;spacingLeft=12;verticalAlign=top;spacingTop=8;" vertex="1" parent="1">
          <mxGeometry x="340" y="350" width="260" height="150" as="geometry" />
        </mxCell>

        <mxCell id="mock" value="本地 mock&#10;（.env.local 未配时）&#10;界面照常可用" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#fffde7;strokeColor=#f9a825;fontSize=12;dashed=1" vertex="1" parent="1">
          <mxGeometry x="680" y="180" width="200" height="80" as="geometry" />
        </mxCell>
        <mxCell id="be" value="你的后端&#10;（推荐：密钥留这里）&#10;POST /api/pet/chat" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#e3f2fd;strokeColor=#1565c0;fontSize=12" vertex="1" parent="1">
          <mxGeometry x="680" y="320" width="200" height="80" as="geometry" />
        </mxCell>

        <mxCell id="e1" style="endArrow=block;html=1;strokeWidth=2" edge="1" parent="1" source="ui" target="ai"><mxGeometry relative="1" as="geometry" /></mxCell>
        <mxCell id="e2" style="endArrow=block;html=1;strokeWidth=2" edge="1" parent="1" source="ai" target="api"><mxGeometry relative="1" as="geometry" /></mxCell>
        <mxCell id="e3" value="无后端" style="endArrow=block;html=1;dashed=1;fontSize=11;fontColor=#f9a825" edge="1" parent="1" source="api" target="mock"><mxGeometry relative="1" as="geometry" /></mxCell>
        <mxCell id="e4" value="有后端" style="endArrow=block;html=1;dashed=1;fontSize=11;fontColor=#1565c0" edge="1" parent="1" source="api" target="be"><mxGeometry relative="1" as="geometry" /></mxCell>

        <mxCell id="warn" value="⚠️ 前端代码是公开的：任何 API 密钥都不能写在 services/ 里。&#10;密钥必须留在你自己的后端，前端只调自己的接口。" style="text;html=1;fontSize=12;align=left;fontColor=#c62828;" vertex="1" parent="1">
          <mxGeometry x="40" y="540" width="700" height="50" as="geometry" />
        </mxCell>
      </root>
    </mxGraphModel>
  </diagram>
</mxfile>
```

### 现状

| 项 | 状态 |
|---|---|
| 请求骨架 | ✅ `api.ts` 完整（超时 / 取消 / 错误分类 / `hasBackend`） |
| AI 接口定义 | ✅ `ai.ts` 的 `askPet()` + 类型 |
| 环境变量 | ✅ `.env.example` + `vite-env.d.ts` 类型声明 |
| `.gitignore` | ✅ `.env`、`.env.*` 已忽略，只提交 `.env.example` |
| UI 接入 | ✅ `PetTerminal` 已改为 `await askPet()`，带 loading 与取消 |
| mock 回退 | ✅ 未配后端时界面完全可用 |
| 实际请求数 | **0**（做好接口等你的后端） |

### 怎么接通后端

```bash
cp .env.example .env.local
# 编辑 .env.local：
#   VITE_API_BASE_URL=https://your-backend.example.com
```

后端实现一个接口即可：

```
POST /api/pet/chat
请求：{ question: string, context: string, history: {role, content}[] }
响应：{ text: string }
```

前端**不用改任何代码**。

### 升级到「副官式」（能替你改数据）

`ai.ts` 末尾留了完整设计思路。核心是让模型返回**结构化意图**而非自然语言，前端执行前让用户确认：

```ts
type PetAction =
  | { type: 'toggleAction'; id: string }
  | { type: 'addAction'; title: string; date: string }
  | { type: 'setGoalProgress'; id: string; progress: number }
```

执行后调 `store.refresh()`，环境状态会自动跟着变 —— 形成闭环：**副官操作 → 数据变 → 状态变 → 悬窗氛围变**。

这样设计的原因：前端持有数据读写权（`data/repo.ts`），模型只产出「意图」。不让一个可能出错的模型直接持有数据操作权。

---

## 7. 验收清单

| 检查项 | 方法 | 结果 |
|---|---|---|
| 类型检查 | `npm run build`（含 `tsc -b`） | ✅ 0 错误 |
| 生产构建 | `npm run build` | ✅ 成功 |
| 代码检查 | `npm run lint` | ✅ 0 errors |
| 九模块可切换 | 浏览器逐个点击 | ✅ 9/9 |
| 3D 渲染 | 检查 canvas `data-engine` | ✅ three.js r186 |
| 贴图加载 | 网络面板 | ✅ 5/5 全部 200 |
| 状态锁定 | 切状态后监测 70s | ✅ 不被自动重算覆盖 |
| 副官对话 | 输入并发送 | ✅ 返回带上下文的回复 |
| 拖拽吸附 | 拖到中间，松手 | ✅ 吸附左右两侧，不居中 |
| 运行时错误 | 浏览器控制台 | ✅ 0 |

> `lint` 有 32 条 warning，全部是 React Compiler 对 R3F 命令式写法（`useFrame` 内修改 `geometry`、`Math.random` 初始化粒子）的假阳性，属该技术栈固有问题，非代码缺陷。

---

## 8. 已知限制

| 限制 | 说明 | 怎么解 |
|---|---|---|
| **气态巨行星无真实贴图** | threejs.org、jsdelivr、NASA、Wikimedia 都试过，只有 three.js 和 three-globe 可达，它们不提供木星。目前用程序化条带 + 大红斑 | 找到木星贴图放 `public/textures/jupiter.jpg`，改 `bodyTextures.ts` |
| 无移动端适配 | 桌面优先，窄屏会挤 | 非目标（见 BRIDGE-UI-PLAN.md §3） |
| 无多用户 / 云同步 | 数据存 localStorage | 换 `data/repo.ts` 实现 |
| AI 副官只说不做 | 桌宠式 | 见 §6 升级路线 |
| GodRays 观感未在真实 GPU 验证 | headless 用软件渲染，只能证明不崩溃 | 本地看，调 `objects/PostFX.tsx` |

---

## 9. 快速开始

```bash
cd bridge-ui
npm run dev        # → http://localhost:5173
```

VS Code 里：`Ctrl+Shift+B` 直接跑 dev，`F5` 带断点调试。

> Windows PowerShell 若报「禁止运行脚本」，执行
> `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` 一次即可（已在本机配好）。

---

## 附：draw.io 图源使用方式

文档中每个 ```drawio 代码块都是**完整的** `.drawio` 文件内容：

1. 复制代码块内容，存为 `xxx.drawio`
2. 用 [app.diagrams.net](https://app.diagrams.net) 打开，或 VS Code 装 *Draw.io Integration* 插件
3. 可直接编辑，导出 PNG / SVG

| 图 | 内容 |
|---|---|
| §1 | 三层架构与依赖方向 |
| §2 | 数据 → 心情 → 画面的完整链路 |
| §3 | 目录结构与职责划分 |
| §4.2 | 悬窗图层顺序（为什么磨砂不模糊 3D） |
| §6 | services 层的请求走向与 mock 回退 |
