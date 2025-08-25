#!/usr/bin/env bun
import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { existsSync } from 'node:fs'
import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { TypeScriptFileMover } from '../../move-ts.ts'

const FIXTURES_DIR = resolve(__dirname, '../fixtures')
const TEMP_DIR = resolve(__dirname, '../temp')

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

describe('Move-TS Basic Functionality', () => {
  beforeEach(async () => {
    await rm(TEMP_DIR, { recursive: true, force: true })
    await mkdir(TEMP_DIR, { recursive: true })
  })

  afterEach(async () => {
    await rm(TEMP_DIR, { recursive: true, force: true })
  })

  test('Basic relative imports - move file and update imports', async () => {
    const tempFixturePath = await createTempFixture('basic-relative')
    const mover = new TypeScriptFileMover(tempFixturePath)
    await mover.init()

    const sourceFile = 'src/utils/helper.ts'
    const targetFile = 'src/lib/helper.ts'

    // Verify source exists
    expect(existsSync(join(tempFixturePath, sourceFile))).toBe(true)

    // Move the file
    await mover.moveFile(sourceFile, targetFile)

    // Verify file was moved
    expect(existsSync(join(tempFixturePath, targetFile))).toBe(true)
    expect(existsSync(join(tempFixturePath, sourceFile))).toBe(false)

    // Check that imports were updated
    const userCardContent = await readFileContent(join(tempFixturePath, 'src/components/UserCard.tsx'))
    expect(userCardContent).toContain("import { User, formatUserName } from '../lib/helper';")

    const _apiContent = await readFileContent(join(tempFixturePath, 'src/services/api.ts'))
    expect(userCardContent).toContain("import { User, formatUserName } from '../lib/helper';")

    const testContent = await readFileContent(join(tempFixturePath, 'tests/helper.test.ts'))
    expect(testContent).toContain("import { User, UserService, formatUserName } from '../src/lib/helper';")
  })

  test('Deep nested relative imports', async () => {
    const tempFixturePath = await createTempFixture('deep-nested')
    const mover = new TypeScriptFileMover(tempFixturePath)
    await mover.init()

    const sourceFile = 'src/utils/validation/rules.ts'
    const targetFile = 'src/core/validation/rules.ts'

    await mover.moveFile(sourceFile, targetFile)

    // Check deeply nested import paths were updated correctly
    const textInputContent = await readFileContent(join(tempFixturePath, 'src/components/ui/inputs/TextInput.tsx'))
    expect(textInputContent).toContain(
      "import { ValidationRule, RequiredRule, MinLengthRule } from '../../../core/validation/rules';"
    )

    const userFormContent = await readFileContent(join(tempFixturePath, 'src/components/forms/UserForm.tsx'))
    expect(userFormContent).toContain("import { EmailRule, RequiredRule } from '../../core/validation/rules';")

    const testContent = await readFileContent(join(tempFixturePath, 'tests/unit/components/TextInput.test.tsx'))
    expect(testContent).toContain("import { RequiredRule, MinLengthRule } from '../../../src/core/validation/rules';")
  })

  test('Multiple imports from same file', async () => {
    const tempFixturePath = await createTempFixture('basic-relative')
    const mover = new TypeScriptFileMover(tempFixturePath)
    await mover.init()

    // Add a file with multiple import statements from the same module
    const multiImportFile = join(tempFixturePath, 'src/multiple-imports.ts')
    await writeFile(
      multiImportFile,
      `
import { User } from './utils/helper';
import { UserService, formatUserName } from './utils/helper';
import type { User as UserType } from './utils/helper';

export class MultipleImportsExample {
  private service = new UserService();
  
  formatUser(user: User): string {
    return formatUserName(user);
  }
  
  processUser(user: UserType): void {
    this.service.addUser(user);
  }
}
`
    )

    await mover.moveFile('src/utils/helper.ts', 'src/shared/helper.ts')

    const multiImportContent = await readFileContent(multiImportFile)
    expect(multiImportContent).toContain("import { User } from './shared/helper';")
    expect(multiImportContent).toContain("import { UserService, formatUserName } from './shared/helper';")
    expect(multiImportContent).toContain("import type { User as UserType } from './shared/helper';")
  })

  test('Export re-declarations', async () => {
    const tempFixturePath = await createTempFixture('basic-relative')
    const mover = new TypeScriptFileMover(tempFixturePath)
    await mover.init()

    // Add a file that re-exports from the module we'll move
    const indexFile = join(tempFixturePath, 'src/index.ts')
    await writeFile(
      indexFile,
      `
export { User, UserService } from './utils/helper';
export * from './components/UserCard';
export { formatUserName as formatUser } from './utils/helper';
`
    )

    await mover.moveFile('src/utils/helper.ts', 'src/types/helper.ts')

    const indexContent = await readFileContent(indexFile)
    expect(indexContent).toContain("export { User, UserService } from './types/helper';")
    expect(indexContent).toContain("export { formatUserName as formatUser } from './types/helper';")
    // This line shouldn't change as it doesn't reference the moved file
    expect(indexContent).toContain("export * from './components/UserCard';")
  })

  test('Error handling scenarios', async () => {
    const tempFixturePath = await createTempFixture('basic-relative')
    const mover = new TypeScriptFileMover(tempFixturePath)
    await mover.init()

    // Test: Source file doesn't exist
    await expect(mover.moveFile('non-existent.ts', 'dest.ts')).rejects.toThrow('Source file does not exist')

    // Test: Destination already exists
    await expect(mover.moveFile('src/utils/helper.ts', 'src/components/UserCard.tsx')).rejects.toThrow(
      'Destination already exists'
    )

    // Test: Non-TypeScript file
    const jsFile = join(tempFixturePath, 'test.js')
    await writeFile(jsFile, 'console.log("test");')

    await expect(mover.moveFile('test.js', 'dest.ts')).rejects.toThrow('Source must be a TypeScript file')
  })

  test('No imports scenario - isolated file', async () => {
    const tempFixturePath = await createTempFixture('basic-relative')
    const mover = new TypeScriptFileMover(tempFixturePath)
    await mover.init()

    // Create a file that's not imported by anyone
    const isolatedFile = join(tempFixturePath, 'src/isolated.ts')
    await writeFile(
      isolatedFile,
      `
export const isolatedFunction = (): string => {
  return "This file is not imported by anyone";
};

export class IsolatedClass {
  doSomething(): void {
    console.log("isolated");
  }
}
`
    )

    // This should succeed but update 0 files
    await mover.moveFile('src/isolated.ts', 'src/utils/isolated.ts')

    // Verify the file was moved
    expect(existsSync(join(tempFixturePath, 'src/utils/isolated.ts'))).toBe(true)
    expect(existsSync(join(tempFixturePath, 'src/isolated.ts'))).toBe(false)
  })

  test('Move to subdirectory', async () => {
    const tempFixturePath = await createTempFixture('basic-relative')
    const mover = new TypeScriptFileMover(tempFixturePath)
    await mover.init()

    await mover.moveFile('src/utils/helper.ts', 'src/utils/core/helper.ts')

    const userCardContent = await readFileContent(join(tempFixturePath, 'src/components/UserCard.tsx'))
    expect(userCardContent).toContain("import { User, formatUserName } from '../utils/core/helper';")

    const apiContent = await readFileContent(join(tempFixturePath, 'src/services/api.ts'))
    expect(apiContent).toContain("import { User, UserService } from '../utils/core/helper';")
  })

  test('Move to parent directory', async () => {
    const tempFixturePath = await createTempFixture('deep-nested')
    const mover = new TypeScriptFileMover(tempFixturePath)
    await mover.init()

    await mover.moveFile('src/utils/validation/rules.ts', 'src/validation-rules.ts')

    const textInputContent = await readFileContent(join(tempFixturePath, 'src/components/ui/inputs/TextInput.tsx'))
    expect(textInputContent).toContain(
      "import { ValidationRule, RequiredRule, MinLengthRule } from '../../../validation-rules';"
    )

    const userFormContent = await readFileContent(join(tempFixturePath, 'src/components/forms/UserForm.tsx'))
    expect(userFormContent).toContain("import { EmailRule, RequiredRule } from '../../validation-rules';")
  })
})

if (import.meta.main) {
  console.log('Running basic move-ts tests...')
}
