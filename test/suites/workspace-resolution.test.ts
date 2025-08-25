#!/usr/bin/env bun
import { TypeScriptFileMover } from '#src';
import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import { cp, mkdir, rm, writeFile } from 'node:fs/promises';
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

describe('Workspace Import Resolution', () => {
  beforeEach(async () => {
    await rm(TEMP_DIR, { recursive: true, force: true });
    await mkdir(TEMP_DIR, { recursive: true });
  });

  afterEach(async () => {
    await rm(TEMP_DIR, { recursive: true, force: true });
  });

  test('Can resolve workspace import to file path', async () => {
    const tempFixturePath = await createTempFixture('bun-monorepo');
    const mover = new TypeScriptFileMover(tempFixturePath);
    await mover.init();

    // Create a test file with workspace import
    const testFile = join(tempFixturePath, 'test-resolution.ts');
    await writeFile(testFile, "import { User } from '@test-monorepo/core/types/user';");

    // Use the internal resolveImportPath method to test resolution
    const resolvedPath = (mover as any).resolveImportPath('@test-monorepo/core/types/user', testFile);
    
    console.log('Resolved path:', resolvedPath);
    console.log('Expected path should contain:', 'packages/core/src/types/user');
    
    // Should resolve to the actual file path
    expect(resolvedPath).toBeTruthy();
    expect(resolvedPath).toContain('packages/core/src/types/user');
  });

  test('Can calculate new workspace import path after move', async () => {
    const tempFixturePath = await createTempFixture('bun-monorepo');
    const mover = new TypeScriptFileMover(tempFixturePath);
    await mover.init();

    // Create a test file that imports from core
    const testFile = join(tempFixturePath, 'packages/ui/src/test.tsx');
    await writeFile(testFile, "import { User } from '@test-monorepo/core/types/user';");

    // Simulate what should happen when core/types/user.ts moves to core/entities/user.ts
    const oldPath = join(tempFixturePath, 'packages/core/src/types/user.ts');
    const newPath = join(tempFixturePath, 'packages/core/src/entities/user.ts');

    // Test the calculateNewImportPath method
    const newImportPath = (mover as any).calculateNewImportPath(
      '@test-monorepo/core/types/user', 
      testFile,
      { newPath }
    );

    console.log('Original import:', '@test-monorepo/core/types/user');
    console.log('New import path:', newImportPath);
    console.log('Expected:', '@test-monorepo/core/entities/user');

    // Should preserve workspace import style
    expect(newImportPath).toBe('@test-monorepo/core/entities/user');
  });

  test('Can handle cross-package workspace import moves', async () => {
    const tempFixturePath = await createTempFixture('bun-monorepo');
    const mover = new TypeScriptFileMover(tempFixturePath);
    await mover.init();

    // Create a test file that imports from API package
    const testFile = join(tempFixturePath, 'apps/web/src/test.tsx');
    await writeFile(testFile, "import { UserService } from '@test-monorepo/api/services/user-service';");

    // Simulate moving from API package to Core package
    const oldPath = join(tempFixturePath, 'packages/api/src/services/user-service.ts');
    const newPath = join(tempFixturePath, 'packages/core/src/services/user-service.ts');

    // Test the calculateNewImportPath method for cross-package move
    const newImportPath = (mover as any).calculateNewImportPath(
      '@test-monorepo/api/services/user-service', 
      testFile,
      { newPath }
    );

    console.log('Original import:', '@test-monorepo/api/services/user-service');
    console.log('New import path:', newImportPath);
    console.log('Expected:', '@test-monorepo/core/services/user-service');

    // Should update to the new workspace package
    expect(newImportPath).toBe('@test-monorepo/core/services/user-service');
  });
});

if (import.meta.main) {
  console.log('Running workspace resolution tests...');
}