#!/usr/bin/env node
/**
 * Verify npm package.json "overrides" against the natural resolution.
 *
 * Two npm behaviors make this harder than a lockfile diff:
 *   1. A plain `npm install` does not re-resolve when an override changes, so
 *      the lockfile and `npm ls` keep showing the pinned version.
 *   2. A re-resolution run inside the repo still reuses the installed
 *      node_modules, so "natural" versions come back biased to what is pinned.
 *
 * This script sidesteps both. It copies package.json into a throwaway
 * directory with no node_modules and no lockfile, removes one override, and
 * lets npm resolve the tree from the registry. That version is the natural
 * resolution. The repo is never modified during a check.
 */

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execSync } from 'node:child_process';

const EXIT_OK = 0;
const EXIT_ERROR = 1;
const EXIT_CHANGES = 2;

const IGNORE_DIRS = new Set(['.git', 'node_modules', 'dist', 'build', 'coverage']);

function printHelp() {
  process.stdout.write(`Usage: analyze-overrides.mjs [options]

Measure each npm "overrides" entry against a clean, isolated re-resolution.

Options:
  --repo <path>       Repository root. Default: current directory.
  --only <a,b,c>      Check only these override names.
  --list              Print overrides and parent chains. Run no installs.
  --apply             Remove the redundant overrides from package.json.
  --json              Emit machine-readable JSON on stdout.
  --timeout <ms>      Per-resolution timeout. Default: 600000.
  --keep-temp         Keep the temp resolution directory.
  --exit-code         Exit 2 when redundant overrides are found.
  -h, --help          Show this help.

Exit codes: 0 ok, 1 error, 2 changes found (with --exit-code).
`);
}

function parseArgs(argv) {
  const out = {
    repo: process.cwd(),
    only: null,
    list: false,
    apply: false,
    json: false,
    timeout: 600000,
    keepTemp: false,
    exitCode: false,
  };
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === '--repo') out.repo = argv[(i += 1)];
    else if (a === '--only') {
      out.only = argv[(i += 1)]
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
    } else if (a === '--list') out.list = true;
    else if (a === '--apply') out.apply = true;
    else if (a === '--json') out.json = true;
    else if (a === '--timeout') out.timeout = Number(argv[(i += 1)]);
    else if (a === '--keep-temp') out.keepTemp = true;
    else if (a === '--exit-code') out.exitCode = true;
    else if (a === '-h' || a === '--help') {
      printHelp();
      process.exit(EXIT_OK);
    } else throw new Error(`Unknown argument: ${a}`);
  }
  return out;
}

// --- version comparison -----------------------------------------------------

function parseVersion(value) {
  const noBuild = String(value).split('+')[0];
  const dash = noBuild.indexOf('-');
  const core = dash === -1 ? noBuild : noBuild.slice(0, dash);
  const pre = dash === -1 ? '' : noBuild.slice(dash + 1);
  const nums = core.split('.').map((n) => parseInt(n, 10));
  while (nums.length < 3) nums.push(0);
  return { nums, pre };
}

function comparePrerelease(a, b) {
  if (a === b) return 0;
  if (a === '') return 1;
  if (b === '') return -1;
  const as = a.split('.');
  const bs = b.split('.');
  for (let i = 0; i < Math.max(as.length, bs.length); i += 1) {
    const x = as[i];
    const y = bs[i];
    if (x === undefined) return -1;
    if (y === undefined) return 1;
    const xn = /^\d+$/.test(x);
    const yn = /^\d+$/.test(y);
    if (xn && yn) {
      if (Number(x) !== Number(y)) return Number(x) - Number(y);
    } else if (xn) return -1;
    else if (yn) return 1;
    else if (x !== y) return x < y ? -1 : 1;
  }
  return 0;
}

function compareVersions(a, b) {
  const A = parseVersion(a);
  const B = parseVersion(b);
  for (let i = 0; i < 3; i += 1) {
    if (A.nums[i] !== B.nums[i]) return A.nums[i] - B.nums[i];
  }
  return comparePrerelease(A.pre, B.pre);
}

