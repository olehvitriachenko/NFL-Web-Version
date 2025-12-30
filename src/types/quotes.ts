/**
 * Types for quotes synchronization
 */

export type QuickQuoteQueueStatus = 'pending' | 'sending' | 'sent' | 'failed' | 'deleted';
export type PdfQueueStatus = 'pending' | 'sending' | 'sent' | 'failed' | 'deleted';

export interface QuotePersonData {
  age: number;
  sex: 'Male' | 'Female';
  smokingHabit: string;
}

export interface QuoteData {
  id?: number;
  company: 'CompanyA' | 'CompanyB';
  insured: QuotePersonData;
  payorEnabled: boolean;
  payor?: QuotePersonData;
  product?: string;
  paymentMethod?: string;
  paymentMode?: string;
  configureProduct?: string;
  basePlan?: number;
  waiverOfPremium?: boolean;
  waiverOfPremiumValue?: number | null;
  accidentalDeath?: boolean;
  dependentChild?: boolean;
  guaranteedInsurability?: boolean;
  premiumChoice?: string;
  faceAmount?: number;
  smokingHabit?: string;
  premium?: number;
  paymentMethod_details?: string;
  status?: 'draft' | 'completed' | 'sent';
  created_at?: number;
  updated_at?: number;
}

export interface QuickQuoteRequest {
  insuranceCompanyId?: number | null;
  age: number;
  gender: string;
  smoker?: boolean;
  coverageAmount: number;
  termLength?: number;
  state: string;
  product?: string | null;
  paymentMethod?: string | null;
  paymentMode?: string | null;
  baseMethod?: string | null;
  basePlanAmount?: string | null;
  waiverOfPremium?: boolean;
  accidentalDeathAdd?: boolean;
  accidentalDeathAddValue?: string | null;
  accidentalDeathAdb?: boolean;
  accidentalDeathAdbValue?: string | null;
  dependentChild?: boolean;
  dependentChildAmount?: string | null;
  guaranteedInsurability?: boolean;
  guaranteedAmount?: string | null;
  insuredFirstName?: string | null;
  insuredLastName?: string | null;
  insuredEmail?: string | null;
  payorFirstName?: string | null;
  payorLastName?: string | null;
  payorEmail?: string | null;
}

export interface QuickQuote {
  readonly id: number;
  insuranceCompanyId?: number | null;
  age: number;
  gender: string;
  smoker?: boolean;
  coverageAmount: number;
  termLength?: number;
  state: string;
  product?: string | null;
  paymentMethod?: string | null;
  paymentMode?: string | null;
  baseMethod?: string | null;
  basePlanAmount?: string | null;
  waiverOfPremium?: boolean;
  accidentalDeathAdd?: boolean;
  accidentalDeathAddValue?: string | null;
  accidentalDeathAdb?: boolean;
  accidentalDeathAdbValue?: string | null;
  dependentChild?: boolean;
  dependentChildAmount?: string | null;
  guaranteedInsurability?: boolean;
  guaranteedAmount?: string | null;
  insuredFirstName?: string | null;
  insuredLastName?: string | null;
  insuredEmail?: string | null;
  payorFirstName?: string | null;
  payorLastName?: string | null;
  payorEmail?: string | null;
  readonly createdAt: string;
}

export interface QuickQuoteSync {
  readonly id: number;
  readonly createdAt: string;
}

export interface QuickQuoteQueueItem {
  id: number;
  quote_id?: number;
  request_data: QuickQuoteRequest;
  pdf_path: string;
  status: QuickQuoteQueueStatus;
  retry_count: number;
  error_message?: string;
  backend_id?: number;
  created_at: number;
  updated_at: number;
}

export interface PdfQueueItem {
  id: number;
  quote_id: number;
  agent_id?: number;
  pdf_path?: string;
  recipient_email: string;
  recipient_name?: string;
  recipient_first_name?: string;
  recipient_last_name?: string;
  status: PdfQueueStatus;
  retry_count: number;
  error_message?: string;
  death_benefit?: number;
  monthly_payment?: number;
  created_at: number;
  updated_at: number;
}

