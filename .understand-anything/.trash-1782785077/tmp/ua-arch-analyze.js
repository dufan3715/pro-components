#!/usr/bin/env node
/**
 * Phase 1 -- Structural Analysis Script for Architecture Layer Detection
 *
 * Reads assembled-graph.json and computes structural patterns.
 * Input:  assembled graph JSON file path (argv[2])
 * Output: structural results JSON file path (argv[3])
 */

const fs = require('fs');
const path = require('path');

// ====== ARGS ======
const inputPath = process.argv[2];
const outputPath = process.argv[3];

if (!inputPath || !outputPath) {
  console.error('Usage: node ua-arch-analyze.js <input.json> <output.json>');
  process.exit(1);
}

// ====== READ INPUT ======
let inputData;
try {
  inputData = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
} catch (e) {
  console.error('ERROR: Failed to read or parse input file:', e.message);
  process.exit(1);
}

const allNodes = inputData.nodes || [];
const allEdges = inputData.edges || [];

// ====== 1. EXTRACT FILE-LEVEL NODES ======
// File-level nodes: all nodes except 'function' type (functions are sub-file symbols)
const fileNodeTypes = new Set([
  'file',
  'config',
  'document',
  'service',
  'pipeline',
  'table',
  'schema',
  'resource',
  'endpoint',
]);
const fileNodes = allNodes.filter(n => fileNodeTypes.has(n.type));

// Build lookup map
const fileNodeMap = new Map();
for (const n of fileNodes) {
  fileNodeMap.set(n.id, n);
}

// ====== 2. CLASSIFY EDGES ======
// Import edges: type === 'imports' AND both source and target are file-level nodes
const importEdges = [];
const otherEdges = [];
for (const e of allEdges) {
  if (
    e.type === 'imports' &&
    fileNodeMap.has(e.source) &&
    fileNodeMap.has(e.target)
  ) {
    importEdges.push(e);
  } else if (fileNodeMap.has(e.source) && fileNodeMap.has(e.target)) {
    // Keep other file-level-to-file-level edges for cross-category analysis
    otherEdges.push(e);
  }
  // Skip edges where either endpoint is a function (sub-file symbol)
}

// ====== A. DIRECTORY GROUPING ======
function getDirectoryGroup(filePath) {
  const parts = filePath.split('/');
  if (parts.length <= 1) return 'root';
  return parts[0];
}

// Find common prefix
function findCommonPrefix(paths) {
  if (paths.length === 0) return '';
  const parts = paths.map(p => p.split('/'));
  let prefix = [];
  const minLen = Math.min(...parts.map(p => p.length));
  for (let i = 0; i < minLen; i++) {
    const seg = parts[0][i];
    if (parts.every(p => p[i] === seg)) {
      prefix.push(seg);
    } else {
      break;
    }
  }
  return prefix.join('/');
}

const allPaths = fileNodes.map(n => n.filePath);
const commonPrefix = findCommonPrefix(allPaths);

function getGroup(filePath) {
  // Remove common prefix first
  let relative = filePath;
  if (commonPrefix && filePath.startsWith(commonPrefix + '/')) {
    relative = filePath.substring(commonPrefix.length + 1);
  } else if (commonPrefix && filePath === commonPrefix) {
    return 'root';
  }

  const parts = relative.split('/');
  if (parts.length === 0 || parts[0] === '') return 'root';

  // Get the first meaningful directory segment
  const first = parts[0];

  // For monorepo with packages/<pkg>/..., group by package name
  if (first === 'packages' && parts.length >= 2) {
    // Determine sub-group: packages/<pkg>/src/components/<module>/...
    // We group by package + component module
    if (
      parts.length >= 5 &&
      parts[2] === 'src' &&
      parts[3] === 'components' &&
      parts.length >= 5
    ) {
      const pkg = parts[1];
      const module = parts[4]; // e.g., form, table, component-provider
      return `${pkg}/${module}`;
    }
    if (parts.length >= 3 && parts[2] === 'src') {
      // src-level files: shared/core, shared/ui, etc.
      if (parts.length >= 4) {
        return `${parts[1]}/${parts[2]}/${parts[3]}`;
      }
      return `${parts[1]}/src`;
    }
    return `${parts[1]}`;
  }

  // For top-level groups like docs, scripts, configs
  return first;
}

// Also compute a TOP-LEVEL group (package level for monorepo)
function getTopGroup(filePath) {
  const parts = filePath.split('/');
  if (parts[0] === 'packages' && parts.length >= 2) {
    return `packages/${parts[1]}`;
  }
  return parts[0] || 'root';
}

