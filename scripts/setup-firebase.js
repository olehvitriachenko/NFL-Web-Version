#!/usr/bin/env node
/**
 * Скрипт для настройки Firebase конфигурации
 * Использование: node scripts/setup-firebase.js [dev|prod]
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const environment = process.argv[2] || 'dev';

if (!['dev', 'prod'].includes(environment)) {
  console.error('❌ Ошибка: окружение должно быть "dev" или "prod"');
  process.exit(1);
}

console.log(`🔧 Настройка Firebase для окружения: ${environment}`);

// Проверяем наличие .env файла
const envFile = path.join(rootDir, '.env');
const envExampleFile = path.join(rootDir, '.env.example');

if (!fs.existsSync(envFile)) {
  console.log('📝 Создание .env файла из .env.example...');
  if (fs.existsSync(envExampleFile)) {
    fs.copyFileSync(envExampleFile, envFile);
    console.log('✅ .env файл создан. Пожалуйста, заполните значения Firebase.');
  } else {
    console.log('⚠️  .env.example не найден. Создайте .env файл вручную.');
  }
} else {
  console.log('✅ .env файл существует');
}

// Проверяем наличие переменных окружения
const envContent = fs.existsSync(envFile) ? fs.readFileSync(envFile, 'utf-8') : '';

const requiredVars = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID',
];

const missingVars = requiredVars.filter(
  (varName) => !envContent.includes(`${varName}=`)
);

if (missingVars.length > 0) {
  console.warn(`⚠️  Отсутствующие переменные окружения:`);
  missingVars.forEach((varName) => console.warn(`   - ${varName}`));
  console.log('\n💡 Добавьте эти переменные в .env файл с соответствующими значениями.');
} else {
  console.log('✅ Все необходимые переменные окружения найдены');
}

console.log(`\n✅ Настройка Firebase для ${environment} окружения завершена`);
console.log('📚 Документация: см. README.md раздел Firebase');

