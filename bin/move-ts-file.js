#!/usr/bin/env node

import { TypeScriptFileMover } from '../dist/move-ts.js';

async function main() {
  const args = process.argv.slice(2);
  
  // Parse flags and arguments
  const flags = args.filter(arg => arg.startsWith('--'));
  const positionalArgs = args.filter(arg => !arg.startsWith('--'));

  if (positionalArgs.length !== 2) {
    console.error('Usage: move-ts <source-file> <destination> [options]');
    console.error('');
    console.error('Options:');
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