const directoryGroups = {};
const topGroups = {};

for (const node of fileNodes) {
  const group = getGroup(node.filePath);
  if (!directoryGroups[group]) directoryGroups[group] = [];
  directoryGroups[group].push(node.id);

  const topGroup = getTopGroup(node.filePath);
  if (!topGroups[topGroup]) topGroups[topGroup] = [];
  topGroups[topGroup].push(node.id);
}

// Filter empty groups
for (const key of Object.keys(directoryGroups)) {
  if (directoryGroups[key].length === 0) delete directoryGroups[key];
}
for (const key of Object.keys(topGroups)) {
  if (topGroups[key].length === 0) delete topGroups[key];
}

// ====== B. NODE TYPE GROUPING ======
const nodeTypeGroups = {};
for (const node of fileNodes) {
  const type = node.type;
  if (!nodeTypeGroups[type]) nodeTypeGroups[type] = [];
  nodeTypeGroups[type].push(node.id);
}

// ====== C. IMPORT ADJACENCY MATRIX ======
const fileFanIn = {};
const fileFanOut = {};

// Initialize
for (const node of fileNodes) {
  fileFanIn[node.id] = 0;
  fileFanOut[node.id] = 0;
}

for (const e of importEdges) {
  if (!fileFanOut[e.source]) fileFanOut[e.source] = 0;
  fileFanOut[e.source]++;
  if (!fileFanIn[e.target]) fileFanIn[e.target] = 0;
  fileFanIn[e.target]++;
}

// Group-level import adjacency
const groupImportSets = {}; // group -> Set of groups it imports from
for (const group of Object.keys(directoryGroups)) {
  groupImportSets[group] = { from: new Set(), to: new Set() };
}

for (const e of importEdges) {
  const srcGroup = getGroup(fileNodeMap.get(e.source)?.filePath || '');
  const tgtGroup = getGroup(fileNodeMap.get(e.target)?.filePath || '');
  if (srcGroup && tgtGroup && srcGroup !== tgtGroup) {
    if (groupImportSets[srcGroup]) groupImportSets[srcGroup].from.add(tgtGroup);
    if (groupImportSets[tgtGroup]) groupImportSets[tgtGroup].to.add(srcGroup);
  }
}

// ====== D. CROSS-CATEGORY DEPENDENCY ANALYSIS ======
const crossCategoryEdges = [];
const ccMap = {}; // "fromType->toType::edgeType" -> count

// Also use allEdges that involve non-file nodes for richer cross-category
for (const e of allEdges) {
  const srcNode = allNodes.find(n => n.id === e.source);
  const tgtNode = allNodes.find(n => n.id === e.target);
  if (!srcNode || !tgtNode) continue;

  const srcType = fileNodeTypes.has(srcNode.type) ? srcNode.type : 'function';
  const tgtType = fileNodeTypes.has(tgtNode.type) ? tgtNode.type : 'function';

  if (srcType === 'function' && tgtType === 'function') continue; // Skip function->function

  const key = `${srcType}->${tgtType}::${e.type}`;
  ccMap[key] = (ccMap[key] || 0) + 1;
}

for (const [key, count] of Object.entries(ccMap)) {
  const [types, edgeType] = key.split('::');
  const [fromType, toType] = types.split('->');
  crossCategoryEdges.push({ fromType, toType, edgeType, count });
}

// ====== E. INTER-GROUP IMPORT FREQUENCY ======
const interGroupImportMap = {}; // "groupA->groupB" -> count

for (const e of importEdges) {
  const srcGroup = getGroup(fileNodeMap.get(e.source)?.filePath || '');
  const tgtGroup = getGroup(fileNodeMap.get(e.target)?.filePath || '');
  if (srcGroup && tgtGroup && srcGroup !== tgtGroup) {
    const key = `${srcGroup}->${tgtGroup}`;
    interGroupImportMap[key] = (interGroupImportMap[key] || 0) + 1;
  }
}

const interGroupImports = [];
for (const [key, count] of Object.entries(interGroupImportMap)) {
  const [from, to] = key.split('->');
  interGroupImports.push({ from, to, count });
}
interGroupImports.sort((a, b) => b.count - a.count);

// ====== F. INTRA-GROUP IMPORT DENSITY ======
const intraGroupDensity = {};

