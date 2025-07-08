import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ImageUpload } from '@/components/ui/image-upload';
import SettingsLayout from '@/layouts/settings-layout';
import { type Organization } from '@/types';
import { Head, useForm } from '@inertiajs/react';
import { Loader2, Globe, Palette } from 'lucide-react';
import { useState } from 'react';

interface Props {
    organization: Organization;
}



export default function SeoSettings({ organization }: Props) {
    const [logoPreview, setLogoPreview] = useState<string | null>(organization.logo_media?.url || null);
    const [faviconPreview, setFaviconPreview] = useState<string | null>(organization.favicon_media?.url || null);

    const form = useForm({
        description: organization.description || '',
        website_url: organization.website_url || '',
        logo_media_id: organization.logo_media_id || null,
        favicon_media_id: organization.favicon_media_id || null,
        primary_color: organization.primary_color || '',
        social_media: organization.social_media || {
            facebook: '',
            twitter: '',
            instagram: '',
            linkedin: '',
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        form.put(route('organizations.settings.seo.update', organization.id));
    };

    const handleLogoUpload = (media: { id: number; url: string } | null) => {
        if (media) {
            setLogoPreview(media.url);
            form.setData('logo_media_id', media.id);
        } else {
            setLogoPreview(null);
            form.setData('logo_media_id', null);
        }
    };

    const handleFaviconUpload = (media: { id: number; url: string } | null) => {
        if (media) {
            setFaviconPreview(media.url);
            form.setData('favicon_media_id', media.id);
        } else {
            setFaviconPreview(null);
            form.setData('favicon_media_id', null);
        }
    };

    const updateSocialMedia = (platform: string, value: string) => {
        form.setData('social_media', {
            ...form.data.social_media,
            [platform]: value,
        });
    };

    return (
        <SettingsLayout>
            <Head title="SEO & Branding Settings" />
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">SEO & Branding</h1>
                    <p className="text-muted-foreground">
                        Customize how your organization appears when shared on social media and search engines.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Organization Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Globe className="h-5 w-5" />
                                Organization Information
                            </CardTitle>
                            <CardDescription>
                                Basic information about your organization that appears in search results and social media.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="description">Organization Description</Label>
                                <Textarea
                                    id="description"
                                    placeholder="A brief description of your organization..."
                                    value={form.data.description}
                                    onChange={(e) => form.setData('description', e.target.value)}
                                    rows={3}
                                />
                                <p className="text-sm text-muted-foreground">
                                    This description appears in search results and social media previews.
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="website_url">Website URL</Label>
                                <Input
                                    id="website_url"
                                    type="url"
                                    placeholder="https://yourwebsite.com"
                                    value={form.data.website_url}
                                    onChange={(e) => form.setData('website_url', e.target.value)}
                                />
                                <p className="text-sm text-muted-foreground">
                                    Your main website URL for social media and search engine links.
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Branding Assets */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Palette className="h-5 w-5" />
                                Branding Assets
                            </CardTitle>
                            <CardDescription>
                                Upload your logo, favicon, and set your brand colors.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Logo Upload */}
                            <div className="space-y-4">
                                <Label>Organization Logo</Label>
                                <ImageUpload
                                    onChange={handleLogoUpload}
                                    preview={logoPreview}
                                    label="Upload Logo"
                                />
                                <p className="text-sm text-muted-foreground">
                                    Upload your organization logo. Recommended size: 512x512px.
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    This logo appears in social media previews and structured data.
                                </p>
                            </div>

                            {/* Favicon Upload */}
                            <div className="space-y-4">
                                <Label>Favicon</Label>
                                <ImageUpload
                                    onChange={handleFaviconUpload}
                                    preview={faviconPreview}
                                    label="Upload Favicon"
                                />
                                <p className="text-sm text-muted-foreground">
                                    Upload your favicon. Recommended size: 32x32px or 16x16px.
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    This icon appears in browser tabs and bookmarks.
                                </p>
                            </div>

                            {/* Primary Color */}
                            <div className="space-y-2">
                                <Label htmlFor="primary_color">Primary Brand Color</Label>
                                <div className="flex items-center gap-3">
                                    <Input
                                        id="primary_color"
                                        type="color"
                                        value={form.data.primary_color}
                                        onChange={(e) => form.setData('primary_color', e.target.value)}
                                        className="w-16 h-10 p-1"
                                    />
                                    <Input
                                        type="text"
                                        placeholder="#3B82F6"
                                        value={form.data.primary_color}
                                        onChange={(e) => form.setData('primary_color', e.target.value)}
                                        className="flex-1"
                                    />
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    This color is used for theme-color meta tags and branding elements.
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Social Media */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Social Media Links</CardTitle>
                            <CardDescription>
                                Add your social media profiles for better social sharing.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="facebook">Facebook</Label>
                                    <Input
                                        id="facebook"
                                        type="url"
                                        placeholder="https://facebook.com/yourpage"
                                        value={form.data.social_media.facebook}
                                        onChange={(e) => updateSocialMedia('facebook', e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="twitter">Twitter/X</Label>
                                    <Input
                                        id="twitter"
                                        type="url"
                                        placeholder="https://twitter.com/yourhandle"
                                        value={form.data.social_media.twitter}
                                        onChange={(e) => updateSocialMedia('twitter', e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="instagram">Instagram</Label>
                                    <Input
                                        id="instagram"
                                        type="url"
                                        placeholder="https://instagram.com/yourprofile"
                                        value={form.data.social_media.instagram}
                                        onChange={(e) => updateSocialMedia('instagram', e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="linkedin">LinkedIn</Label>
                                    <Input
                                        id="linkedin"
                                        type="url"
                                        placeholder="https://linkedin.com/company/yourcompany"
                                        value={form.data.social_media.linkedin}
                                        onChange={(e) => updateSocialMedia('linkedin', e.target.value)}
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Preview Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Social Media Preview</CardTitle>
                            <CardDescription>
                                How your checkout pages will appear when shared on social media.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="border rounded-lg p-4 bg-gray-50">
                                <div className="max-w-md">
                                    {logoPreview && (
                                        <img
                                            src={logoPreview}
                                            alt="Logo"
                                            className="w-12 h-12 object-contain mb-3"
                                        />
                                    )}
                                    <h3 className="font-semibold text-lg mb-1">
                                        {organization.name} - Checkout
                                    </h3>
                                    <p className="text-sm text-gray-600 mb-2">
                                        {form.data.description || 'Complete your purchase securely'}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        {form.data.website_url || 'yourwebsite.com'}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="flex justify-end">
                        <Button type="submit" disabled={form.processing}>
                            {form.processing && (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            Save Changes
                        </Button>
                    </div>
                </form>
            </div>
        </SettingsLayout>
    );
} 