# 发布指南

本文档说明如何将 `@qin-ui/*` 系列包发布到 npm。当前采用**手动发版**流程。

## 适用范围

- `@qin-ui/pro-components-core`
- `@qin-ui/antdv-next-pro`
- `@qin-ui/antd-vue-pro`
- `@qin-ui/element-plus-pro`
- `@qin-ui/vant-pro`

> 各包版本号**独立**，互不联动。一次可单独发一个包，也可同时发多个包。

## 前提：npm 已登录

```bash
npm whoami
```

显示用户名即可。若返回 `E401`，先执行 `npm login`。

## 手动发版流程

以单独发布 `@qin-ui/antdv-next-pro` 为例。

### 1. 写 changeset（只选要发的包）

```bash
pnpm changeset
```

- 空格**只勾选 `@qin-ui/antdv-next-pro`**
- 选版本类型：`patch`（补丁）/ `minor`（次版本）/ `major`（主版本）
- 填写变更摘要（会写入 CHANGELOG）

执行后在 `.changeset/` 下生成一个 `.md` 文件。

### 2. 消费 changeset，bump 版本 + 生成 CHANGELOG

```bash
pnpm version-packages
```

只改动目标包的 `package.json`（版本号）与 `CHANGELOG.md`，其余包不受影响。

### 3. 提交版本变更（⚠️ 关键，不可跳过）

```bash
git add packages/antdv-next-pro/package.json packages/antdv-next-pro/CHANGELOG.md .changeset/
git commit -m "chore(release): @qin-ui/antdv-next-pro <新版本号>"
```

> **这一步必须执行**。若跳过直接 publish，会导致 publish 打的 tag 指向不含版本号变更的旧 commit。

### 4. 发布到 npm（⚠️ 必须用 pnpm，不能用 npm）

```bash
pnpm -F @qin-ui/antdv-next-pro publish
```

publish 成功后会自动打 tag `@qin-ui/antdv-next-pro@<版本号>`。

### 5. 推送代码和 tag

```bash
git push --follow-tags
```

## 同时发布多个包

若多个包需同时发版，步骤相同，只是 changeset 一次性勾选多个包：

```bash
pnpm changeset          # 勾选多个包
pnpm version-packages   # 一次性 bump 所有勾选包
git add packages/*/package.json packages/*/CHANGELOG.md .changeset/
git commit -m "chore(release): 版本发布 <版本列表>"
pnpm changeset publish  # 一次性发布所有包
git push --follow-tags
```

## 发版后验证

每次发完，跑一遍以下命令，三条都对才算发版干净：

```bash
# 1. 核对 npm 版本
npm view @qin-ui/antdv-next-pro version

# 2. 核对 tag 指向的 commit 里版本号是否正确
git show @qin-ui/antdv-next-pro@<版本号>:packages/antdv-next-pro/package.json | grep version

# 3. 核对 tag 是否已推送到远程
git ls-remote --tags origin | grep @<版本号>
```

## 常见问题

### Q: 为什么必须用 `pnpm publish`，不能用 `npm publish`？

包内依赖 `@qin-ui/pro-components-core: "workspace:^"`。只有 pnpm publish 会把它替换成实际版本号（如 `^1.0.1`）；npm publish 会原样发出 `workspace:^`，导致消费方装不上 core。

### Q: tag 指向的版本号不对怎么办？

说明 version-packages 后没 commit 就 publish 了。修复步骤：

1. 删除错误的本地与远程 tag：
   ```bash
   git tag -d @qin-ui/antdv-next-pro@<版本号>
   git push origin :refs/tags/@qin-ui/antdv-next-pro@<版本号>
   ```
2. 在正确的 commit（含版本号变更的那个）上重新打 tag：
   ```bash
   git tag @qin-ui/antdv-next-pro@<版本号> <正确的commit>
   git push --tags
   ```

## 自动化发版（备选）

仓库已配置 `.github/workflows/release.yml`，支持基于 `main` 分支的自动化发版（需在 GitHub Secrets 配置 `NPM_TOKEN`，类型选 `Automation` 绕过 2FA）。当前未启用，保留备用。

自动化流程：写 changeset -> 合并 PR 到 `main` -> release.yml 自动发起 Version Packages PR -> 合并该 PR -> 自动 build + publish + 打 tag。
