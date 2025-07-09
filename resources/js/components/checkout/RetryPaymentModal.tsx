import React, { useState, useEffect } from 'react';
import { SavedPaymentMethod } from '@/types/checkout';
import axios from '@/lib/axios';

interface RetryPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRetry: (paymentMethodId?: string) => void;
  customerId: string;
  errorMessage?: string;
}

export function RetryPaymentModal({ 
  isOpen, 
  onClose, 
  onRetry, 
  customerId, 
  errorMessage 
}: RetryPaymentModalProps) {
  const [savedPaymentMethods, setSavedPaymentMethods] = useState<SavedPaymentMethod[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMethods, setIsLoadingMethods] = useState(false);

  useEffect(() => {
    if (isOpen && customerId) {
      setIsLoadingMethods(true);
      axios.get(`/api/customers/${customerId}/payment-methods`)
        .then(response => {
          setSavedPaymentMethods(response.data.payment_methods || []);
        })
        .catch(error => {
          console.error('Failed to load saved payment methods:', error);
        })
        .finally(() => {
          setIsLoadingMethods(false);
        });
    }
  }, [isOpen, customerId]);

  const handleRetry = async () => {
    setIsLoading(true);
    try {
      onRetry(selectedMethod || undefined);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUseNewMethod = () => {
    setSelectedMethod(null);
    onRetry();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h2 className="text-lg font-semibold mb-4">Payment Failed</h2>
        
        {errorMessage && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {errorMessage}
          </div>
        )}

        <p className="text-gray-600 mb-4">
          Your payment was not successful. Would you like to try again with a different payment method?
        </p>

        {/* Saved Payment Methods */}
        {savedPaymentMethods.length > 0 && (
          <div className="mb-4">
            <h3 className="text-sm font-medium text-gray-700 mb-2">
              Previously Used Payment Methods
            </h3>
            <div className="space-y-2">
              {savedPaymentMethods.map((method) => (
                <label
                  key={method.id}
                  className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedMethod === method.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <input
                    type="radio"
                    name="retryPaymentMethod"
                    value={method.id}
                    checked={selectedMethod === method.id}
                    onChange={(e) => setSelectedMethod(e.target.value)}
                    className="mr-3"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-sm">{method.display_name}</div>
                    <div className="text-xs text-gray-500">
                      Last used {new Date(method.last_used_at).toLocaleDateString()}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoadingMethods && (
          <div className="flex items-center justify-center py-4">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
            <span className="ml-2 text-sm text-gray-600">Loading payment methods...</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            disabled={isLoading}
          >
            Cancel
          </button>
          
          {savedPaymentMethods.length > 0 && (
            <button
              onClick={handleRetry}
              disabled={isLoading || !selectedMethod}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? 'Retrying...' : 'Retry with Selected'}
            </button>
          )}
          
          <button
            onClick={handleUseNewMethod}
            disabled={isLoading}
            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? 'Loading...' : 'Use New Method'}
          </button>
        </div>
      </div>
    </div>
  );
} 