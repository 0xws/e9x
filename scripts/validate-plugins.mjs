import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
const root = process.cwd();
const problems = [];
async function exists(p) { try { await stat(p); return true; } catch { return false; } }
async function checkJson(relative, required = []) {
  const file = path.join(root, relative);
  let value;
  try { value = JSON.parse(await readFile(file, 'utf8')); }
  catch (error) { problems.push(`${relative}: invalid JSON (${error.message})`); return null; }
  for (const key of required) if (!(key in value)) problems.push(`${relative}: missing required key ${key}`);
  return value;
}
for (const agent of ['codex', 'cursor', 'vibe']) {
  const base = `packages/plugins/${agent}/templates`;
  const manifestPath = agent === 'cursor' ? `${base}/.cursor-plugin/plugin.json` : `${base}/plugin.json`;
  const manifest = await checkJson(manifestPath, agent === 'cursor' ? ['name', 'skills'] : ['$schema', 'name', 'version', 'description']);
  if (manifest) {
    if (agent !== 'cursor' && manifest.$schema !== 'https://agent-plugins.org/schemas/1.0.0/plugin.schema.json') problems.push(`${manifestPath}: unexpected Agent Plugins schema`);
    if (agent === 'vibe' && manifest.extensions?.['ai.mistral.vibe']?.schemaVersion !== 1) problems.push(`${manifestPath}: missing Vibe schemaVersion 1 extension`);
    const declared = [];
    for (const key of ['rules', 'skills', 'agents', 'commands']) {
      const paths = manifest[key] ? (Array.isArray(manifest[key]) ? manifest[key] : [manifest[key]]) : [];
      declared.push(...paths.map(p => p.endsWith('.md') || p.endsWith('.mdc') ? p : `${p}/SKILL.md`).filter(p => key !== 'agents' && p.endsWith('/SKILL.md')));
      if (key === 'rules' || key === 'agents' || key === 'commands') declared.push(...paths);
    }
    for (const p of declared) if (!(await exists(path.join(root, base, p)))) problems.push(`${manifestPath}: referenced component missing: ${p}`);
  }
  const skillDir = path.join(root, base, 'skills');
  for (const skill of await readdir(skillDir, { withFileTypes: true }).catch(() => [])) {
    if (skill.isDirectory()) {
      const f = path.join(skillDir, skill.name, 'SKILL.md');
      if (!(await exists(f))) problems.push(`${path.relative(root, f)}: required skill file missing`);
      else {
        const content = await readFile(f, 'utf8');
        if (!content.startsWith('---\n') || !/^name:\s*\S+/m.test(content.split('---').slice(1, 2)[0] ?? '') || !/^description:\s*\S+/m.test(content.split('---').slice(1, 2)[0] ?? '')) problems.push(`${path.relative(root, f)}: missing skill name/description frontmatter`);
      }
    }
  }
}
const codexMarket = await checkJson('.agents/plugins/marketplace.json', ['name', 'plugins']);
if (codexMarket && !codexMarket.plugins.some(p => p.name === 'elysia9x')) problems.push('.agents/plugins/marketplace.json: missing elysia9x entry');
if (codexMarket) for (const entry of codexMarket.plugins) { const sourcePath = entry.source?.path; if (sourcePath && !(await exists(path.resolve(root, sourcePath)))) problems.push(`.agents/plugins/marketplace.json: source path does not exist: ${sourcePath}`); else if (sourcePath && !(await exists(path.resolve(root, sourcePath, 'plugin.json')))) problems.push(`.agents/plugins/marketplace.json: plugin.json missing at ${sourcePath}`); }
const cursorMarket = await checkJson('.cursor-plugin/marketplace.json', ['name', 'plugins']);
if (cursorMarket && !cursorMarket.plugins.some(p => p.name === 'elysia9x')) problems.push('.cursor-plugin/marketplace.json: missing elysia9x entry');
if (cursorMarket) for (const entry of cursorMarket.plugins) { const sourcePath = entry.source; if (sourcePath && !(await exists(path.resolve(root, sourcePath, '.cursor-plugin/plugin.json')))) problems.push(`.cursor-plugin/marketplace.json: native plugin manifest missing at ${sourcePath}/.cursor-plugin/plugin.json`); }
if (problems.length) { console.error(`Plugin validation failed (${problems.length})`); for (const p of problems) console.error(`- ${p}`); process.exit(1); }
console.log('Plugin manifests and declared components validated.');