function minVersion(copies) {
  let min = null;
  for (const copy of copies) {
    if (min === null || compareVersions(copy.version, min) < 0) min = copy.version;
  }
  return min;
}

// --- override parsing -------------------------------------------------------

function overrideName(key) {
  if (key.startsWith('@')) {
    const idx = key.indexOf('@', 1);
    return idx === -1 ? key : key.slice(0, idx);
  }
  const idx = key.indexOf('@');
  return idx === -1 ? key : key.slice(0, idx);
}

function resolveSpec(spec, pkg) {
  if (typeof spec === 'string' && spec.startsWith('$')) {
    const ref = spec.slice(1);
    const found =
      pkg.dependencies?.[ref] ??
      pkg.devDependencies?.[ref] ??
      pkg.peerDependencies?.[ref] ??
      pkg.optionalDependencies?.[ref];
    return found ?? spec;
  }
  return spec;
}

function collectOverrides(pkg) {
  const overrides = pkg.overrides;
  if (!overrides || typeof overrides !== 'object') return [];
  const entries = [];
  for (const [key, value] of Object.entries(overrides)) {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      for (const [child, spec] of Object.entries(value)) {
        entries.push({
          topKey: key,
          name: overrideName(child),
          parent: key,
          nestedKey: child,
          spec: resolveSpec(spec, pkg),
          rawSpec: spec,
          isRef: typeof spec === 'string' && spec.startsWith('$'),
        });
      }
    } else {
      entries.push({
        topKey: key,
        name: overrideName(key),
        parent: null,
        nestedKey: null,
        spec: resolveSpec(value, pkg),
        rawSpec: value,
        isRef: typeof value === 'string' && value.startsWith('$'),
      });
    }
  }
  return entries;
}

function entryId(entry) {
  return `${entry.topKey}|${entry.parent ?? ''}|${entry.nestedKey ?? ''}`;
}

function withoutEntry(pkg, entry) {
  const clone = JSON.parse(JSON.stringify(pkg));
  if (!clone.overrides) return clone;
  if (entry.parent) {
    const parentObj = clone.overrides[entry.topKey];
    if (parentObj && typeof parentObj === 'object') {
      delete parentObj[entry.nestedKey];
      if (Object.keys(parentObj).length === 0) delete clone.overrides[entry.topKey];
    }
  } else {
    delete clone.overrides[entry.topKey];
  }
  if (Object.keys(clone.overrides).length === 0) delete clone.overrides;
  return clone;
}

// --- file helpers -----------------------------------------------------------

