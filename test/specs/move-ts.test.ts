#!/usr/bin/env bun
import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { existsSync } from 'node:fs'
import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { TypeScriptFileMover } from '../../move-ts.ts'

const FIXTURES_DIR = resolve(__dirname, '../fixtures')
const TEMP_DIR = resolve(__dirname, '../temp')

interface TestCase {
  name: string
  fixture: string
  sourceFile: string
  targetFile: string
  expectedUpdates: Array<{
    file: string
    expectedImport: string
  }>
}

const TEST_CASES: TestCase[] = [
  {
    name: 'Basic relative imports',
    fixture: 'basic-relative',
    sourceFile: 'src/utils/helper.ts',
    targetFile: 'src/lib/helper.ts',
    expectedUpdates: [
      {
        file: 'src/components/UserCard.tsx',
        expectedImport: "import { User, formatUserName } from '../lib/helper';",
      },
      {
        file: 'src/services/api.ts',
        expectedImport: "import { User, UserService } from '../lib/helper';",
      },
      {
        file: 'tests/helper.test.ts',
        expectedImport: "import { User, UserService, formatUserName } from '../src/lib/helper';",
      },
    ],
  },
  {
    name: 'TypeScript path mapping',
    fixture: 'tsconfig-paths',
    sourceFile: 'src/utils/database.ts',
    targetFile: 'src/core/database.ts',
    expectedUpdates: [
      {
        file: 'src/services/user-repository.ts',
        expectedImport: "import { Database, DatabaseConfig, createDatabase } from '@/core/database';",
      },
      {
        file: 'lib/config.ts',
        expectedImport: "import type { DatabaseConfig } from '@/core/database';",
      },
    ],
  },
  {
    name: 'Package.json imports',
    fixture: 'package-imports',
    sourceFile: 'src/shared/validation.ts',
    targetFile: 'src/shared/utils/validation.ts',
    expectedUpdates: [
      {
        file: 'src/features/user-form.ts',
        expectedImport:
          "import { Validator, ValidationResult, emailRule, requiredRule } from '../shared/utils/validation';",
      },
      {
        file: 'src/features/auth-service.ts',
        expectedImport: "import { createValidator, requiredRule, emailRule } from '../shared/utils/validation';",
      },
    ],
  },
  {
    name: 'Deep nested relative imports',
    fixture: 'deep-nested',
    sourceFile: 'src/utils/validation/rules.ts',
    targetFile: 'src/core/validation/rules.ts',
    expectedUpdates: [
      {
        file: 'src/components/ui/inputs/TextInput.tsx',
        expectedImport: "import { ValidationRule, RequiredRule, MinLengthRule } from '../../../core/validation/rules';",
      },
      {
        file: 'src/components/forms/UserForm.tsx',
        expectedImport: "import { EmailRule, RequiredRule } from '../../core/validation/rules';",
      },
      {
        file: 'tests/unit/components/TextInput.test.tsx',
        expectedImport: "import { RequiredRule, MinLengthRule } from '../../../src/core/validation/rules';",
      },
    ],
  },
  {
    name: 'Mixed imports scenario',
    fixture: 'mixed-imports',
    sourceFile: 'src/utils/logger.ts',
    targetFile: 'src/core/logging/logger.ts',
    expectedUpdates: [
      {
        file: 'src/core/event-bus.ts',
        expectedImport: "import { Logger, LogLevel, createLogger } from '~/core/logging/logger';",
      },
      {
        file: 'src/features/notification-service.ts',
        expectedImport: "import type { Logger } from '~/core/logging/logger';",
      },
      {
        file: 'lib/constants.ts',
        expectedImport: "import type { LogLevel } from '~/core/logging/logger';",
      },
    ],
  },
]

async function createTempFixture(fixtureName: string): Promise<string> {
  const fixtureSource = join(FIXTURES_DIR, fixtureName)
  const tempFixture = join(TEMP_DIR, fixtureName)

  await rm(tempFixture, { recursive: true, force: true })
  await mkdir(dirname(tempFixture), { recursive: true })
  await cp(fixtureSource, tempFixture, { recursive: true })

  return tempFixture
}

async function readFileContent(filePath: string): Promise<string> {
  try {
    return await readFile(filePath, 'utf-8')
  } catch (_error) {
    return ''
  }
}

