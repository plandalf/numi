import { Head, Link, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Pencil } from 'lucide-react';
import SettingsLayout from '@/layouts/settings/layout';
import { Theme } from '@/types/theme';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Theme settings',
        href: '/settings/themes',
    },
];

interface Props {
    themes: Theme[];
}

export default function Themes({ themes }: Props) {
    const handleCreateTheme = () => {
        router.post(route('themes.store'));
    };
    
    const handleDeleteTheme = (themeId: number) => {
        router.post(route('themes.store'));
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Profile settings" />
            <SettingsLayout>
                <Head title="Themes" />
                
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">Themes</h2>
                        <p className="text-muted-foreground">
                            Manage your organization's themes
                        </p>
                    </div>
                    <Button onClick={handleCreateTheme}>
                        <Plus className="mr-2 h-4 w-4" />
                        Create Theme
                    </Button>
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {themes.map((theme) => (
                        <Card key={theme.id} className="overflow-hidden">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-lg">{theme.name ?? 'Untitled theme'}</CardTitle>
                                <CardDescription>
                                    Created {new Date(theme.created_at).toLocaleDateString()}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="pb-2">
                                <div className="space-y-2">
                                    <div className="flex items-center space-x-2">
                                        <div className="h-4 w-4 rounded-full" style={{ backgroundColor: theme?.color?.components?.primary_color || '#000000' }} />
                                        <span className="text-sm text-muted-foreground">Primary Color</span>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <div className="h-4 w-4 rounded-full" style={{ backgroundColor: theme?.color?.components?.secondary_color || '#000000' }} />
                                        <span className="text-sm text-muted-foreground">Secondary Color</span>
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter className="pt-2">
                                <Button variant="outline" size="sm" asChild className="w-full">
                                    <Link href={route('themes.edit', theme.id)}>
                                        <Pencil className="mr-2 h-4 w-4" />
                                        Edit Theme
                                    </Link>
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}

                    {themes.length === 0 && (
                        <Card className="col-span-full">
                            <CardHeader>
                                <CardTitle>No Themes</CardTitle>
                                <CardDescription>
                                    You haven't created any themes yet. Create your first theme to get started.
                                </CardDescription>
                            </CardHeader>
                            <CardFooter>
                                <Button onClick={handleCreateTheme}>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Create Theme
                                </Button>
                            </CardFooter>
                        </Card>
                    )}
                </div>
            </SettingsLayout>
        </AppLayout>
    );
}
