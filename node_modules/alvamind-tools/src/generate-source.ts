#!/usr/bin/env node

import * as fs from 'fs';
import * as path from 'path';

// Ubah agar bisa mengakses directory project yang menggunakan package
const projectDir = process.cwd();

async function generateSourceCodeMarkdown(
  outputFilename: string = 'source-code.md',
  customInclude: string[] = [],
  customExclude: string[] = [],
) {
  const projectName = path.basename(projectDir); // ambil nama project dari root dir
  const excludedPathsAndFiles = [
    'node_modules',
    '.git',
    'generate-source.ts',
    '.zed-settings.json',
    '.vscode/settings.json',
    'package-lock.json',
    'src/common/dtos/generated',
    'src/persistence/seed.ts',
    'bun.lockb',
    'src/common/exceptions',
    'prisma/schema.prisma',
    'build',
    'documentation/tsyringe-neo.md',
    'src/common/utils',
    outputFilename,
  ];

  const defaultExcludes: RegExp[] = [];

  // Updated regex to handle both single-line and multi-line comments
  const singleLineCommentRegex = /^\s*\/\/.*$/gm;
  const multiLineCommentRegex = /\/\*[\s\S]*?\*\//g;

  let allPaths: string[] = [];
  let allFiles: string[] = [];

  function isExcluded(filePath: string): boolean {
    const normalizedFilePath = path.normalize(filePath);

    if (
      excludedPathsAndFiles.includes(normalizedFilePath) ||
      excludedPathsAndFiles.some((excludedPath) => normalizedFilePath.startsWith(path.normalize(excludedPath) + '/'))
    ) {
      return true;
    }

    // Convert glob patterns to regex patterns
    const isCustomExcluded = customExclude.some((exclude) => {
      try {
        let pattern = exclude;
        if (!exclude.startsWith('/') || !exclude.endsWith('/')) {
          // Convert glob pattern to regex pattern
          pattern = exclude
            .replace(/\./g, '\\.') // Escape dots
            .replace(/\*/g, '.*'); // Convert * to .*
        } else {
          // If it's already a regex pattern (enclosed in //)
          pattern = exclude.slice(1, -1);
        }
        const regex = new RegExp(pattern);
        return regex.test(normalizedFilePath);
      } catch (e) {
        console.error(`Invalid regex: ${exclude}`, e);
        return false;
      }
    });

    if (isCustomExcluded && !customInclude.some((include) => normalizedFilePath.endsWith(include))) {
      return true;
    }

    return false;
  }

  function traverseDir(dir: string) {
    // Ubah untuk menggunakan projectDir
    const entries = fs.readdirSync(path.join(projectDir, dir), { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (isExcluded(fullPath)) {
        continue;
      }

      if (entry.isDirectory()) {
        allPaths.push(fullPath);
        traverseDir(fullPath);
      } else if (entry.isFile()) {
        allFiles.push(fullPath);
      }
    }
  }

  traverseDir('.');

  const filteredPaths = allPaths.filter((p) => !isExcluded(p));
  const filteredFiles = allFiles.filter((f) => !isExcluded(f));

  let output = `# Project: ${projectName}\n\n`; // Tambahin judul project di awal output
  output += filteredPaths.join('\n') + '\n====================\n';
  let totalLines = 0;

  for (const file of filteredFiles) {
    output += `// ${file}\n`;
    // Ubah untuk menggunakan projectDir
    let content = fs.readFileSync(path.join(projectDir, file), 'utf-8');
    // Remove both types of comments
    content = content.replace(multiLineCommentRegex, '');
    content = content.replace(singleLineCommentRegex, '');
    // Remove empty lines that might be left after removing comments
    content = content.replace(/^\s*[\r\n]/gm, '');
    const lines = content.split('\n');
    totalLines += lines.length;
    output += content + '\n';
  }

  // Ubah untuk menggunakan projectDir
  fs.writeFileSync(path.join(projectDir, outputFilename), output);
  console.log(`Source code info written to ${outputFilename}. Total lines: ${totalLines}`);
}

// Ubah agar bisa menerima parameter dari CLI
const args = process.argv.slice(2);
let outputFilename = 'source-code.md';
let customInclude: string[] = [];
let customExclude: string[] = [];

args.forEach((arg) => {
  if (arg.startsWith('output=')) {
    outputFilename = arg.split('=')[1];
  } else if (arg.startsWith('include=')) {
    customInclude = arg.split('=')[1].split(',');
  } else if (arg.startsWith('exclude=')) {
    try {
      const excludeValue = arg.split('=')[1];
      if (excludeValue) {
        customExclude = excludeValue.split(',').map((pattern) => pattern.trim());
      }
    } catch (error) {
      console.error('Error parsing exclude patterns:', error);
      customExclude = [];
    }
  }
});

generateSourceCodeMarkdown(outputFilename, customInclude, customExclude).catch((err) => console.error('Error:', err));
