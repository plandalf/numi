import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useSubscriptions } from '@/hooks/use-subscriptions';
import SettingsLayout from '@/layouts/settings-layout';
import { getDaysFromNow } from '@/lib/utils';
import { Head } from '@inertiajs/react';

export default function Billing() {
    const subscriptions = useSubscriptions();
    const subscription = subscriptions?.[0];
    
    const formatTrialEndDate = (diffInDays: number) => {
        if (diffInDays === 0) return 'today';
        if (diffInDays === 1) return 'tomorrow';
        return `in ${diffInDays} days`;
    };
    
    return (
        <SettingsLayout>
            <Head title="Billing Settings" />
            <div className="space-y-6">
                <Card>
                    <CardContent className="space-y-4">
                        {subscription ? (
                            <>
                                <div className="flex flex-col gap-y-2">
                                    <p className="text-sm font-medium">Current Plan</p>
                                    <p className="text-2xl font-bold">{subscription.product_name}</p>
                                </div>
                                {subscription.on_trial && (
                                    <div className="rounded-lg bg-yellow-50 p-2">
                                        <p className="text-sm text-yellow-800">
                                            Your trial ends {formatTrialEndDate(subscription?.trial_days_left)}
                                        </p>
                                    </div>
                                )}
                            </>
                        ) : (
                            <p className="text-sm text-gray-500">No active subscription found.</p>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Billing Information</CardTitle>
                        <CardDescription>
                            Manage your billing information and subscription.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button className="cursor-pointer"onClick={() => window.location.href = route('organizations.settings.billing.portal')}>Manage Subscription</Button>
                    </CardContent>
                </Card>
            </div>
        </SettingsLayout>
    );
} 