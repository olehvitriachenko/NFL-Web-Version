/**
 * PDF HTML Template Generator
 * Generates the complete HTML template for PDF generation
 */

import { getRequiredExaminations } from '../qualificationExaminations';
import { Gender } from '../premiumCalculating/types';
import { getProductShortCode } from '../../utils/productCode';
import { isTermProduct } from '../../utils/planCodes';

interface TemplateParams {
  quote: any;
  agent?: any;
  insuredName: string;
  insuredAge: number;
  sexDisplay: string;
  smokingDisplay: string;
  productName: string;
  productAbbrev: string;
  productType: string;
  productForm: string;
  quoteNumber: string;
  calculatedPremium: number;
  baseAmount: number;
  illustration: any;
  isTermProductForPdf: boolean;
  productNameForIllustration: string;
  page5Data: any[];
  page6Data: any[];
  generateTableRows: (data: any[]) => string;
  generateTermTableRows: (data: any[]) => string;
  companyLogoHtml: string;
  smallCompanyLogo: string;
  formatDate: (timestamp?: number) => string;
  formatCurrency: (amount: number | undefined | string) => string;
  formatNumber: (amount: number | undefined | string) => string;
  formatCurrencyNoDecimals: (amount: number | undefined | string) => string;
}

/**
 * Generates the complete HTML template for PDF
 * This is a simplified version - can be expanded based on React Native version
 */
