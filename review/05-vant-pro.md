# packages/vant-pro 修改清单（734e3c0 → 当前）

> 复核快照：起始 `HEAD=74030da`，复核过程中并行工作流提交了 `e73293a`（仅 docs/测试/config，无 src 变更），最终以 `HEAD=e73293a` 重新抓取全量 diff；两版 diff 差异仅为本报告覆盖的 AI 上下文文档与守卫用例。
> 复核方式：逐行读当前文件 + 逐提交 `git show` 读意图 + 8 条仓外探针（`/tmp/change-review/probe/`，只写 /tmp）实证。
> 未修改仓库任何文件（`git status --porcelain -- packages/vant-pro` 为空；门禁构建仅重写 gitignore 覆盖的 `es/`、`api.json`、`bin/init-ai.mjs`）。

## 概览

- **提交数**：19（`git log --oneline 734e3c0..HEAD -- packages/vant-pro | wc -l`）
- **文件数**：32 changed, 1550 insertions(+), 199 deletions(−)；其中 `src/` 15 个、`__tests__/` 12 个、其余 5 个为 package/tsconfig/vitest/README/AI-CONTEXT
- **用例数**：**55 → 90**（spec 文件 10 → 15；grep `it(`/`test(` 计数与 vitest 报告一致）
- **门禁结果**：`npx vitest run` 90/90 通过（exit 0）；`npx vue-tsc --noEmit` 0 错误（exit 0）；`pnpm --filter "@qin-ui/vant-pro" build` 成功（exit 0）；附加核验 `npx eslint src __tests__` 0 error（187 warning）、`node scripts/check-test-ids.mjs` ✓ 无重号
- **复核结论分布**：21 条修改点中 ✅ 13 条、⚠️ 6 条、❌ 2 条（详见各条目「复核结论」；另见「遗留与建议」3 条 pre-existing 残留）

## 修改点

### 1. 弹层与内联分支统一为「控件侧取值」，与 confirm 写回构成对称往返

- **位置**：`packages/vant-pro/src/components/form/components/BaseField/index.vue:287-297`（`onFieldClick` 的 `open(props.path, value.value, …)`）；`packages/vant-pro/src/components/form/hooks/useFormPopup.ts:162-166`（`open` 的 `@param initialValue` 文案）
- **修改点**：`open(path, form?.getFormData?.(props.path), …)` → `open(path, value.value, …)`。`value` 的 getter 已应用 `valueFormatter.get`（`BaseField/index.vue:91-102`），confirm 分支经 `value.value = popupFieldValue` 走 setter 应用 `valueFormatter.set`（`:206-222`），两侧构成 get→set 对称往返。同步把 `open` 的 `@param` 从「弹层初始值（原始数据）」改为「弹层初始值，取控件侧取值（已应用 valueFormatter.get）」。
- **解决的问题**：CR-055（**行为变更**）。此前弹层收 `formData` 原始数据、内联收控件侧取值，数组模型控件（`tags`/`picker`/`date-picker`）在弹层内状态错乱（`values.map is not a function`）。
- **影响**：运行时行为变更（仅影响配置了 `valueFormatter.get` 的 popup 字段）；公开 API 签名不变；类型契约不变；无性能影响。**需要 Changeset**：`.changeset/fix-vant-popup-semantics.md`（`minor`）已写明「⚠️ 升级影响」小节，逐字说明了两分支取值差异与「未配置 valueFormatter 的字段行为不变」——需求已满足。
- **证据**：`VP-V7 [判别]`（`BaseField.spec.ts:270-325`，断言弹层初值 `['a','b']` 而非原始串 `'a,b'`，并断言 confirm 后回写 `'a,b,c'`）；提交 `46d2fef`。
- **复核结论**：✅ 无误（语义只出现在 `onFieldClick` 一处，无第二处 `getFormData` 直取残留）。

### 2. 抽离 `dispatchListeners`，覆盖 `onUpdateValue` / confirm / cancel

- **位置**：`packages/vant-pro/src/components/form/utils/listeners.ts:1-28`（新增）；调用点 `BaseField/index.vue:125`（onUpdateValue）、`:221`（confirm）、`:225`（cancel）
- **修改点**：三处各自的「函数直调 / 数组 forEach」内联分支 → 统一 `dispatchListeners(listener, ...args)`：函数直调、数组按序逐个调用（并跳过非函数项）、其余形态不调用。
- **解决的问题**：CR-056。Provider `componentVars` 与字段配置声明同名监听时 `mergeProps` 会合并为数组，此前 confirm/cancel 直接调用抛 `confirmEvent is not a function`，且两侧回调被静默丢弃（弹层已关、值已写）。
- **影响**：运行时行为修复；`utils/listeners.ts` 不在包公开导出面（`src/index.ts` 未导出 utils），非公开 API；无类型契约变更；无需独立 Changeset（并入 #1 的 changeset 条目）。
- **证据**：`VP-B8 [判别]`（`BaseField.spec.ts:823-877`，断言派发顺序 `provider-update, field-update, provider-confirm, field-confirm` 且不抛错）；提交 `46d2fef`。
- **复核结论**：⚠️ 建议改进——契约第 3 条「其余忽略」分支（传入 string/object 等非函数非数组）**无用例覆盖**，建议补 1 条（`dispatchListeners('x' as any)` / `dispatchListeners({} as any)` 不抛错且不调用）。

### 3. 字段卸载时按 `activeFieldId === fieldUid` 关闭自属弹层

