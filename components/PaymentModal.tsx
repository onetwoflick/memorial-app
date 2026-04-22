'use client';

import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';

// Make sure to call `loadStripe` outside of a component’s render to avoid
// recreating the `Stripe` object on every render.
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "pk_test_TYooMQauvdEDq54NiTphI7jx");

interface CheckoutFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

function CheckoutForm({ onSuccess, onCancel }: CheckoutFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    const { error: submitError, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        // You can leave this blank if we just want to succeed without redirect,
        // or set to the current URL. But confirmPayment defaults to redirecting.
        // We can use redirect: 'if_required' to handle it client-side.
      },
      redirect: 'if_required',
    });

    if (submitError) {
      setError(submitError.message || 'An error occurred.');
      setIsProcessing(false);
    } else if (paymentIntent && paymentIntent.status === 'succeeded') {
      onSuccess();
    } else {
      setError('Unexpected status: ' + paymentIntent?.status);
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6 mt-4">
      <PaymentElement />
      {error && <div className="text-red-500 text-sm text-center">{error}</div>}
      <div className="flex gap-4 justify-end mt-4">
        <button
          type="button"
          onClick={onCancel}
          disabled={isProcessing}
          className="px-6 py-3 rounded-full text-slate-600 bg-stone-100 hover:bg-stone-200 transition-colors font-medium disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isProcessing || !stripe || !elements}
          className="px-6 py-3 rounded-full text-white bg-slate-800 hover:bg-slate-700 transition-colors font-medium shadow-md disabled:opacity-50 min-w-[120px]"
        >
          {isProcessing ? 'Processing...' : 'Pay $10.00'}
        </button>
      </div>
    </form>
  );
}

interface PaymentModalProps {
  clientSecret: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function PaymentModal({ clientSecret, onSuccess, onCancel }: PaymentModalProps) {
  const options = {
    clientSecret,
    appearance: {
      theme: 'stripe' as const,
      variables: {
        colorPrimary: '#1e293b',
        colorBackground: '#ffffff',
        colorText: '#1e293b',
      },
    },
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl flex flex-col relative overflow-y-auto max-h-[90vh]">
        <h3 className="font-serif text-2xl mb-2 text-slate-800 text-center">Support this Memorial</h3>
        <p className="text-sm text-slate-500 mb-6 text-center">A one-time fee of $10 to publish your tribute.</p>
        <Elements stripe={stripePromise} options={options}>
          <CheckoutForm onSuccess={onSuccess} onCancel={onCancel} />
        </Elements>
      </div>
    </div>
  );
}
