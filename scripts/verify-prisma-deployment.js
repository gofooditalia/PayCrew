#!/usr/bin/env node

/**
 * Prisma Deployment Verification Script
 * 
 * This script verifies that Prisma binaries are correctly configured
 * for Vercel deployment (RHEL environment)
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Prisma Deployment Verification');
console.log('==================================');

// Check 1: Verify Prisma client directory exists
const prismaClientDir = path.join(__dirname, '../node_modules/.prisma/client');
if (!fs.existsSync(prismaClientDir)) {
  console.error('❌ Prisma client directory not found');
  process.exit(1);
}
console.log('✅ Prisma client directory exists');

// Check 2: Verify required binaries exist
const requiredBinaries = [
  'libquery_engine-rhel-openssl-3.0.x.so.node',
  'libquery_engine-debian-openssl-3.0.x.so.node'
];

let allBinariesExist = true;
requiredBinaries.forEach(binary => {
  const binaryPath = path.join(prismaClientDir, binary);
  if (fs.existsSync(binaryPath)) {
    const stats = fs.statSync(binaryPath);
    console.log(`✅ ${binary} (${Math.round(stats.size / 1024 / 1024)}MB)`);
  } else {
    console.error(`❌ ${binary} - MISSING`);
    allBinariesExist = false;
  }
});

if (!allBinariesExist) {
  console.error('\n❌ Some required Prisma binaries are missing!');
  console.error('Run: npm run db:generate');
  process.exit(1);
}

// Check 3: Verify schema configuration
const schemaPath = path.join(__dirname, '../prisma/schema.prisma');
if (!fs.existsSync(schemaPath)) {
  console.error('❌ Prisma schema not found');
  process.exit(1);
}

const schemaContent = fs.readFileSync(schemaPath, 'utf8');
const hasBinaryTargets = schemaContent.includes('binaryTargets');
const hasRhelTarget = schemaContent.includes('rhel-openssl-3.0.x');

if (!hasBinaryTargets) {
  console.error('❌ binaryTargets not configured in schema.prisma');
  process.exit(1);
}

if (!hasRhelTarget) {
  console.error('❌ rhel-openssl-3.0.x target not configured');
  process.exit(1);
}

console.log('✅ Binary targets configured correctly');

// Check 4: Verify package.json scripts
const packageJsonPath = path.join(__dirname, '../package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

if (!packageJson.scripts || !packageJson.scripts.postinstall) {
  console.error('❌ postinstall script not found in package.json');
  process.exit(1);
}

const hasPrismaGenerate = packageJson.scripts.postinstall.includes('prisma generate');
if (!hasPrismaGenerate) {
  console.error('❌ postinstall script does not include "prisma generate"');
  process.exit(1);
}

console.log('✅ postinstall script configured correctly');

// Check 5: Verify Next.js configuration
const nextConfigPath = path.join(__dirname, '../next.config.js');
if (!fs.existsSync(nextConfigPath)) {
  console.error('❌ next.config.js not found');
  process.exit(1);
}

const nextConfigContent = fs.readFileSync(nextConfigPath, 'utf8');
const hasTranspilePackages = nextConfigContent.includes('transpilePackages');
const hasPrismaClient = nextConfigContent.includes('@prisma/client');

if (!hasTranspilePackages || !hasPrismaClient) {
  console.error('❌ @prisma/client not in transpilePackages');
  process.exit(1);
}

console.log('✅ Next.js configuration looks good');

console.log('\n🎉 All Prisma deployment checks passed!');
console.log('\n📋 Deployment Summary:');
console.log('   • Prisma binaries: RHEL + Debian targets');
console.log('   • Schema: binaryTargets configured');
console.log('   • Build: transpilePackages includes @prisma/client');
console.log('   • Scripts: postinstall runs prisma generate');
console.log('\n🚀 Ready for Vercel deployment!');