- **位置**：`packages/vant-pro/src/components/form/components/BaseField/index.vue:299-305`
- **修改点**：新增 `onBeforeUnmount` 钩子 → `if (popup?.activeFieldId?.value === fieldUid) popup.close()`。归属判定用组件实例 uid（`:130` `getCurrentInstance()!.uid`，开弹层时写入 `:296`）。
- **解决的问题**：CR-057。字段在弹层打开期间被 `setField(path,{hidden:true})` 隐藏或被删除时，弹层与遮罩残留为空白浮层（隐藏键在字段层被剥离，隐藏/删除都表现为卸载）。
- **影响**：运行时行为修复；无 API/类型变更；不影响他字段弹层（归属不等则不关闭）。
- **证据**：`VP-B7 [判别]`（`BaseField.spec.ts:764-818`，隐藏分支断言 `visible=false` + `activeFieldId=undefined` + VanPopup `show=false`；删除分支先验证另一字段仍可正常开启，再删除并断言关闭）；`VP-V14`（归属 uid 恒等）；提交 `46d2fef`。
- **复核结论**：✅ 无误（判定条件是 `===` 严格恒等，不存在误关他字段弹层的路径）。

### 4. Field 层专有键不再降级为内层控件 DOM 属性

- **位置**：`packages/vant-pro/src/components/form/components/BaseField/index.vue:169-171`（`getControlPropsKeys`）、`:241-255`（剔除循环）
- **修改点**：新增「保留集 = `uiFieldPropsKeys`（`Object.keys(VanField.props)`，`:64`）∩ 内层控件声明的 props」判定，命中且不在保留集时从 `bindAttrs` 删除（`type`/`name` 例外）。`fieldAttrs` 的既有白名单下发（`:230-239`）不变，外层 `van-field` 仍拿到 `label`/`rules`。
- **解决的问题**：CR-058。`label`/`rules`/`disabled` 等先前作为普通属性透传内层控件，`rules` 对象被序列化成 `[object Object]` 落到 DOM。
- **影响**：运行时行为修复；无 API 变更；无需独立 Changeset。
- **证据**：`BF-09 [判别]`（`BaseField.spec.ts:704-759`：picker 根节点无 `label`/`rules`/`disabled`；stepper 的 `placeholder`/`max`/`disabled` 仍以 prop 保留）；提交 `46d2fef`。
- **复核结论**：⚠️ 建议改进（3 处，均经仓外探针实证）：
  1. **数组式 props 声明会被误判为空集**：`getControlPropsKeys` 用 `Object.keys(component?.props || {})`，而 Vue 不会把数组式 `props: ['disabled']` 归一化到组件定义上（探针实测 `Object.keys= ["0"]`，SSR 渲染后仍为 `["0"]`）。故声明为数组式的自定义控件会**丢掉自己声明的 Field 层同名键**：探针 P-03 中 `props: ['modelValue','disabled','placeholder']` 的组件最终只收到 `{modelValue:2}`，`disabled`/`placeholder` 被删；对象式同组件（P-04）正常收到三者。建议改为 `Array.isArray(component.props) ? component.props : Object.keys(component.props || {})`，并补一条「数组式 props 控件保留声明键」用例。
  2. **原生元素回退路径被过度剔除**：`component` 为未注册字符串时 `is.value` 仍是字符串、`component.props` 不存在 → 保留集为空 → `placeholder`/`disabled` 一并被删。探针 P-07 实测 `component:'input'` 渲染为 `<input type="tel" modelvalue="abc">`，**`placeholder="请输入关键字"` 与 `disabled` 均丢失**（`type` 因例外保留），而 734e3c0 基线无剔除循环（`git show 734e3c0:…/BaseField/index.vue | grep -c controlPropsKeys` = 0）→ 属本批引入的回退路径行为回归；而 `src/index.ts:20` 的公开 JSDoc 示例正是 `component: 'input'`。建议在解析结果为字符串（原生元素）时跳过剔除，或至少对原生元素保留 DOM 合法属性。
  3. **`type` 例外与契约口径不符**：剔除循环硬编码 `key !== 'type' && key !== 'name'`，故 `type` 仍会泄漏——探针 P-05 实测 popup picker 字段带 `type:'tel'` 时渲染出 `<div class="van-picker" type="tel">`。`name` 例外实际惰性（`useGroupFieldAttrs.ts:25` 已把 `name` 从 `componentProps` 剥离，故 `bindAttrs` 通常不含 `name`）。建议把例外收窄为「仅 `component === 'field'` 分支保留 `type`/`name`」，或把例外写进代码注释（现注释只说「内层控件未声明的 Field 层键剔除」，未提例外）。

### 5. `updateProps` 持久化：`baseProps` / `openProps` / `props` 三层

- **位置**：`packages/vant-pro/src/components/form/hooks/useFormPopup.ts:127-136`（三层定义）、`:138-146`（`syncProps`）、`:148-160`（`resetProps`）、`:162-186`（`open`）、`:197-201`（`updateProps`）
- **修改点**：`open()` 不再调用 `resetProps()`（旧的「先重置为默认再合并 customProps」）→ 清空 `openProps` 后仅合并本次 `customProps`；`updateProps` 写 `baseProps` 并 `syncProps()`；`resetProps` 只重置 `baseProps` 并清空单次覆盖。`syncProps` 先删除三层皆无的键再 `Object.assign(props, baseProps, openProps)`，**`props` 对象标识稳定**（同一 reactive 对象原地增删）。
- **解决的问题**：CR-059。`updateProps` 写入的属性会被下一次 `open()` 重置，无法做全局弹层默认配置。
- **影响**：运行时行为修复（`props` 的公开读取面与对象标识不变，故非 breaking——基线 `open()` 本就会重置 `props`，直接改写 `props` 也不会跨 open 存活）；JSDoc 同步为「基础属性/单次覆盖」行为陈述（`:43-57`、`:197`）；无类型契约变更。
- **证据**：`POP-01`（`useFormPopup.spec.ts:223-252`，覆盖 `updateProps→open` 保留、`customProps` 单次生效、再次 open 回落持久值、`resetProps` 后回默认）；`VP-V16`（跨字段不串属性）；提交 `46d2fef`。
- **复核结论**：✅ 无误（`syncProps` 的「先删后并」保证了 `resetProps` 后不残留 `closeOnClickOverlay` 等非默认键，POP-01 末段已判别）。

