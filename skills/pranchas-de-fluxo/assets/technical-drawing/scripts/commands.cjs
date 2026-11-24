const fs = require('node:fs'), {execFileSync} = require('node:child_process');

function has(command) {
  try {
    execFileSync(process.platform === 'win32' ? 'where.exe' : 'which', [command], {stdio: 'ignore'});
    return true;
  } catch {
    return false;
  }
}

function findChrome() {
  if (process.platform === 'win32') {
    return [process.env.PROGRAMFILES, process.env.LOCALAPPDATA, process.env['PROGRAMFILES(X86)']]
      .filter(Boolean)
      .map(root => require('node:path').join(root, 'Google', 'Chrome', 'Application', 'chrome.exe'))
      .find(candidate => fs.existsSync(candidate));
  }
  const candidates = ['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/Applications/Chromium.app/Contents/MacOS/Chromium', 'google-chrome', 'chromium', 'chromium-browser'];
  return candidates.find(c => c.startsWith('/') ? fs.existsSync(c) : has(c));
}

module.exports = {has, findChrome};
