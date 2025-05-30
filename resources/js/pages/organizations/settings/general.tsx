import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import SettingsLayout from '@/layouts/settings-layout';
import { type Organization } from '@/types';
import { Head, useForm } from '@inertiajs/react';
import { Loader2 } from "lucide-react";

interface Props {
    organization: Organization;
}

const breadcrumbs = [
    { title: 'Settings', href: route('organizations.settings.general') },
    { title: 'General', href: route('organizations.settings.general') },
];

const AVAILABLE_CURRENCIES = {
    USD: 'US Dollar',
    EUR: 'Euro',
    GBP: 'British Pound',
    CAD: 'Canadian Dollar',
    AUD: 'Australian Dollar',
} as const;

export default function General({ organization }: Props) {
    const form = useForm({
        name: organization.name,
        default_currency: organization.default_currency,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        form.put(route('organizations.update', organization.id));
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
                                    value={form.data.name}
                                    onChange={(e) => form.setData('name', e.target.value)}
                                    placeholder="Acme Corp"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="currency">Default Currency</Label>
                                <Select
                                    value={form.data.default_currency}
                                    onValueChange={(value) => form.setData('default_currency', value)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select currency" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Object.entries(AVAILABLE_CURRENCIES).map(([code, name]) => (
                                            <SelectItem key={code} value={code}>
                                                {code} - {name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <Button
                                type="submit"
                                disabled={form.processing}
                            >
                                {form.processing && (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                )}
                                Save changes
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </SettingsLayout>
    );
}