### 6. `componentClass/componentStyle` 与 `fieldClass/fieldStyle` 落点修正

- **位置**：`packages/vant-pro/src/components/form/components/BaseField/index.vue:196`（折叠为 `{class, style}`）、`:201`（从透传属性中剥离原名）、`:377-378`（`component==='field'` 分支补绑 `fieldAttrs.class/style`）
- **修改点**：`componentClass`/`componentStyle` 不再作为普通属性透传，而是在合并阶段折叠为内层组件的 `class`/`style` 并剥离原始键；`component: 'field'` 分支（外层包装与内层组件合一）补绑字段层样式，与 VanField 包装分支一致。
- **解决的问题**：字段样式类名/内联样式不生效且污染 DOM（`componentclass="[object Object]"`）。
- **影响**：运行时行为修复；无 breaking（原「样式被忽略」无合理依赖）；Changeset `.changeset/fix-vant-field-class-style.md`（patch）已写明。
- **证据**：`BF-06`（内层自定义组件根节点获得 `custom-cls` 且无 `componentclass`/`componentstyle` DOM 属性）、`BF-07`（`component:'field'` 时 VanField 根节点获得 `fieldClass`/`fieldStyle`）、`BF-08`（四类 class/style 各归其层、互不串层）；提交 `3bb3303`。
- **复核结论**：✅ 无误（`mergeProps` 对 `class` 相同值短路、对 `style` 归一为空对象，实测无空 `style` 属性落地，探针 P-03/P-04 的根节点 attributes 无残留）。

### 7. `onFieldClick` 的禁用判定改读 Field 层属性

- **位置**：`packages/vant-pro/src/components/form/components/BaseField/index.vue:287-289`
- **修改点**：`const { disabled, readonly } = groupedAttrs.value.attrs` → `…fieldAttrs`。被点击的是外层只读展示 `van-field`，故判定应取 Field 层视图（含 `effectiveDisabled` 与 Provider 注入的 `readonly`）。
- **解决的问题**：弹层字段的禁用/只读判定取错了层（`bindAttrs` 中 `readonly` 可能因控件不声明该 prop 而不存在）。
- **影响**：运行时行为收敛（更严格：Provider 注入 `readonly: true` 时不再打开弹层）；无 API/类型变更。
- **证据**：`BF-09`/`VP-B8` 间接覆盖；`VP-V7` 覆盖正常开启路径；提交 `46d2fef`。
- **复核结论**：✅ 无误（`readonly`/`disabled` 均在 `uiFieldPropsKeys` 白名单内，`fieldAttrs` 必然携带）。

### 8. ProForm 兜底表单实例提前到 setup 同步期创建

- **位置**：`packages/vant-pro/src/components/form/components/ProForm/index.vue:63-71`（`const fallbackForm = useForm(); const currentForm = computed(() => props.form ?? fallbackForm)`）
- **修改点**：`computed(() => props.form ?? (fallbackForm ??= useForm()))` 的惰性初始化 → setup 同步期 `const fallbackForm = useForm()`；JSDoc 由「惰性初始化」改为「回退内部表单实例」行为陈述。
- **解决的问题**：惰性初始化发生在 computed 求值期（非 setup），`useFormPopup(true)` 内 `getCurrentInstance()` 为空 → `provide()` 只能在 setup 内使用的告警、且弹层 id 退化为 `standalone-N`；同时消除「运行期 `:form` 置空」路径的重复初始化。
- **影响**：运行时行为修复；副作用是即使外部传入 `:form` 也会创建一份内部兜底表单（多一份响应式状态，未渲染、无渲染开销）；无 API/类型变更。
- **证据**：`VP-A2`（未传 form 自建）、`VP-B2`/`VP-B2b`（运行期置空回退）、`VP-V12`/`VP-V13`（容器 id 由 useId 派生、多实例互不重复）、`VP-V19`（`:form` 替换触发重挂载）；提交 `cc83f0b`。
- **复核结论**：✅ 无误（兜底实例 `props.form` 存在时不参与渲染，仅内存占用；`git diff` 未改变 `:key="formKey"` 契约）。

### 9. `fields` 含 null/原始值项不再崩溃

- **位置**：`packages/vant-pro/src/components/form/components/BaseFormItem/index.vue:22-23`（引入 `isObjectItem`）、`:41-47`（`validFields` 过滤）、`:82-83`（`setComponentRef` 非对象守卫）
- **修改点**：`f.filter(field => !toValue(field.hidden))` → `f.filter(field => isObjectItem(field) && !toValue((field as any).hidden))`；`setComponentRef` 增加 `if (!field || typeof field !== 'object') return`。
- **解决的问题**：`fields` 数组混入 `null`/原始值时读 `.hidden` 抛错、`toRaw` 对原始值抛 WeakMap 错误（core 统一 `isObjectItem`）。
- **影响**：健壮性修复；无 API 变更。
- **证据**：`BI-A15`（null/undefined 项）、`BI-A15b`（原始值项，`renderKey` 走非对象回退）；提交 `5a8a20d`。
- **复核结论**：✅ 无误（`isObjectItem` 经 `shared/core` 统一再导出，符合 AGENTS.md §1.3 导入契约）。