for (const [group, nodeIds] of Object.entries(directoryGroups)) {
  const idSet = new Set(nodeIds);
  let internalEdges = 0;
  let totalEdges = 0;

  for (const e of importEdges) {
    const srcIn = idSet.has(e.source);
    const tgtIn = idSet.has(e.target);
    if (srcIn || tgtIn) {
      totalEdges++;
      if (srcIn && tgtIn) {
        internalEdges++;
      }
    }
  }

  const density = totalEdges > 0 ? internalEdges / totalEdges : 0;
  intraGroupDensity[group] = { internalEdges, totalEdges, density };
}

// ====== G. DIRECTORY PATTERN MATCHING ======
const patternMap = {
  routes: 'api',
  api: 'api',
  controllers: 'api',
  endpoints: 'api',
  handlers: 'api',
  services: 'service',
  core: 'service',
  lib: 'service',
  domain: 'service',
  logic: 'service',
  models: 'data',
  db: 'data',
  data: 'data',
  persistence: 'data',
  repository: 'data',
  entities: 'data',
  components: 'ui',
  views: 'ui',
  pages: 'ui',
  ui: 'ui',
  layouts: 'ui',
  screens: 'ui',
  middleware: 'middleware',
  plugins: 'middleware',
  interceptors: 'middleware',
  guards: 'middleware',
  utils: 'utility',
  helpers: 'utility',
  common: 'utility',
  shared: 'utility',
  tools: 'utility',
  config: 'config',
  constants: 'config',
  env: 'config',
  settings: 'config',
  __tests__: 'test',
  test: 'test',
  tests: 'test',
  spec: 'test',
  specs: 'test',
  types: 'types',
  interfaces: 'types',
  schemas: 'types',
  contracts: 'types',
  dtos: 'types',
  hooks: 'hooks',
  store: 'state',
  state: 'state',
  reducers: 'state',
  actions: 'state',
  slices: 'state',
  assets: 'assets',
  static: 'assets',
  public: 'assets',
  migrations: 'data',
  management: 'config',
  commands: 'config',
  templatetags: 'utility',
  signals: 'service',
  serializers: 'api',
  cmd: 'entry',
  internal: 'service',
  pkg: 'utility',
  dto: 'types',
  request: 'types',
  response: 'types',
  entity: 'data',
  controller: 'api',
  routers: 'api',
  composables: 'service',
  blueprints: 'api',
  mailers: 'service',
  jobs: 'service',
  channels: 'service',
  bin: 'entry',
  docs: 'documentation',
  documentation: 'documentation',
  wiki: 'documentation',
  deploy: 'infrastructure',
  deployment: 'infrastructure',
  infra: 'infrastructure',
  infrastructure: 'infrastructure',
  '.github': 'ci-cd',
  '.gitlab': 'ci-cd',
  '.circleci': 'ci-cd',
  k8s: 'infrastructure',
  kubernetes: 'infrastructure',
  helm: 'infrastructure',
  charts: 'infrastructure',
  terraform: 'infrastructure',
  tf: 'infrastructure',
  docker: 'infrastructure',
  sql: 'data',
  database: 'data',
  schema: 'data',
};

const patternMatches = {};

for (const group of Object.keys(directoryGroups)) {
  // Try exact match first
  const lastSeg = group.split('/').pop().toLowerCase();
  if (patternMap[lastSeg]) {
    patternMatches[group] = patternMap[lastSeg];
  } else if (patternMap[group.toLowerCase()]) {
    patternMatches[group] = patternMap[group.toLowerCase()];
  } else {
    // Check for specific package/module patterns
    // e.g., "antd-vue-pro/form" -> last segment is "form" -> pattern is likely "ui" (form module)
    // e.g., "antd-vue-pro/table" -> "table"
    // e.g., "element-plus-pro/component-provider" -> "component-provider" -> "ui"
    if (['form', 'table', 'component-provider'].includes(lastSeg)) {
      patternMatches[group] = 'ui';
    } else if (lastSeg === 'shared') {
      patternMatches[group] = 'utility';
    } else if (lastSeg === 'core') {
      patternMatches[group] = 'service';
    } else if (['hooks', 'composables'].includes(lastSeg)) {
      patternMatches[group] = 'service';
    }
  }
}

