#!/usr/bin/env node

import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { TypeScriptFileMover } from '../dist/move-ts.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function getVersion() {
  try {
    const packageJson = readFileSync(join(__dirname, '../package.json'), 'utf-8');
    const pkg = JSON.parse(packageJson);
    return pkg.version;
  } catch {
    return 'unknown';
  }
}

function showHelp() {
  const version = getVersion();
  console.error(`move-ts-file v${version}`);
  console.error('');
  console.error('Usage: move-ts <source-file> <destination> [options]');
  console.error('       move-ts version');
  console.error('');
  console.error('Options:');
  console.error('  --version              Show version number and exit');
  console.error('  --dry-run              Show what would be changed without making changes');
  console.error('  --no-update-barrels    Disable automatic barrel export updates (default: enabled)');
  console.error('  --debug                Enable debug logging for troubleshooting');
  console.error('');
  console.error('Examples:');
  console.error('  move-ts src/old-file.ts src/new-location/');
  console.error('  move-ts src/old-file.ts src/new-location/new-name.ts');
  console.error('  move-ts components/Button.tsx shared/ui/Button.tsx');
  console.error('  move-ts src/utils/helper.ts src/lib/helper.ts --no-update-barrels');
  console.error('  move-ts src/utils/helper.ts src/shared/helper.ts --dry-run');
  console.error('  move-ts src/utils/helper.ts src/shared/helper.ts --debug');
}

async function main() {
  const args = process.argv.slice(2);
  
  // Handle version command
  if (args.length === 1 && args[0] === 'version') {
    console.log(getVersion());
    process.exit(0);
  }
  
  // Parse flags and arguments
  const flags = args.filter(arg => arg.startsWith('--'));
  const positionalArgs = args.filter(arg => !arg.startsWith('--'));

  // Handle --version flag
  if (flags.includes('--version')) {
    console.log(getVersion());
    process.exit(0);
  }

  if (positionalArgs.length !== 2) {
    showHelp();
    process.exit(1);
  }

  const [sourcePath, destPath] = positionalArgs;
  const updateBarrels = !flags.includes('--no-update-barrels');
  const dryRun = flags.includes('--dry-run');
  const debug = flags.includes('--debug');

  try {
    const mover = new TypeScriptFileMover(process.cwd(), { updateBarrels, dryRun, debug });
    await mover.init();
    await mover.moveFile(sourcePath, destPath);
  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

main();