### 10. 字段渲染 key 改为「字段对象身份」，抽出共享 `utils/fieldKey.ts`

- **位置**：`packages/vant-pro/src/components/form/utils/fieldKey.ts:1-26`（新增，模块级 `WeakMap` + 自增种子）；`useGroupFieldAttrs.ts:30-37`（`renderKey: getFieldKey(field)`）；`BaseFormItem/index.vue:108`（`:key="item.renderKey"`，删除组件内本地 `getFieldKey` 实现）
- **修改点**：`v-for` key 由 `item.path || getFieldKey(item.rawField)` → 恒为 `item.renderKey`（`toRaw(field)` 身份 → 自增编号）。同 `path` 兄弟字段不再共用 key。
- **解决的问题**：同 `path` 字段 key 冲突导致节点错位复用；「无 path 才用对象 key」的半吊子策略失效。
- **影响**：运行时行为修复（DOM 复用/迁移语义变化）；模块级 `WeakMap` 不入响应式追踪（`computed` 内调用安全）；无公开 API 变更。
- **证据**：`BI-A17`（同 path 交换后节点随 key 迁移）、`BFI-04`（头部插入分组后原字段组件不复用错位）、`VP-V11`（头部 `prependField` 后 `input` 节点保留、弹层归属不变）、`VP-V19`（同批字段对象 + `:form` 替换仍重挂载）；提交 `dc29ccc`、`2429b61`。
- **复核结论**：⚠️ 建议改进（低危）——非对象回退键为 `` `raw_${String(field)}` ``，两个相同原始值（如两个 `'a'`、两个 `null`）会得到同一 key，JSDoc（`:14-16`）称「按字面量生成稳定 key」但未声明该冲突；`BaseFormItem` 已用 `isObjectItem` 过滤故组件路径不可达，直接消费 `useGroupFieldAttrs`/`getFieldKey` 时可达。建议改为 `raw_${typeof field}_${String(field)}_${index}` 形态（需传入下标）或在 JSDoc 标注该边界。

### 11. `BaseFormItem` 新增 `disabled` 并向下传播

- **位置**：`packages/vant-pro/src/components/form/components/BaseFormItem/index.vue:31-39`（`disabled?: boolean` + `disabled: undefined` 默认）、`:115-118`（嵌套 `BaseFormItem`）、`:122-127`（`BaseField` 显式 `:disabled`）
- **修改点**：新增 `disabled` prop；叶子字段 `:disabled="item.componentProps.disabled ?? props.disabled"`，嵌套分组 `:disabled="toValue(item.rawField.disabled) ?? props.disabled"`；随 `077f293`（CR-030）四包同构补充 `Field.disabled` 的 JSDoc「字段级取值优先，未显式指定时继承上层（表单或宿主 Provider）的禁用上下文」。
- **解决的问题**：分组字段的 `disabled` 不向子字段传播（element/vant 同一批修复）。
- **影响**：新增（非公开文档化）内部 prop；`@internal` 组件，不在 `src/index.ts` 导出面；无类型契约变更。
- **证据**：探针 P-02（直接给 `BaseFormItem` 传 `disabled: true` 时 `VanStepper.disabled === true`，管线本身可用）；提交 `cc83f0b`。
- **复核结论**：⚠️ 建议改进——**ProForm 从不给 BaseFormItem 传 `disabled`**（`ProForm/index.vue:148` 只有 `:fields`），且 `BaseField` 恒把 `disabled` 写成显式布尔（`:188-198` `{ disabled: effectiveDisabled }`），该显式 `false` 会**遮蔽 van-form 的 disabled 上下文**（vant `Field.getProp` 优先取自身 prop，仅在其为 `undefined` 时才回落 `form.props[key]`）。探针实证：P-01 `<ProForm disabled>` → `VanForm.disabled=true`、`VanField.disabled=false`、`VanStepper.disabled=false`；P-01b 更严格：`van-cell--disabled` 计数 0、`input` 无 `disabled` 属性、stepper 加减号均无 `disabled`、`van-stepper__plus` 仍带 `van-haptics-feedback`（可交互）。即 **`<ProForm disabled>` 对 vant 字段整体无效**，与 `ProForm/index.vue:21` 的 `@param {boolean} [disabled] - 全局表单禁用` 及四包同构 JSDoc（`types/index.ts:95`）不符；其余三包靠宿主 Form 原生 disabled 上下文（antd/element）或 ProForm 自建上下文（antdv-next `ProForm/index.vue:82-88`）成立，属**四包漂移**。建议：vant 侧在 ProForm 把 `attrs.disabled`（含 `''`/`'true'` 归一）经 `:disabled` 下传 `BaseFormItem`，或改由 `useProviderDisabled` 式上下文；若决定不做，则应把 vant 的 `Field.disabled` JSDoc 收窄为「继承宿主 Provider 注入的 componentVars 禁用值」，并删掉 ProForm 的「全局表单禁用」措辞。

### 12. `useGroupFieldAttrs` 改用 core `resolveFieldIdentity`

