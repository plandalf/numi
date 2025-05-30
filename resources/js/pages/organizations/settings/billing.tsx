import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useSubscriptions } from '@/hooks/use-subscriptions';
import SettingsLayout from '@/layouts/settings-layout';
import { Head } from '@inertiajs/react';
import { useState } from 'react';

const PLAN_PRICE = 25;
const PLAN_NAME = 'Plandalf';

export default function Billing() {
    const subscriptions = useSubscriptions();
    const [billingEmail, setBillingEmail] = useState('');
    const isPaid = subscriptions && subscriptions.some(sub => sub.stripe_status === 'active');

    // Dummy data for now
    const paymentMethods = [];
    const invoices = [];

    return (
        <SettingsLayout>
            <Head title="Billing & Subscription" />
            <div className="max-w-2xl mx-auto w-full py-10 px-2 space-y-6">
                {/* Subscriptions Section */}
                <section className="bg-white border rounded-xl px-6 py-6">
                    <h2 className="text-lg font-bold mb-4">Subscriptions</h2>
                    <div className="divide-y">
                        <div className="flex items-center justify-between py-3">
                            <div>
                                <div className="font-medium">{PLAN_NAME}</div>
                                <div className="text-xs text-muted-foreground">{isPaid ? 'Active' : 'Free trial'}</div>
                            </div>
                            <div className="text-right">
                                <div className="font-medium">${PLAN_PRICE} / mo</div>
                                <div className="text-xs text-muted-foreground">1 workspace</div>
                            </div>
                        </div>
                    </div>
                    <div className="pt-4">
                        <Button variant="secondary" className="w-32 h-9 rounded" onClick={() => window.location.href = route('organizations.settings.billing.checkout')}>
                            Upgrade
                        </Button>
                    </div>
                </section>

                {/* Billing Email Section */}
                <section className="bg-white border rounded-xl px-6 py-6">
                    <h2 className="text-lg font-bold mb-4">Billing Email</h2>
                    <div className="mb-3 text-sm text-muted-foreground">Upgrade to a paid plan to receive invoices.</div>
                    <Input
                        type="email"
                        placeholder="you@example.com"
                        value={billingEmail}
                        onChange={e => setBillingEmail(e.target.value)}
                        disabled={!isPaid}
                        className="mb-3 bg-gray-50 border-gray-200"
                    />
                    <Button variant="secondary" className="w-24 h-9 rounded" disabled={!isPaid}>
                        Save
                    </Button>
                </section>

                {/* Payment Methods Section */}
                <section className="bg-white border rounded-xl px-6 py-6">
                    <h2 className="text-lg font-bold mb-4">Payment Methods</h2>
                    {paymentMethods.length === 0 ? (
                        <div className="mb-4 text-sm text-muted-foreground">There are no payment methods yet. Upgrade to a paid plan to add a new one.</div>
                    ) : (
                        <div className="mb-4">{/* Render payment methods here */}</div>
                    )}
                    <Button variant="secondary" className="w-40 h-9 rounded" disabled={!isPaid}>
                        Add new card
                    </Button>
                </section>

                {/* Invoices Section */}
                <section className="bg-white border rounded-xl px-6 py-6">
                    <h2 className="text-lg font-bold mb-4">Invoices</h2>
                    {invoices.length === 0 ? (
                        <div className="flex flex-col items-center py-8">
                            <div className="text-base font-semibold mb-1">No invoices yet</div>
                            <div className="text-sm text-muted-foreground text-center">Once a payment cycle ends, you'll be able to see invoices.</div>
                        </div>
                    ) : (
                        <div>{/* Render invoices here */}</div>
                    )}
                </section>
            </div>
        </SettingsLayout>
    );
} 