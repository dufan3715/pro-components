# @qin-ui/antd-vue-pro — AI Context

> Schema-driven component library wrapping **ant-design-vue v4** (`a-` prefix). Describe UIs as JS objects instead of template tag soup.

---

## 1. Architecture

### 1.1 Three-layer rendering

```
Field[] config layer       { path:'name', component:'input', span:8, label:'Name', placeholder:'...' }
        │
@qin-ui/antd-vue-pro       Schema parser — strips props layer by layer
        │
ant-design-vue v4          a-input / a-select / a-table / a-form-item / a-col  ...
```

ProForm/ProTable are **rendering engines**, not a component library. All actual UI comes from ant-design-vue. Field props are peeled off and dispatched to different DOM layers.

### 1.2 Component resolution

`Field.component` string → `componentMap` → ant-design-vue component.

If not found in the built-in map, the string is resolved against `ProComponentProvider` injected components; a Vue component object is rendered directly (used by `'custom'` internally).

### 1.3 Built-in component map

| Field `component`  | ant-design-vue component | Key pass-through props (verify against https://antdv.com)                              |
| :----------------- | :----------------------- | :------------------------------------------------------------------------------------- |
| `'input'`          | Input                    | placeholder, maxlength, allowClear, addonBefore, addonAfter, prefix, suffix, showCount |
| `'textarea'`       | TextArea                 | rows, maxlength, showCount, autoSize                                                   |
| `'input-password'` | InputPassword            | placeholder, maxlength, visibilityToggle                                               |
| `'input-search'`   | InputSearch              | placeholder, loading, onSearch                                                         |
| `'input-number'`   | InputNumber              | min, max, step, precision, formatter, parser                                           |
| `'select'`         | Select                   | **options**, mode, showSearch, filterOption, allowClear, loading                       |
| `'cascader'`       | Cascader                 | **options**, fieldNames, showSearch, allowClear                                        |
| `'date-picker'`    | DatePicker               | picker, format, showTime, disabledDate, valueFormat                                    |
| `'range-picker'`   | RangePicker              | format, showTime, disabledDate, allowClear                                             |
| `'time-picker'`    | TimePicker               | format, showSecond, hourStep, minuteStep                                               |
| `'checkbox-group'` | CheckboxGroup            | **options**, direction                                                                 |
| `'radio-group'`    | RadioGroup               | **options**, direction, buttonStyle                                                    |
| `'switch'`         | Switch                   | checkedChildren, unCheckedChildren, loading                                            |
| `'slider'`         | Slider                   | min, max, step, marks, range, tooltip                                                  |
| `'tree-select'`    | TreeSelect               | **treeData**, showSearch, treeCheckable, fieldNames                                    |
| `'transfer'`       | Transfer                 | **dataSource**, **titles**, **targetKeys**, showSearch, render                         |
| `'custom'`         | (user-supplied)          | component receives a Vue component or `h()` render function                            |

> The prop column is illustrative. **Always verify prop names/types against [antdv.com](https://antdv.com).**

---

## 2. Property layering (core rule)

Field props are **stripped in layers** and dispatched to different DOM targets.

```
<a-col :span="8">                   ← Grid layer
  <a-form-item label="City">        ← FormItem layer
    <a-select placeholder="..." />  ← Input-control layer
  </a-form-item>
</a-col>
```

### 2.1 Layer dispatch

**Grid layer → `<a-col>`** (only when grid is enabled):
`span`, `order`, `offset`, `push`, `pull`, `flex`, `xs`, `sm`, `md`, `lg`, `xl`, `xxl`

**FormItem layer → `<a-form-item>`**:
`label`, `rules`, `colon`, `labelAlign`, `labelCol`, `wrapperCol`, `tooltip`, `extra`, `help`, `validateFirst`, `validateTrigger`, `valuePropName`, `normalize`, `formItemClass`→`class`, `formItemStyle`→`style`, `formItemContainer`, `formItemDataAttrs`→`data-*`

**Input-control layer → the input component** (everything else):
`disabled`, `placeholder`, `allowClear`, `options`, `showSearch`, `maxlength`, `mode`, `componentClass`→`class`, `componentStyle`→`style`, `componentDataAttrs`→`data-*`, and any ant-design-vue props for that component.

**Consumed by ProForm logic, not bound to DOM**: `component`, `fields`, `hidden`, `slots`, `modelProp`, `valueFormatter`, `componentContainer`, `extraProps`.

### 2.2 modelProp

Controls the `v-model:xxx` binding name.

- Default: `modelProp: 'value'` → `v-model:value`
- Switch uses `checked` — **ProComponentProvider presets `modelProp: 'checked'` for `'switch'`** so you rarely set it manually.
- Override per-field when using a custom component that expects a different v-model prop.

---

## 3. Progressive usage

### Level 1: Config-driven (no hand-written a-\* tags)

```ts
import { ProForm, useForm } from '@qin-ui/antd-vue-pro';

const form = useForm({ username: '', password: '' }, [
  {
    path: 'username',
    component: 'input',
    label: '用户名',
    placeholder: '请输入',
    rules: [{ required: true }],
  },
  {
    path: 'password',
    component: 'input-password',
    label: '密码',
    placeholder: '请输入',
    rules: [{ required: true }],
  },
]);
```

```html
<ProForm :form="form" />
```

### Level 2: Field linkage

Control props (`disabled`, `hidden`, `rules`, etc.) support three reactivity patterns:

```ts
// A) computed() — declarative, for linkages known at init (preferred)
disabled: computed(() => !form.formData.enabled),
rules: computed(() => [{ required: form.formData.hasLimit, message: '必填' }]),

// B) ref() — external shared state
const isDisabled = ref(false);

// C) setField() — imperative, for event-driven changes
form.setField('limitCount', { disabled: true });
```

**Rule: pick the simplest. computed() for init-time, setField() for runtime events, ref() for external state.**

### Level 3: Custom component

```ts
import { h } from 'vue';
import CustomInput from './CustomInput.vue';

// In field config:
{ path: 'key', component: (p, ctx) => h(CustomInput, { ...p, ...ctx.attrs }) }
```

Or via scoped slot in template (all binding params forwarded via `v-bind="scoped"`):

```html
<ProForm :form="form">
  <template #agreement="scoped">
    <a-checkbox v-bind="scoped">同意协议</a-checkbox>
  </template>
</ProForm>
```

---

## 4. Anti-patterns

- **Never hand-write `<a-form-item>` inside `<ProForm>`.** ProForm renders FormItems from Field config automatically.
- **Never guess pass-through prop names.** Verify against [ant-design-vue docs](https://antdv.com).
- **Don't confuse Grid props with input props.** `span` goes to `<a-col>`, not the input.
- **Use `computed()` for reactive Field configs.** Plain values won't track dependencies.
- **Prefer the simplest linkage pattern.** Don't use `setField()` when `computed()` suffices.

---

## 5. ProComponentProvider — global defaults

Wrap your app to set defaults for all ProForm/ProTable instances. Merged with priority (highest first):

1. **Field-level config** (always wins)
2. **`componentVars`** passed to ProComponentProvider
3. **`INJECT_CONFIG`** built-in presets

### Built-in presets (INJECT_CONFIG)

| Component                                      | Preset                                                                                                                                  |
| :--------------------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------- |
| `switch`                                       | `{ modelProp: 'checked' }`                                                                                                              |
| `input`                                        | `{ maxlength: 100, allowClear: true, placeholder: '请输入' }`                                                                           |
| `textarea`                                     | `{ maxlength: 200, autoSize: {minRows:3,maxRows:6}, showCount: true, allowClear: true, placeholder: '请输入' }`                         |
| `select` / `cascader`                          | `{ allowClear: true, placeholder: '请选择', getPopupContainer }`                                                                        |
| `input-number`                                 | `{ max: 10^15, min: -(10^15), controls: false, placeholder: '请输入', style: {width:'100%'} }`                                          |
| `date-picker` / `range-picker` / `time-picker` | `{ allowClear: true, getPopupContainer, style: {width:'100%'} }`                                                                        |
| `pro-table`                                    | `{ pagination: {showTotal, showSizeChanger, showQuickJumper}, searchFormConfig: {layout:'grid'}, control: true, addIndexColumn: true }` |
| `pro-form`                                     | `{ grid: { gutter: {xs:8, sm:16, md:16, lg:24} } }`                                                                                     |
| `pro-form-item`                                | `{ validateFirst: true, span: 8 }`                                                                                                      |

### Override example

```vue
<ProComponentProvider
  :component-vars="{
    'pro-form-item': { span: 6 },
    input: { maxlength: 200 },
    select: { showSearch: true },
    'pro-table': { addIndexColumn: false },
  }"
>
  <ProForm :form="form" />
  <ProTable :table="table" />
</ProComponentProvider>
```

---

## 6. ProTable quick reference

```ts
import { ProTable, useTable } from '@qin-ui/antd-vue-pro';

const table = useTable<Row>({
  columns: [
    { title: 'ID', dataIndex: 'id', width: 80 },
    { title: 'Name', dataIndex: 'name', width: 120 },
  ],
  // searchFields uses the same Field[] format as ProForm
  searchFields: [
    { path: 'name', component: 'input', placeholder: 'Search' },
    { path: 'status', component: 'select', options: [...] },
  ],
});
// table.searchForm is a ProForm instance — all form methods available
```

```html
<ProTable :table="table" :search="fetchData" addIndexColumn immediateSearch />
```

---

## 7. References

1. **`node_modules/@qin-ui/antd-vue-pro/api.json`** — Structured API metadata (signatures, types, JSDoc examples)
2. **`node_modules/@qin-ui/antd-vue-pro/README.md`** — Full usage docs and code examples
3. **[antdv.com](https://antdv.com)** — ant-design-vue component API reference (always check before writing pass-through props)
