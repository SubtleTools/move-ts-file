#!/usr/bin/env bun
import { TypeScriptFileMover } from '#src';
import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import { existsSync } from 'node:fs';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';

const TEMP_DIR = resolve(__dirname, '../temp');

describe('Directory Destination Support', () => {
  beforeEach(async () => {
    await rm(TEMP_DIR, { recursive: true, force: true });
    await mkdir(TEMP_DIR, { recursive: true });
  });

  afterEach(async () => {
    await rm(TEMP_DIR, { recursive: true, force: true });
  });

  test('Move file to directory destination - relative path', async () => {
    const tempFixturePath = join(TEMP_DIR, 'directory-test');
    await mkdir(tempFixturePath, { recursive: true });
    await mkdir(join(tempFixturePath, 'src'), { recursive: true });

    // Create source file
    const sourceFile = 'src/diagram-editor-orchestrator-complex.tsx';
    await writeFile(
      join(tempFixturePath, sourceFile),
      `export const DiagramEditorOrchestrator = () => {
  return <div>Complex editor</div>;
};`
    );

    // Create package.json
    await writeFile(
      join(tempFixturePath, 'package.json'),
      JSON.stringify({ name: 'test-project', version: '1.0.0' })
    );

    const mover = new TypeScriptFileMover(tempFixturePath);
    await mover.init();

    // Move to directory destination (should append source filename)
    await mover.moveFile(sourceFile, 'components');

    // Verify source file was moved
    expect(existsSync(join(tempFixturePath, sourceFile))).toBe(false);
    
    // Verify file exists in destination directory with same filename
    const expectedDestination = 'components/diagram-editor-orchestrator-complex.tsx';
    expect(existsSync(join(tempFixturePath, expectedDestination))).toBe(true);
  });

  test('Move file to directory destination with trailing slash', async () => {
    const tempFixturePath = join(TEMP_DIR, 'directory-slash-test');
    await mkdir(tempFixturePath, { recursive: true });
    await mkdir(join(tempFixturePath, 'src'), { recursive: true });

    // Create source file
    const sourceFile = 'src/my-component.tsx';
    await writeFile(
      join(tempFixturePath, sourceFile),
      `export const MyComponent = () => {
  return <div>My component</div>;
};`
    );

    // Create package.json
    await writeFile(
      join(tempFixturePath, 'package.json'),
      JSON.stringify({ name: 'test-project', version: '1.0.0' })
    );

    const mover = new TypeScriptFileMover(tempFixturePath);
    await mover.init();

    // Move to directory destination with trailing slash
    await mover.moveFile(sourceFile, 'shared/');

    // Verify source file was moved
    expect(existsSync(join(tempFixturePath, sourceFile))).toBe(false);
    
    // Verify file exists in destination directory with same filename
    const expectedDestination = 'shared/my-component.tsx';
    expect(existsSync(join(tempFixturePath, expectedDestination))).toBe(true);
  });

  test('Move file to nested directory destination', async () => {
    const tempFixturePath = join(TEMP_DIR, 'nested-directory-test');
    await mkdir(tempFixturePath, { recursive: true });
    await mkdir(join(tempFixturePath, 'src'), { recursive: true });

    // Create source file
    const sourceFile = 'src/utils.ts';
    await writeFile(
      join(tempFixturePath, sourceFile),
      `export const utility = () => {
  return 'helper';
};`
    );

    // Create package.json
    await writeFile(
      join(tempFixturePath, 'package.json'),
      JSON.stringify({ name: 'test-project', version: '1.0.0' })
    );

    const mover = new TypeScriptFileMover(tempFixturePath);
    await mover.init();

    // Move to nested directory destination
    await mover.moveFile(sourceFile, 'components/shared/utils');

    // Verify source file was moved
    expect(existsSync(join(tempFixturePath, sourceFile))).toBe(false);
    
    // Verify file exists in nested destination directory with same filename
    const expectedDestination = 'components/shared/utils/utils.ts';
    expect(existsSync(join(tempFixturePath, expectedDestination))).toBe(true);
  });

  test('Move file to absolute directory destination', async () => {
    const tempFixturePath = join(TEMP_DIR, 'absolute-directory-test');
    await mkdir(tempFixturePath, { recursive: true });
    await mkdir(join(tempFixturePath, 'src'), { recursive: true });

    // Create source file
    const sourceFile = 'src/button.tsx';
    await writeFile(
      join(tempFixturePath, sourceFile),
      `export const Button = () => {
  return <button>Click me</button>;
};`
    );

    // Create package.json
    await writeFile(
      join(tempFixturePath, 'package.json'),
      JSON.stringify({ name: 'test-project', version: '1.0.0' })
    );

    const mover = new TypeScriptFileMover(tempFixturePath);
    await mover.init();

    // Use absolute path to destination directory
    const absoluteDestDir = join(tempFixturePath, 'ui-components');
    await mover.moveFile(sourceFile, absoluteDestDir);

    // Verify source file was moved
    expect(existsSync(join(tempFixturePath, sourceFile))).toBe(false);
    
    // Verify file exists in absolute destination directory with same filename
    const expectedDestination = join(absoluteDestDir, 'button.tsx');
    expect(existsSync(expectedDestination)).toBe(true);
  });
});