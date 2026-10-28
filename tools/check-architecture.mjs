// Checks the DDD import rules of the bounded contexts of src/app:
// R1 layers: inside a context, presentation -> application -> infrastructure -> domain. Views never import the
//    infrastructure, ApiError or @angular/common/http; the domain imports no Angular or RxJS; only the infrastructure
//    reads src/environments.
// R3 contexts: a context never imports code of another one. It reads the data it needs through a model, an endpoint
//    and an assembler of its own (Anti-Corruption Layer of the Context Mapping of the report).
// R5 shared: shared imports no context, except the layout that composes their components.
// R6 session: other contexts only use IamStore and the IAM guards in their routes.
// R7 stores: the application layer of a context only has <context>.store.ts, as in the course example; shared has none.
// It fails when an import breaks a rule and is not listed in tools/architecture-exceptions.json.
// Usage: npm run check:architecture
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const appDir = join(root, 'src', 'app');
const exceptionsFile = join(root, 'tools', 'architecture-exceptions.json');

const LAYERS = new Set(['domain', 'application', 'infrastructure', 'presentation']);
const IAM_SESSION = 'iam/application/iam.store';
const IMPORT = /(?:^|[\s;])(?:import|export)\s+(?:type\s+)?(?:[\w*{}\s,$]+?\s+from\s+)?['"]([^'"]+)['"]|import\(\s*['"]([^'"]+)['"]\s*\)/g;

/**
 * Lists the TypeScript sources of a folder, without the specs: tests may compose several contexts.
 */
function sources(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return sources(path);
    return entry.name.endsWith('.ts') && !entry.name.endsWith('.spec.ts') ? [path] : [];
  });
}

/**
 * Bounded context and layer of a module, from its path relative to src/app without the extension.
 */
function locate(path) {
  const parts = path.split('/');
  if (parts.length === 1) return { path, context: null, layer: null };
  return { path, context: parts[0], layer: LAYERS.has(parts[1]) ? parts[1] : null };
}

const isRoutes = (path) => /[.-]routes$/.test(path);
const isGuard = (path) => /\/infrastructure\/[\w-]*guards?$/.test(path);
const isComponent = (path) => path.includes('/presentation/components/');

/**
 * Rule broken by an import of a package, or null.
 */
function packageRule(from, spec) {
  if (from.layer === 'domain' && (spec.startsWith('@angular/') || spec === 'rxjs' || spec.startsWith('rxjs/'))) {
    return 'R1: the domain does not depend on Angular or RxJS';
  }
  if (spec === '@angular/common/http' && from.context && !['infrastructure', 'application'].includes(from.layer)) {
    return 'R1: only the application and the infrastructure know HTTP';
  }
  return null;
}

/**
 * Rule broken by an import between two modules of src/app, or null.
 */
function moduleRule(from, to) {
  if (!from.context) return null;
  if (to.context === from.context || to.context === 'shared') {
    if (from.layer === 'domain' && to.layer !== 'domain') return 'R1: the domain only imports the domain';
    if (to.layer === 'presentation' && from.layer !== 'presentation') return 'R1: only the presentation imports the presentation';
    if (from.layer === 'presentation' && to.layer === 'infrastructure' && !(isRoutes(from.path) && isGuard(to.path))) {
      return 'R1: the presentation reaches the infrastructure through the application';
    }
    return null;
  }
  if (!to.context) return null;
  if (to.context === 'iam' && (to.path === IAM_SESSION || (isRoutes(from.path) && isGuard(to.path)))) return null;
  if (from.context === 'shared') {
    if (from.layer === 'presentation' && isComponent(to.path)) return null;
    return `R5: shared does not depend on the ${to.context} context`;
  }
  if (to.context === 'iam') return 'R6: other contexts only use the session of IamStore and the IAM guards';
  return `R3: ${from.context} uses code of ${to.context}; read it through a model and an endpoint of its own`;
}

const violations = new Map();
for (const file of sources(appDir)) {
  const from = locate(relative(appDir, file).split(sep).join('/').replace(/\.ts$/, ''));
  const text = readFileSync(file, 'utf8');
  for (const match of text.matchAll(IMPORT)) {
    const spec = match[1] ?? match[2];
    let target;
    let rule;
    if (spec.startsWith('.')) {
      const path = relative(appDir, resolve(dirname(file), spec)).split(sep).join('/');
      if (path.startsWith('../environments/')) {
        target = path;
        rule = from.context && from.layer !== 'infrastructure' ? 'R1: only the infrastructure reads the environment' : null;
      } else {
        target = path;
        rule = moduleRule(from, locate(path));
      }
    } else {
      target = spec;
      rule = packageRule(from, spec);
    }
    if (rule) violations.set(`${from.path}.ts -> ${target}`, rule);
  }
}

for (const file of sources(appDir)) {
  const module = locate(relative(appDir, file).split(sep).join('/').replace(/.ts$/, ''));
  if (module.layer !== 'application') continue;
  const store = `${module.context}/application/${module.context}.store`;
  if (module.context === 'shared') {
    violations.set(`${module.path}.ts -> no application layer in shared`, 'R7: shared has no application layer');
  } else if (module.path !== store) {
    violations.set(`${module.path}.ts -> ${store}`, `R7: the application layer of ${module.context} only has ${module.context}.store.ts`);
  }
}

const { exceptions } = JSON.parse(readFileSync(exceptionsFile, 'utf8'));
const unexpected = [...violations].filter(([key]) => !(key in exceptions));
const fixed = Object.keys(exceptions).filter((key) => !violations.has(key));

for (const key of fixed) {
  console.warn(`fixed, remove it from tools/architecture-exceptions.json: ${key}`);
}
if (unexpected.length) {
  console.error(`${unexpected.length} problem(s) with the DDD rules (see the header of tools/check-architecture.mjs):`);
  for (const [key, rule] of unexpected.sort()) console.error(`  src/app/${key}\n    ${rule}`);
  process.exit(1);
}
console.log(`DDD rules OK: no new violations, ${violations.size} known in tools/architecture-exceptions.json.`);
