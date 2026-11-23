const fs = require('fs');
const path = require('path');

const targetFile = path.resolve(__dirname, '../node_modules/@nestjs/cli/lib/utils/tree-kill.js');

if (fs.existsSync(targetFile)) {
  let content = fs.readFileSync(targetFile, 'utf8');
  if (content.includes("execSync('taskkill /pid ' + pid + ' /T /F');")) {
    content = content.replace(
      "execSync('taskkill /pid ' + pid + ' /T /F');",
      "try { (0, child_process_1.execSync)('taskkill /pid ' + pid + ' /T /F', { stdio: 'ignore' }); } catch (e) { /* ignore */ }"
    );
    fs.writeFileSync(targetFile, content, 'utf8');
    console.log('[PATCH] Successfully patched @nestjs/cli treeKillSync for Windows safe execution!');
  } else {
    console.log('[PATCH] @nestjs/cli treeKillSync already patched or safe.');
  }
} else {
  console.log('[PATCH] Target file not found, skipping patch.');
}
