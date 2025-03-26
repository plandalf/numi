import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import SettingsLayout from '@/layouts/settings-layout';
import { type Organization } from '@/types';
import { Head } from '@inertiajs/react';

interface Props {
    organization: Organization;
}

export default function Billing({ organization }: Props) {
    return (
        <SettingsLayout>
            <Head title="Billing Settings" />
            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Billing Information</CardTitle>
                        <CardDescription>
                            Manage your billing information and subscription.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button>Manage Subscription</Button>
                    </CardContent>
                </Card>
            </div>
        </SettingsLayout>
    );
} 