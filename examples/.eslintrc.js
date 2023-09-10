module.exports = {
  root: true,
  extends: '../.eslintrc.js',
  rules: {
    'import/no-extraneous-dependencies': [
      'error',
      { packageDir: ['.', __dirname] },
    ],
  },
  settings: {
    'import/resolver': {
      typescript: {
        project: `${__dirname}/tsconfig.json`,
      },
    },
  },
};
