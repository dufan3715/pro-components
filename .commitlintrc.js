// 配置参考 https://github.com/conventional-changelog/commitlint/blob/master/docs/reference-rules.md

module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    /**
     * ?? 提交类型
     * build : 改变了build工具 如 webpack
     * ci : 持续集成新增
     * chore : 构建过程或辅助工具的变动
     * feat : 新功能
     * docs : 文档改变
     * fix : 修复bug
     * perf : 性能优化
     * refactor : 某个已有功能重构
     * revert : 撤销上一次的 commit
     * style : 代码格式改变
     * test : 增加测试
     * anno: 增加注释
     */
    'type-enum': [
      2,
      'always',
      [
        'build',
        'ci',
        'chore',
        'docs',
        'feat',
        'fix',
        'perf',
        'refactor',
        'revert',
        'style',
        'test',
        'anno',
      ],
    ],
  },
};
