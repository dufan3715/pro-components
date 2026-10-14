---
'@qin-ui/antd-vue-pro': patch
---

修复尺寸控件的高亮项与表格实际尺寸不一致，以及 Provider 注入尺寸后无法经控件改尺寸：

- **缺陷一（高亮不符）**：`SizeControl` 的高亮项此前只读本地 `v-model:size`，而 Provider 注入的尺寸不经过该模型 —— `<ProComponentProvider :componentVars="{ 'pro-table': { size: 'small' } }">` 下表格实际为紧凑尺寸，尺寸菜单却高亮「默认」。实测修复前：`ATable.size = 'small'`、`SizeControl.currentSize = 'large'`。
- **缺陷二（改不动）**：`effectiveSize` 此前为「显式绑定 ? 本地模型 : Provider 注入」，未显式绑定时 Provider 注入恒胜 —— 用户在尺寸菜单里选择其它尺寸会被注入值回压，点击等于无效。实测修复前：Provider 注入 `small` 后把模型写为 `middle`，表格仍为 `small`。
- **修复**：
  - `SizeControl` 新增 `effectiveSize` 入参（仅用于高亮），高亮顺序为「表格有效尺寸 > 本地绑定 > 宿主 ConfigProvider 的 componentSize」；`ProTable` 经 `:effective-size="effectiveSize"` 下发。
  - `effectiveSize` 的取值改为「显式绑定 > 控件回写 > Provider 注入」：本地模型一旦被写入即视为已选定，未显式绑定的 Provider 注入不再回压。
- **回归**：新增 `SC-A14`（三场景：Provider 注入时高亮跟随注入值、注入后经控件改尺寸时表格与高亮同步跟随回写值、显式绑定时高亮跟随显式值）。两处修改各自经突变验证：回退 `effectiveSize` 优先级 → `expected 'small' to be 'middle'`；回退 `SizeControl` 高亮入参 → `expected 'large' to be 'small'`。

破坏性变更：无（均为缺陷修复；`SizeControl` 为包内组件，新增入参可选）。
