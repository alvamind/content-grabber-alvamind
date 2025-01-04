#!/usr/bin/env node

import { execSync } from 'child_process';
import * as readline from 'readline';
import chalk from 'chalk';
import * as fs from 'fs';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Get command line arguments
const [, , versionArg, commitMessageArg] = process.argv;

async function askQuestion(query: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(query, resolve);
  });
}

function checkGitStatus(): boolean {
  try {
    const status = execSync('git status --porcelain').toString();
    return status.length === 0;
  } catch (error) {
    return false;
  }
}

function getCurrentBranch(): string {
  return execSync('git rev-parse --abbrev-ref HEAD').toString().trim();
}

function validatePackageJson(): void {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const requiredFields = ['name', 'version', 'description', 'main', 'types'];

  for (const field of requiredFields) {
    if (!packageJson[field]) {
      throw new Error(`Missing required field in package.json: ${field}`);
    }
  }
}

async function selectVersionType(): Promise<string> {
  // If version type is provided via command line, use it
  if (versionArg && ['patch', 'minor', 'major'].includes(versionArg)) {
    return versionArg;
  }

  console.log(chalk.cyan('\nSelect version increment type:'));
  console.log(chalk.gray('1. patch (1.0.0 -> 1.0.1)'));
  console.log(chalk.gray('2. minor (1.0.0 -> 1.1.0)'));
  console.log(chalk.gray('3. major (1.0.0 -> 2.0.0)'));

  const answer = await askQuestion('Enter your choice (1-3): ');
  const versionMap: { [key: string]: string } = {
    '1': 'patch',
    '2': 'minor',
    '3': 'major',
  };

  return versionMap[answer] || 'patch';
}

async function getCommitMessage(): Promise<string> {
  // If commit message is provided via command line, use it
  if (commitMessageArg) {
    return commitMessageArg;
  }

  const message = await askQuestion(chalk.cyan('Enter commit message: '));
  if (!message.trim()) {
    throw new Error('Commit message is required');
  }
  return message;
}

async function publishPackage() {
  try {
    console.log(chalk.cyan('\n🔍 Running pre-publish checks...\n'));

    // Validate package.json
    console.log(chalk.cyan('📋 Validating package.json...'));
    validatePackageJson();
    console.log(chalk.green('✅ package.json is valid'));

    // Check current branch
    const currentBranch = getCurrentBranch();
    if (currentBranch !== 'main' && currentBranch !== 'master') {
      console.log(chalk.yellow(`⚠️  You're on branch '${currentBranch}'.`));
    }

    // Check for uncommitted changes
    if (!checkGitStatus()) {
      console.log(chalk.yellow('⚠️  You have uncommitted changes'));
      const commitMessage = await getCommitMessage();
      execSync(`bun commit "${commitMessage}"`, { stdio: 'inherit' });
    }

    // Clean and build
    console.log(chalk.cyan('\n🧹 Cleaning project...'));
    execSync('bun clean', { stdio: 'inherit' });

    console.log(chalk.cyan('\n📦 Installing dependencies...'));
    execSync('bun install', { stdio: 'inherit' });

    console.log(chalk.cyan('\n🔨 Building project...'));
    execSync('bun run build', { stdio: 'inherit' });

    // Run tests if they exist
    try {
      console.log(chalk.cyan('\n🧪 Running tests...'));
      execSync('bun test', { stdio: 'inherit' });
      console.log(chalk.green('✅ Tests passed'));
    } catch (error) {
      console.log(chalk.yellow('⚠️  No tests found or tests failed'));
    }

    // Version increment
    const versionType = await selectVersionType();
    console.log(chalk.cyan(`\n📝 Incrementing ${versionType} version...`));
    execSync(`npm version ${versionType} --no-git-tag-version`, { stdio: 'inherit' });

    // Publish to npm
    console.log(chalk.cyan('\n🚀 Publishing to npm...'));
    execSync('npm publish', { stdio: 'inherit' });

    // Create and push git tag
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const tagName = `v${packageJson.version}`;
    execSync(`git tag ${tagName}`, { stdio: 'inherit' });
    execSync('git push && git push --tags', { stdio: 'inherit' });

    console.log(chalk.green('\n✨ Package successfully published to npm!'));
    console.log(chalk.gray(`Version: ${packageJson.version}`));
    console.log(chalk.gray(`Tag: ${tagName}`));
  } catch (error) {
    console.error(chalk.red('\n❌ Error during publish process:'), error);
    process.exit(1);
  } finally {
    rl.close();
  }
}

publishPackage();