// File-level pattern matching for ungrouped or ambiguous files
const filePatternMatches = {};
for (const node of fileNodes) {
  const fp = node.filePath;
  const fileName = fp.split('/').pop();

  // Test files
  if (
    /\.test\./.test(fileName) ||
    /\.spec\./.test(fileName) ||
    /^test_/.test(fileName) ||
    /_test\./.test(fileName) ||
    /Test\./.test(fileName) ||
    /_spec\./.test(fileName) ||
    /Test\.php$/.test(fileName) ||
    /Tests\.cs$/.test(fileName)
  ) {
    filePatternMatches[node.id] = 'test';
  }
  // TypeScript declaration files
  else if (/\.d\.ts$/.test(fileName)) {
    filePatternMatches[node.id] = 'types';
  }
  // Index/entry files
  else if (
    /^(index\.(ts|js|tsx|jsx)|__init__\.py|manage\.py)$/.test(fileName)
  ) {
    filePatternMatches[node.id] = 'entry';
  }
  // Configuration files
  else if (
    /^(Cargo\.toml|go\.mod|Gemfile|pom\.xml|build\.gradle|composer\.json)$/.test(
      fileName
    )
  ) {
    filePatternMatches[node.id] = 'config';
  }
  // WSGI/ASGI
  else if (/^(wsgi\.py|asgi\.py|config\.ru)$/.test(fileName)) {
    filePatternMatches[node.id] = 'config';
  }
  // Main entry
  else if (
    /^(main\.(go|rs)|lib\.rs|Application\.java|Program\.cs)$/.test(fileName)
  ) {
    filePatternMatches[node.id] = 'entry';
  }
  // Docker
  else if (/^Dockerfile/.test(fileName) || /^docker-compose/.test(fileName)) {
    filePatternMatches[node.id] = 'infrastructure';
  }
  // Terraform
  else if (/\.(tf|tfvars)$/.test(fileName)) {
    filePatternMatches[node.id] = 'infrastructure';
  }
  // CI/CD
  else if (
    /\.github\/workflows\//.test(fp) ||
    /\.gitlab-ci\.yml$/.test(fileName) ||
    /^Jenkinsfile$/.test(fileName)
  ) {
    filePatternMatches[node.id] = 'ci-cd';
  }
  // SQL
  else if (/\.sql$/.test(fileName)) {
    filePatternMatches[node.id] = 'data';
  }
  // GraphQL / Proto
  else if (/\.(graphql|gql|proto)$/.test(fileName)) {
    filePatternMatches[node.id] = 'types';
  }
  // Markdown
  else if (/\.(md|rst)$/.test(fileName)) {
    filePatternMatches[node.id] = 'documentation';
  }
  // Makefile
  else if (/^Makefile$/.test(fileName)) {
    filePatternMatches[node.id] = 'infrastructure';
  }
  // Vue SFC components in components/ directories
  else if (
    fp.includes('/components/') &&
    (fileName.endsWith('.vue') || fileName === 'index.ts')
  ) {
    // already handled by directory grouping
  }
}

// ====== H. DEPLOYMENT TOPOLOGY DETECTION ======
const deploymentTopology = {
  hasDockerfile: false,
  hasCompose: false,
  hasK8s: false,
  hasTerraform: false,
  hasCI: false,
  infraFiles: [],
};

for (const node of fileNodes) {
  const fp = node.filePath;
  const fn = fp.split('/').pop();

  if (/^Dockerfile/i.test(fn)) {
    deploymentTopology.hasDockerfile = true;
    deploymentTopology.infraFiles.push(fp);
  }
  if (/^docker-compose/.test(fn)) {
    deploymentTopology.hasCompose = true;
    deploymentTopology.infraFiles.push(fp);
  }
  if (
    /\.(tf|tfvars)$/.test(fn) ||
    fp.includes('kubernetes') ||
    fp.includes('k8s') ||
    fp.includes('helm')
  ) {
    deploymentTopology.hasK8s = true;
    deploymentTopology.infraFiles.push(fp);
  }
  if (fp.includes('terraform') || /\.tf$/.test(fn)) {
    deploymentTopology.hasTerraform = true;
    deploymentTopology.infraFiles.push(fp);
  }
  if (
    fp.includes('.github/workflows') ||
    fp.includes('.gitlab-ci') ||
    fn === 'Jenkinsfile'
  ) {
    deploymentTopology.hasCI = true;
    deploymentTopology.infraFiles.push(fp);
  }
}

// ====== I. DATA PIPELINE DETECTION ======
const dataPipeline = {
  schemaFiles: [],
  migrationFiles: [],
  dataModelFiles: [],
  apiHandlerFiles: [],
};

