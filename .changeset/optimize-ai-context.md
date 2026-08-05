---
'@qin-ui/antd-vue-pro': patch
'@qin-ui/antdv-next-pro': patch
'@qin-ui/element-plus-pro': patch
'@qin-ui/vant-pro': patch
---

## AI 上下文优化

### init-ai 脚本去重（根模板生成方案）

- 新增 `scripts/init-ai.template.mjs`：四包共享的 init-ai.mjs 模板，差异点用 `{{PKG_NAME}}`/`{{UI_LIB_DESC}}`/`{{DOC_URL}}`/`{{SKILL_DESC}}` 占位符
- 新增 `scripts/generate-init-ai.ts`：构建时按包配置替换占位符生成 `bin/init-ai.mjs`（仿 `generate-api-json.ts` 风格）
- 各包 `prebuild` 钩子追加 `&& tsx ../../scripts/generate-init-ai.ts <pkg>`
- `.gitignore` 追加 `packages/*/bin/init-ai.mjs`（与 `api.json` 一致作为构建产物）
- 根 `package.json` 新增 `generate:init-ai` 脚本

### AI-CONTEXT.md 激进精简 + 校对修正（4 包）

主载体 AGENTS.md（即 AI-CONTEXT.md）只保留规则/速查/反模式/导航，全量代码示例与详细 API 下沉到 skills 载体（README + api.json）。

**共性修正（源码核对 core useFormData/useFields）：**

- `setFormData` 补充函数式批量更新 `setFormData(prev => ({...prev, name:'新'}))`
- `getField` 补充查找函数形式 `getField(f => ...)` + `{ all: true }` 返回数组
- `setField` 补充函数式更新 `setField(path, prev => ({...}))` + `{ all: true }` 批量
- `deleteField/appendField/prependField/getParentField` 补充 `{ all: true }`
- `appendField/prependField` 补 `undefined` 末尾/开头 + 数组入参
- `valueFormatter` 时机修正：实际在 computed setter 中、setFormData 写入前执行；注明函数形态仅 set 方向生效

**antd-vue-pro / antdv-next-pro 专有修正：**

- INJECT_CONFIG `pageSizeOptions:['10'..'100']` 伪代码 → 实际 `['10','20','30','40','50','100']`
- `expand` 补 `expandStatus: false`
- 确认 `labelAlign` 在 ant-design-vue v4 / antdv-next FormItem.props 中，保留在 FormItem 层

**element-plus-pro 专有修正：**

- INJECT_CONFIG autocomplete placeholder → '请输入'（误与 select/cascader 合并为 '请选择'）
- pro-table expand 补 `expandStatus: false`
- date-picker 子类型补全 `dates`/`months`/`years`/`datetimerange`
- ProTable props 补 `columns`/`data`/`pagination`
- Column 补 `key` 字段

### README.md 同步校对（4 包）

修正与 AI-CONTEXT 一致的 INJECT_CONFIG 数据错误、API 签名描述漏项、valueFormatter 时机/方向，确保 skills 载体内容准确。

### skills 标准结构重构

`.agents/skills/{pkg}.md` 扁平大文件 -> `.agents/skills/{pkg}/` 标准分层目录：

- `SKILL.md`：skills 入口（frontmatter + 速查 + 参考导航）
- `references/README.md`：完整使用文档
- `references/api.md`：结构化 API 元数据

同步修正四包 AI-CONTEXT.md / README.md / docs 中的旧路径引用。

### 安装方式修正

AI-CONTEXT.md 移除不必要的 `import 'xxx.css'` 和 `app.use()` 全量注册，改为按需引入（推荐）。

### 代码 bug 修复（vant-pro）

`GroupedFieldAttrs` 属性剥离名 `formItemContainer` -> `fieldContainer`，与 `Field` 类型定义一致。
原 bug：类型定义暴露 `fieldContainer`，但运行时剥离 `formItemContainer`，导致用户传 `fieldContainer` 会泄漏到内部控件 attrs。

### 文档与代码一致性核对

逐包源码核对 componentMap、INJECT_CONFIG、useForm/useTable 签名与返回成员、属性分层透传逻辑、valueFormatter 时机、Form 实例方法名等，修正 useForm 重载一签名（补 `root` 参数）。
