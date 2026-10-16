---
'@qin-ui/antd-vue-pro': patch
'@qin-ui/antdv-next-pro': patch
'@qin-ui/element-plus-pro': patch
'@qin-ui/vant-pro': patch
---

ProComponentProvider 注入面收敛：不可注入键在注入层静默剔除。

- **注入面边界由两处声明**：类型面在 `RequiredComponentVars` 内直接剔除（`Omit<TableProps, 'loading' | 'columns' | 'dataSource'>`、`Omit<ProFormProps, 'form' | 'grid'>` 等），`ComponentVars` 仍为 `Partial<RequiredComponentVars>`；运行期清单直接声明在 `INJECT_CONFIG` 各项的 `ignoreProps`（普通数组），驱动注入层剔除（剔除经 core 的 `omit` 执行，原适配层局部实现 `omitIgnoredProps` 移除）。两处由契约用例分别锁定（类型面文本 + 项内清单文本），行为用例覆盖剔除与静默。
  不可注入键：`antd-vue-pro` / `antdv-next-pro` 的 `pro-table` → `loading` / `columns` / `dataSource`；`element-plus-pro` 的 `pro-table` → `data`（类型面），运行期清单另含 `loading` / `columns`（二者非其类型面成员，此前被静默忽略，现同样剔除）；四包 `pro-form` → `form`。
- **消费侧防御代码删除**：`antd-vue-pro` / `antdv-next-pro` 的 `ProTable` 不再自建 `TABLE_LEVEL_PROP_KEYS` 做过滤（注入层已保证不出现这些键）；`element-plus-pro` / `vant-pro` 的既有取值路径不变。
- **静默剔除（新增行为）**：Provider 收到不可注入键时在注入层直接剔除，不输出告警——类型面已将这些键排除在 `componentVars` 之外，仅 JS / `as any` 传参可能触达，宁缺勿扰。
- **回归**：`antdv-next` `PT-A39`、`antd` `PT-A38`、`element` `PT-A35`、`vant` `VP-PC4` 分别以注入面探针（直接 `inject` 注入配置）锁定「键已静默剔除 + 其余键照常下发 + 不产生告警」，并锁定运行期变更路径；四包 `comment-conventions` 的 Provider 边界用例改为分别锁定类型面剔除文本与项内清单文本（`DOC-04` / `DOC-05`）。

**注意（契约收紧，element / vant）**：`componentVars['pro-table'].data`（element）与 `componentVars['pro-form'].form`（vant）由「可配置但被运行时静默忽略」改为「编译期不可配置 + 传入即静默剔除」；element 的 `columns` / `loading` 不在其类型面内，改为「传入即在注入层静默剔除」。如项目配置中存在这两项，请删除：数据源请改传 `:table` 实例（`useTable`）或显式 `:data`，表单实例请显式传 `:form`。`antd-vue-pro` / `antdv-next-pro` 的三键在上一个 changeset 中已收紧，本次仅补齐注入层剔除。

破坏性变更：无（类型面为收紧误导性配置面；注入层剔除为静默行为，不影响运行时结果）。
