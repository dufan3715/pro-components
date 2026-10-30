---
'@qin-ui/antd-vue-pro': patch
'@qin-ui/antdv-next-pro': patch
'@qin-ui/element-plus-pro': patch
'@qin-ui/vant-pro': patch
---

动态数组字段行改用数据行对象身份作为渲染 key：数组行增删 / 重排时，只要业务数据保留行对象引用，已有行与 FormItem 实例保持复用，仅新增行挂载、删除行卸载。重复行引用与重复 path 由兄弟列表做唯一性收敛；无法定位数据行的字段回退到字段对象身份，行为与之前一致。

同一行内 `component` / `picker` / `type` 变化时，仅重建 BaseField 控件子树，按新控件重新解析 Provider 默认值、locale placeholder 与 `modelProp`。