- **位置**：`packages/vant-pro/src/components/form/hooks/useGroupFieldAttrs.ts:24-37`（`path: resolveFieldIdentity(field)`，`GroupedField.path: string`）
- **修改点**：本地 `toValue(field.name) ?? toValue(field.path)` + `Array.isArray(raw) ? raw.join('.') : raw || ''` → core `resolveFieldIdentity`（键序 `['name','path']`、`normalizePathKey` 归一、无可用键返回 `''`）；同时把 `path`/`name` 从 `componentProps` 剥离的写法由 `const { path, name, … }` 改为 `_path`/`_name`（消除未用变量）。
- **解决的问题**：字段标识契约四包统一（宿主标识键 `name` 优先于 `path`），归一化实现收敛到 core 单点。
- **影响**：语义与基线一致（旧的 `??` 链同序同义），仅归一化实现替换；`GroupedField` 新增 `renderKey` 字段（`@internal` 类型，未在公开导出面）。
- **证据**：`cross-package.spec.ts:56`「宿主标识键优先于 path：name 覆盖 path，值绑定与字段查找共用同一标识」；`VP-F15`（`name` 优先、仅 `path` 时取 `path`、容器属性剥离）；提交 `bd888e9`。
- **复核结论**：✅ 无误（`resolveFieldIdentity` 返回 `string`，与 `GroupedField.path: string` 一致；`''` 兜底与旧 `|| ''` 等价）。

### 13. `Field` 公开类型补实例访问器

- **位置**：`packages/vant-pro/src/components/form/types/index.ts:238-241`（`Field = (FieldTypeMap[C] | WithFields<D>) & Pick<AdditionalMethods<any>, 'getComponentRef' | 'getComponentComputedProps'>`）；`shared/core/index.ts:6`（`type AdditionalMethods`）
- **修改点**：字段公开类型复用 core `AdditionalMethods` 声明 `getComponentRef`/`getComponentComputedProps`，与 `BaseFormItem` 运行时经 `defineProperty`（不可枚举）挂载的访问器对齐。
- **解决的问题**：访问器已在运行时可用但类型面缺失，业务需 `as any`。
- **影响**：类型契约增强（纯增量，不收紧既有字段配置类型）；无运行时影响。
- **证据**：`BI-A16 [判别]`（`BaseFormItem.spec.ts:194-216`，`const field: Field = …` 后 `field.getComponentRef?.()` 无需断言且运行时有值）；提交 `3a99eb0`。
- **复核结论**：✅ 无误（`Pick` 只取两个可选方法，不污染字段配置字面量）。

### 14. `hidden` / `disabled` 的 JSDoc 与类型（CR-030）

- **位置**：`packages/vant-pro/src/components/form/types/index.ts:83-97`
- **修改点**：四包同构补充行为陈述，当前文件内 `hidden`、`disabled` 各出现**两个连续 JSDoc 块**（旧块 `:83-85`、`:91-93`；新块 `:86-89`、`:94-96`），新块声明「支持布尔、Ref 与 getter 形式，渲染期统一按 `toValue` 取值」「字段级取值优先，未显式指定时继承上层（表单或宿主 Provider）的禁用上下文」，并在 `hidden` 的新块中夹带「嵌套字段 `path` 使用各自独立的完整路径…」的 path 语义。
- **解决的问题**：CR-030 四包文案收敛（`hidden` 支持 `toValue` 解包、`disabled` 继承语义、嵌套 `path` 不拼接）。
- **影响**：仅文档；`hidden?: boolean` / `disabled?: boolean` 的类型面未同步放宽；无运行时影响。
- **证据**：`comment-conventions.spec.ts` 未覆盖本文件；四包同句已由 `grep` 核验逐字一致（`antd-vue-pro:118` / `antdv-next-pro:106` / `element-plus-pro:118` / `vant-pro:95`）；提交 `077f293`。
- **复核结论**：❌ 问题——(a) `:83-85` 与 `:91-93` 是**未被删除的旧 JSDoc 残留**（同一成员两段 `@description`，违反 AGENTS.md §2 的注释规范；docgen/IDE 取后者，前者纯噪声），且 `hidden` 的新块把 `path` 语义写进了 `hidden` 的说明、`path` 成员自身（`:79-82`）只有一句「字段标识namePath, 同name」；(b) 新块声称 `hidden` 支持 Ref/getter，但声明类型是 `hidden?: boolean`——运行时确实经 `toValue` 支持，**类型面却拒绝**（`BaseFormItem` 不得不用 `(field as any).hidden` 绕过，见 `BaseFormItem/index.vue:45`），文案与类型契约不一致。建议：删除两处旧 JSDoc 块；把嵌套 path 说明移到 `path` 成员；将类型放宽为 `hidden?: MaybeRefOrGetter<boolean>`（`disabled` 同理，或把 JSDoc 收窄为「渲染期按 toValue 取值」并说明类型面仅布尔）。

### 15. `SlotComponent` 渲染判定放宽为「非原始值即组件」

- **位置**：`packages/vant-pro/src/components/form/components/SlotComponent/index.vue:16-24`（`isRenderable = c !== null && c !== undefined && (typeof c === 'function' || typeof c === 'object')`）
- **修改点**：`v-if="isVNode(component) || typeof component === 'function'"` → `v-if="isRenderable(component)"`（组件定义对象也交给 `<component :is>`），原始值仍走文本插值；同时去掉 `import { isVNode }` 与注入类型断言。
- **解决的问题**：CR-086。`SlotComponentType` 显式允许组件对象，但此前只认 VNode/函数 → 组件对象落入文本插值，DOM 出现组件对象 JSON 文本（自引用对象还会抛循环引用错）。
- **影响**：运行时行为修复；与 `element-plus-pro` 同构文件逐字一致；无 API 变更。
- **证据**：`BI-A20 [判别]`（`BaseFormItem.spec.ts:260`，组件对象渲染组件本体、字符串按文本渲染）；`DOC-02`（`comment-conventions.spec.ts:55-65`，断言与 element 文件逐字一致且不含 `isVNode`）；提交 `2429b61`（`0f61b82` 登记为待批）。
- **复核结论**：✅ 无误（`null`/`undefined`/`number`/`boolean`/`string` 均按文本分支，函数式组件保留）。

