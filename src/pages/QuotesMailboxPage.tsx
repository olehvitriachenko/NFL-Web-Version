import { useState, useEffect } from 'react';
import { useNavigate, useRouter } from '@tanstack/react-router';
import { PageHeader } from '../components/PageHeader';
import { navigateBack } from '../utils/navigation';
import { pdfQueueService } from '../services/quotes/pdfQueueService';
import { databaseAdapter } from '../services/quotes/databaseAdapter';
import type { PdfQueueItem } from '../types/quotes';
import { useAnalytics } from '../hooks/useAnalytics';

interface QuoteDisplayItem {
  id: number;
  createdDate: string;
  policyType: string;
  dateTime: string;
  amount: number;
  monthlyCost: number;
  pdfPath?: string;
  recipientEmail: string;
  recipientName?: string;
  paymentMode?: string;
}

export const QuotesMailboxPage = () => {
  const navigate = useNavigate();
  const router = useRouter();
  const analytics = useAnalytics();
  const [sentQuotes, setSentQuotes] = useState<QuoteDisplayItem[]>([]);
  const [unsentQuotes, setUnsentQuotes] = useState<QuoteDisplayItem[]>([]);
  const [undeliverableQuotes, setUndeliverableQuotes] = useState<QuoteDisplayItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadQuotes();
    
    // Refresh quotes when page becomes visible (user navigates back)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        loadQuotes();
      }
    };
    
    // Refresh quotes periodically (every 5 seconds)
    const interval = setInterval(() => {
      loadQuotes();
    }, 5000);
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const loadQuotes = async () => {
    try {
      setLoading(true);
      
      // Get all PDFs from queue with quote data joined
      const result = await databaseAdapter.query(`
        SELECT 
          pq.*,
          q.product,
          q.configureProduct,
          q.paymentMode
        FROM pdf_queue pq
        LEFT JOIN quotes q ON pq.quote_id = q.id
        WHERE pq.status != 'deleted'
        ORDER BY pq.created_at DESC
      `);
      
      const allPdfs = result.rows.map((row: any) => ({
        id: row.id,
        quote_id: row.quote_id,
        agent_id: row.agent_id,
        pdf_path: row.pdf_path,
        recipient_email: row.recipient_email,
        recipient_name: row.recipient_name,
        recipient_first_name: row.recipient_first_name,
        recipient_last_name: row.recipient_last_name,
        status: row.status,
        retry_count: row.retry_count,
        error_message: row.error_message,
        death_benefit: row.death_benefit,
        monthly_payment: row.monthly_payment,
        created_at: row.created_at,
        updated_at: row.updated_at,
        product: row.product,
        configureProduct: row.configureProduct,
        paymentMode: row.paymentMode,
      }));
      
      // Filter by status
      const sent = allPdfs.filter((pdf: any) => pdf.status === 'sent');
      const unsent = allPdfs.filter((pdf: any) => pdf.status === 'pending');
      const undeliverable = allPdfs.filter((pdf: any) => pdf.status === 'failed');
      
      // Transform to display format
      setSentQuotes(sent.map(transformPdfToQuote));
      setUnsentQuotes(unsent.map(transformPdfToQuote));
      setUndeliverableQuotes(undeliverable.map(transformPdfToQuote));
    } catch (error) {
      console.error('Error loading quotes:', error);
    } finally {
      setLoading(false);
    }
  };

  const transformPdfToQuote = (pdf: any): QuoteDisplayItem => {
    const date = new Date(pdf.created_at * 1000);
    const formattedDate = formatDateTime(date);
    
    // Get product type from quote data
    let policyType = 'PWL - Participating Whole Life'; // default
    if (pdf.product) {
      policyType = pdf.product;
    } else if (pdf.configureProduct) {
      policyType = pdf.configureProduct;
    }
    
    // Build recipient name from available fields
    let recipientName: string | undefined;
    if (pdf.recipient_name) {
      recipientName = pdf.recipient_name;
    } else if (pdf.recipient_first_name || pdf.recipient_last_name) {
      const name = `${pdf.recipient_first_name || ''} ${pdf.recipient_last_name || ''}`.trim();
      recipientName = name || undefined;
    }
    
    return {
      id: pdf.id,
      createdDate: formattedDate,
      policyType,
      dateTime: formattedDate,
      amount: pdf.death_benefit || 0,
      monthlyCost: pdf.monthly_payment || 0,
      pdfPath: pdf.pdf_path,
      recipientEmail: pdf.recipient_email,
      recipientName,
      paymentMode: pdf.paymentMode,
    };
  };

  const formatDateTime = (date: Date): string => {
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const year = date.getFullYear();
    const hours = date.getHours() % 12 || 12;
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const ampm = date.getHours() >= 12 ? 'PM' : 'AM';
    return `${month}/${day}/${year} ${hours}:${minutes} ${ampm}`;
  };

  const handleBack = () => {
    navigateBack(router, () => navigate({ to: '/home' }));
  };

  const handleHome = () => {
    navigate({ to: '/home' });
  };

  const handleViewPdf = (pdfPath: string | undefined, quoteId?: number) => {
    if (!pdfPath) {
      console.error('PDF path not available');
      return;
    }
    
    // Отслеживание просмотра PDF котировки
    analytics.trackClick('view_quote_pdf', `quote_${quoteId || 'unknown'}`, 'button');
    analytics.trackEvent('quote_pdf_viewed', {
      quote_id: quoteId,
      source: 'quotes_mailbox'
    });
    
    // Encode the file path for URL
    const encodedPath = encodeURIComponent(pdfPath);
    navigate({ 
      to: '/pdf-viewer', 
      search: { file: encodedPath } 
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const renderQuoteCard = (quote: QuoteDisplayItem) => (
    <div
      key={quote.id}
      className="bg-white p-4 rounded-lg shadow-sm border border-gray-200"
      style={{ borderRadius: 10 }}
    >
      <div className="mb-3">
        <p className="text-sm text-gray-600 mb-2">
          <span className="font-medium">Created:</span> {quote.createdDate}
        </p>
        <h3 className="text-base font-bold text-[#000000] mb-2">
          {quote.policyType}
        </h3>
        <p className="text-sm text-gray-600 mb-2">
          {quote.dateTime}
        </p>
      </div>
      
      <div className="flex justify-between items-end">
        <div>
          <p className="text-base font-bold text-[#000000] mb-1">
            {formatCurrency(quote.amount)}
          </p>
          <p className="text-sm text-gray-700">
            {formatCurrency((() => {
              // For non-standard payment modes, monthlyCost in database is incorrectly calculated
              // as modal / 12 in syncService, so we need to multiply by 12 to get modal back
              const paymentMode = quote.paymentMode || 'Monthly';
              const monthlyCost = quote.monthlyCost || 0;
              
              if (paymentMode === 'EveryFourWeeks' || paymentMode === 'Every 4 Weeks') {
                // monthlyCost = modal / 12, so modal = monthlyCost * 12
                return monthlyCost * 12;
              }
              if (paymentMode === 'SemiMonthly' || paymentMode === 'Semi-Monthly') {
                return monthlyCost * 12;
              }
              if (paymentMode === 'BiWeekly' || paymentMode === 'Bi-Weekly') {
                return monthlyCost * 12;
              }
              if (paymentMode === 'Weekly') {
                return monthlyCost * 12;
              }
              
              // For standard payment modes, convert from monthly to modal
              const modeMap: Record<string, number> = {
                'Monthly': 1,
                'Quarterly': 3,
                'Semi-Annual': 6,
                'SemiAnnual': 6,
                'Annual': 12,
              };
              
              const multiplier = modeMap[paymentMode] || 1;
              return monthlyCost * multiplier;
            })())}/{(() => {
              const paymentMode = quote.paymentMode || 'Monthly';
              const modeLabels: Record<string, string> = {
                'Monthly': 'Monthly',
                'Quarterly': 'Quarterly',
                'Semi-Annual': 'Semi-Annual',
                'SemiAnnual': 'Semi-Annual',
                'Annual': 'Annual',
                'EveryFourWeeks': 'Every 4 Weeks',
                'Every 4 Weeks': 'Every 4 Weeks',
                'SemiMonthly': 'Semi-Monthly',
                'Semi-Monthly': 'Semi-Monthly',
                'BiWeekly': 'Bi-Weekly',
                'Bi-Weekly': 'Bi-Weekly',
                'Weekly': 'Weekly',
              };
              return modeLabels[paymentMode] || 'Monthly';
            })()}
          </p>
        </div>
        <button
          onClick={() => handleViewPdf(quote.pdfPath, quote.id)}
          disabled={!quote.pdfPath}
          className="bg-[#39458C] text-white px-6 py-2 rounded-lg font-medium text-sm hover:bg-[#0D175C]/90 transition-colors flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ borderRadius: 10 }}
        >
          VIEW PDF
        </button>
      </div>
    </div>
  );

  const renderSection = (title: string, quotes: QuoteDisplayItem[], sectionKey: 'sent' | 'unsent' | 'undeliverable') => {
    return (
      <div key={sectionKey} className="w-full">
        {/* Section Banner */}
        <div 
          className="w-[calc(100%-90px)] rounded-lg mx-auto py-2"
          style={{ backgroundColor: '#39458C' }}
        >
          <div className="px-4">
            <h2 className="text-white text-base font-bold">
              {title} {quotes.length > 0 && `(${quotes.length})`}
            </h2>
          </div>
        </div>

        {/* Quotes List */}
        <div className="mx-auto py-4 px-8 bg-white">
          <div className="px-4">
            {loading ? (
              <div className="text-center py-8">
                <p className="text-gray-600">Loading quotes...</p>
              </div>
            ) : quotes.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600">No quotes in this section</p>
              </div>
            ) : (
              <div className="space-y-4">
                {quotes.map(renderQuoteCard)}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-white">
      <PageHeader title="Mail" onBack={handleBack} onHome={handleHome} />
      
      {/* Sent Section */}
      {renderSection('Sent', sentQuotes, 'sent')}

      {/* Unsent Section */}
      {renderSection('Unsent', unsentQuotes, 'unsent')}

      {/* Undeliverable Section */}
      {renderSection('Undeliverable', undeliverableQuotes, 'undeliverable')}
    </div>
  );
};