for (const node of fileNodes) {
  const fp = node.filePath;

  if (/\.(sql|graphql|gql|proto)$/.test(fp)) {
    dataPipeline.schemaFiles.push(fp);
  }
  if (fp.includes('migration')) {
    dataPipeline.migrationFiles.push(fp);
  }
  if (
    fp.includes('/types/') ||
    fp.includes('/models/') ||
    fp.includes('/entities/')
  ) {
    dataPipeline.dataModelFiles.push(fp);
  }
  if (
    fp.includes('/routes/') ||
    fp.includes('/api/') ||
    fp.includes('/controllers/') ||
    fp.includes('/handlers/')
  ) {
    dataPipeline.apiHandlerFiles.push(fp);
  }
}

// ====== J. DOCUMENTATION COVERAGE ======
const docCoverage = {
  groupsWithDocs: 0,
  totalGroups: Object.keys(directoryGroups).length,
  coverageRatio: 0,
  undocumentedGroups: [],
};

const docNodeSet = new Set();
for (const node of fileNodes) {
  if (node.type === 'document' || /\.(md|rst)$/.test(node.filePath)) {
    docNodeSet.add(node.filePath);
  }
}

for (const [group, nodeIds] of Object.entries(directoryGroups)) {
  const hasDoc = nodeIds.some(id => {
    const n = fileNodeMap.get(id);
    return n && (n.type === 'document' || /\.(md|rst)$/.test(n.filePath));
  });

  if (hasDoc) {
    docCoverage.groupsWithDocs++;
  } else {
    docCoverage.undocumentedGroups.push(group);
  }
}
docCoverage.coverageRatio =
  docCoverage.totalGroups > 0
    ? docCoverage.groupsWithDocs / docCoverage.totalGroups
    : 0;

// ====== K. DEPENDENCY DIRECTION ======
const dependencyDirection = [];
const pairDirections = {}; // "A<->B" -> { AtoB: count, BtoA: count }

for (const e of importEdges) {
  const srcGroup = getGroup(fileNodeMap.get(e.source)?.filePath || '');
  const tgtGroup = getGroup(fileNodeMap.get(e.target)?.filePath || '');
  if (srcGroup && tgtGroup && srcGroup !== tgtGroup) {
    const pairKey = [srcGroup, tgtGroup].sort().join('<->');
    if (!pairDirections[pairKey]) pairDirections[pairKey] = {};
    const dirKey = `${srcGroup}->${tgtGroup}`;
    pairDirections[pairKey][dirKey] =
      (pairDirections[pairKey][dirKey] || 0) + 1;
  }
}

for (const [pair, dirs] of Object.entries(pairDirections)) {
  const entries = Object.entries(dirs);
  if (entries.length === 2) {
    const [dirA, countA] = entries[0];
    const [dirB, countB] = entries[1];
    if (countA > countB) {
      const [from, to] = dirA.split('->');
      dependencyDirection.push({ dependent: from, dependsOn: to });
    } else if (countB > countA) {
      const [from, to] = dirB.split('->');
      dependencyDirection.push({ dependent: from, dependsOn: to });
    }
    // If equal, both directions recorded
  } else if (entries.length === 1) {
    const [dir, count] = entries[0];
    const [from, to] = dir.split('->');
    dependencyDirection.push({ dependent: from, dependsOn: to });
  }
}

// ====== FILE STATS ======
const fileStats = {
  totalFileNodes: fileNodes.length,
  filesPerGroup: {},
  nodeTypeCounts: {},
};

for (const [group, ids] of Object.entries(directoryGroups)) {
  fileStats.filesPerGroup[group] = ids.length;
}
for (const [type, ids] of Object.entries(nodeTypeGroups)) {
  fileStats.nodeTypeCounts[type] = ids.length;
}

// ====== OUTPUT ======
const results = {
  scriptCompleted: true,
  commonPrefix,
  directoryGroups,
  topGroups,
  nodeTypeGroups,
  crossCategoryEdges,
  interGroupImports,
  intraGroupDensity,
  patternMatches,
  filePatternMatches,
  deploymentTopology,
  dataPipeline,
  docCoverage,
  dependencyDirection,
  fileStats,
  fileFanIn,
  fileFanOut,
};

try {
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2), 'utf8');
} catch (e) {
  console.error('ERROR: Failed to write output file:', e.message);
  process.exit(1);
}

console.log(
  `Analysis complete. ${fileNodes.length} file-level nodes, ${importEdges.length} import edges, ${allEdges.length} total edges.`
);
console.log(`Results written to ${outputPath}`);

process.exit(0);