### 16. `src/index.ts` 导出 JSDoc 拆分、`shared/core` 再导出面补齐

- **位置**：`packages/vant-pro/src/index.ts:12-45`（三段 JSDoc 各自紧贴 `export`）；`src/shared/core/index.ts:4-57`（补 `type AdditionalMethods`、`localePacks`、`normalizeColumn`、`normalizeColumns`、`resolveFieldIdentity`、`DEFAULT_FIELD_IDENTITY_KEYS`、`isObjectItem`）
- **修改点**：原先三段组件说明在一个 JSDoc 块内、仅最后一段绑定导出（ProForm 文档在 IDE 丢失）→ 拆为三个 `export {}`；适配层补齐 core 已公开但包内取不到的再导出。
- **解决的问题**：CR-024（导出文档绑定）、CR-025（§1.3 统一导入契约）。
- **影响**：文档/类型可见性；`shared/core` 是包内聚合入口，非新增公开 API（`normalizeColumn/normalizeColumns/localePacks` 未从 `src/index.ts` 再导出）；Changeset `.changeset/fix-adapters-export-surface-and-contracts.md`。
- **证据**：`setup.spec.ts` `SETUP-03`（经包名解析到 core 源码，与直接源码导入同一模块实例）；构建 dts 成功；提交 `077f293`（`3a99eb0`/`5a8a20d`/`bd888e9` 增量补充）。
- **复核结论**：⚠️ 建议改进（低危，2 点）：(a) `src/index.ts:63` 仍为 `app.component(ProComponentProvider.name!, ProComponentProvider)`，其余三包已改为 `ProComponentProvider.name ?? 'ProComponentProvider'`（`antd-vue-pro/src/index.ts:83-86` 等）——CR-025 的 install 项**漏改 vant**（运行时无影响：`component-provider/components/index.vue:38-39` 有静态 `name`）；(b) `shared/core/index.ts` 分组注释失准：`:5` 的 `// types` 只覆盖 `type AdditionalMethods`，紧随的 `localePacks`/`normalizeColumn(s)` 是值导出；`resolveFieldIdentity`/`DEFAULT_FIELD_IDENTITY_KEYS` 被放在 `:10` 的 `// hooks` 下，实为字段标识 utils。建议把 `// types` 下移或拆成 `// 字段标识 / 表格列归一` 分组。

### 17. 纯类型导入收敛（`import type`）

- **位置**：`component-provider/constants/index.ts:1-3`、`component-provider/types/index.ts:1-4`、`components/form/components/index.ts:1-4`、`form/hooks/useFields.ts:1`、`form/hooks/useFormPopup.ts:12`、`form/types/index.ts:1-13`、`components/ProForm/index.vue:49-50` 等
- **修改点**：值导入 `import { X }` 改为 `import type { X }`（含 `Field as VanField`、`Popup`、`AdditionalMethods` 等）；`eslint.config.mjs` 开启 `@typescript-eslint/consistent-type-imports`（error）。
- **解决的问题**：CR-089 统一类型绑定，避免纯类型导入进入运行时依赖图。
- **影响**：纯类型层，无运行时/API 影响；无需 Changeset。
- **证据**：`npx vue-tsc --noEmit` 0 错误 + `vite build` 成功；`npx eslint src __tests__` **0 error**；提交 `0f61b82`。
- **复核结论**：✅ 无误（`useFormPopup.ts:12` 的 `import type { Popup }` 后仍以 `ComponentProps<typeof Popup>` 使用，类型面不受影响）。

### 18. 文档更新：date-picker 数组模型示例、AI 协作章节、`updateProps/open` 语义

- **位置**：`packages/vant-pro/README.md:176-178`（AI 协作章节）、`:479-500`（date-picker/area 示例改 `date: string[]` + `displayFormatter: (val: string[]) => val?.join('-')`）、`:236/255/258`（**未更新**）；`docs/vant-pro/components/pro-form/index.md:60`（已更新为持久化/单次覆盖/控件侧取值）；`packages/vant-pro/AI-CONTEXT.md:59-80`（项目级覆盖层）、`:174`（反模式）
- **修改点**：README 的 `date-picker` 弹层示例改数组模型（旧示例 `date: ''` + `(val: string)` 实测内联与弹层两分支均抛 `values.map is not a function`）；新增「与 AI 编码工具协作」段；AI-CONTEXT 增补「写码前先读项目 `ProComponentProvider` 实际配置」硬规则；`docs/vant-pro` 的 `formPopup` 行补 `updateProps` 持久生效 / `open` 的 `customProps` 仅本次 / `initialValue` 为控件侧取值。
- **解决的问题**：CR-060 文档修正；AI 协作规则（属性优先级 Field > Provider > 内置默认）。
- **影响**：仅文档；随 `e73293a` 附 Changeset `.changeset/ai-provider-context-vant.md`（patch）。
- **证据**：`ai-context.spec.ts` `AC-01…AC-07`（`__tests__/ai-context.spec.ts:12-39`，静态断言 AI-CONTEXT 关键句在场）；提交 `46d2fef`、`e73293a`。
- **复核结论**：❌ 问题——**README 的 `formPopup` 表格仍是 CR-055/CR-059 之前的旧语义**，与实现、与新 JSDoc、与 `docs/vant-pro/components/pro-form/index.md:60` 直接矛盾：`README.md:236`「可传初始值（**原始数据**）」、`:255`「打开指定字段的弹层；**自动重置属性为默认值后合并 customProps**；`initialValue` 传**原始数据**」、`:258`「`updateProps(props)`：合并更新当前弹层属性」。而实现是 `open()` 不再重置基础属性、`initialValue` 取控件侧取值、`updateProps` 写持久基础属性。CR-060 声称「docs 补 updateProps/open/initialValue 语义说明」只落到 `docs/`，**包内 README（npm 页面与 `files` 发布物）漏改**。建议按 `docs/vant-pro/.../index.md:60` 的措辞同步 `README.md:236/255/258`，并把该表并入注释/文档契约用例（如 `comment-conventions.spec.ts`）以防回流。

