# core 发版就绪审计（4 份，只读审计产物）

> ⚠️ 本目录与其中的改动**尚未提交**（按 owner 要求：复核期间的修改须经确认后方可提交）。
> 审计方式：只读逐行核查 + 最小复现探针（探针写在 `/tmp` 并已删除，审计期间仓库零写入）。

| 文件                                                             | 主线                                                             | 计数                  | 是否阻塞发版                                                                                      |
| ---------------------------------------------------------------- | ---------------------------------------------------------------- | --------------------- | ------------------------------------------------------------------------------------------------- |
| [`01-release-and-packaging.md`](./01-release-and-packaging.md)   | 类型面 / 导出面与产物一致 / JSDoc / 打包与 changeset / core 纯度 | ❌3 / ⚠️21 / ✅19     | 条件性不阻塞（1 条真实伤害消费方的类型面缺陷 + 2 条发版文档失真，建议合并 Version Packages 前修） |
| [`02-tests-and-coverage.md`](./02-tests-and-coverage.md)         | 215 用例覆盖矩阵 / 失信断言 / 13 组突变验证 / 测试基建           | ❌1 / ⚠️17+1组 / ✅12 | 不阻塞（P0：`isObjectItem` 零行为覆盖）                                                           |
| [`03-shared-correctness.md`](./03-shared-correctness.md)         | `path` / `utils` / `cloneDeep` / `pick` / `locale` 正确性与安全  | ❌4 / ⚠️19 / ✅15     | 不阻塞（TS 路径不可达，但 JS 边界真实可达）                                                       |
| [`04-form-table-correctness.md`](./04-form-table-correctness.md) | `form/**` + `table/**` 逐文件核查（含 45 条实测原始日志）        | ❌9 / ⚠️19 / ✅16     | **建议先修 `useSearchFormExpand` 三条再发**（四包共用）                                           |

合计：**❌ 17 / ⚠️ 76 / ✅ 62**。

## 我方已在本轮修掉的（仍未提交）

- ❌ `UseSearchFormExpandReturn` 未导出 → 消费方 TS2742（已补导出，并有消费方探针 0 错误证据）
- ❌ `isDangerousKey` 的 `@internal` 表述与两条 changeset 互相矛盾（已统一口径）
- ❌ `camelizeProperties` 的 JSDoc 被 `const` 隔断 → 产物 d.ts 零文档（已归位）
- ❌ `format` 走原型链（`format('{toString}')` 输出原生函数源码）→ 改自有属性判定（`LC-08` 判别 ✓）
- ❌ `pick` 无危险键防护（可替换结果对象原型）→ 复用 `isDangerousKey` 跳过（`SU-08` 判别 ✓）
