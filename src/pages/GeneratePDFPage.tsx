import { useState, useRef } from 'react';
import { generateAndSavePDF, generatePDFFromElement, type PDFOptions } from '../utils/pdf';
import { Button } from '../components/Button';
import { useAnalytics } from '../hooks/useAnalytics';

export const GeneratePDFPage = () => {
  const analytics = useAnalytics();
  const [htmlContent, setHtmlContent] = useState(`<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: Arial, sans-serif;
      padding: 20px;
      max-width: 800px;
      margin: 0 auto;
    }
    h1 {
      color: #333;
      border-bottom: 2px solid #0066cc;
      padding-bottom: 10px;
    }
    .info {
      background-color: #f5f5f5;
      padding: 15px;
      border-radius: 5px;
      margin: 20px 0;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
    }
    th, td {
      border: 1px solid #ddd;
      padding: 12px;
      text-align: left;
    }
    th {
      background-color: #0066cc;
      color: white;
    }
    tr:nth-child(even) {
      background-color: #f2f2f2;
    }
  </style>
</head>
<body>
  <h1>Пример документа для PDF</h1>
  <div class="info">
    <p><strong>Дата:</strong> ${new Date().toLocaleDateString('ru-RU')}</p>
    <p><strong>Версия:</strong> 1.0</p>
  </div>
  <h2>Информация</h2>
  <p>Это пример HTML документа, который будет конвертирован в PDF.</p>
  <table>
    <thead>
      <tr>
        <th>Поле</th>
        <th>Значение</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Название</td>
        <td>Пример документа</td>
      </tr>
      <tr>
        <td>Тип</td>
        <td>PDF генерация</td>
      </tr>
      <tr>
        <td>Статус</td>
        <td>Готов</td>
      </tr>
    </tbody>
  </table>
  <p>Вы можете изменить HTML код выше и сгенерировать PDF с вашим содержимым.</p>
</body>
</html>`);

  const [isGenerating, setIsGenerating] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  // Extract body content from full HTML document for preview
  const getBodyContent = (html: string): string => {
    const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
    if (bodyMatch && bodyMatch[1]) {
      return bodyMatch[1];
    }
    // If no body tag found, try to extract content between tags or return as is
    const htmlMatch = html.match(/<html[^>]*>([\s\S]*)<\/html>/i);
    if (htmlMatch && htmlMatch[1]) {
      return htmlMatch[1];
    }
    return html;
  };

  const handleGenerateFromHTML = async () => {
    setIsGenerating(true);
    setMessage(null);

    // Отслеживание начала генерации PDF
    analytics.trackClick('generate_pdf', 'from_html', 'button');
    analytics.trackEvent('pdf_generation_started', {
      method: 'html',
      page_type: 'generate_pdf'
    });

    try {
      const filePath = await generateAndSavePDF(htmlContent, 'document.pdf', {
        pageSize: 'A4',
        printBackground: true,
        margins: {
          top: 20,
          bottom: 20,
          left: 20,
          right: 20,
        },
      });

      if (filePath) {
        setMessage(`PDF успешно сохранен: ${filePath}`);
        analytics.trackEvent('pdf_generated', {
          method: 'html',
          success: true,
          file_name: 'document.pdf'
        });
      } else {
        setMessage('Сохранение отменено');
        analytics.trackEvent('pdf_generation_cancelled', {
          method: 'html'
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
      setMessage(`Ошибка: ${errorMessage}`);
      analytics.trackEvent('pdf_generation_error', {
        method: 'html',
        error: errorMessage
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateFromElement = async () => {
    if (!previewRef.current) {
      setMessage('Элемент для генерации не найден');
      return;
    }

    setIsGenerating(true);
    setMessage(null);

    // Отслеживание начала генерации PDF из элемента
    analytics.trackClick('generate_pdf', 'from_element', 'button');
    analytics.trackEvent('pdf_generation_started', {
      method: 'element',
      page_type: 'generate_pdf'
    });

    try {
      const pdfBuffer = await generatePDFFromElement(previewRef, {
        pageSize: 'A4',
        printBackground: true,
        margins: {
          top: 20,
          bottom: 20,
          left: 20,
          right: 20,
        },
      });

      if (pdfBuffer) {
        const { savePDFFile } = await import('../utils/pdf');
        const filePath = await savePDFFile(pdfBuffer, 'preview.pdf');
        
        if (filePath) {
          setMessage(`PDF успешно сохранен: ${filePath}`);
          analytics.trackEvent('pdf_generated', {
            method: 'element',
            success: true,
            file_name: 'preview.pdf'
          });
        } else {
          setMessage('Сохранение отменено');
          analytics.trackEvent('pdf_generation_cancelled', {
            method: 'element'
          });
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
      setMessage(`Ошибка: ${errorMessage}`);
      analytics.trackEvent('pdf_generation_error', {
        method: 'element',
        error: errorMessage
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f5f7] p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Генерация PDF из HTML</h1>

        {message && (
          <div className={`mb-4 p-4 rounded ${
            message.includes('Ошибка') 
              ? 'bg-red-100 text-red-800' 
              : message.includes('отменено')
              ? 'bg-yellow-100 text-yellow-800'
              : 'bg-green-100 text-green-800'
          }`}>
            {message}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* HTML Editor */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">HTML код</h2>
            <textarea
              value={htmlContent}
              onChange={(e) => setHtmlContent(e.target.value)}
              className="w-full h-96 p-4 border border-gray-300 rounded font-mono text-sm"
              placeholder="Введите HTML код..."
            />
            <div className="mt-4 flex gap-2">
              <Button
                onClick={handleGenerateFromHTML}
                disabled={isGenerating}
                className="flex-1"
              >
                {isGenerating ? 'Генерация...' : 'Сгенерировать PDF из HTML'}
              </Button>
            </div>
          </div>

          {/* Preview */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Предпросмотр</h2>
            <div className="border border-gray-300 rounded p-4 bg-white max-h-96 overflow-auto">
              <div ref={previewRef} dangerouslySetInnerHTML={{ __html: getBodyContent(htmlContent) }} />
            </div>
            <div className="mt-4">
              <Button
                onClick={handleGenerateFromElement}
                disabled={isGenerating}
                className="w-full"
              >
                {isGenerating ? 'Генерация...' : 'Сгенерировать PDF из элемента'}
              </Button>
            </div>
          </div>
        </div>

        {/* Usage Instructions */}
        <div className="mt-8 bg-blue-50 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Инструкция по использованию</h2>
          <div className="space-y-2 text-sm">
            <p><strong>1. Генерация из HTML строки:</strong></p>
            <pre className="bg-gray-100 p-3 rounded overflow-x-auto">
{`import { generateAndSavePDF } from '../utils/pdf';

const html = '<html>...</html>';
await generateAndSavePDF(html, 'document.pdf');`}
            </pre>

            <p className="mt-4"><strong>2. Генерация из HTML элемента:</strong></p>
            <pre className="bg-gray-100 p-3 rounded overflow-x-auto">
{`import { generatePDFFromElement, savePDFFile } from '../utils/pdf';

const pdfBuffer = await generatePDFFromElement(elementRef);
if (pdfBuffer) {
  await savePDFFile(pdfBuffer, 'document.pdf');
}`}
            </pre>

            <p className="mt-4"><strong>3. Настройки PDF:</strong></p>
            <pre className="bg-gray-100 p-3 rounded overflow-x-auto">
{`const options = {
  pageSize: 'A4', // 'A4' | 'Letter' | 'Legal' | 'Tabloid' | 'Ledger' | 'A3' | 'A5' | 'A6'
  landscape: false,
  printBackground: true,
  margins: {
    top: 20,
    bottom: 20,
    left: 20,
    right: 20,
  },
};`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};

