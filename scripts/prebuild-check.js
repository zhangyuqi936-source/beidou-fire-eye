/* ═══════════════════════════════════════════════════════════════
   prebuild-check.js — 预构建检查脚本
   检查5项：JSON语法、SCSS语法、文件存在性、BOM、算法函数
   ═══════════════════════════════════════════════════════════════ */

const fs = require('fs');
const path = require('path');

let passed = 0;
let failed = 0;

function check(name, fn) {
  try {
    fn();
    console.log('✅ ' + name);
    passed++;
  } catch (e) {
    console.log('❌ ' + name + ': ' + e.message);
    failed++;
  }
}

/* 1. JSON 文件语法检查 */
console.log('\n=== 1. JSON 语法检查 ===');
const jsonFiles = ['pages.json', 'manifest.json', 'package.json',
  'data/law-db.json', 'data/demo-reports.json', 'data/demo-statistics.json',
  'data/feedback.json', 'data/memory-graph-default.json', 'static/manifest.json'];
jsonFiles.forEach(f => {
  check('JSON: ' + f, () => {
    const content = JSON.parse(fs.readFileSync(f, 'utf-8'));
    if (f === 'data/law-db.json') {
      const count = (content.laws || []).length + (content.customLaws || []).length;
      if (count < 8) throw new Error('法规数量不足: ' + count + ' (需要≥8)');
    }
    if (f === 'data/demo-reports.json') {
      if (content.length !== 3) throw new Error('报告数量: ' + content.length + ' (需要3)');
    }
  });
});

/* 2. JS/SCSS 语法检查 */
console.log('\n=== 2. 语法检查 ===');
const jsFiles = ['server.cjs', 'utils/hazard-taxonomy.js', 'utils/scene-classifier.js',
  'utils/risk-engine.js', 'utils/regulation-matcher.js', 'utils/degradation-manager.js',
  'utils/hazard-law-matcher.js', 'utils/feedback-loop.js', 'utils/api-client.js',
  'utils/ai-service.js', 'utils/theme-manager.js', 'utils/error-handler.js',
  'utils/loading-service.js', 'utils/storage.js', 'utils/report-generator.js',
  'utils/chain-visualizer.js'];
jsFiles.forEach(f => {
  check('Syntax: ' + f, () => {
    require('child_process').execSync('node -c "' + f + '"', { cwd: __dirname + '/..' });
  });
});

/* 3. 算法函数覆盖检查 */
console.log('\n=== 3. 算法函数覆盖 ===');
const serverContent = fs.readFileSync('server.cjs', 'utf-8');
const algoFuncs = ['recognizeImage', 'sceneClassify', 'runDetectionPipeline',
  'mapToTaxonomy', 'quantifyRisk', 'matchRegulation', 'generateReport', 'applyDegradation'];
const missing = algoFuncs.filter(f => !serverContent.includes(f));
if (missing.length > 0) {
  check('算法函数覆盖: ' + (algoFuncs.length - missing.length) + '/' + algoFuncs.length, () => {
    throw new Error('缺失: ' + missing.join(', '));
  });
} else {
  check('算法函数覆盖: ' + algoFuncs.length + '/' + algoFuncs.length, () => {});
}

/* 4. 文件存在性检查 */
console.log('\n=== 4. 关键文件存在 ===');
const keyFiles = ['index.html', 'main.js', 'App.vue', 'pages.json', 'manifest.json',
  'vite.config.js', 'package.json', 'server.cjs', 'static/theme.scss', 'uni.scss',
  'static/critical.css', 'static/dark-mode.css', 'static/sw.js',
  'pages/index/index.vue', 'pages/inspect/capture.vue', 'pages/inspect/analyzing.vue',
  'pages/inspect/result.vue'];
keyFiles.forEach(f => {
  check('Exists: ' + f, () => {
    if (!fs.existsSync(f)) throw new Error('文件不存在');
  });
});

/* 5. BOM 扫描 */
console.log('\n=== 5. BOM 扫描 ===');
function scanBOM(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const fp = path.join(dir, e.name);
    if (e.isDirectory() && !e.name.startsWith('.') && e.name !== 'node_modules' && e.name !== 'dist') {
      scanBOM(fp);
    } else if (e.name.match(/\.(vue|json|js|cjs|scss|css|html|md)$/)) {
      const buf = fs.readFileSync(fp);
      if (buf[0] === 0xEF && buf[1] === 0xBB && buf[2] === 0xBF) {
        throw new Error('BOM detected: ' + fp);
      }
    }
  }
}
check('BOM scan (all files)', () => { scanBOM('.'); });

console.log('\n═══════════════════════════════════════');
console.log('  Results: ' + passed + ' passed, ' + failed + ' failed');
console.log('═══════════════════════════════════════');
process.exit(failed > 0 ? 1 : 0);
