import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import SettingsLayout from '@/layouts/settings-layout';
import { type Organization } from '@/types';
import { Head, router } from '@inertiajs/react';
import { useState } from 'react';

interface Props {
    organization: Organization;
}

const breadcrumbs = [
    { title: 'Settings', href: route('organizations.settings.general') },
    { title: 'General', href: route('organizations.settings.general') },
];

export default function General({ organization }: Props) {
    const [name, setName] = useState(organization.name);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        router.put(route('organizations.update', organization.id), { name });
    };

    return (
        <SettingsLayout breadcrumbs={breadcrumbs}>
            <Head title="Organization Settings" />
            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Organization Details</CardTitle>
                        <CardDescription>
                            Update your organization's basic information.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Organization name</Label>
                                <Input
                                    id="name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Acme Corp"
                                />
                            </div>
                            <Button type="submit">Save changes</Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </SettingsLayout>
    );
} 