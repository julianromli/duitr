#!/usr/bin/env node

/**
 * Environment Setup Validation Script
 * Run this script to verify your Duitr development environment is properly configured
 * 
 * Usage: node validate-setup.js
 */

import { existsSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🔒 Duitr Security Setup Validation\n');

let hasErrors = false;
const warnings = [];

// Check 1: .env file exists
console.log('1. Checking environment file...');
const envPath = join(__dirname, '.env');
if (existsSync(envPath)) {
  console.log('   ✅ .env file found');
  
  // Check environment variables
  const envContent = readFileSync(envPath, 'utf8');
  
  const requiredVars = [
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY'
  ];
  
  console.log('2. Checking required environment variables...');
  for (const varName of requiredVars) {
    if (envContent.includes(`${varName}=`) && !envContent.includes(`${varName}=your_`)) {
      console.log(`   ✅ ${varName} is set`);
    } else {
      console.log(`   ❌ ${varName} is missing or not configured`);
      hasErrors = true;
    }
  }
  
  // Check for exposed credentials
  console.log('3. Checking for exposed credentials...');
  if (envContent.includes('cxqluedeykgqmthzveiw.supabase.co')) {
    console.log('   ⚠️  WARNING: Using exposed Supabase URL - please rotate your credentials');
    warnings.push('Rotate Supabase credentials immediately');
  } else {
    console.log('   ✅ No exposed credentials detected');
  }
  
} else {
  console.log('   ❌ .env file not found');
  console.log('      Run: cp .env.example .env');
  hasErrors = true;
}

// Check 2: .gitignore properly configured
console.log('4. Checking .gitignore configuration...');
const gitignorePath = join(__dirname, '.gitignore');
if (existsSync(gitignorePath)) {
  const gitignoreContent = readFileSync(gitignorePath, 'utf8');
  if (gitignoreContent.includes('.env')) {
    console.log('   ✅ .env files are properly excluded from git');
  } else {
    console.log('   ❌ .env files are not excluded from git');
    hasErrors = true;
  }
} else {
  console.log('   ❌ .gitignore file not found');
  hasErrors = true;
}

// Check 3: No hardcoded credentials in source
console.log('5. Checking source code for hardcoded credentials...');
const sourceFiles = [
  'src/lib/supabase.ts',
  'src/integrations/supabase/client.ts'
];

for (const filePath of sourceFiles) {
  const fullPath = join(__dirname, filePath);
  if (existsSync(fullPath)) {
    const content = readFileSync(fullPath, 'utf8');
    if (content.includes('cxqluedeykgqmthzveiw') || content.includes('eyJhbGciOi')) {
      console.log(`   ❌ Hardcoded credentials found in ${filePath}`);
      hasErrors = true;
    } else {
      console.log(`   ✅ ${filePath} is clean`);
    }
  }
}

// Summary
console.log('\n📋 Validation Summary:');
if (hasErrors) {
  console.log('❌ Setup has ERRORS - please fix the issues above before proceeding');
  process.exit(1);
} else if (warnings.length > 0) {
  console.log('⚠️  Setup is functional but has warnings:');
  warnings.forEach(warning => console.log(`   - ${warning}`));
  console.log('\n✅ You can proceed with development, but address warnings for production');
} else {
  console.log('✅ All checks passed! Your environment is properly secured.');
}

console.log('\n🚀 Next steps:');
console.log('   - Run: bun dev');
console.log('   - Visit: http://localhost:8080');
console.log('   - Check the Security Fixes Summary: SECURITY_FIXES_SUMMARY.md');