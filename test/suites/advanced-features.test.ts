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

describe('Advanced Import Resolution Features', () => {
  beforeEach(async () => {
    await rm(TEMP_DIR, { recursive: true, force: true });
    await mkdir(TEMP_DIR, { recursive: true });
  });

  afterEach(async () => {
    await rm(TEMP_DIR, { recursive: true, force: true });
  });

  test('TypeScript path mapping - wildcard patterns', async () => {
    const tempFixturePath = await createTempFixture('tsconfig-paths');
    const mover = new TypeScriptFileMover(tempFixturePath);
    await mover.init();

    // Move database.ts from utils to data directory
    await mover.moveFile('src/utils/database.ts', 'src/data/database.ts');

    // Check that path-mapped imports were updated correctly
    const userRepositoryContent = await readFileContent(join(tempFixturePath, 'src/services/user-repository.ts'));
    expect(userRepositoryContent).toContain(
      "import { createDatabase, Database, DatabaseConfig } from '@/data/database';",
    );

    // The path mapping should resolve to the new location
    expect(existsSync(join(tempFixturePath, 'src/data/database.ts'))).toBe(true);
    expect(existsSync(join(tempFixturePath, 'src/utils/database.ts'))).toBe(false);
  });

  test('TypeScript path mapping - exact matches', async () => {
    const tempFixturePath = await createTempFixture('tsconfig-paths');
    const mover = new TypeScriptFileMover(tempFixturePath);
    await mover.init();

    // Update tsconfig to include exact match
    const tsConfigPath = join(tempFixturePath, 'tsconfig.json');
    const tsConfig = JSON.parse(await readFileContent(tsConfigPath));
    tsConfig.compilerOptions.paths['@database'] = ['src/utils/database.ts'];
    await writeFile(tsConfigPath, JSON.stringify(tsConfig, null, 2));

    // Create a file that uses the exact path mapping
    const exactImportFile = join(tempFixturePath, 'src/services/db-service.ts');
    await writeFile(
      exactImportFile,
      `
import { Database } from '@database';

export class DatabaseService {
  private db: Database;
  
  constructor(config: any) {
    this.db = new Database(config);
  }
}
`,
    );

    // Reinitialize to pick up the new tsconfig
    await mover.init();

    // Move the database file
    await mover.moveFile('src/utils/database.ts', 'src/core/database.ts');

    // The exact import should be updated to use a wildcard mapping that fits the new location
    const dbServiceContent = await readFileContent(exactImportFile);
    expect(dbServiceContent).toContain("import { Database } from '@/core/database';");
    // The path mapping now points to the new location
  });

  test('Package.json imports - wildcard patterns', async () => {
    const tempFixturePath = await createTempFixture('package-imports');
    const mover = new TypeScriptFileMover(tempFixturePath);
    await mover.init();

    // Create a file that uses package imports
    const packageImportFile = join(tempFixturePath, 'src/test-package-imports.ts');
    await writeFile(
      packageImportFile,
      `
import { ValidationResult } from '#utils/validation';

export const testValidation = (): ValidationResult => {
  return { isValid: true, errors: [] };
};
`,
    );

    // Update package.json to include the wildcard import
    const packageJsonPath = join(tempFixturePath, 'package.json');
    const packageJson = JSON.parse(await readFileContent(packageJsonPath));
    packageJson.imports['#utils/*'] = './src/shared/*.js';
    await writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2));

    // Reinitialize to pick up the new package.json
    await mover.init();

    // Move the validation file
    await mover.moveFile('src/shared/validation.ts', 'src/shared/utils/validation.ts');

    // The package import should still work with the new location
    const testFileContent = await readFileContent(packageImportFile);
    expect(testFileContent).toContain("import { ValidationResult } from '#utils/validation';");

    // Verify the file was actually moved
    expect(existsSync(join(tempFixturePath, 'src/shared/utils/validation.ts'))).toBe(true);
  });

  test('Package.json imports - exact matches', async () => {
    const tempFixturePath = await createTempFixture('package-imports');
    const mover = new TypeScriptFileMover(tempFixturePath);
    await mover.init();

    // Update package.json to include exact import
    const packageJsonPath = join(tempFixturePath, 'package.json');
    const packageJson = JSON.parse(await readFileContent(packageJsonPath));
    packageJson.imports['#validation'] = './src/shared/validation.js';
    await writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2));

    // Create a file that uses the exact package import
    const exactPackageImportFile = join(tempFixturePath, 'src/test-exact-import.ts');
    await writeFile(
      exactPackageImportFile,
      `
import { createValidator } from '#validation';

export const validator = createValidator();
`,
    );

    // Reinitialize to pick up the new package.json
    await mover.init();

    // Move the validation file
    await mover.moveFile('src/shared/validation.ts', 'src/core/validation.ts');

    // The exact package import should still work
    const testFileContent = await readFileContent(exactPackageImportFile);
    expect(testFileContent).toContain("import { createValidator } from '#validation';");
  });

  test('Mixed import types in same file', async () => {
    const tempFixturePath = await createTempFixture('mixed-imports');
    const mover = new TypeScriptFileMover(tempFixturePath);
    await mover.init();

    // Create a file with multiple import types
    const mixedImportsFile = join(tempFixturePath, 'src/mixed-test.ts');
    await writeFile(
      mixedImportsFile,
      `
import { Logger, LogLevel } from '~utils/logger';          // TS path mapping
import { constants } from '#lib/constants';                // Package import
import { EventBus } from './core/event-bus';               // Relative import
import type { User } from '~core/types';                   // TS path mapping type import

export class MixedImportsTest {
  private logger: Logger;
  private eventBus: EventBus;
  
  constructor() {
    this.logger = new Logger(LogLevel.INFO);
    this.eventBus = new EventBus();
  }
  
  processUser(user: User) {
    this.logger.info('Processing user', { userId: user.id });
  }
}
`,
    );

    // Update configs to support all import types
    const packageJsonPath = join(tempFixturePath, 'package.json');
    const packageJson = JSON.parse(await readFileContent(packageJsonPath));
    packageJson.imports['#lib/*'] = './lib/*.js';
    await writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2));

    const tsConfigPath = join(tempFixturePath, 'tsconfig.json');
    const tsConfig = JSON.parse(await readFileContent(tsConfigPath));
    tsConfig.compilerOptions.paths['~core/*'] = ['src/core/*'];
    await writeFile(tsConfigPath, JSON.stringify(tsConfig, null, 2));

    // Create the missing files
    await writeFile(join(tempFixturePath, 'src/core/types.ts'), 'export interface User { id: string; }');

    // Reinitialize to pick up config changes
    await mover.init();

    // Move the logger file (TS path mapped)
    await mover.moveFile('src/utils/logger.ts', 'src/shared/logger.ts');

    // Check that the TS path mapping was updated correctly
    const mixedTestContent = await readFileContent(mixedImportsFile);
    expect(mixedTestContent).toContain("import { Logger, LogLevel } from '~/shared/logger';");

    // Other imports should remain unchanged
    expect(mixedTestContent).toContain("import { constants } from '#lib/constants';");
    expect(mixedTestContent).toContain("import { EventBus } from './core/event-bus';");
    expect(mixedTestContent).toContain("import type { User } from '~core/types';");
  });

  test('Cross-package monorepo imports with workspace references', async () => {
    const tempFixturePath = await createTempFixture('bun-monorepo');
    const mover = new TypeScriptFileMover(tempFixturePath);
    await mover.init();

    // Move user types from core to a shared location
    await mover.moveFile('packages/core/src/types/user.ts', 'packages/core/src/entities/user.ts');

    // Check that internal imports within core were updated
    const validationContent = await readFileContent(join(tempFixturePath, 'packages/core/src/utils/validation.ts'));
    expect(validationContent).toContain("import { CreateUserRequest, User, UserRole } from '../entities/user';");

    // Check that cross-package imports were updated while preserving workspace import style
    const userCardContent = await readFileContent(join(tempFixturePath, 'packages/ui/src/components/UserCard.tsx'));
    // The tool should preserve workspace imports when moving files within the same workspace
    expect(userCardContent).toContain("import { User, UserRole } from '@test-monorepo/core/entities/user';");

    // Core package index should be updated
    const coreIndexContent = await readFileContent(join(tempFixturePath, 'packages/core/src/index.ts'));
    expect(coreIndexContent).toContain("export * from './entities/user';");
  });

  test('Move file across path mapping boundaries', async () => {
    const tempFixturePath = await createTempFixture('tsconfig-paths');
    const mover = new TypeScriptFileMover(tempFixturePath);
    await mover.init();

    // Create a file outside the mapped paths
    const outsideFile = join(tempFixturePath, 'external/external-service.ts');
    await mkdir(dirname(outsideFile), { recursive: true });
    await writeFile(
      outsideFile,
      `
import { Database } from '@utils/database';

export class ExternalService {
  db = new Database({ host: 'external', port: 5432, database: 'external' });
}
`,
    );

    // Move database from utils (mapped) to external (unmapped)
    await mover.moveFile('src/utils/database.ts', 'external/database.ts');

    // The import should fall back to relative path since it's outside the mapping
    const externalServiceContent = await readFileContent(outsideFile);
    expect(externalServiceContent).toContain("import { Database } from './database';");

    // Files that were using the mapped path should now use relative paths too
    const userRepositoryContent = await readFileContent(join(tempFixturePath, 'src/services/user-repository.ts'));
    expect(userRepositoryContent).toContain(
      "import { createDatabase, Database, DatabaseConfig } from '../../external/database';",
    );
  });

  test('Preserve import type (import vs import type)', async () => {
    const tempFixturePath = await createTempFixture('tsconfig-paths');
    const mover = new TypeScriptFileMover(tempFixturePath);
    await mover.init();

    // Create a file with type-only imports
    const typeImportFile = join(tempFixturePath, 'src/test-types.ts');
    await writeFile(
      typeImportFile,
      `
import { Database, createDatabase } from '@utils/database';
import type { DatabaseConfig } from '@utils/database';

export class TypeTest {
  private config: DatabaseConfig = {
    host: 'localhost',
    port: 5432,
    database: 'test'
  };
  
  getDatabase(): Database {
    return createDatabase(this.config);
  }
}
`,
    );

    // Move the database file
    await mover.moveFile('src/utils/database.ts', 'src/data/database.ts');

    // Both import types should be preserved and updated
    const typeTestContent = await readFileContent(typeImportFile);
    expect(typeTestContent).toContain("import { Database, createDatabase } from '@/data/database';");
    expect(typeTestContent).toContain("import type { DatabaseConfig } from '@/data/database';");
  });

  test('Handle index.ts re-exports with path mappings', async () => {
    const tempFixturePath = await createTempFixture('bun-monorepo');
    const mover = new TypeScriptFileMover(tempFixturePath);
    await mover.init();

    // Move validation from core to ui package
    await mover.moveFile('packages/core/src/utils/validation.ts', 'packages/ui/src/validation/validation.ts');

    // Check that core's index.ts was updated to remove the export
    const coreIndexContent = await readFileContent(join(tempFixturePath, 'packages/core/src/index.ts'));
    // The export should be updated to point to the new location
    expect(coreIndexContent).toContain("export * from '../../ui/src/validation/validation';");

    // Files that imported from the core package should now import from ui
    const userFormContent = await readFileContent(join(tempFixturePath, 'packages/ui/src/forms/UserForm.tsx'));
    // Should now use workspace import to ui package
    expect(userFormContent).toContain(
      "import { UserValidator, ValidationError } from '@test-monorepo/ui/validation/validation';",
    );
  });

  test('Complex monorepo scenario with multiple moves', async () => {
    const tempFixturePath = await createTempFixture('bun-monorepo');
    const mover = new TypeScriptFileMover(tempFixturePath);
    await mover.init();

    // First move: Move user types to shared location
    await mover.moveFile('packages/core/src/types/user.ts', 'packages/core/src/shared/user.ts');

    // Second move: Move validation to a different package
    await mover.moveFile('packages/core/src/utils/validation.ts', 'packages/ui/src/utils/validation.ts');

    // Check that the validation file (now in UI) imports user types correctly
    const validationContent = await readFileContent(join(tempFixturePath, 'packages/ui/src/utils/validation.ts'));
    expect(validationContent).toContain("import { CreateUserRequest, User, UserRole } from '../shared/user';");

    // Check that UI components now use workspace import to ui package
    const userFormContent = await readFileContent(join(tempFixturePath, 'packages/ui/src/forms/UserForm.tsx'));
    expect(userFormContent).toContain(
      "import { UserValidator, ValidationError } from '@test-monorepo/ui/utils/validation';",
    );

    // Check that API package imports are updated to use workspace imports
    const userRepositoryContent = await readFileContent(
      join(tempFixturePath, 'packages/api/src/services/user-repository.ts'),
    );
    expect(userRepositoryContent).toContain(
      "import { isValidUser, UserValidator, ValidationError } from '@test-monorepo/ui/utils/validation';",
    );
    expect(userRepositoryContent).toContain(
      "import { CreateUserRequest, UpdateUserRequest, User, UserRole, UserSummary } from '@test-monorepo/core/shared/user';",
    );
  });
});

if (import.meta.main) {
  console.log('Running advanced import resolution tests...');
}
