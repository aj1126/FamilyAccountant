#!/usr/bin/env node
// check-mobile-tooling.cjs - SPEC-FA-deps V-step: proves the Expo 51 tooling still works on the overridden majors.
// Usage: node check-mobile-tooling.cjs <FamilyAccountant repo root>
// Prints one PASS/FAIL line per check, then "RESULT pass=<n> fail=<n>"; exit code = number of FAILs.
// Read-only for the repo: it writes only under the OS temp dir and removes what it wrote.
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');

const repo = path.resolve(process.argv[2] || '.');
let pass = 0;
let fail = 0;
function check(name, ok, detail) {
  if (ok) pass++; else fail++;
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${detail ? ' -- ' + detail : ''}`);
}
function pkgDir(name, from) {
  return path.dirname(require.resolve(`${name}/package.json`, { paths: [from] }));
}
function version(dir) {
  return JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf8')).version;
}
function atLeast(v, min) {
  const a = v.split(/[.-]/).map(Number);
  const b = min.split('.').map(Number);
  for (let i = 0; i < 3; i++) { if (a[i] !== b[i]) return a[i] > b[i]; }
  return true;
}

async function main() {
  const mobile = path.join(repo, 'packages', 'mobile');
  const expoDir = pkgDir('expo', mobile);
  const cliDir = pkgDir('@expo/cli', expoDir);
  const tarDir = pkgDir('tar', cliDir);
  const tarV = version(tarDir);
  check('C1 @expo/cli is 0.18.31 (the patched version)', version(cliDir) === '0.18.31', version(cliDir));
  check('C2 tar seen by @expo/cli >= 7.5.21', atLeast(tarV, '7.5.21'), tarV);

  const tarMod = require(tarDir);
  const unpatched = tarMod && tarMod.__esModule ? tarMod : { default: tarMod };
  check('C3 control: unpatched interop gives no extract (why the patch exists)',
    typeof (unpatched.default && unpatched.default.extract) !== 'function', `typeof=${typeof (unpatched.default && unpatched.default.extract)}`);

  for (const f of ['tar.js', 'npm.js']) {
    const src = fs.readFileSync(path.join(cliDir, 'build', 'src', 'utils', f), 'utf8');
    check(`C4 patch present in utils/${f}`, src.includes('{ default: require("tar") }') && !src.includes('_interopRequireDefault(require("tar"))'));
  }

  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'fa-mobile-check-'));
  try {
    const src = path.join(tmp, 'src', 'package');
    fs.mkdirSync(src, { recursive: true });
    fs.writeFileSync(path.join(src, 'hello.txt'), 'fa-deps\n');
    const tgz = path.join(tmp, 'probe.tgz');
    await tarMod.c({ gzip: true, file: tgz, cwd: path.join(tmp, 'src') }, ['package']);

    // utils/tar.js extractAsync: JS-tar branch (the one Windows uses); force it on every OS.
    const out1 = path.join(tmp, 'out1');
    fs.mkdirSync(out1);
    const realPlatform = Object.getOwnPropertyDescriptor(process, 'platform');
    Object.defineProperty(process, 'platform', { value: 'win32' });
    let err1 = '';
    try {
      await require(path.join(cliDir, 'build', 'src', 'utils', 'tar.js')).extractAsync(tgz, out1);
    } catch (e) {
      err1 = e.message;
    } finally {
      Object.defineProperty(process, 'platform', realPlatform);
    }
    const f1 = path.join(out1, 'package', 'hello.txt');
    check('C5 expo extractAsync (JS tar) extracts', !err1 && fs.existsSync(f1) && fs.readFileSync(f1, 'utf8') === 'fa-deps\n', err1);

    // utils/npm.js extractNpmTarballAsync: the template-download path (always JS tar).
    const out2 = path.join(tmp, 'out2');
    let err2 = '';
    try {
      await require(path.join(cliDir, 'build', 'src', 'utils', 'npm.js'))
        .extractNpmTarballAsync(fs.createReadStream(tgz), { cwd: out2, name: 'probe-app', strip: 1 });
    } catch (e) { err2 = e.message; }
    const f2 = path.join(out2, 'hello.txt');
    check('C6 expo extractNpmTarballAsync extracts (strip 1)', !err2 && fs.existsSync(f2), err2);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }

  // @xmldom/xmldom 0.7 -> 0.8 under @expo/plist
  const plistDir = pkgDir('@expo/plist', cliDir);
  const xmlV = version(pkgDir('@xmldom/xmldom', plistDir));
  check('C7 xmldom seen by @expo/plist >= 0.8.15', atLeast(xmlV, '0.8.15'), xmlV);
  let parsed;
  try {
    parsed = require(plistDir).default.parse('<?xml version="1.0" encoding="UTF-8"?><plist version="1.0"><dict><key>a</key><string>b</string></dict></plist>');
  } catch (e) { parsed = e.message; }
  check('C8 @expo/plist parses a plist', parsed && parsed.a === 'b', JSON.stringify(parsed));

  // turbo-stream 2 -> 3 under @remix-run/server-runtime (expo-router -> @expo/server -> @remix-run/node)
  const routerDir = pkgDir('expo-router', mobile);
  const serverDir = pkgDir('@expo/server', routerDir);
  const nodeDir = pkgDir('@remix-run/node', serverDir);
  const rtDir = pkgDir('@remix-run/server-runtime', nodeDir);
  const tsV = version(pkgDir('turbo-stream', rtDir));
  check('C9 turbo-stream seen by server-runtime >= 3.0.0', atLeast(tsV, '3.0.0'), tsV);
  check('C10 server-runtime >= 2.17.5', atLeast(version(rtDir), '2.17.5'), version(rtDir));
  let loadErr = '';
  try { require(nodeDir); require(serverDir); } catch (e) { loadErr = e.message; }
  check('C11 @remix-run/node and @expo/server load', !loadErr, loadErr);

  console.log(`RESULT pass=${pass} fail=${fail}`);
  process.exit(fail);
}
main().catch((e) => { console.log(`FAIL crashed -- ${e.stack}`); process.exit(99); });
