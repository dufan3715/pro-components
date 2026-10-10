## 五、跨包与工程化改动（不属于单包）

### 1. 用例编号卫兵 `scripts/check-test-ids.mjs`（新增，+80 行，提交 `0ea21e0` / `ad60833`）

- **修改点**：新增独立脚本，扫描各包 `__tests__/**` 的用例编号并校验**同一包内唯一**：
  - 双模式识别：具名形式 `it('前缀-编号: 描述')` 与 `it.each` 表内 `{ id: '前缀-编号' }`；
  - 裸字面量收紧：需含连字符或 ≥2 位数字段，避免把 `'X2'`、`'O2'` 这类普通值误判为编号；
  - 同行多命中自动去重；跨行重复 → 打印两处位置并 `exit 1`。
- **解决的问题**：评审中发现 `element PT-09`、`vant VP-V15/VP-V16/M11` 等**编号重复/错位**导致用例报告不可定位（CR-021 类问题）；此前无任何自动化约束。
- **影响**：**仅工程化**，不影响运行时代码与包产物；新增根脚本 `check:test-ids`，并串入 `lint:check`（提交 `0ea21e0`），CI 由 `pnpm lint` 改为 `pnpm lint:check`（校验模式、不写文件）。
- **证据**：`pnpm check:test-ids` 全仓通过；CI 改动见 `.github/workflows/ci.yml`。

### 2. ESLint 类型导入规则（`eslint.config.mjs`，+7 行，提交 `0f61b82`）

- **修改点**：新增 `@typescript-eslint/consistent-type-imports`（`error`，`prefer: 'type-imports'`，`fixStyle: 'separate-type-imports'`）。
- **解决的问题**：纯类型绑定与运行时导入混写，导致打包产物残留无用导入、类型面与实现面边界不清（CR-089）。
- **影响**：**开发者体验/产物洁净度**；存量 61 文件、118 处已统一（`--fix` 59 处 + 人工 2 处）。可能影响下游使用者的 lint 结果（若继承本仓配置），运行时无影响。
- **证据**：`npx eslint "packages/**/*.{ts,vue}"` → 0 error。

### 3. 根脚本与 CI（`package.json` +7 行、`.github/workflows/ci.yml`）

- **修改点**：新增 `check:test-ids`、`lint:check:eslint`、`lint:check:stylelint`、`lint:check:prettier`，并由 `lint:check` 串联；CI 的 Lint 步骤改用 `pnpm lint:check`。
- **解决的问题**：原 `pnpm lint` 会**写文件**（`--fix`），在 CI 中无法作为"是否合格"的判据（CR-017 同类：文档化门禁与实际不符）。
- **影响**：CI 语义由"自动修复"变为"校验失败即红"；本地需要自动修复时仍可用 `pnpm lint`。

### 4. 测试基建（细节见 §四各包报告）

- **mock 隔离**：五包 `vitest` 配置开启 `restoreMocks`（提交 `0ea21e0`），消除跨用例 spy 泄漏。
- **`flushPromises` 去真实睡眠**：`__tests__/helpers/mount.ts` 由「`setTimeout(20)` 等待」改为「`nextTick` + `setTimeout(0)` + `nextTick`」，约百处调用点提速（提交 `0ea21e0`）。
- **告警守卫**：`antd-vue-pro` / `antdv-next-pro` / `element-plus-pro` 三包 `__tests__/setup.ts` 增加「未放行告警即失败」的 `afterEach`，白名单按探针实测逐包校准；`expectWarn` 由死代码复活为真实断言。
- **注释契约锁定**：三包新增 `__tests__/comment-conventions.spec.ts`（`DOC-01/02/03`），静态校验公开 JSDoc 结构。
- **源码消费 core**：测试期经 `src` 别名消费 core（提交 `a9b4f13`），消除对 `es` 构建产物的隐性依赖（此前必须先 build core 才能跑测试）。
- **RO/IO mock 身份**：修复 `ResizeObserver`/`IntersectionObserver` mock 的 `disconnect` 身份不匹配（提交 `938fcb7`）。

### 5. `examples` 演示应用

- `a0cd0b8`：增加 `passWithNoTests`，修复 `pnpm -r test` 在 examples 包必然失败（CR-017）。
- `58a03cf`：新增路由配置与测试脚本。
- 复核期新增 5 个可视化复核 demo（`examples/src/views/*-demo.vue`）：字段 a11y、列对象就地变异、分组列、Provider 控制表格尺寸、vant class/style 落点；用于人工目视确认对应修复。

### 6. Changeset 与发版

- 共 **32 份** changeset；bump 级别分布：`patch` 41 项（跨包计次）、**`minor` 4 项**：
  - `@qin-ui/pro-components-core` minor：CR-016「不再就地变异调用方数组」（`@mutates` 契约收敛）；
  - `@qin-ui/vant-pro` minor：CR-055「弹层取值统一为控件侧取值」；
  - `@qin-ui/antd-vue-pro` / `@qin-ui/antdv-next-pro` minor：查询表单回车语义与相关契约调整（详见两包报告）。
- 其余为 `patch`：缺陷修复、类型面收敛、文档同步、`sideEffects` 元数据等。
