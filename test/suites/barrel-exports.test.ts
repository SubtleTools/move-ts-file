#!/usr/bin/env bun
import { TypeScriptFileMover } from '#src';
import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import { existsSync } from 'node:fs';
import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';

const FIXTURES_DIR = resolve(__dirname, '../fixtures');
const TEMP_DIR = resolve(__dirname, '../temp');

async function createTempFixture(fixtureName: string): Promise<string> {
  const fixtureSource = join(FIXTURES_DIR, fixtureName);
  const tempFixture = join(TEMP_DIR, fixtureName);

  await rm(tempFixture, { recursive: true, force: true });
  await mkdir(dirname(tempFixture), { recursive: true });
  await cp(fixtureSource, tempFixture, { recursive: true });

  return tempFixture;
}

async function readFileContent(filePath: string): Promise<string> {
  try {
    return await readFile(filePath, 'utf-8');
  } catch (_error) {
    return '';
  }
}

describe('Barrel Export Handling', () => {
  beforeEach(async () => {
    await rm(TEMP_DIR, { recursive: true, force: true });
    await mkdir(TEMP_DIR, { recursive: true });
  });

  afterEach(async () => {
    await rm(TEMP_DIR, { recursive: true, force: true });
  });

  test('Updates barrel exports when moving a file (updateBarrels: true)', async () => {
    const tempFixturePath = await createTempFixture('barrel-exports');

    // Create mover with barrel updates enabled (default)
    const mover = new TypeScriptFileMover(tempFixturePath, { updateBarrels: true });
    await mover.init();

    const sourceFile = 'src/utils/helper.ts';
    const targetFile = 'src/shared/helper.ts';

    // Verify source file exists
    expect(existsSync(join(tempFixturePath, sourceFile))).toBe(true);

    // Move the file
    await mover.moveFile(sourceFile, targetFile);

    // Verify file was moved
    expect(existsSync(join(tempFixturePath, targetFile))).toBe(true);
    expect(existsSync(join(tempFixturePath, sourceFile))).toBe(false);

    // Check that barrel export was updated
    const utilsIndexContent = await readFileContent(join(tempFixturePath, 'src/utils/index.ts'));
    expect(utilsIndexContent).toContain(
      "export { formatUserName, User, UserService, validateEmail } from '../shared/helper.js';",
    );

    // Check that imports from the barrel still work (components should not need updating)
    const userCardContent = await readFileContent(join(tempFixturePath, 'src/components/UserCard.tsx'));
    expect(userCardContent).toContain("import { formatUserName, User } from '../utils/index.js';");

    const userFormContent = await readFileContent(join(tempFixturePath, 'src/components/UserForm.tsx'));
    expect(userFormContent).toContain("import { isEmail, required, User } from '../utils/index.js';");
  });

  test('Does not update barrel exports when disabled (updateBarrels: false)', async () => {
    const tempFixturePath = await createTempFixture('barrel-exports');

    // Create mover with barrel updates disabled
    const mover = new TypeScriptFileMover(tempFixturePath, { updateBarrels: false });
    await mover.init();

    const sourceFile = 'src/utils/helper.ts';
    const targetFile = 'src/shared/helper.ts';

    // Store original barrel content
    const originalBarrelContent = await readFileContent(join(tempFixturePath, 'src/utils/index.ts'));

    // Move the file
    await mover.moveFile(sourceFile, targetFile);

    // Verify file was moved
    expect(existsSync(join(tempFixturePath, targetFile))).toBe(true);
    expect(existsSync(join(tempFixturePath, sourceFile))).toBe(false);

    // Check that barrel export was NOT updated (should still reference old path)
    const utilsIndexContent = await readFileContent(join(tempFixturePath, 'src/utils/index.ts'));
    expect(utilsIndexContent).toBe(originalBarrelContent);
    expect(utilsIndexContent).toContain(
      "export { formatUserName, User, UserService, validateEmail } from './helper.js';",
    );
  });

  test('Updates multiple barrel exports when file is re-exported in several places', async () => {
    const tempFixturePath = await createTempFixture('barrel-exports');

    // Add an additional barrel that re-exports validation
    const additionalBarrelPath = join(tempFixturePath, 'src/forms/index.ts');
    await mkdir(dirname(additionalBarrelPath), { recursive: true });
    await writeFile(additionalBarrelPath, "export { required, isEmail } from '../utils/validation.js';");

    const mover = new TypeScriptFileMover(tempFixturePath, { updateBarrels: true });
    await mover.init();

    // Move validation.ts
    await mover.moveFile('src/utils/validation.ts', 'src/shared/validation.ts');

    // Check that both barrels were updated
    const utilsIndexContent = await readFileContent(join(tempFixturePath, 'src/utils/index.ts'));
    expect(utilsIndexContent).toContain("export { isEmail, minLength, required } from '../shared/validation.js';");

    const formsIndexContent = await readFileContent(additionalBarrelPath);
    expect(formsIndexContent).toContain("export { required, isEmail } from '../shared/validation.js';");
  });

  test('Handles star exports in barrel files', async () => {
    const tempFixturePath = await createTempFixture('barrel-exports');

    // Modify utils index to use star export
    const utilsIndexPath = join(tempFixturePath, 'src/utils/index.ts');
    await writeFile(
      utilsIndexPath,
      `// Barrel file with star exports
export * from './helper.js';
export * from './validation.js';`,
    );

    const mover = new TypeScriptFileMover(tempFixturePath, { updateBarrels: true });
    await mover.init();

    // Move helper.ts
    await mover.moveFile('src/utils/helper.ts', 'src/shared/helper.ts');

    // Check that star export was updated
    const utilsIndexContent = await readFileContent(utilsIndexPath);
    expect(utilsIndexContent).toContain("export * from '../shared/helper.js';");
    expect(utilsIndexContent).toContain("export * from './validation.js';"); // Other export unchanged
  });

  test('Preserves import style in components when barrel is updated', async () => {
    const tempFixturePath = await createTempFixture('barrel-exports');

    const mover = new TypeScriptFileMover(tempFixturePath, { updateBarrels: true });
    await mover.init();

    // Get original component content
    const originalUserCardContent = await readFileContent(join(tempFixturePath, 'src/components/UserCard.tsx'));
    const originalUserFormContent = await readFileContent(join(tempFixturePath, 'src/components/UserForm.tsx'));

    // Move helper.ts (which is re-exported by utils/index.ts)
    await mover.moveFile('src/utils/helper.ts', 'src/shared/helper.ts');

    // Components should remain unchanged since they import from the barrel
    const newUserCardContent = await readFileContent(join(tempFixturePath, 'src/components/UserCard.tsx'));
    const newUserFormContent = await readFileContent(join(tempFixturePath, 'src/components/UserForm.tsx'));

    expect(newUserCardContent).toBe(originalUserCardContent);
    expect(newUserFormContent).toBe(originalUserFormContent);
  });
});

if (import.meta.main) {
  console.log('Running barrel export tests...');
}
