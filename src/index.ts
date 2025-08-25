export { BarrelAnalyzer } from './barrel-analyzer.js';
export { ConfigLoader } from './config-loader.js';
export { ImportAnalyzer } from './import-analyzer.js';
export { TypeScriptFileMover, type TypeScriptFileMoverOptions } from './move-ts.js';
export { PackageImportsResolver } from './package-imports-resolver.js';
export { PathResolver, RelativePathResolver } from './path-resolver.js';
export { TsConfigPathResolver } from './tsconfig-path-resolver.js';
export type {
  BarrelAnalysisResult,
  BarrelExport,
  FileUpdate,
  ImportReference,
  ImportTypeInfo,
  NamedExport,
  PackageImportsInfo,
  PathMappingInfo,
} from './types.js';
