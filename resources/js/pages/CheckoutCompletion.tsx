import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Head } from '@inertiajs/react';
import { useState } from 'react';
import { router } from '@inertiajs/react';

interface CheckoutCompletionProps {
    checkout?: {
        id: string;
        external_id: string;
        status: string;
        amount: number;
        currency: string;
        customer_email: string;
        created_at: string;
        completed_at?: string;
    };
    checkoutData?: any;
    error?: string;
    checkoutId?: string;
}

export default function CheckoutCompletion({ checkout, checkoutData, error, checkoutId }: CheckoutCompletionProps) {
    const [isProcessing, setIsProcessing] = useState(false);
    const [processingError, setProcessingError] = useState<string | null>(null);

    const handleProcessCheckout = async () => {
        if (!checkoutId) return;

        setIsProcessing(true);
        setProcessingError(null);

        try {
            const response = await fetch(`/organizations/settings/checkout-completion/${checkoutId}/process`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to process checkout');
            }

            // Redirect to billing page with success message
            router.visit('/organizations/settings/billing', {
                data: { 
                    success: true, 
                    message: 'Checkout processed successfully!',
                    checkoutId: data.checkout?.external_id 
                }
            });

        } catch (err) {
            setProcessingError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setIsProcessing(false);
        }
    };

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <Head title="Checkout Error" />
                <Card className="w-full max-w-md">
                    <CardHeader>
                        <CardTitle className="text-red-600">Checkout Error</CardTitle>
                        <CardDescription>Unable to load checkout details</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-sm text-gray-600 mb-4">{error}</div>
                        {checkoutId && (
                            <div className="text-xs text-gray-500 mb-4">
                                Checkout ID: {checkoutId}
                            </div>
                        )}
                        <Button 
                            onClick={() => router.visit('/organizations/settings/billing')}
                            className="w-full"
                        >
                            Return to Billing
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <Head title="Checkout Completion" />
            <Card className="w-full max-w-2xl">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        Checkout Completion
                        {checkout && (
                            <Badge variant={checkout.status === 'completed' ? 'default' : 'secondary'}>
                                {checkout.status}
                            </Badge>
                        )}
                    </CardTitle>
                    <CardDescription>
                        Review and process your checkout from Plandalf
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {checkout && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <div className="text-sm font-medium text-gray-500">Checkout ID</div>
                                <div className="text-sm font-mono bg-gray-100 p-2 rounded">
                                    {checkout.external_id}
                                </div>
                            </div>
                            <div className="space-y-2">
                                <div className="text-sm font-medium text-gray-500">Amount</div>
                                <div className="text-lg font-semibold">
                                    ${(checkout.amount / 100).toFixed(2)} {checkout.currency.toUpperCase()}
                                </div>
                            </div>
                            <div className="space-y-2">
                                <div className="text-sm font-medium text-gray-500">Customer Email</div>
                                <div className="text-sm">{checkout.customer_email}</div>
                            </div>
                            <div className="space-y-2">
                                <div className="text-sm font-medium text-gray-500">Created</div>
                                <div className="text-sm">
                                    {new Date(checkout.created_at).toLocaleDateString()}
                                </div>
                            </div>
                        </div>
                    )}

                    {checkoutData && (
                        <div className="border-t pt-4">
                            <h3 className="text-sm font-medium text-gray-700 mb-2">Raw Checkout Data</h3>
                            <pre className="text-xs bg-gray-100 p-3 rounded overflow-auto max-h-40">
                                {JSON.stringify(checkoutData, null, 2)}
                            </pre>
                        </div>
                    )}

                    {processingError && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                            <div className="text-sm text-red-700">{processingError}</div>
                        </div>
                    )}

                    <div className="flex gap-3 pt-4">
                        <Button 
                            onClick={handleProcessCheckout}
                            disabled={isProcessing || checkout?.status === 'completed'}
                            className="flex-1"
                        >
                            {isProcessing ? 'Processing...' : 'Process Checkout'}
                        </Button>
                        <Button 
                            variant="outline"
                            onClick={() => router.visit('/organizations/settings/billing')}
                        >
                            Return to Billing
                        </Button>
                    </div>

                    {checkout?.status === 'completed' && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                            <div className="text-sm text-green-700">
                                This checkout has already been completed.
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
} 