describe('TypeScriptFileMover', () => {
  beforeEach(async () => {
    await rm(TEMP_DIR, { recursive: true, force: true })
    await mkdir(TEMP_DIR, { recursive: true })
  })

  afterEach(async () => {
    await rm(TEMP_DIR, { recursive: true, force: true })
  })

  for (const testCase of TEST_CASES) {
    test(testCase.name, async () => {
      // Create temporary fixture
      const tempFixturePath = await createTempFixture(testCase.fixture)

      // Initialize mover
      const mover = new TypeScriptFileMover(tempFixturePath)
      await mover.init()

      // Get original file contents for comparison
      const originalContents = new Map<string, string>()
      for (const update of testCase.expectedUpdates) {
        const filePath = join(tempFixturePath, update.file)
        originalContents.set(update.file, await readFileContent(filePath))
      }

      // Verify source file exists
      const sourceFilePath = join(tempFixturePath, testCase.sourceFile)
      expect(existsSync(sourceFilePath)).toBe(true)

      // Perform the move
      await mover.moveFile(testCase.sourceFile, testCase.targetFile)

      // Verify file was moved
      const targetFilePath = join(tempFixturePath, testCase.targetFile)
      expect(existsSync(targetFilePath)).toBe(true)
      expect(existsSync(sourceFilePath)).toBe(false)

      // Verify imports were updated correctly
      for (const expectedUpdate of testCase.expectedUpdates) {
        const filePath = join(tempFixturePath, expectedUpdate.file)
        const updatedContent = await readFileContent(filePath)
        const originalContent = originalContents.get(expectedUpdate.file)

        expect(updatedContent).not.toBe(originalContent)
        expect(updatedContent).toContain(expectedUpdate.expectedImport)
      }
    })
  }

  test('Error handling - source file does not exist', async () => {
    const tempFixturePath = await createTempFixture('basic-relative')
    const mover = new TypeScriptFileMover(tempFixturePath)
    await mover.init()

    await expect(mover.moveFile('non-existent.ts', 'dest.ts')).rejects.toThrow('Source file does not exist')
  })

  test('Error handling - destination already exists', async () => {
    const tempFixturePath = await createTempFixture('basic-relative')
    const mover = new TypeScriptFileMover(tempFixturePath)
    await mover.init()

    await expect(mover.moveFile('src/utils/helper.ts', 'src/components/UserCard.tsx')).rejects.toThrow(
      'Destination already exists'
    )
  })

  test('Error handling - non-TypeScript file', async () => {
    const tempFixturePath = await createTempFixture('basic-relative')

    // Create a non-TS file
    const nonTsFile = join(tempFixturePath, 'test.js')
    await writeFile(nonTsFile, 'console.log("test");')

    const mover = new TypeScriptFileMover(tempFixturePath)
    await mover.init()

    await expect(mover.moveFile('test.js', 'dest.ts')).rejects.toThrow('Source must be a TypeScript file')
  })

  test('No updates when no imports found', async () => {
    const tempFixturePath = await createTempFixture('basic-relative')

    // Create an isolated file with no imports
    const isolatedFile = join(tempFixturePath, 'src/isolated.ts')
    await writeFile(
      isolatedFile,
      `
export const isolatedFunction = () => {
  return "This file is not imported by anyone";
};
`
    )

    const mover = new TypeScriptFileMover(tempFixturePath)
    await mover.init()

    // This should succeed but update 0 files
    await mover.moveFile('src/isolated.ts', 'src/utils/isolated.ts')

    const targetPath = join(tempFixturePath, 'src/utils/isolated.ts')
    expect(existsSync(targetPath)).toBe(true)
  })

  test('Handle export statements', async () => {
    const tempFixturePath = await createTempFixture('basic-relative')

    // Create a file that re-exports from the file we'll move
    const reexportFile = join(tempFixturePath, 'src/index.ts')
    await writeFile(
      reexportFile,
      `
export { User, UserService, formatUserName } from './utils/helper';
export * from './components/UserCard';
`
    )

    const mover = new TypeScriptFileMover(tempFixturePath)
    await mover.init()

    await mover.moveFile('src/utils/helper.ts', 'src/lib/helper.ts')

    const indexContent = await readFileContent(reexportFile)
    expect(indexContent).toContain("export { User, UserService, formatUserName } from './lib/helper';")
  })
})

// Additional integration test
describe('TypeScriptFileMover Integration', () => {
  test('Complex scenario with multiple file moves', async () => {
    const tempFixturePath = await createTempFixture('mixed-imports')
    const mover = new TypeScriptFileMover(tempFixturePath)
    await mover.init()

    // Move logger first
    await mover.moveFile('src/utils/logger.ts', 'src/core/logging/logger.ts')

    // Verify the event-bus file was updated
    const eventBusContent = await readFileContent(join(tempFixturePath, 'src/core/event-bus.ts'))
    expect(eventBusContent).toContain("import { Logger, LogLevel, createLogger } from '~/core/logging/logger';")

    // Now move event-bus to a different location
    await mover.moveFile('src/core/event-bus.ts', 'src/shared/event-bus.ts')

    // Verify notification service was updated
    const notificationContent = await readFileContent(join(tempFixturePath, 'src/features/notification-service.ts'))
    expect(notificationContent).toContain("import { EventBus, globalEventBus } from '../shared/event-bus';")
  })
})

if (import.meta.main) {
  console.log('Running move-ts tests...')
}
