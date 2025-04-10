import { FormEventHandler } from 'react';
import { Head, useForm, Link } from '@inertiajs/react';
import { Offer } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import AppOfferLayout from '@/layouts/app/app-offer-layout';
import OfferSettingsLayout from '@/layouts/app/offer-settings-layout';
import { Theme } from '@/types/theme';
import { PlusCircle } from 'lucide-react';

interface Props {
    offer: Offer;
    themes: Theme[];
    currentTheme: Theme | null;
}

export default function ThemeSettings({ offer, themes, currentTheme }: Props) {
    const { data, setData, put, processing } = useForm({
        theme_id: currentTheme?.id?.toString() ?? '',
    });

    const handleSubmit: FormEventHandler = (e) => {
        e.preventDefault();
        put(route('offers.update.theme', offer.id), {
            onSuccess: () => {
                toast.success('Theme updated successfully');
            },
        });
    };

    return (
        <AppOfferLayout offer={offer}>
            <Head title={`${offer.name || 'Untitled Offer'} - Theme Settings`} />
            <div className="px-4 py-6">
                <h1 className="text-2xl font-semibold mb-6">Theme Settings for {offer.name || 'Untitled Offer'}</h1>
                
                <OfferSettingsLayout offerId={offer.id}>
                    <Card>
                        <CardHeader>
                            <CardTitle>Theme Settings</CardTitle>
                            <CardDescription>
                                Choose a theme for your offer. The theme will affect the appearance of your offer page.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <div className="flex items-end justify-between gap-2">
                                        <div className="flex-1">
                                            <Label htmlFor="theme">Select Theme</Label>
                                            <Select
                                                value={data.theme_id}
                                                onValueChange={(value) => setData('theme_id', value)}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select a theme" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {themes.map((theme) => (
                                                        <SelectItem key={theme.id} value={theme.id.toString()}>
                                                            {theme.name ?? `Untitled theme`}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="icon"
                                            asChild
                                            className="flex items-center"
                                        >
                                            <Link href={route('themes.store')}>
                                                <PlusCircle className="h-5 w-5" />
                                                <span className="sr-only">Create new theme</span>
                                            </Link>
                                        </Button>
                                    </div>
                                </div>

                                <Button type="submit" disabled={processing}>
                                    {processing ? 'Saving...' : 'Save Theme'}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </OfferSettingsLayout>
            </div>
        </AppOfferLayout>
    );
} 