#!/usr/bin/env node
/**
 * Скрипт для проверки конфигурации Firebase
 * Использование: 
 *   node scripts/verify-firebase.js        # Проверяет .env (dev)
 *   node scripts/verify-firebase.js prod   # Проверяет .env.production (prod)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const environment = process.argv[2] || 'dev';
const isProd = environment === 'prod' || environment === 'production';

const envFileName = isProd ? '.env.production' : '.env';
const envFile = path.join(rootDir, envFileName);

console.log(`🔍 Проверка конфигурации Firebase для ${isProd ? 'PRODUCTION' : 'DEV'} окружения...\n`);
console.log(`📁 Проверяемый файл: ${envFileName}\n`);

let hasErrors = false;

if (!fs.existsSync(envFile)) {
  console.error(`❌ ${envFileName} файл не найден`);
  if (isProd) {
    console.log(`💡 Создайте ${envFileName} файл с PROD конфигурацией Firebase`);
    console.log('📚 См. FIREBASE_PROD_SETUP.md для инструкций');
  } else {
    console.log('💡 Создайте .env файл или используйте: npm run firebase:setup');
  }
  hasErrors = true;
} else {
  console.log(`✅ ${envFileName} файл найден`);

  // Читаем переменные окружения
  const envContent = fs.readFileSync(envFile, 'utf-8');
  const envLines = envContent.split('\n');

  const requiredVars = [
    'VITE_FIREBASE_API_KEY',
    'VITE_FIREBASE_AUTH_DOMAIN',
    'VITE_FIREBASE_PROJECT_ID',
    'VITE_FIREBASE_STORAGE_BUCKET',
    'VITE_FIREBASE_MESSAGING_SENDER_ID',
    'VITE_FIREBASE_APP_ID',
  ];

  const foundVars = {};

  envLines.forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      if (key && valueParts.length > 0) {
        foundVars[key.trim()] = valueParts.join('=').trim();
      }
    }
  });

  // Проверяем каждую переменную
  requiredVars.forEach((varName) => {
    if (!foundVars[varName]) {
      console.error(`❌ ${varName} не найдена`);
      hasErrors = true;
    } else if (!foundVars[varName] || foundVars[varName].length === 0) {
      console.error(`❌ ${varName} пустая`);
      hasErrors = true;
    } else {
      console.log(`✅ ${varName} настроена`);
    }
  });

  // Проверяем формат значений
  if (foundVars['VITE_FIREBASE_PROJECT_ID']) {
    const projectId = foundVars['VITE_FIREBASE_PROJECT_ID'];
    // Firebase Project ID должен содержать только буквы, цифры и дефисы
    if (!/^[a-z0-9-]+$/.test(projectId)) {
      console.warn(`⚠️  VITE_FIREBASE_PROJECT_ID может содержать только строчные буквы, цифры и дефисы`);
    }
  }
}

// Проверка конфигурационных файлов сервисов
const configFiles = {
  'src/config/firebase.ts': 'Конфигурация Firebase',
  'src/services/firebase/firebaseService.ts': 'Firebase Analytics Service',
  'src/hooks/useAnalytics.ts': 'useAnalytics Hook',
};

Object.entries(configFiles).forEach(([filePath, description]) => {
  const fullPath = path.join(rootDir, filePath);
  if (fs.existsSync(fullPath)) {
    console.log(`✅ ${description} найден (${filePath})`);
  } else {
    console.error(`❌ ${description} не найден (${filePath})`);
    hasErrors = true;
  }
});

console.log('\n' + '='.repeat(50));

if (hasErrors) {
  console.error('\n❌ Проверка завершена с ошибками');
  console.log('💡 Исправьте ошибки и запустите проверку снова');
  process.exit(1);
} else {
  console.log('\n✅ Конфигурация Firebase корректна');
  console.log('🚀 Firebase готов к использованию');
}

