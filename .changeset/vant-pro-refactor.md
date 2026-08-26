---
'@qin-ui/vant-pro': minor
---

### ⚠️ API 变更与适配说明 (Breaking Changes / API Notice)

- **FormPopup 管理与 open 签名增强**：
  - `useFormPopup` 的 `open` 方法签名更新为 `open(path: string, initialValue?: any, customProps?: Partial<PopupProps>, fieldId?: number | string)`；
  - 自动隔离各字段实例并支持在 `open` 时重置 `props` 为全局默认值 `DEFAULT_POPUP_PROPS`，杜绝跨字段属性污染；
  - 为支持多实例 Teleport 容器隔离，新增 `contentId` 与 `teleportTo` 唯一选择器。
- **ValueFormatter 旧值传递机制与只读快照契约**：
  - **按需注入旧值**：底层基于格式化函数的形参个数（`fn.length > 1`）决定是否读取旧值上下文。若转换逻辑需要使用旧值，请显式声明两个形参 `(val, oldVal) => ...`；
  - **只读快照副本**：传入的 `oldVal` 为只读快照副本，不得依赖原地修改写回；仅当 formatter 声明双形参时才克隆旧值，单参转换零开销。

### 🐞 缺陷修复与优化 (Bug Fixes & Improvements)

- **useForm (VP6)**：
  - 修复 `useForm(root: false)` 镜像 core 的 root 判定；
  - 移除显式 `disabled` prop，表单属性透传至底层 `VanForm`；
  - 支持未传 `form` 时的自动初始化与运行时 `:form` 替换动态代理（Proxy 三 trap + formKey）；
- **useFormPopup (V7, V8, V10, V11, V18)**：
  - 修复 `onFieldClick` 取值源为原始底层数据（`form.getFormData(path)`），避免 getter 展示格式化字符串导致 DatePicker / Picker 选择器初始选中错位；
  - 增加 `DEFAULT_POPUP_PROPS` 与 `resetProps()`，打开弹层自动重置并合并当前字段属性；
  - 引入 `activeFieldId` / `fieldUid` 实例匹配，彻底杜绝相同 path 字段在 Teleport 容器中的双渲染冲突；
  - 修复确认回调清空表单项的能力，移除 `if (popupVal !== undefined)` 守卫；
  - 移除 `as never` 类型断言；
- **BaseField (VP3, V9, A14, B4)**：
  - `getInitProps` 纯函数化，setup 顶层注入；
  - 修复 `signature` 组件取消事件映射为 `onClear`；
  - 未识别组件类型时输出明确警告并降级为原生元素渲染；
  - 落地 B4 旧值按需克隆契约；
- **ProComponentProvider (V2, VP5)**：
  - `componentVars` 与 `componentMap` 均改为 `computed` 响应式 provide，支持动态切换自定义组件映射。
