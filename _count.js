const fs = require('fs');
const path = require('path');

function countFiles(dir, exts) {
  let c = 0;
  function walk(d) {
    const entries = fs.readdirSync(d, { withFileTypes: true });
    for (const e of entries) {
      const fp = path.join(d, e.name);
      if (e.isDirectory() && e.name !== 'node_modules' && e.name !== 'dist' && e.name !== '.git') {
        walk(fp);
      } else if (exts.some(x => e.name.endsWith(x))) {
        c++;
      }
    }
  }
  walk(dir);
  return c;
}

const vue = countFiles('pages', ['.vue']);
const js = countFiles('utils', ['.js']);
const json = countFiles('data', ['.json']);
const css = countFiles('static', ['.css']);
const scss = countFiles('static', ['.scss']);
const html = countFiles('static', ['.html']);
const staticJson = countFiles('static', ['.json']);
const staticJs = countFiles('static', ['.js']);
const scripts = countFiles('scripts', ['.js']);

const rootFiles = ['server.cjs','index.html','main.js','App.vue','pages.json','manifest.json',
  'vite.config.js','package.json','uni.scss','README.md','Dockerfile','docker-compose.yml',
  'demo.bat','demo.sh','.gitignore'].filter(f => fs.existsSync(f));

console.log('pages/*.vue:     ' + vue);
console.log('utils/*.js:      ' + js);
console.log('data/*.json:     ' + json);
console.log('static/*.css:    ' + css);
console.log('static/*.scss:   ' + scss);
console.log('static (html+json+js): ' + (html + staticJson + staticJs));
console.log('scripts/*.js:    ' + scripts);
console.log('root files:      ' + rootFiles.length);
console.log('docs/*.md:       ' + countFiles('docs', ['.md']));
console.log('---');
console.log('TOTAL: ' + (vue + js + json + css + scss + html + staticJson + staticJs + scripts + rootFiles.length + countFiles('docs', ['.md'])));