function detectIndent(text) {
  const m = text.match(/\n(\s+)"/);
  return m ? m[1] : '  ';
}

function sleepSync(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

function retry(fn, attempts = 5, delayMs = 250) {
  let lastError;
  for (let i = 0; i < attempts; i += 1) {
    try {
      return fn();
    } catch (error) {
      lastError = error;
      if (i < attempts - 1) sleepSync(delayMs);
    }
  }
  throw lastError;
}

function writePackageJson(file, pkg, indent, trailingNewline) {
  let text = JSON.stringify(pkg, null, indent);
  if (trailingNewline) text += '\n';
  retry(() => fs.writeFileSync(file, text));
}

function readJsonRetry(file) {
  return retry(() => JSON.parse(fs.readFileSync(file, 'utf8')));
}

// --- lockfile queries -------------------------------------------------------

function findCopies(lock, name) {
  const suffix = `node_modules/${name}`;
  const out = [];
  for (const [key, entry] of Object.entries(lock.packages || {})) {
    if (key === suffix || key.endsWith(`/${suffix}`)) {
      out.push({
        path: key,
        version: entry.version,
        dev: Boolean(entry.dev),
        peer: Boolean(entry.peer),
      });
    }
  }
  return out;
}

function findParents(lock, name) {
  const out = [];
  for (const [key, entry] of Object.entries(lock.packages || {})) {
    for (const field of ['dependencies', 'peerDependencies', 'optionalDependencies']) {
      const spec = entry?.[field]?.[name];
      if (spec) {
        out.push({
          parent: key === '' ? '(root)' : key,
          parentVersion: entry.version || '',
          range: spec,
          field,
        });
      }
    }
  }
  return out;
}

// --- isolated resolution ----------------------------------------------------

function expandWorkspaceDirs(repo, pattern) {
  const dirs = [];
  if (pattern.includes('**')) {
    const base = pattern.slice(0, pattern.indexOf('**')).replace(/\/+$/, '');
    const walk = (dir) => {
      if (!fs.existsSync(dir)) return;
      for (const name of fs.readdirSync(dir)) {
        if (IGNORE_DIRS.has(name)) continue;
        const child = path.join(dir, name);
        if (!fs.statSync(child).isDirectory()) continue;
        if (fs.existsSync(path.join(child, 'package.json'))) dirs.push(child);
        walk(child);
      }
    };
    walk(path.resolve(repo, base));
    return dirs;
  }
  if (pattern.includes('*')) {
    const idx = pattern.indexOf('*');
    const base = path.resolve(repo, pattern.slice(0, idx).replace(/\/+$/, ''));
    const tail = pattern.slice(idx + 1).replace(/^\/+/, '');
    if (!fs.existsSync(base)) return dirs;
    for (const name of fs.readdirSync(base)) {
      const child = path.join(base, name);
      if (!fs.statSync(child).isDirectory() || IGNORE_DIRS.has(name)) continue;
      const target = tail ? path.join(child, tail) : child;
      if (fs.existsSync(path.join(target, 'package.json'))) dirs.push(target);
    }
    return dirs;
  }
  const direct = path.resolve(repo, pattern);
  if (fs.existsSync(path.join(direct, 'package.json'))) dirs.push(direct);
  return dirs;
}

function workspacePatterns(pkg) {
  const ws = pkg.workspaces;
  if (!ws) return [];
  if (Array.isArray(ws)) return ws;
  if (Array.isArray(ws.packages)) return ws.packages;
  return [];
}

function setupTempWorkspace(repo, pkg, tempDir, manifestText, indent, trailingNewline) {
  const warnings = [];
  for (const name of ['.npmrc', '.npmrc.local']) {
    const src = path.join(repo, name);
    if (fs.existsSync(src)) fs.copyFileSync(src, path.join(tempDir, name));
  }
  const patterns = workspacePatterns(pkg);
  for (const pattern of patterns) {
    for (const dir of expandWorkspaceDirs(repo, pattern)) {
      const rel = path.relative(repo, dir);
      if (!rel || rel.startsWith('..')) continue;
      const destDir = path.join(tempDir, rel);
      fs.mkdirSync(destDir, { recursive: true });
      fs.copyFileSync(path.join(dir, 'package.json'), path.join(destDir, 'package.json'));
    }
  }
  if (patterns.length > 0) {
    warnings.push(
      `Workspaces detected (${patterns.join(', ')}). Copied member manifests. Verify results.`,
    );
  }
  writePackageJson(path.join(tempDir, 'package.json'), pkg, indent, trailingNewline);
  return warnings;
}

function resolveWithout(repo, basePkg, entry, tempDir, indent, trailingNewline, timeout) {
  const target = path.join(tempDir, 'package.json');
  writePackageJson(target, withoutEntry(basePkg, entry), indent, trailingNewline);
  const tempLock = path.join(tempDir, 'package-lock.json');
  fs.rmSync(tempLock, { force: true, maxRetries: 5, retryDelay: 250 });
  execSync('npm install --package-lock-only --ignore-scripts --no-audit --no-fund', {
    cwd: tempDir,
    timeout,
    stdio: ['ignore', 'pipe', 'pipe'],
    encoding: 'utf8',
  });
  return readJsonRetry(tempLock);
}

// --- reporting --------------------------------------------------------------

function currentBranch(repo) {
  try {
    return execSync('git rev-parse --abbrev-ref HEAD', {
      cwd: repo,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch {
    return null;
  }
}

function renderText(repo, results, redundant, applied, warnings) {
  const lines = [];
  lines.push(`Override check: ${repo}`);
  lines.push('');
  const pad = Math.max(8, ...results.map((r) => r.name.length));
  lines.push(`  ${'Override'.padEnd(pad)}  ${'Pinned'.padEnd(10)}  ${'Natural'.padEnd(10)}  Verdict`);
  for (const r of results) {
    lines.push(
      `  ${r.name.padEnd(pad)}  ${String(r.before ?? '-').padEnd(10)}  ${String(
        r.after ?? '-',
      ).padEnd(10)}  ${r.verdict}`,
    );
  }
  lines.push('');
  for (const r of results) {
    if (r.verdict === 'REDUNDANT' || r.verdict === 'REVIEW' || r.verdict === 'ERROR') {
      lines.push(`${r.name}: ${r.verdict}`);
      lines.push(`  spec:    ${r.spec}`);
      if (r.reason) lines.push(`  reason:  ${r.reason}`);
      for (const p of r.beforeParents || []) {
        lines.push(`  parent:  ${p.parent}@${p.parentVersion} requires ${p.range} (${p.field})`);
      }
      lines.push('');
    }
  }
  for (const w of warnings) lines.push(`NOTE: ${w}`);
  if (warnings.length > 0) lines.push('');
  if (applied) {
    lines.push(
      redundant.length > 0
        ? `Removed ${redundant.length} redundant override(s) from package.json.`
        : 'No redundant overrides to remove.',
    );
  } else if (redundant.length > 0) {
    lines.push(`${redundant.length} override(s) can be removed. Re-run with --apply.`);
  } else {
    lines.push('No redundant overrides. Nothing to remove.');
  }
  return lines.join('\n');
}

function output(payload, asJson, text) {
  if (asJson) process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
  else if (text) process.stdout.write(`${text}\n`);
}

// --- main -------------------------------------------------------------------

function main() {
  const args = parseArgs(process.argv.slice(2));
  const repo = path.resolve(args.repo);
  const pkgPath = path.join(repo, 'package.json');
  const lockPath = path.join(repo, 'package-lock.json');

  if (!fs.existsSync(pkgPath)) throw new Error(`No package.json in ${repo}`);
  if (!fs.existsSync(lockPath)) throw new Error(`No package-lock.json in ${repo}`);

  const pkgText = fs.readFileSync(pkgPath, 'utf8');
  const pkg = JSON.parse(pkgText);
  const indent = detectIndent(pkgText);
  const trailingNewline = pkgText.endsWith('\n');

  let entries = collectOverrides(pkg);
  if (args.only) entries = entries.filter((e) => args.only.includes(e.name));
  if (entries.length === 0) {
    output({ repo, overrides: 0, results: [] }, args.json, 'No overrides to check.');
    process.exit(EXIT_OK);
  }

  const repoLock = readJsonRetry(lockPath);
  const warnings = [];

  const buildResult = (entry) => {
    const beforeCopies = findCopies(repoLock, entry.name);
    return {
      id: entryId(entry),
      name: entry.name,
      spec: entry.spec,
      isRef: entry.isRef,
      topKey: entry.topKey,
      parent: entry.parent,
      before: minVersion(beforeCopies),
      beforeCopies,
      beforeParents: findParents(repoLock, entry.name),
    };
  };

  if (args.list) {
    const results = entries.map((entry) => ({
      ...buildResult(entry),
      after: null,
      verdict: 'LIST',
    }));
    output(
      { repo, mode: 'list', results },
      args.json,
      renderText(repo, results, [], false, warnings),
    );
    process.exit(EXIT_OK);
  }

  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'override-prune-'));
  const results = [];

  try {
    warnings.push(...setupTempWorkspace(repo, pkg, tempDir, pkgText, indent, trailingNewline));

    for (let i = 0; i < entries.length; i += 1) {
      const entry = entries[i];
      const result = buildResult(entry);
      if (!args.json) process.stderr.write(`[${i + 1}/${entries.length}] ${entry.name} ...\n`);

      try {
        const afterLock = resolveWithout(
          repo,
          pkg,
          entry,
          tempDir,
          indent,
          trailingNewline,
          args.timeout,
        );
        const afterCopies = findCopies(afterLock, entry.name);
        const afterMin = minVersion(afterCopies);

        result.after = afterMin;
        result.afterCopies = afterCopies;

        if (result.isRef) {
          result.verdict = 'REVIEW';
          result.reason = `Self-reference override (${entry.rawSpec}). It forces convergence with a direct dependency, not a specific fix.`;
        } else if (result.beforeCopies.length === 0) {
          result.verdict = afterCopies.length === 0 ? 'NOT-PRESENT' : 'REVIEW';
          result.reason =
            afterCopies.length === 0
              ? 'Not installed before or after. The override is a no-op.'
              : 'Absent with the override, present without it. Review by hand.';
        } else if (afterCopies.length === 0) {
          result.verdict = 'REVIEW';
          result.reason = 'Present with the override, absent without it. Review by hand.';
        } else if (compareVersions(afterMin, result.before) >= 0) {
          result.verdict = 'REDUNDANT';
          result.reason = `Natural resolution ${afterMin} is at or above the pinned ${result.before}.`;
        } else {
          result.verdict = 'KEEP';
          result.reason = `Natural resolution ${afterMin} is below the pinned ${result.before}.`;
        }
      } catch (error) {
        result.verdict = 'ERROR';
        result.reason = String(error.message || error).split('\n')[0];
      }

      results.push(result);
    }
  } finally {
    if (!args.keepTemp) {
      try {
        fs.rmSync(tempDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 250 });
      } catch {
        /* best effort */
      }
    } else {
      process.stderr.write(`Temp resolution dir kept: ${tempDir}\n`);
    }
  }

  const redundant = results.filter((r) => r.verdict === 'REDUNDANT');

  if (args.apply && redundant.length > 0) {
    let finalPkg = pkg;
    for (const entry of entries) {
      if (redundant.some((r) => r.id === entryId(entry))) {
        finalPkg = withoutEntry(finalPkg, entry);
      }
    }
    writePackageJson(pkgPath, finalPkg, indent, trailingNewline);
    if (!args.json) {
      process.stderr.write(`Applied: removed ${redundant.length} override(s). Running npm install ...\n`);
    }
    try {
      execSync('npm install --ignore-scripts --no-audit --no-fund', {
        cwd: repo,
        timeout: args.timeout,
        stdio: ['ignore', 'pipe', 'pipe'],
        encoding: 'utf8',
      });
      const finalLock = readJsonRetry(lockPath);
      for (const r of redundant) {
        const copies = findCopies(finalLock, r.name);
        r.afterApply = minVersion(copies);
        r.applyOk = copies.length === 0 || compareVersions(r.afterApply, r.before) >= 0;
      }
    } catch (error) {
      for (const r of redundant) {
        r.applyOk = false;
        r.applyError = String(error.message || error).split('\n')[0];
      }
    }
  }

  output(
    {
      repo,
      mode: args.apply ? 'apply' : 'report',
      branch: currentBranch(repo),
      overrides: entries.length,
      redundant: redundant.length,
      warnings,
      results,
    },
    args.json,
    renderText(repo, results, redundant, args.apply, warnings),
  );

  process.exit(args.exitCode && redundant.length > 0 ? EXIT_CHANGES : EXIT_OK);
}

try {
  main();
} catch (error) {
  process.stderr.write(`Error: ${error.message || error}\n`);
  process.exit(EXIT_ERROR);
}
