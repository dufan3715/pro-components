# Changesets

本仓库使用 [Changesets](https://github.com/changesets/changesets) 管理多包版本与 CHANGELOG。

## 工作流

1. 在你的分支上完成开发后，运行：

   ```bash
   pnpm changeset
   ```

   按交互提示选择受影响的包、版本类型（major/minor/patch）并填写变更摘要。

2. 提交生成的 `.changeset/*.md` 文件：

   ```bash
   git add .changeset
   git commit -m "chore: add changeset"
   ```

3. 合并到 `main` 分支后，Release 工作流会自动消费 changeset：
   - 发布已变更的包到 npm
   - 更新各包版本号与 CHANGELOG
   - 发起一个 “Version Packages” PR 汇总版本变更

## 配置说明

- `linked`：为空，各包版本号独立，互不联动
- `updateInternalDependencies: patch`：内部依赖（`@qin-ui/*`）默认按 patch 升级
- `ignore`：根工程、文档、示例工程不参与发布（private 包默认忽略）
