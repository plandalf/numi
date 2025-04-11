import { Head, Link, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { X, Plus, Pencil } from 'lucide-react';
import SettingsLayout from '@/layouts/settings/layout';
import { Theme } from '@/types/theme';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { showToast } from '@/lib/notifications';
import { 
    AlertDialog, 
    AlertDialogAction, 
    AlertDialogCancel, 
    AlertDialogContent, 
    AlertDialogDescription, 
    AlertDialogFooter, 
    AlertDialogHeader, 
    AlertDialogTitle 
} from '@/components/ui/alert-dialog';
import { useState } from 'react';

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
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [themeToDelete, setThemeToDelete] = useState<Theme | null>(null);

    const handleCreateTheme = () => {
        router.post(route('themes.store'));
    };
    
    const openDeleteDialog = (theme: Theme) => {
        setThemeToDelete(theme);
        setIsDeleteDialogOpen(true);
    };
    
    const handleDeleteTheme = () => {
        if (!themeToDelete) return;
        
        router.delete(route('themes.destroy', themeToDelete.id), {
            onSuccess: () => {
                showToast('Theme deleted successfully', 'success');
                setIsDeleteDialogOpen(false);
                setThemeToDelete(null);
            },
            onError: () => {
                showToast('Failed to delete theme', 'error');
            }
        });
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
                            <CardFooter className="pt-2 flex gap-2">
                                <Button variant="outline" size="sm" asChild className="w-full">
                                    <Link href={route('themes.edit', theme.id)}>
                                        <Pencil className="h-4 w-4" />
                                    </Link>
                                </Button>
                                <Button 
                                    variant="destructive" 
                                    size="sm" 
                                    className="w-full cursor-pointer" 
                                    onClick={() => openDeleteDialog(theme)}
                                >
                                    <X className="h-4 w-4" />
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
            
            {/* Delete confirmation dialog */}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the theme 
                            <span className="font-semibold"> {themeToDelete?.name ?? 'Untitled theme'} </span>.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                            onClick={handleDeleteTheme}
                            className="bg-destructive text-white hover:bg-destructive/90"
                        >
                            Delete Theme
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </AppLayout>
    );
}
