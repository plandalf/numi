import { Head, router } from "@inertiajs/react";
import AppLayout from "@/layouts/app-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Integration } from "@/types/integration";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Settings, CreditCard, Smartphone, Building, LucideIcon } from "lucide-react";

interface Props {
    integration: Integration & {
        available_payment_methods: Record<string, string>;
        payment_only_methods: Record<string, string>;
        enabled_payment_methods: string[];
    };
}

const paymentMethodIcons: Record<string, LucideIcon> = {
    card: CreditCard,
    apple_pay: Smartphone,
    google_pay: Smartphone,
    link: Building,
    us_bank_account: Building,
    sepa_debit: Building,
    ideal: Building,
    sofort: Building,
    bancontact: Building,
    giropay: Building,
    eps: Building,
    p24: Building,
    alipay: Smartphone,
    wechat_pay: Smartphone,
    klarna: CreditCard,
    afterpay_clearpay: CreditCard,
    affirm: CreditCard,
    paypal: Building,
};

export default function Show({ integration }: Props) {
    const [enabledPaymentMethods, setEnabledPaymentMethods] = useState<string[]>(
        integration.enabled_payment_methods || []
    );
    const [saving, setSaving] = useState(false);

    const handlePaymentMethodToggle = (method: string, enabled: boolean) => {
        if (enabled) {
            setEnabledPaymentMethods([...enabledPaymentMethods, method]);
        } else {
            setEnabledPaymentMethods(enabledPaymentMethods.filter(m => m !== method));
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await router.put(`/integrations/${integration.id}/payment-methods`, {
                payment_methods: enabledPaymentMethods,
            });
        } finally {
            setSaving(false);
        }
    };

    const categorizePaymentMethods = () => {
        const categories = {
            cards: [] as Array<[string, string, boolean]>, // [key, label, isSetupCompatible]
            wallets: [] as Array<[string, string, boolean]>,
            bank: [] as Array<[string, string, boolean]>,
            bnpl: [] as Array<[string, string, boolean]>,
        };

        // Process setup-compatible payment methods
        Object.entries(integration.available_payment_methods).forEach(([key, label]) => {
            if (['card'].includes(key)) {
                categories.cards.push([key, label, true]);
            } else if (['apple_pay', 'google_pay', 'paypal', 'amazon_pay', 'revolut_pay', 'cashapp'].includes(key)) {
                categories.wallets.push([key, label, true]);
            } else if (['us_bank_account', 'sepa_debit', 'bacs_debit', 'au_becs_debit', 'acss_debit', 'link'].includes(key)) {
                categories.bank.push([key, label, true]);
            }
        });

        // Process payment-only methods
        Object.entries(integration.payment_only_methods).forEach(([key, label]) => {
            if (['alipay', 'wechat_pay'].includes(key)) {
                categories.wallets.push([key, label, false]);
            } else if (['ideal', 'sofort', 'bancontact', 'giropay', 'eps', 'p24', 'fpx', 'grabpay', 'oxxo', 'boleto', 'konbini', 'paynow', 'promptpay', 'swish', 'twint', 'mb_way', 'multibanco', 'blik', 'mobilepay', 'vipps', 'satispay'].includes(key)) {
                categories.bank.push([key, label, false]);
            } else if (['klarna', 'afterpay_clearpay', 'affirm', 'zip'].includes(key)) {
                categories.bnpl.push([key, label, false]);
            }
        });

        return categories;
    };

    const categories = categorizePaymentMethods();
    const hasChanges = JSON.stringify(enabledPaymentMethods.sort()) !== JSON.stringify(integration.enabled_payment_methods.sort());

    return (
        <AppLayout>
            <Head title={`Integration: ${integration.name}`} />

            <div className="container mx-auto py-10 px-4 sm:px-6 lg:px-8">
                <div className="space-y-6">
                    {/* Integration Overview */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Settings className="w-5 h-5" />
                                {integration.name}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <h3 className="text-sm font-medium text-muted-foreground">Type</h3>
                                    <p className="mt-1 font-semibold">{integration.type}</p>
                                </div>
                                <div>
                                    <h3 className="text-sm font-medium text-muted-foreground">Environment</h3>
                                    <Badge variant={integration.environment === 'live' ? 'default' : 'secondary'}>
                                        {integration.environment}
                                    </Badge>
                                </div>
                                <div>
                                    <h3 className="text-sm font-medium text-muted-foreground">Status</h3>
                                    <div className="flex items-center gap-2 mt-1">
                                        <CheckCircle className="w-4 h-4 text-green-500" />
                                        <span className="text-sm text-green-600">Connected</span>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Payment Methods Configuration */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle>Payment Methods</CardTitle>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        Select which payment methods to display in your checkout forms. 
                                        <br />
                                        <span className="text-orange-600">Payment only</span> methods can only be used for immediate payments, while others can also save payment details for future use.
                                    </p>
                                </div>
                                <Button 
                                    onClick={handleSave} 
                                    disabled={!hasChanges || saving}
                                    className="ml-4"
                                >
                                    {saving ? 'Saving...' : 'Save Changes'}
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Cards */}
                            {categories.cards.length > 0 && (
                                <div>
                                    <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                                        <CreditCard className="w-5 h-5" />
                                        Cards
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                        {categories.cards.map(([method, label, isSetupCompatible]) => {
                                            const Icon = paymentMethodIcons[method] || CreditCard;
                                            const isEnabled = enabledPaymentMethods.includes(method);
                                            
                                            return (
                                                <div 
                                                    key={method}
                                                    className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                                                        isEnabled ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                                                    }`}
                                                    onClick={() => handlePaymentMethodToggle(method, !isEnabled)}
                                                >
                                                    <div className="flex items-center space-x-3">
                                                        <Checkbox 
                                                            id={method}
                                                            checked={isEnabled}
                                                            onChange={() => {}} // Handled by parent click
                                                        />
                                                        <Icon className="w-5 h-5 text-muted-foreground" />
                                                        <div className="flex flex-col">
                                                            <Label htmlFor={method} className="cursor-pointer">
                                                                {label}
                                                            </Label>
                                                            {!isSetupCompatible && (
                                                                <span className="text-xs text-orange-600">
                                                                    Payment only
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Digital Wallets */}
                            {categories.wallets.length > 0 && (
                                <div>
                                    <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                                        <Smartphone className="w-5 h-5" />
                                        Digital Wallets
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                        {categories.wallets.map(([method, label, isSetupCompatible]) => {
                                            const Icon = paymentMethodIcons[method] || Smartphone;
                                            const isEnabled = enabledPaymentMethods.includes(method);
                                            
                                            return (
                                                <div 
                                                    key={method}
                                                    className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                                                        isEnabled ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                                                    }`}
                                                    onClick={() => handlePaymentMethodToggle(method, !isEnabled)}
                                                >
                                                    <div className="flex items-center space-x-3">
                                                        <Checkbox 
                                                            id={method}
                                                            checked={isEnabled}
                                                            onChange={() => {}} // Handled by parent click
                                                        />
                                                        <Icon className="w-5 h-5 text-muted-foreground" />
                                                        <div className="flex flex-col">
                                                            <Label htmlFor={method} className="cursor-pointer">
                                                                {label}
                                                            </Label>
                                                            {!isSetupCompatible && (
                                                                <span className="text-xs text-orange-600">
                                                                    Payment only
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Bank Transfers */}
                            {categories.bank.length > 0 && (
                                <div>
                                    <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                                        <Building className="w-5 h-5" />
                                        Bank Transfers & Direct Debit
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                        {categories.bank.map(([method, label, isSetupCompatible]) => {
                                            const Icon = paymentMethodIcons[method] || Building;
                                            const isEnabled = enabledPaymentMethods.includes(method);
                                            
                                            return (
                                                <div 
                                                    key={method}
                                                    className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                                                        isEnabled ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                                                    }`}
                                                    onClick={() => handlePaymentMethodToggle(method, !isEnabled)}
                                                >
                                                    <div className="flex items-center space-x-3">
                                                        <Checkbox 
                                                            id={method}
                                                            checked={isEnabled}
                                                            onChange={() => {}} // Handled by parent click
                                                        />
                                                        <Icon className="w-5 h-5 text-muted-foreground" />
                                                        <div className="flex flex-col">
                                                            <Label htmlFor={method} className="cursor-pointer">
                                                                {label}
                                                            </Label>
                                                            {!isSetupCompatible && (
                                                                <span className="text-xs text-orange-600">
                                                                    Payment only
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Buy Now, Pay Later */}
                            {categories.bnpl.length > 0 && (
                                <div>
                                    <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                                        <CreditCard className="w-5 h-5" />
                                        Buy Now, Pay Later
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                        {categories.bnpl.map(([method, label, isSetupCompatible]) => {
                                            const Icon = paymentMethodIcons[method] || CreditCard;
                                            const isEnabled = enabledPaymentMethods.includes(method);
                                            
                                            return (
                                                <div 
                                                    key={method}
                                                    className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                                                        isEnabled ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                                                    }`}
                                                    onClick={() => handlePaymentMethodToggle(method, !isEnabled)}
                                                >
                                                    <div className="flex items-center space-x-3">
                                                        <Checkbox 
                                                            id={method}
                                                            checked={isEnabled}
                                                            onChange={() => {}} // Handled by parent click
                                                        />
                                                        <Icon className="w-5 h-5 text-muted-foreground" />
                                                        <div className="flex flex-col">
                                                            <Label htmlFor={method} className="cursor-pointer">
                                                                {label}
                                                            </Label>
                                                            {!isSetupCompatible && (
                                                                <span className="text-xs text-orange-600">
                                                                    Payment only
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {enabledPaymentMethods.length === 0 && (
                                <div className="text-center py-8 text-muted-foreground">
                                    <CreditCard className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                    <p>No payment methods selected. Please enable at least one payment method.</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}