### 19. 测试基建：vitest 别名/`restoreMocks`、RO mock 身份修复

- **位置**：`packages/vant-pro/vitest.config.ts:4-21`（`@qin-ui/pro-components-core` → `../core/src/index.ts` 别名 + `restoreMocks: true`）、`__tests__/setup.ts:21-50`（`ResizeObserverEntry` 类型化、`disconnect()` 用 `this.entry` 注销）
- **修改点**：测试期经源码消费 core（消除对 `es/` 构建产物的隐性依赖）；每用例后自动还原 `vi.spyOn` 替身；RO mock 的注册表条目改为构造期持有同一对象引用（原 `delete({callback, elements})` 因对象身份不同永远删不掉）。
- **解决的问题**：测试可信度（对构建产物的隐性依赖、mock 泄漏、注册表注销失败）。
- **影响**：仅测试基建；无运行时影响。
- **证据**：`SETUP-01`（disconnect 后条目移除）、`SETUP-02`（unobserve 仅移除元素）、`SETUP-03`（经包名解析到源码且与源码导入同一模块实例）；提交 `a9b4f13`、`938fcb7`、`0ea21e0`。
- **复核结论**：✅ 无误。

### 20. `package.json` / `tsconfig.json` 元数据

- **位置**：`packages/vant-pro/package.json:55`（`@types/node ^24` devDependency）、`:61-63`（`sideEffects: ["./es/index.js"]`）；`tsconfig.json:17`（`"types": ["node"]`）
- **修改点**：`sideEffects` 去掉 `"**/*.css"`；新增 `@types/node`；tsconfig 显式 `types: ["node"]`（供 `ai-context.spec.ts` 使用 `node:fs`/`node:path`）。
- **解决的问题**：CR-026（本包无 `<style>` 块、`es/` 无 CSS 产物、`exports` 未暴露 CSS 子路径，`**/*.css` 为无效声明）。
- **影响**：打包元数据；`sideEffects` 与其余三包的差异**经核实合理**（`ls packages/*/es/*.css`：antd/element/antdv-next 各 1 个 CSS 产物，vant-pro 0 个）；Changeset `.changeset/fix-vant-sideeffects-metadata.md`（patch）已写明理由。
- **证据**：`git log -p` 定位为 `0ea21e0`；`grep -rn "<style\|\.css" packages/vant-pro/src/` 无命中；构建产物无 CSS。
- **复核结论**：⚠️ 建议改进（低危）——`tsconfig.json` 在 `files` 发布清单内（`files: ["es","src","bin","README.md","LICENSE","api.json","AI-CONTEXT.md","tsconfig.json"]`），而 `types: ["node"]` 会把自动纳入的 `@types/*` 收窄为仅 `node`，且 `@types/node` 只是 devDependency；若有消费方 `extends` 该 tsconfig，将需要自备 `@types/node` 并失去其它自动 `@types`。**待确认**：是否有外部消费方 `extends`（仓库内仅本包使用）。建议改为在 `__tests__` 侧局部声明，或把 `@types/node` 提为 `peerDependencies`/`dependencies`。

### 21. 用例扩充盘点（CR-031 / CR-061 / CR-086 等）

- **位置/修改点**：新增 spec 文件 5 个（`baseFieldUtils.spec.ts` VP-F14/F15、`formHooks.spec.ts` VP-F16/F17/F18、`setup.spec.ts` SETUP-01/02/03、`comment-conventions.spec.ts` DOC-01/02、`ai-context.spec.ts` AC-01…07）；既有文件扩充（`BaseField.spec.ts` +6：BF-06/07/08/09、VP-B7、VP-B8；`useFormPopup.spec.ts` +2：VP-V17/V18，另 POP-01 扩展 + `VP-V11` 改不同 path 触发 keyed-map 分支；`BaseFormItem.spec.ts` +5：BI-A15/A15b/A16/A17/A20 + BFI-04 重写；`ProForm.spec.ts` +2：PF-D1、VP-V19；`hooks-locale.spec.ts` +2：HL-03/04；`cross-package.spec.ts` +1）。
- **解决的问题**：CR-031（补齐未覆盖的公开能力）、CR-061（补测 7 条并调整 3 条）、CR-086（BI-A20）、CR-022（重写恒真/零信息断言）。
- **影响**：仅测试；`package.json` 无 test 脚本变更。
- **证据**：`npx vitest run` → 15 files / 90 tests 全绿；55→90 用例增量与各提交 diff 行数吻合；`VP-V17` 用真实 `defer` Teleport（不 stub teleport）断言内容落在 `contentId` 容器、`VP-V18` 覆盖 `teleportTo`、`VP-V19` 覆盖「同批字段对象 + `:form` 替换」的 `formKey` 重挂载；提交 `f299454`、`0a47cfe`、`2429b61`、`46d2fef`、`e73293a`。
- **复核结论**：✅ 无误（判别性断言可失败：`BF-09` 的 `hasAttribute`、`BI-A17` 的节点恒等、`VP-V19` 的 `setupCount` 与节点恒等均为强判别）。⚠️ 提示：`comment-conventions.spec.ts`/`ai-context.spec.ts` 属「文档子串契约」，合法改词即转红，属设计取舍，仅需知悉维护成本。

