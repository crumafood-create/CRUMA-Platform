import { readdir, readFile } from 'node:fs/promises';
import { extname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repositoryRoot = resolve(fileURLToPath(new URL('../..', import.meta.url)));
const sourceRoot = join(repositoryRoot, 'src');
const supportedExtensions = new Set(['.js', '.jsx', '.mjs', '.ts', '.tsx']);

async function listSourceFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const path = join(directory, entry.name);

    if (entry.isDirectory()) {
      files.push(...(await listSourceFiles(path)));
    } else if (supportedExtensions.has(extname(entry.name))) {
      files.push(path);
    }
  }

  return files;
}

function addReference(collection, name, source) {
  const sources = collection.get(name) ?? new Set();
  sources.add(source);
  collection.set(name, sources);
}

function collectMatches(content, pattern, collection, source) {
  for (const match of content.matchAll(pattern)) {
    addReference(collection, match[2], source);
  }
}

function serialize(collection) {
  return [...collection.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([name, sources]) => ({
      name,
      sources: [...sources].sort(),
    }));
}

const relations = new Map();
const rpcFunctions = new Map();
const storageBuckets = new Map();
const files = await listSourceFiles(sourceRoot);

for (const file of files) {
  const source = relative(repositoryRoot, file).replaceAll('\\', '/');
  const content = await readFile(file, 'utf8');
  const contentWithoutStorageCalls = content.replace(
    /\.storage\s*\.\s*from\s*\(\s*(['"`])([^'"`]+)\1/g,
    '',
  );

  collectMatches(
    content,
    /\.storage\s*\.\s*from\s*\(\s*(['"`])([^'"`]+)\1/g,
    storageBuckets,
    source,
  );
  collectMatches(
    contentWithoutStorageCalls,
    /\.from\s*\(\s*(['"`])([^'"`]+)\1/g,
    relations,
    source,
  );
  collectMatches(
    content,
    /\.rpc\s*\(\s*(['"`])([^'"`]+)\1/g,
    rpcFunctions,
    source,
  );
}

const inventory = {
  schemaVersion: 1,
  scope: 'Referencias literales de Supabase encontradas en src; no representa el esquema desplegado.',
  relations: serialize(relations),
  rpcFunctions: serialize(rpcFunctions),
  storageBuckets: serialize(storageBuckets),
};

process.stdout.write(`${JSON.stringify(inventory, null, 2)}\n`);
