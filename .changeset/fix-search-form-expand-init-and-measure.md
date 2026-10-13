---
'@qin-ui/pro-components-core': patch
---

修复 `useSearchFormExpand` 的五项用户可见缺陷（四个 UI 包的 `SearchForm` 与 `ProTable` 搜索区共用本 Hook）：

- **初值自动展开后被打回折叠**：隐藏区有已填写条件时 Hook 会自动展开，此后任意一次 ≥2px 的重测（窗口 resize、字段增减、textarea 自适应）都会把 `expandStatus` 无条件写回 `expand` 配置初值，用户看到已填写的条件窗口一抖就收起。现「初值判定」结果一次性产出，后续重测保持当前展开状态（`isManualToggle` 手动锁定语义不变）。
- **旧的 IntersectionObserver 排队回调会断开新实例**：每次测量都 `disconnect()` 后重建 IO，先前入队的回调执行时操作的是闭包变量指向的**新**实例，导致新判定被断掉、自动展开丢失。现判定复用同一 IO 实例（仅补登记新元素），回调内断开的是自身实例，并以代际计数丢弃实例切换前入队的过期回调。
- **折叠态多显示行**：行元素「坐标链不可测」（隐藏、`display:contents`、跨 shadow/iframe 等）时此前被静默丢弃后继续测量，导致第 minExpandRows 行的边界取到更靠后的行，折叠高度偏大（实测多显示一行）。现任一元素坐标链不可测即整组放弃，折叠高度回退行高算术。
- **非 grid 布局下 `heightStyle` 为 `'0px'`**：`collapseHeight` 只在 grid 布局计算，inline 布局下保持初始值 `0`，直接消费该 Hook 的调用方会拿到 `heightStyle === '0px'`（四个适配层当前只在 grid 分支应用该样式，属潜在踩坑）。现 non-grid 或未启用折叠时 `currentHeight` 为 `'unset'`、`heightStyle` 为 `undefined`（**行为变更**：此前读到的 `0` / `'0px'` 变为 `'unset'` / `undefined`）。
- **`cleanupObservers()` 后永久失明**：调用后残留的 `observedFormEl` / `observedItemEls` 让后续测量认为容器与行元素「已观察」，既不再 `observe` 也不重建容器观察。现该函数复位全部观察与测量状态，随后的 `updateHeights()` 会重新建立容器与行元素观察。

验证：新增判别用例 `SE-12` ~ `SE-16`（回退任一修复即失败）；examples 提供 `core-audit-verification` 验证台供真实浏览器复核。

破坏性变更：无。