## 遗留与建议

- **未随本批修复的过期文案（pre-existing，建议随手清理）**：`src/index.ts:20` 的公开 JSDoc 示例用 `component: 'input'`，而 `'input'` 既不在 `BaseComponentMap`（`constants/index.ts:84-100`）也不在 `ComponentName` 联合类型内 —— 按示例写会触发 `未识别的组件类型 "input"` 告警并降级为原生元素（叠加本报告 #4-2，placeholder/disabled 还会被剔除）。建议改为 `component: 'field'`（并考虑给 `ComponentName` 加 `'input'` 之类的原生元素白名单，或明确文档化原生回退语义）。
- **判别用例编号的注释残留（pre-existing，且新卫兵抓不到）**：`__tests__/BaseField.spec.ts:510/541/567` 的分节注释写 `VP-V10 / VP-V11 / VP-V12`，而同一分节的 `it()` 名为 `VP-F13a/b/c`（`:512/543/569`），且与 `useFormPopup.spec.ts:73/149/283` 的真实 `VP-V10/11/12` 撞号。经 `git blame`，注释与 `it()` 名同出 `e30b2d18`（是 `734e3c0` 的祖先，**不在本次改动范围**）；`scripts/check-test-ids.mjs` 只扫描带引号的编号字面量（`NAMED_PATTERN`/`BARE_PATTERN` 均要求前置引号），实测 `node scripts/check-test-ids.mjs` → `✓` exit 0，故注释残留不会被拦截。建议把分节注释与 `it()` 名对齐，并让卫兵扫描 `// 编号` 形式。
- **跨包漂移（vant 侧未跟上）**：(a) `install()` 的 `ProComponentProvider.name!`（#16-a）；(b) `<ProForm disabled>` 对字段无效（#11，其余三包成立）；(c) `sideEffects` 与三包不同（**已核实合理**，勿盲目对齐）。
- **门禁外但仓库纪律相关**：`npx eslint packages/vant-pro/src packages/vant-pro/__tests__` 为 **0 error / 187 warning**，warning 全部是 `@typescript-eslint/no-explicit-any`（新增文件 `utils/listeners.ts:3,4,17`、`utils/fieldKey.ts` 等），与包内既有风格一致，未新增 error。
- **未加测试的两处**：`dispatchListeners` 的「其余忽略」分支（#2）；`getControlPropsKeys` 的数组式 props 分支（#4-1，本报告以仓外探针 P-03/P-04 实证，未落地为仓库用例）。
- **待确认**：`tsconfig.json` 的 `types: ["node"]` 是否有外部 `extends` 消费方（#20）；`Field.disabled` 的 Ref/getter 形态是否计划进类型面（#14-b）。

## 门禁实测

命令与结果原文摘要（均在 `packages/vant-pro`，HEAD=`e73293a`，工作区 `git status --porcelain -- packages/vant-pro` 为空）：

1. `npx vitest run` → exit 0

   ```
   Test Files  15 passed (15)
        Tests  90 passed (90)
      Duration  2.12s
   ```

   仅有 1 处预期 stderr（`M10` 用例的孤立上下文告警）：`[useForm] root=false 但未找到注入的父表单实例（当前不在 ProForm 组件上下文中），已回退为创建独立根表单。`

2. `npx vue-tsc --noEmit` → 无任何输出，`TSC_EXIT=0`（0 错误）

3. `pnpm --filter "@qin-ui/vant-pro" build` → exit 0

   ```
   > @qin-ui/vant-pro@1.3.4 prebuild … tsx ../../scripts/generate-api-json.ts vant-pro && … generate-init-ai.ts vant-pro
   > @qin-ui/vant-pro@1.3.4 build … vue-tsc --noEmit && vite build
   ✓ 30 modules transformed.
   [vite:dts] Declaration files built in 17145ms.
   es/index.js  34.11 kB │ gzip: 7.83 kB │ map: 78.53 kB
   ✓ built in 23.14s
   ```

   产物 `es/index.js`、`api.json`、`bin/init-ai.mjs` 均被 gitignore 覆盖，未改动任何跟踪文件。

4. 附加核验（仓库纪律，非本次要求门禁）：`npx eslint packages/vant-pro/src packages/vant-pro/__tests__` → `✖ 187 problems (0 errors, 187 warnings)`；`node scripts/check-test-ids.mjs` → `[check-test-ids] 用例编号在同一包内唯一 ✓`（exit 0）

5. 仓外探针（不写仓库，仅 `/private/tmp/change-review/probe/`，最终复跑）：`npx vitest run --config /tmp/change-review/probe/vitest.probe.config.mjs` → `Test Files 1 passed (1) / Tests 8 passed (8)`（`root=/private/tmp/change-review`、`cacheDir` 指向探针本地目录、`vue`/`vant`/`@vue/test-utils`/core 全部经 `createRequire(PKG)` 的绝对路径别名解析，不写入仓库 `node_modules`，不依赖软链）；实证结论见 #4-1/#4-2/#4-3（P-03 数组式 props 仅收到 `{modelValue:2}`、P-04 对象式收到三者、P-05 `<div class="van-picker" type="tel">`）、#11（P-01 `VanForm.disabled=true` 但 `VanField/VanStepper.disabled=false`、P-01b `van-cell--disabled` 计数 0 且 stepper 加减号无 `disabled`、P-02 直接传 `BaseFormItem disabled` 时生效）、`hidden` 递归（P-06：嵌套分组 `hidden: true` 子字段被过滤，仅渲染 1 个输入框与「B」文案 ✅）、原生元素回退（P-07 `{"type":"tel","modelvalue":"abc"}`，`placeholder`/`disabled` 丢失）。
