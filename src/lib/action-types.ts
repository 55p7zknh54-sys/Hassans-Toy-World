import type { CheckoutErrors } from './validation';

export type ReceiptItem = { name_en: string; name_ar: string; quantity: number; line_total: number };

export type Receipt = {
  number: string;
  name: string;
  phone: string;
  governorate_en: string;
  governorate_ar: string;
  city: string;
  address: string;
  items: ReceiptItem[];
  subtotal: number;
  delivery_fee: number;
  total: number;
  deposit_required: boolean;
  deposit_amount: number;
};

export type PlaceOrderState =
  | { status: 'idle' }
  | { status: 'error'; code: string; errors?: CheckoutErrors; params?: Record<string, string | number> }
  | { status: 'success'; receipt: Receipt };

export type TrackState =
  | { status: 'idle' }
  | { status: 'not_found' }
  | { status: 'error' }
  | {
      status: 'found';
      order: {
        number: string;
        state: string;
        created_at: string;
        subtotal: number;
        delivery_fee: number;
        total: number;
        governorate_en: string;
        governorate_ar: string;
        deposit_required: boolean;
        deposit_amount: number;
        deposit_received: boolean;
        items: ReceiptItem[];
      };
    };

export type ReviewState =
  | { status: 'idle' }
  | { status: 'error'; code: string }
  | { status: 'success'; verified: boolean };

export const initialPlaceOrder: PlaceOrderState = { status: 'idle' };
export const initialTrack: TrackState = { status: 'idle' };
export const initialReview: ReviewState = { status: 'idle' };
