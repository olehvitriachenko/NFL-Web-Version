# PDF Generation Utility

Утилита для генерации PDF из HTML в Electron приложении.

## Использование

### 1. Генерация PDF из HTML строки

```typescript
import { generateAndSavePDF } from '../utils/pdf';

const html = `
  <!DOCTYPE html>
  <html>
    <head>
      <style>
        body { font-family: Arial; }
        h1 { color: #333; }
      </style>
    </head>
    <body>
      <h1>Мой документ</h1>
      <p>Содержимое документа</p>
    </body>
  </html>
`;

// Генерация и сохранение в одном шаге
const filePath = await generateAndSavePDF(html, 'document.pdf', {
  pageSize: 'A4',
  printBackground: true,
  margins: {
    top: 20,
    bottom: 20,
    left: 20,
    right: 20,
  },
});
```

### 2. Генерация PDF из HTML элемента

```typescript
import { generatePDFFromElement, savePDFFile } from '../utils/pdf';
import { useRef } from 'react';

function MyComponent() {
  const elementRef = useRef<HTMLDivElement>(null);

  const handleGeneratePDF = async () => {
    if (!elementRef.current) return;

    const pdfBuffer = await generatePDFFromElement(elementRef, {
      pageSize: 'A4',
      printBackground: true,
    });

    if (pdfBuffer) {
      await savePDFFile(pdfBuffer, 'document.pdf');
    }
  };

  return (
    <div ref={elementRef}>
      <h1>Мой документ</h1>
      <p>Содержимое для PDF</p>
    </div>
  );
}
```

### 3. Раздельная генерация и сохранение

```typescript
import { generatePDFFromHTML, savePDFFile } from '../utils/pdf';

// Сначала генерируем PDF
const pdfBuffer = await generatePDFFromHTML(html, {
  pageSize: 'A4',
  landscape: false,
});

// Затем сохраняем
if (pdfBuffer) {
  const filePath = await savePDFFile(pdfBuffer, 'document.pdf');
  console.log('PDF сохранен:', filePath);
}
```

## Опции PDF

```typescript
interface PDFOptions {
  margins?: {
    top?: number;
    bottom?: number;
    left?: number;
    right?: number;
  };
  pageSize?: 'A4' | 'Letter' | 'Legal' | 'Tabloid' | 'Ledger' | 'A3' | 'A5' | 'A6';
  landscape?: boolean;
  printBackground?: boolean;
}
```

## Важные замечания

1. **Только в Electron**: Функции работают только в Electron окружении. В браузере они вернут `null`.

2. **HTML должен быть полным документом**: При использовании `generatePDFFromHTML` передавайте полный HTML документ с тегами `<html>`, `<head>`, `<body>`.

3. **Стили**: Стили должны быть включены в HTML (в теге `<style>` или через внешние CSS файлы).

4. **Асинхронность**: Все функции асинхронные и возвращают Promise.

## Пример страницы

Полный пример использования можно найти в `src/pages/GeneratePDFPage.tsx`.

