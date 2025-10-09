#!/usr/bin/env bun

import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'

interface PackageJson {
  version: string
  [key: string]: unknown
}

function bumpVersion(
  currentVersion: string,
  type: 'patch' | 'minor' | 'major' = 'patch'
): string {
  const [major, minor, patch] = currentVersion.split('.').map(Number)

  switch (type) {
    case 'major':
      return `${major + 1}.0.0`
    case 'minor':
      return `${major}.${minor + 1}.0`
    case 'patch':
    default:
      return `${major}.${minor}.${patch + 1}`
  }
}

function updatePackageJson(version: string): void {
  const packagePath = join(process.cwd(), 'package.json')
  const packageJson: PackageJson = JSON.parse(readFileSync(packagePath, 'utf8'))

  const oldVersion = packageJson.version
  packageJson.version = version

  writeFileSync(packagePath, JSON.stringify(packageJson, null, 2) + '\n')

  console.log(`Version bumped from ${oldVersion} to ${version}`)
}

function main(): void {
  const args = process.argv.slice(2)
  const versionType = (args[0] as 'patch' | 'minor' | 'major') || 'patch'

  const packagePath = join(process.cwd(), 'package.json')
  const packageJson: PackageJson = JSON.parse(readFileSync(packagePath, 'utf8'))

  const newVersion = bumpVersion(packageJson.version, versionType)
  updatePackageJson(newVersion)

  console.log(`✅ Version updated to ${newVersion}`)
}

if (import.meta.main) {
  main()
}
