import AppLayout from '@/layouts/app-layout';
import { Head, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Copy, ExternalLink, TestTube, CreditCard, AlertCircle } from 'lucide-react';
import { Offer } from '@/types/offer';
import { toast } from 'sonner';

interface Props {
    offer: Offer;
    hasLiveIntegration: boolean;
    hasTestIntegration: boolean;
    liveCheckoutUrl: string;
    testCheckoutUrl: string;
}

export default function TestCheckout({ offer, hasLiveIntegration, hasTestIntegration, liveCheckoutUrl, testCheckoutUrl }: Props) {
    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success('Copied to clipboard');
    };

    return (
        <AppLayout>
            <Head title={`${offer.name || 'Untitled Offer'} - Test Checkout`} />
            <div className="max-w-4xl mx-auto space-y-8 p-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-semibold">Test Checkout</h1>
                        <p className="text-muted-foreground mt-1">
                            Quick access to checkout URLs for {offer.name || 'Untitled Offer'}
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Link href={`/offers/${offer.id}`}>
                            <Button variant="outline">
                                Edit Offer
                            </Button>
                        </Link>
                        <Link href={`/offers/${offer.id}/sharing`}>
                            <Button variant="outline">
                                Full Sharing
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Integration Status */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium flex items-center gap-2">
                                <CreditCard className="h-4 w-4" />
                                Live Integration
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Badge variant={hasLiveIntegration ? "default" : "secondary"}>
                                {hasLiveIntegration ? "Connected" : "Not Connected"}
                            </Badge>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium flex items-center gap-2">
                                <TestTube className="h-4 w-4" />
                                Test Integration
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Badge variant={hasTestIntegration ? "default" : "secondary"}>
                                {hasTestIntegration ? "Connected" : "Not Connected"}
                            </Badge>
                        </CardContent>
                    </Card>
                </div>

                {/* Checkout URLs */}
                <div className="space-y-6">
                    {/* Live Checkout */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <CreditCard className="h-5 w-5" />
                                Live Checkout
                            </CardTitle>
                            <CardDescription>
                                Real payments will be processed through your live Stripe integration
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {hasLiveIntegration ? (
                                <>
                                    <div className="relative">
                                        <Input
                                            readOnly
                                            value={liveCheckoutUrl}
                                            className="pr-24"
                                        />
                                        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-2">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => copyToClipboard(liveCheckoutUrl)}
                                            >
                                                <Copy className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => window.open(liveCheckoutUrl, '_blank')}
                                            >
                                                <ExternalLink className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            onClick={() => window.open(liveCheckoutUrl, '_blank')}
                                            className="flex-1"
                                        >
                                            <ExternalLink className="h-4 w-4 mr-2" />
                                            Open Live Checkout
                                        </Button>
                                    </div>
                                </>
                            ) : (
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <AlertCircle className="h-4 w-4" />
                                    <span>No live integration connected</span>
                                    <Link href="/integrations">
                                        <Button variant="outline" size="sm">
                                            Setup Integration
                                        </Button>
                                    </Link>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Test Checkout */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <TestTube className="h-5 w-5" />
                                Test Checkout
                            </CardTitle>
                            <CardDescription>
                                No real payments - use Stripe test cards (e.g., 4242424242424242)
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {hasTestIntegration ? (
                                <>
                                    <div className="relative">
                                        <Input
                                            readOnly
                                            value={testCheckoutUrl}
                                            className="pr-24"
                                        />
                                        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-2">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => copyToClipboard(testCheckoutUrl)}
                                            >
                                                <Copy className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => window.open(testCheckoutUrl, '_blank')}
                                            >
                                                <ExternalLink className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            onClick={() => window.open(testCheckoutUrl, '_blank')}
                                            className="flex-1"
                                        >
                                            <TestTube className="h-4 w-4 mr-2" />
                                            Open Test Checkout
                                        </Button>
                                    </div>
                                </>
                            ) : (
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <AlertCircle className="h-4 w-4" />
                                    <span>No test integration connected</span>
                                    <Link href="/integrations">
                                        <Button variant="outline" size="sm">
                                            Setup Test Integration
                                        </Button>
                                    </Link>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Quick Tips */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm font-medium">Quick Tips</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm text-muted-foreground">
                        <div className="flex items-start gap-2">
                            <div className="w-1.5 h-1.5 bg-muted-foreground rounded-full mt-2 flex-shrink-0" />
                            <span>Use test checkout to verify your offer flow without real payments</span>
                        </div>
                        <div className="flex items-start gap-2">
                            <div className="w-1.5 h-1.5 bg-muted-foreground rounded-full mt-2 flex-shrink-0" />
                            <span>Test card: 4242424242424242, any future date, any CVC</span>
                        </div>
                        <div className="flex items-start gap-2">
                            <div className="w-1.5 h-1.5 bg-muted-foreground rounded-full mt-2 flex-shrink-0" />
                            <span>Both integrations need to be set up in your integrations page</span>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
} 