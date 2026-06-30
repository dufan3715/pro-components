const fs = require('fs');
const scan = JSON.parse(fs.readFileSync('/Users/dufan/Desktop/Code/My_project/pro-components/.understand-anything/intermediate/scan-result.json', 'utf8'));
const paths = scan.files.map(f => f.path);
const input = {
  projectRoot: '/Users/dufan/Desktop/Code/My_project/pro-components',
  sourceFilePaths: paths,
  gitCommitHash: '60217979b460ab5e1eae701ad8ee85077fa24688'
};
fs.writeFileSync('/Users/dufan/Desktop/Code/My_project/pro-components/.understand-anything/intermediate/fingerprint-input.json', JSON.stringify(input, null, 2));
console.log(`Wrote ${paths.length} paths`);