export function generatePDFHTMLTemplate(params: TemplateParams): string {
  const {
    quote,
    agent,
    insuredName,
    insuredAge,
    sexDisplay,
    smokingDisplay,
    productName,
    productAbbrev,
    productType,
    productForm,
    quoteNumber,
    calculatedPremium,
    baseAmount,
    illustration,
    isTermProductForPdf,
    productNameForIllustration,
    page5Data,
    page6Data,
    generateTableRows,
    generateTermTableRows,
    companyLogoHtml,
    smallCompanyLogo,
    formatDate,
    formatCurrency,
    formatNumber,
    formatCurrencyNoDecimals,
  } = params;

  // Get required examinations
  const examinations: string[] = [];
  try {
    const faceAmount = quote.faceAmount || 0;
    const insuredGender = (quote.insured?.sex === 'Male' ? Gender.Male : Gender.Female) as Gender;
    
    if (isTermProduct(productNameForIllustration)) {
      const examResults = getRequiredExaminations('SelectTerm', insuredAge, faceAmount, insuredGender);
      examinations.push(...examResults.map(exam => exam.text));
    } else if (getProductShortCode(productNameForIllustration) === 'PWL') {
      const examResults = getRequiredExaminations('PWL', insuredAge, faceAmount, insuredGender);
      examinations.push(...examResults.map(exam => exam.text));
    } else {
      // Try to get examinations for other products
      const productCode = getProductShortCode(productNameForIllustration);
      if (productCode) {
        const examResults = getRequiredExaminations(productCode, insuredAge, faceAmount, insuredGender);
        examinations.push(...examResults.map(exam => exam.text));
      }
    }
  } catch (error) {
    console.warn('[PdfTemplate] Failed to get examinations:', error);
  }

  // Always show actual examinations, even if empty (don't show "Non Medical")
  const examinationsList = examinations.length === 0 
    ? '<li>No examinations required</li>'
    : examinations.map(exam => `<li>${exam}</li>`).join('');

  return `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8">
    <style>
      @page {
        margin: 0.5in;
        size: letter;
      }
      
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }
      
      body {
        font-family: 'Helvetica', 'Arial', sans-serif;
        font-size: 10pt;
        line-height: 1.5;
        color: #000;
        background: #fff;
      }
      
      /* Cover Page Styles */
      .cover-page {
        min-height: 100vh;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        padding: 0;
        padding-inline: 20px;
      }
      
      .cover-header {
        text-align: center;
        margin-bottom: 60px;
      }
      
      .logo-container {
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 100px;
        gap: 10px;
        padding-top: 60px;
      }
      
      .logo-image {
        max-width: 220px;
        height: auto;
        object-fit: contain;
        display: block;
        margin: 0 auto 10px;
      }
      
      .logo-image-small {
        max-width: 140px;
        height: auto;
        object-fit: contain;
        display: block;
        margin: 0 auto 10px;
      }
      
      .logo-graphic {
        width: 40px;
        height: 40px;
        background-color: #808080;
        border-radius: 4px;
        display: inline-block;
      }
      
      .company-name {
        font-family: 'Times New Roman', serif;
        font-size: 28pt;
        font-weight: bold;
        color: #1a3a5c;
        margin-bottom: 5px;
      }
      
      .company-tagline {
        font-size: 11pt;
        color: #1a3a5c;
        letter-spacing: 1px;
      }
      
      .main-title {
        font-size: 18pt;
        font-weight: 500;
        text-align: center;
        margin: 5px 0;
        color: #000;
      }
      
      .policy-type {
        font-size: 14pt;
        text-align: center;
        margin: 10px 0;
        color: #000;
      }
      
      .policy-abbrev {
        font-size: 14pt;
        font-weight: bold;
        text-align: center;
        margin: 15px 0 40px 0;
        color: #000;
      }
      
      .cover-content {
        text-align: center;
        flex: 1;
        display: flex;
        flex-direction: column;
        justify-content: center;
        gap: 40px;
      }
      
      .cover-section {
        margin: 10px 0;
      }
      
      .cover-label {
        font-style: italic;
        font-size: 11pt;
        margin-bottom: 4px;
        color: #000;
      }
      
      .cover-value {
        font-size: 12pt;
        color: #000;
      }
      
      .cover-footer {
        border-top: 1px solid #666;
        padding-top: 15px;
        margin-top: 40px;
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        font-size: 8pt;
        color: #000;
      }
      
      .footer-left {
        text-align: left;
      }
      
      .footer-center {
        text-align: center;
        flex: 1;
      }
      
      .footer-right {
        text-align: right;
      }
      
      .footer-line {
        margin-top: 5px;
      }
      
      /* Content Pages Styles */
      .content-page {
        page-break-before: always;
        page-break-inside: avoid;
        min-height: 100vh;
        display: flex;
        flex-direction: column;
        padding-inline: 20px;
      }
      
      .content-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        padding-top: 20px;
        margin-bottom: 10px;
        padding-bottom: 8px;
        border-bottom: 1px solid #666;
      }
      
      .content-logo {
        display: flex;
        align-items: center;
        gap: 10px;
      }
      
      .content-logo-graphic {
        width: 30px;
        height: 30px;
        background-color: #808080;
        border-radius: 4px;
        display: inline-block;
      }
      
      .content-company-name {
        font-family: 'Times New Roman', serif;
        font-size: 20pt;
        font-weight: bold;
        color: #1a3a5c;
        margin-bottom: 2px;
      }
      
      .content-company-tagline {
        font-size: 9pt;
        color: #1a3a5c;
        letter-spacing: 1px;
      }
      
      .content-header-info {
        text-align: right;
        font-size: 7pt;
        line-height: 1.3;
      }
      
      .content-header-info div {
        margin-bottom: 2px;
      }
      
      .explanation-section {
        display: flex;
        align-items: flex-start;
        margin-bottom: 20px;
      }
      
      .explanation-label {
        flex: 0 0 170px;
        font-size: 9pt;
        text-align: right;
        line-height: 1.2;
        font-weight: bold;
      }
      
      .explanation-label-sub {
        font-weight: normal;
        margin-left: 15px;
        margin-top: 5px;
      }
      
      .explanation-content {
        flex: 1;
        font-size: 9pt;
        line-height: 1.4;
        text-align: justify;
        border-left: 1px solid black;
        margin-left: 15px;
        padding-left: 15px;
        padding-bottom: 20px;
      }
      
      .content-footer {
        border-top: 1px solid #666;
        padding-top: 10px;
        margin-top: auto;
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        font-size: 7pt;
        color: #000;
        page-break-inside: avoid;
      }
      
      .content-footer-left {
        text-align: left;
      }
      
      .content-footer-center {
        text-align: center;
        flex: 1;
      }
      
      .content-footer-right {
        text-align: right;
      }
      
      .content-footer-line {
        margin-top: 5px;
      }
      
      .premium-summary-container {
        display: flex;
        page-break-inside: avoid;
      }
      
      .premium-summary-left {
        flex: 0 0 180px;
        text-align: right;
        padding-right: 12px;
        display: flex;
        flex-direction: column;
      }
      
      .premium-summary-right {
        flex: 1;
        border-left: 1px solid black;
        padding-left: 12px;
      }
      
      .premium-summary-title {
        font-weight: bold;
        font-size: 9pt;
        margin-bottom: 12px;
      }
      
      .premium-table {
        width: 100%;
        border-collapse: collapse;
        border-spacing: 0;
        font-size: 8pt;
      }
      
      .premium-table th {
        text-align: left;
        font-weight: normal;
        text-transform: none;
        padding: 5px 0;
        font-size: 8pt;
        background-color: #ffffff;
        border: none;
      }
      
      .premium-table td {
        padding: 4px 0;
        border: none;
      }
      
      .premium-table .total-row {
        font-weight: bold;
      }
      
      .premium-table .total-value {
        border-top: 1px solid #000;
        padding-top: 5px;
      }
      
      .underwriting-requirements {
        margin-top: 10px;
      }
      
      .underwriting-requirements-title {
        font-weight: bold;
        font-size: 8pt;
        margin-top: auto;
        line-height: 1.1;
      }
      
      .underwriting-requirements-list {
        list-style: none;
        margin: 0;
        padding: 0;
      }
      
      .underwriting-requirements-list li {
        padding-left: 10px;
        position: relative;
        margin-bottom: 2px;
        font-size: 7pt;
        line-height: 1.2;
      }
      
      .underwriting-requirements-list li:before {
        content: "•";
        position: absolute;
        left: 0;
      }
      
      .policy-value-container {
        display: flex;
        width: 100%;
        box-sizing: border-box;
      }
      
      .policy-value-left {
        flex: 0 0 200px;
        text-align: left;
        padding-right: 15px;
        display: flex;
        flex-direction: column;
        font-size: 9pt;
      }
      
      .policy-value-right {
        flex: 1;
        border-left: 1px solid black;
        padding-left: 15px;
      }
      
      .policy-value-info-section {
        margin-bottom: 8px;
      }
      
      .policy-value-info-title {
        font-weight: bold;
        font-style: italic;
        margin-bottom: 3px;
        font-size: 9pt;
      }
      
      .policy-value-info-text {
        margin-bottom: 3px;
        line-height: 1.3;
        text-align: justify;
        font-size: 8pt;
      }
      
      .policy-value-table {
        width: 100%;
        border-collapse: collapse;
        border-spacing: 0;
        font-size: 7pt;
        margin-bottom: 10px;
        page-break-inside: auto;
      }
      
      .policy-value-table th {
        border: 1px solid #000;
        padding: 2px 3px;
        text-align: center;
        font-weight: bold;
        font-size: 7pt;
        background-color: #ffffff;
        line-height: 1.1;
      }
      
      .policy-value-table td {
        padding: 1px 3px;
        text-align: right;
        border-left: 1px solid #000;
        border-top: none;
        border-bottom: none;
        line-height: 1.1;
      }
      
      .policy-value-table td:last-child {
        border-right: 1px solid #000;
      }
      
      .policy-value-table .category-row {
        font-weight: bold;
      }
      
      .policy-value-table .category-row td {
        border-top: 1px solid #000;
        padding-top: 3px;
        padding-bottom: 1px;
      }
      
      .policy-value-table .category-label {
        text-align: left;
        padding-left: 10px;
      }
      
      .policy-value-table tbody tr:last-child td {
        border-bottom: 1px solid #000;
      }
      
      .acknowledgement-section {
        margin-top: 10px;
        font-size: 8pt;
        line-height: 1.3;
      }
      
      .acknowledgement-text {
        margin-bottom: 10px;
      }
      
      .signature-block {
        margin-top: 30px;
        margin-bottom: 10px;
      }
      
      .signature-line {
        border-bottom: 1px solid #000;
        width: 100%;
        margin-bottom: 5px;
      }
      
      .signature-label-row {
        display: flex;
        justify-content: space-between;
        font-size: 8pt;
      }
      
      .signature-label {
        font-weight: bold;
      }
      
      .signature-date {
        color: #666;
      }
      
      .projected-values-table {
        width: 100%;
        max-width: 100%;
        border-collapse: collapse;
        border-spacing: 0;
        font-size: 7pt;
        margin-bottom: 12px;
        page-break-inside: avoid;
        margin-left: 0;
        margin-right: 0;
        box-sizing: border-box;
        table-layout: fixed;
      }
      
      .projected-values-table th {
        border: 1px solid #000;
        padding: 3px 2px;
        text-align: center;
        font-weight: bold;
        font-size: 7pt;
        background-color: #ffffff;
        white-space: nowrap;
        word-break: keep-all;
      }
      
      .projected-values-table td {
        border-left: 1px solid #000;
        border-right: 1px solid #000;
        border-top: none;
        border-bottom: none;
        padding: 2px 2px;
        text-align: right;
        font-size: 7pt;
      }
      
      .projected-values-table td:first-child {
        border-left: 1px solid #000;
      }
      
      .projected-values-table td:last-child {
        border-right: 1px solid #000;
      }
      
      .projected-values-table tbody tr:last-child td {
        border-bottom: 1px solid #000;
      }
      
      .projected-values-table .age-col {
        text-align: center;
        font-weight: bold;
      }
      
      .disclaimer-text {
        font-size: 7pt;
        line-height: 1.4;
        margin-bottom: 6px;
        width: 100%;
        box-sizing: border-box;
      }
      
      hr {
        border: none;
        border-top: 1px solid #000;
        margin: 10px 0;
      }
    </style>
  </head>
  <body>
    <!-- Cover Page -->
    <div class="cover-page">
      <div class="cover-header">
        <div class="logo-container">
          ${companyLogoHtml}
        </div>
        <hr/>
        <div class="main-title">A Life Insurance Policy Illustration</div>
        <hr/>
        <div class="policy-type">${productType}</div>
        <div class="policy-abbrev">${productName}</div>
      </div>
      
      <div class="cover-content">
        <div class="cover-section">
          <div class="cover-label">Designed for:</div>
          <div class="cover-value">${insuredName}</div>
        </div>
        
        <div class="cover-section">
          <div class="cover-label">Presented by:</div>
          <div class="cover-value">${agent ? `${agent.firstName} ${agent.lastName}` : 'N/A'}</div>
        </div>
        
        <div class="cover-section">
          <div class="cover-label">${formatDate(quote.created_at)}</div>
        </div>
      </div>
      
      <div class="cover-footer">
        <div class="footer-left">
          <div>Prepared by: ${agent ? `${agent.firstName} ${agent.lastName} ${agent.id || ''}` : 'N/A'}</div>
          <div class="footer-line">${formatDate(quote.created_at)}</div>
        </div>
        <div class="footer-center">
          <div>Version 5.9.32</div>
        </div>
        <div class="footer-right">
          <div>This is page 1 of 6 pages</div>
          <div class="footer-line">and is not valid unless all pages are included</div>
        </div>
      </div>
    </div>
    
    <!-- Page 2: Policy Explanation -->
    <div class="content-page">
      <div class="content-header">
        <div class="content-logo">
          ${smallCompanyLogo}
        </div>
        <div class="content-header-info">
          <div><strong>Designed for:</strong> ${insuredName}</div>
          <div>${sexDisplay}, Age ${insuredAge}, ${smokingDisplay}</div>
          <div>A Life Insurance Policy Explanation</div>
          <div>${productName} - ${productForm}</div>
        </div>
      </div>
      
      <div>
        <div class="explanation-section">
          <div class="explanation-label">${isTermProductForPdf ? 'Term Life Insurance' : 'Whole Life Insurance'}</div>
          <div class="explanation-content">
            ${isTermProductForPdf
              ? `The policy that you are considering is ${productName} policy renewable until age 70. It provides a level death benefit to your selected beneficiary in the event of your death while the policy is in effect.`
              : `The Traditional Whole Life policy that you are considering offers permanent protection with guaranteed premiums, cash values and death benefits. ${productName} is a Traditional Whole Life Insurance Policy with guaranteed level premiums payable to age 121.`
            }
          </div>
        </div>
        
        <div class="explanation-section">
          <div class="explanation-label">
            Underwriting Class
            <div class="explanation-label-sub">${smokingDisplay}</div>
          </div>
          <div class="explanation-content">
            The premium outlay for this coverage has been calculated assuming this policy is issued in the ${smokingDisplay} underwriting class. Actual premiums for the insurance coverage will ultimately depend on the outcome of the underwriting process, and may vary from what is shown on this illustration. If so, you will receive a revised illustration with your insurance contract.
          </div>
        </div>
        
        <div class="explanation-section">
          <div class="explanation-label">Initial Insurance Benefit</div>
          <div class="explanation-content">
            The death benefit provided at issue is assumed to be ${formatCurrency(quote.faceAmount)} on the base insured. The death benefit is the amount payable in the event of death, as stated on the front page of the policy.
          </div>
        </div>
        
        <div class="explanation-section">
          <div class="explanation-label">Contract Premium</div>
          <div class="explanation-content">
            The total Initial Contract Premium is ${formatCurrency(calculatedPremium)} ${quote.paymentMode || quote.paymentMethod || 'Monthly'} and is guaranteed for life. Premiums are payable to age 121.
          </div>
        </div>
        
        <div class="explanation-section">
          <div class="explanation-label">Surrender Value</div>
          <div class="explanation-content">
            ${isTermProductForPdf ? 'This policy does not provide a cash value.' : 'The Cash Surrender Value is the amount available to the insured upon surrender of the policy.'}
          </div>
        </div>
        
        <div class="explanation-section">
          <div class="explanation-label">Non-Guaranteed Elements of the Policy</div>
          <div class="explanation-content">
            Many aspects of your life insurance policy are guaranteed, including your premiums, cash values, and death benefits. However, certain aspects of the policy cannot be predicted with absolute certainty. The values shown in the current columns reflect the Company's current dividend scale. The values in the midpoint column reflect half of the Company's current dividend scale. These values are not guaranteed and assume that the dividends will remain unchanged for the years shown. This is not likely to occur, and actual results may be more or less favorable. These non-guaranteed elements are based on the Company's year-by-year experience which depends on items such as the general interest rate environment, the amount and timing of benefit claims that the Company pays, and the Company's operating expenses.
          </div>
        </div>
      </div>
      
      <div class="content-footer" style="margin-top: 100px">
        <div class="content-footer-left">
          <div>Prepared by: ${agent ? `${agent.firstName} ${agent.lastName} ${agent.id || ''}` : 'N/A'}</div>
          <div class="content-footer-line">${formatDate(quote.created_at)}</div>
        </div>
        <div class="content-footer-center">
          <div>Version 5.9.32</div>
        </div>
        <div class="content-footer-right">
          <div>This is page 2 of 6 pages</div>
          <div class="content-footer-line">and is not valid unless all pages are included</div>
        </div>
      </div>
    </div>
    
    <!-- Page 3: Premium Summary -->
    <div class="content-page">
      <div class="content-header">
        <div class="content-logo">
          ${smallCompanyLogo}
        </div>
        <div class="content-header-info">
          <div><strong>Designed for:</strong> ${insuredName}</div>
          <div>${sexDisplay}, Age ${insuredAge}, ${smokingDisplay}</div>
          <div>A Life Insurance Policy Explanation</div>
          <div>${productName} - ${productForm}</div>
        </div>
      </div>
      
      <div class="premium-summary-container">
        <div class="premium-summary-left">
          <div class="premium-summary-title">Premium Summary</div>
          <div class="underwriting-requirements-title">Underwriting <br/> Requirements</div>
        </div>
        
        <div class="premium-summary-right">
          <table class="premium-table">
            <thead>
              <tr>
                <th style="width: 50%;"></th>
                <th style="text-align: center; padding-right: 15px;">Initial Death Benefit</th>
                <th style="text-align: center;">Initial Premium ${quote.paymentMode}</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="text-align: center">${productName}</td>
                <td style="text-align: right; padding-right: 15px;">${formatCurrency(quote.faceAmount)}</td>
                <td style="text-align: right;">${formatCurrency(calculatedPremium)}</td>
              </tr>
              <tr>
                <td style="text-align: center">${smokingDisplay}</td>
                <td style="text-align: right; padding-right: 15px;">${formatCurrency(quote.faceAmount)}</td>
                <td style="text-align: right;">${formatCurrency(calculatedPremium)}</td>
              </tr>
              <tr class="total-row">
                <td style="text-align: center">Total Premium</td>
                <td style="text-align: right; padding-right: 15px;"></td>
                <td style="text-align: right;" class="total-value">${formatCurrency(calculatedPremium)}</td>
              </tr>
            </tbody>
          </table>
          
          <ul class="underwriting-requirements-list">
            ${examinationsList}
          </ul>
        </div>
      </div>
      
      <div class="content-footer" style="margin-top: auto; padding-top: 10px;">
        <div class="content-footer-left">
          <div>Prepared by: ${agent ? `${agent.firstName} ${agent.lastName} ${agent.id || ''}` : 'N/A'}</div>
          <div class="content-footer-line">${formatDate(quote.created_at)}</div>
        </div>
        <div class="content-footer-center">
          <div>Version 5.9.32</div>
        </div>
        <div class="content-footer-right">
          <div>This is page 3 of 6 pages</div>
          <div class="content-footer-line">and is not valid unless all pages are included</div>
        </div>
      </div>
    </div>
    
    <!-- Page 4: Policy Value Summary -->
    <div class="content-page">
      <div class="content-header">
        <div class="content-logo">
          ${smallCompanyLogo}
        </div>
        <div class="content-header-info">
          <div><strong>Designed for:</strong> ${insuredName}</div>
          <div>${sexDisplay}, Age ${insuredAge}, ${smokingDisplay}</div>
          <div>A Life Insurance Policy Explanation</div>
          <div>${productName} - ${productForm}</div>
        </div>
      </div>
      
      <div class="policy-value-container">
        <div class="policy-value-left">
          <div class="policy-value-info-section">
            <div class="policy-value-info-title">Prepared by:</div>
            <div>${agent ? `${agent.firstName} ${agent.lastName}` : 'N/A'}</div>
            <div>${agent?.id || ''}</div>
            <div class="policy-value-info-title" style="margin-top: 10px;">Underwriting Class:</div>
            <div>${smokingDisplay}</div>
          </div>
          <div class="policy-value-info-section">
            <div class="policy-value-info-title">Guaranteed</div>
            <div class="policy-value-info-text">
              These policy values and benefits are guaranteed provided the Contract Premiums are paid in full each year as illustrated. <br/>• Policy death benefit <br/>• Policy cash value <br/>• Policy premiums
            </div>
          </div>
          <div class="policy-value-info-section">
            <div class="policy-value-info-title">Non-Guaranteed</div>
            <div class="policy-value-info-text">
              This illustration assumes that the non-guaranteed elements will continue unchanged for all years shown. This is not likely to occur and actual results may be more or less favorable.
            </div>
          </div>
          <div class="policy-value-info-section">
            <div class="policy-value-info-title">Midpoint</div>
            <div class="policy-value-info-text">
              Policy values and benefits are the average of those values produced using Guaranteed assumptions and Current assumptions. These values are not guaranteed.
            </div>
          </div>
          <div class="policy-value-info-section">
            <div class="policy-value-info-title">Current</div>
            <div class="policy-value-info-text">
              Policy values and benefits are based on the Company's current assumptions and are not guaranteed.
            </div>
          </div>
        </div>
        
        <div class="policy-value-right">
          <div style="margin-bottom: 15px; font-size: 9pt; text-align: center">
            <div>${formatCurrency(quote.faceAmount)}</div>
            <div>Initial Contract Premium: ${formatCurrency(calculatedPremium)} ${quote.paymentMode || 'Annually'}</div>
          </div>
          
          <table class="policy-value-table">
            <thead>
              <tr>
                <th rowspan="2" style="width: 40%;"></th>
                <th rowspan="2" style="width: 20%;">Guaranteed</th>
                <th colspan="2" style="width: 40%;">Non-Guaranteed<br/>Assumptions</th>
              </tr>
              <tr>
                <th style="width: 20%;">Mid-point</th>
                <th style="width: 20%;">Current</th>
              </tr>
            </thead>
            <tbody>
              <tr class="category-row">
                <td class="category-label"><strong>Summary Year 5</strong></td>
                <td></td>
                <td></td>
                <td></td>
              </tr>
              <tr>
                <td class="category-label">Premiums</td>
                <td>${formatNumber(illustration.year5?.premiums || 0)}</td>
                <td>${isTermProductForPdf ? '-' : formatNumber(illustration.year5?.premiums || 0)}</td>
                <td>${isTermProductForPdf ? '-' : formatNumber(illustration.year5?.premiums || 0)}</td>
              </tr>
              ${!isTermProductForPdf ? `<tr>
                <td class="category-label">Cash Surrender Value</td>
                <td>${formatNumber(illustration.year5?.cashSurrenderValue?.guaranteed || 0)}</td>
                <td>${formatNumber(illustration.year5?.cashSurrenderValue?.midpoint || 0)}</td>
                <td>${formatNumber(illustration.year5?.cashSurrenderValue?.current || 0)}</td>
              </tr>` : ''}
              <tr>
                <td class="category-label">Death Benefit</td>
                <td>${formatNumber(illustration.year5?.deathBenefit?.guaranteed || baseAmount)}</td>
                <td>${isTermProductForPdf ? '-' : formatNumber(illustration.year5?.deathBenefit?.midpoint || 0)}</td>
                <td>${isTermProductForPdf ? '-' : formatNumber(illustration.year5?.deathBenefit?.current || 0)}</td>
              </tr>
              
              <tr class="category-row">
                <td class="category-label"><strong>Summary Year 10</strong></td>
                <td></td>
                <td></td>
                <td></td>
              </tr>
              <tr>
                <td class="category-label">Premiums</td>
                <td>${formatNumber(illustration.year10?.premiums || 0)}</td>
                <td>${isTermProductForPdf ? '-' : formatNumber(illustration.year10?.premiums || 0)}</td>
                <td>${isTermProductForPdf ? '-' : formatNumber(illustration.year10?.premiums || 0)}</td>
              </tr>
              ${!isTermProductForPdf ? `<tr>
                <td class="category-label">Cash Surrender Value</td>
                <td>${formatNumber(illustration.year10?.cashSurrenderValue?.guaranteed || 0)}</td>
                <td>${formatNumber(illustration.year10?.cashSurrenderValue?.midpoint || 0)}</td>
                <td>${formatNumber(illustration.year10?.cashSurrenderValue?.current || 0)}</td>
              </tr>` : ''}
              <tr>
                <td class="category-label">Death Benefit</td>
                <td>${formatNumber(illustration.year10?.deathBenefit?.guaranteed || baseAmount)}</td>
                <td>${isTermProductForPdf ? '-' : formatNumber(illustration.year10?.deathBenefit?.midpoint || 0)}</td>
                <td>${isTermProductForPdf ? '-' : formatNumber(illustration.year10?.deathBenefit?.current || 0)}</td>
              </tr>
              
              <tr class="category-row">
                <td class="category-label"><strong>Summary Year 20</strong></td>
                <td></td>
                <td></td>
                <td></td>
              </tr>
              <tr>
                <td class="category-label">Premiums</td>
                <td>${formatNumber(illustration.year20?.premiums || 0)}</td>
                <td>${isTermProductForPdf ? '-' : formatNumber(illustration.year20?.premiums || 0)}</td>
                <td>${isTermProductForPdf ? '-' : formatNumber(illustration.year20?.premiums || 0)}</td>
              </tr>
              ${!isTermProductForPdf ? `<tr>
                <td class="category-label">Cash Surrender Value</td>
                <td>${formatNumber(illustration.year20?.cashSurrenderValue?.guaranteed || 0)}</td>
                <td>${formatNumber(illustration.year20?.cashSurrenderValue?.midpoint || 0)}</td>
                <td>${formatNumber(illustration.year20?.cashSurrenderValue?.current || 0)}</td>
              </tr>` : ''}
              <tr>
                <td class="category-label">Death Benefit</td>
                <td>${formatNumber(illustration.year20?.deathBenefit?.guaranteed || baseAmount)}</td>
                <td>${isTermProductForPdf ? '-' : formatNumber(illustration.year20?.deathBenefit?.midpoint || 0)}</td>
                <td>${isTermProductForPdf ? '-' : formatNumber(illustration.year20?.deathBenefit?.current || 0)}</td>
              </tr>
              
              <tr class="category-row">
                <td class="category-label"><strong>Summary Age 70</strong></td>
                <td></td>
                <td></td>
                <td></td>
              </tr>
              <tr>
                <td class="category-label">Premiums</td>
                <td>${formatNumber(illustration.age70?.premiums?.guaranteed || 0)}</td>
                <td>${isTermProductForPdf ? '-' : formatNumber(illustration.age70?.premiums?.guaranteed || 0)}</td>
                <td>${isTermProductForPdf ? '-' : formatNumber(illustration.age70?.premiums?.guaranteed || 0)}</td>
              </tr>
              ${!isTermProductForPdf ? `<tr>
                <td class="category-label">Cash Surrender Value</td>
                <td>${formatNumber(illustration.age70?.cashSurrenderValue?.guaranteed || 0)}</td>
                <td>${formatNumber(illustration.age70?.cashSurrenderValue?.midpoint || 0)}</td>
                <td>${formatNumber(illustration.age70?.cashSurrenderValue?.current || 0)}</td>
              </tr>` : ''}
              <tr>
                <td class="category-label">Death Benefit</td>
                <td>${formatNumber(illustration.age70?.deathBenefit?.guaranteed || baseAmount)}</td>
                <td>${isTermProductForPdf ? '-' : formatNumber(illustration.age70?.deathBenefit?.midpoint || 0)}</td>
                <td>${isTermProductForPdf ? '-' : formatNumber(illustration.age70?.deathBenefit?.current || 0)}</td>
              </tr>
              ${productNameForIllustration !== 'Payroll - 20 Year Term' ? `
              <tr class="category-row">
                <td class="category-label"><strong>At Final Year (${121 - insuredAge})</strong></td>
                <td></td>
                <td></td>
                <td></td>
              </tr>
              <tr>
                <td class="category-label">Premiums</td>
                <td>${formatNumber(illustration.year90?.premiums || 0)}</td>
                <td>${isTermProductForPdf ? '-' : formatNumber(illustration.year90?.premiums || 0)}</td>
                <td>${isTermProductForPdf ? '-' : formatNumber(illustration.year90?.premiums || 0)}</td>
              </tr>
              ${!isTermProductForPdf ? `<tr>
                <td class="category-label">Cash Surrender Value</td>
                <td>${formatNumber(illustration.year90?.cashSurrenderValue?.guaranteed || baseAmount)}</td>
                <td>${formatNumber(illustration.year90?.cashSurrenderValue?.midpoint || 0)}</td>
                <td>${formatNumber(illustration.year90?.cashSurrenderValue?.current || 0)}</td>
              </tr>` : ''}
              <tr>
                <td class="category-label">Death Benefit</td>
                <td>${formatNumber(illustration.year90?.deathBenefit?.guaranteed || baseAmount)}</td>
                <td>${isTermProductForPdf ? '-' : formatNumber(illustration.year90?.deathBenefit?.midpoint || 0)}</td>
                <td>${isTermProductForPdf ? '-' : formatNumber(illustration.year90?.deathBenefit?.current || 0)}</td>
              </tr>
              ` : ''}
            </tbody>
          </table>
          
          <div class="acknowledgement-section">
            <div class="acknowledgement-text">
              I have received a copy of this illustration and understand that any non-guaranteed elements illustrated are subject to change and could be either higher or lower. The agent has told me they are not guaranteed.
            </div>
            
            <div class="signature-block">
              <div class="signature-line"></div>
              <div class="signature-label-row">
                <div class="signature-label">Applicant/Policy Owner</div>
                <div class="signature-date">Date</div>
              </div>
            </div>
            
            <div class="acknowledgement-text" style="margin-top: 20px;">
              I certify that this illustration has been presented to the applicant and that I have explained that any non-guaranteed elements illustrated are subject to change. I have made no statements that are inconsistent with the illustration.
            </div>
            
            <div class="signature-block">
              <div class="signature-line"></div>
              <div class="signature-label-row">
                <div class="signature-label">Authorized Agent</div>
                <div class="signature-date">Date</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div class="content-footer" style="margin-top: 120px; margin-inline: 20px;">
        <div class="content-footer-left">
          <div>Prepared by: ${agent ? `${agent.firstName} ${agent.lastName} ${agent.id || ''}` : 'N/A'}</div>
          <div class="content-footer-line">${formatDate(quote.created_at)}</div>
        </div>
        <div class="content-footer-center">
          <div>Version 5.9.32</div>
        </div>
        <div class="content-footer-right">
          <div>This is page 4 of 6 pages</div>
          <div class="content-footer-line">and is not valid unless all pages are included</div>
        </div>
      </div>
    </div>
    
    <!-- Page 5: Year-by-Year Illustration -->
    <div class="content-page">
      <div class="content-header">
        <div class="content-logo">
          ${smallCompanyLogo}
        </div>
        <div class="content-header-info">
          <div><strong>Designed for:</strong> ${insuredName}</div>
          <div>${sexDisplay}, Age ${insuredAge}, ${smokingDisplay}</div>
          <div>A Life Insurance Policy Explanation</div>
          <div>${productName} - ${productForm}</div>
        </div>
      </div>
      
      <div style="margin-top: 20px;">
        <div style="font-size: 10pt; text-align: center;">${formatCurrency(quote.faceAmount)}</div>
        <div style="font-size: 10pt; text-align: center;">Contract Premium: ${formatCurrency(calculatedPremium)} ${quote.paymentMode}</div>
        ${!isTermProductForPdf ? '<div style="font-size: 10pt; text-align: center; margin-bottom: 10px;">Dividend Option: Paid Up Additions</div>' : '<div style="font-size: 10pt; text-align: center; margin-bottom: 10px;"></div>'}
        <table class="projected-values-table" style="width: 100%;">
          <thead>
            ${isTermProductForPdf ? `
            <tr>
              <th style="width: 25%;">Age</th>
              <th style="width: 25%;">End <br/> of <br/> Year</th>
              <th style="width: 25%;">Contract <br/> Premium</th>
              <th style="width: 25%;">Death <br/> Benefit</th>
            </tr>
            ` : `
            <tr>
              <th style="width: 6%;">Age</th>
              <th style="width: 8%;">End <br/> of <br/> Year</th>
              <th style="width: 10%;">Contract <br/> Premium</th>
              <th style="width: 12%;">Cash <br/> Surr <br/> Value</th>
              <th style="width: 12%;">Death <br/> Benefit</th>
              <th style="width: 10%;">Annual <br/> Dividend</th>
              <th style="width: 12%;">Accum <br/> Paid-Up<br/>Additions</th>
              <th style="width: 12%;">Cash <br/> Surr <br/> Value</th>
              <th style="width: 12%;">Death <br/> Benefit</th>
              <th style="width: 10%;">Total <br/> Paid-Up</th>
            </tr>
            `}
          </thead>
          <tbody>
            ${isTermProductForPdf ? generateTermTableRows(page5Data) : generateTableRows(page5Data)}
          </tbody>
        </table>
      </div>
      
      <div style="margin-top: 0px">
        <div class="disclaimer-text" style="margin-inline: 20px">
          The Current Non-Guaranteed values and benefits are based on the Company's current assumptions. These values are not guaranteed and assume the assumptions will remain unchanged for the years shown. This is not likely to occur and actual results may be more or less favorable.
        </div>
        
        <div class="disclaimer-text" style="margin-inline: 20px">
          <i>Any outstanding loan and loan interest would reduce the death benefit and cash value. Premiums are assumed to be paid at the beginning of the modal period and policy values are illustrated as of the end of the year.</i>
        </div>
        
        <div class="content-footer" style="margin-inline: 20px">
          <div class="content-footer-left">
            <div>Prepared by: ${agent ? `${agent.firstName} ${agent.lastName} ${agent.id || ''}` : 'N/A'}</div>
            <div class="content-footer-line">${formatDate(quote.created_at)}</div>
          </div>
          <div class="content-footer-center">
            <div>Version 5.9.32</div>
          </div>
          <div class="content-footer-right">
            <div>This is page 5 of 6 pages</div>
            <div class="content-footer-line">and is not valid unless all pages are included</div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Page 6: Projected Policy Values (Continuation) -->
    ${page6Data.length > 0 ? `
    <div class="content-page">
      <div class="content-header">
        <div class="content-logo">
          ${smallCompanyLogo}
        </div>
        <div class="content-header-info">
          <div><strong>Designed for:</strong> ${insuredName}</div>
          <div>${sexDisplay}, Age ${insuredAge}, ${smokingDisplay}</div>
          <div>A Life Insurance Policy Explanation</div>
          <div>${productName} - ${productForm}</div>
        </div>
      </div>
      
      <div style="flex: 1; display: flex; flex-direction: column;">
        <div style="margin-top: 15px; text-align: center; font-size: 9pt;">
          <div style="font-size: 10pt; text-align: center;">${formatCurrency(quote.faceAmount)}</div>
          <div style="font-size: 10pt; text-align: center;">Contract Premium: ${formatCurrency(calculatedPremium)} ${quote.paymentMode}</div>
          ${!isTermProductForPdf ? '<div style="font-size: 10pt; text-align: center; margin-bottom: 10px;">Dividend Option: Paid Up Additions</div>' : '<div style="font-size: 10pt; text-align: center; margin-bottom: 10px;"></div>'}
        </div>
        
        <div>
          <table class="projected-values-table" style="width: 100%;">
            <thead>
              ${isTermProductForPdf ? `
              <tr>
                <th style="width: 25%;">Age</th>
                <th style="width: 25%;">End <br/> of <br/> Year</th>
                <th style="width: 25%;">Contract <br/> Premium</th>
                <th style="width: 25%;">Death <br/> Benefit</th>
              </tr>
              ` : `
              <tr>
                <th style="width: 6%;">Age</th>
                <th style="width: 8%;">End <br/> of <br/> Year</th>
                <th style="width: 10%;">Contract <br/> Premium</th>
                <th style="width: 12%;">Cash <br/> Surr <br/> Value</th>
                <th style="width: 12%;">Death <br/> Benefit</th>
                <th style="width: 10%;">Annual <br/> Dividend</th>
                <th style="width: 12%;">Accum <br/> Paid-Up<br/>Additions</th>
                <th style="width: 12%;">Cash <br/> Surr <br/> Value</th>
                <th style="width: 12%;">Death <br/> Benefit</th>
                <th style="width: 10%;">Total <br/> Paid-Up</th>
              </tr>
              `}
            </thead>
            <tbody>
              ${isTermProductForPdf ? generateTermTableRows(page6Data) : generateTableRows(page6Data)}
            </tbody>
          </table>
        </div>
        
        <div class="disclaimer-text">
          The Current Non-Guaranteed values and benefits are based on the Company's current assumptions. These values are not guaranteed and assume the assumptions will remain unchanged for the years shown. This is not likely to occur and actual results may be more or less favorable.
        </div>
        
        <div class="disclaimer-text">
          <i>Any outstanding loan and loan interest would reduce the death benefit and cash value. Premiums are assumed to be paid at the beginning of the modal period and policy values are illustrated as of the end of the year.</i>
        </div>
        
        <div class="content-footer" style="margin-top: 230px">
          <div class="content-footer-left">
            <div>Prepared by: ${agent ? `${agent.firstName} ${agent.lastName} ${agent.id || ''}` : 'N/A'}</div>
            <div class="content-footer-line">${formatDate(quote.created_at)}</div>
          </div>
          <div class="content-footer-center">
            <div>Version 5.9.32</div>
          </div>
          <div class="content-footer-right">
            <div>This is page 6 of 6 pages</div>
            <div class="content-footer-line">and is not valid unless all pages are included</div>
          </div>
        </div>
      </div>
    </div>
    ` : ''}
  </body>
</html>
  `;
}

