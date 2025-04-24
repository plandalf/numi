import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useCurrentOrganization } from '@/hooks/use-current-organization';
import { useSubscriptions } from '@/hooks/use-subscriptions';
import SettingsLayout from '@/layouts/settings-layout';
import { Head } from '@inertiajs/react';

export default function Billing() {
    const subscriptions = useSubscriptions();
    const organization = useCurrentOrganization();

    const formatTrialEndDate = (diffInDays: number) => {
        if (diffInDays === 0) return 'today';
        if (diffInDays === 1) return 'tomorrow';
        return `in ${diffInDays} days`;
    };
    
    return (
        <SettingsLayout>
            <Head title="Billing Settings" />
            <div className="space-y-6">
                {organization?.on_trial && (
                    <Card>
                        <CardContent className="space-y-4">
                            <p className="text-sm font-medium">You have {organization.trial_days_left} days left until your trial period ends.</p>
                            <p className="text-sm font-medium"><b>Upgrade to the Plandalf</b> plan to continue using the platform.</p>
                            <Button
                                className="cursor-pointer"
                                onClick={() => window.location.href = route('organizations.settings.billing.checkout')}
                                variant="default"
                            >
                                Upgrade to Plandalf
                            </Button>
                        </CardContent>
                    </Card>
                )}
                {subscriptions?.map((subscription) => (
                    <Card key={subscription.id}>
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
                ))}

               {!organization?.on_trial && (
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
               )}
            </div>
        </SettingsLayout>
    );
} 