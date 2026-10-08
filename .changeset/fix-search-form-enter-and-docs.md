---
'@qin-ui/antd-vue-pro': patch
'@qin-ui/antdv-next-pro': patch
---

修复搜索框回车不触发查询，并对齐 README 的公开契约描述：

- **搜索框内回车现在会触发查询（CR-050）**：`antd-vue-pro` 与 `antdv-next-pro` 的查询按钮此前是 `html-type="submit"` + `@click="onSearch"`，表单上**没有** `@submit` 监听 —— 宿主 Form 会对 submit 做 `preventDefault` 并 `emit('submit')`，但无人接听，导致**在搜索框内按回车不会查询**（`element-plus-pro` 已是「统一经表单 submit 触发」的语义，四包行为此前不一致）。现改为 `<ProForm @submit.prevent="onSearch">` 单一路径，并移除按钮的 `@click`（`type=submit` 的按钮在真实浏览器中会同时触发 click 与 submit，两者并存会造成**双触发**）。点击与回车现在都只触发一次查询。
- **README 公开契约描述修正（CR-038）**：`search` 的类型由宽松写法对齐为真实公开契约 `() => Promise<unknown>`（实现无入参）；`antd-vue-pro` 的 `tableContainer` 说明由「默认为 false」更正为「默认包裹内容，传 `false` 关闭包裹」（`DefaultTableContainer`）。
