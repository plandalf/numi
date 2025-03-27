import AppOfferLayout from '@/layouts/app/app-offer-layout';
import OfferSettingsLayout from '@/layouts/app/offer-settings-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';

interface Offer {
    id: number;
    name: string;
    created_at: string;
    updated_at: string;
}

interface Props {
    offer: Offer;
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
    {
        title: 'Offers',
        href: '/offers',
    },
];

export default function Settings({ offer }: Props) {
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDeleteOffer = () => {
        setIsDeleting(true);
        
        // Show immediate toast while API call happens
        const toastId = toast.loading(`Deleting offer ${offer.name}...`);
        
        router.delete(`/offers/${offer.id}`, {
            onSuccess: () => {
                // Toast will be shown by the flash message handler
                // This is just for immediate client-side feedback
                toast.success(`Offer ${offer.name} deleted successfully`, {
                    id: toastId,
                });
            },
            onError: (errors) => {
                setIsDeleting(false);
                toast.error(`Failed to delete offer: ${errors.message || 'Unknown error'}`, {
                    id: toastId,
                });
            },
            onFinish: () => {
                setIsDeleting(false);
            }
        });
    };

    return (
        <AppOfferLayout offer={offer}>
            <Head title={`${offer.name || 'Untitled Offer'} - Settings`} />
            <div className="px-4 py-6">
                <h1 className="text-2xl font-semibold mb-6">Settings for {offer.name || 'Untitled Offer'}</h1>
                
                <OfferSettingsLayout offerId={offer.id}>
                    <div className="space-y-8">
                        <Card>
                            <CardHeader>
                                <CardTitle>General Settings</CardTitle>
                                <CardDescription>
                                    Configure the basic settings for your offer
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {/* Add your settings form here */}
                                <p className="text-muted-foreground">Settings content coming soon...</p>
                            </CardContent>
                        </Card>

                        {/* Danger Zone */}
                        <Card className="border-destructive">
                            <CardHeader>
                                <CardTitle className="text-destructive">Danger Zone</CardTitle>
                                <CardDescription>
                                    Actions here cannot be undone. Be certain before proceeding.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div className="rounded-md border border-destructive p-4">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h4 className="font-semibold">Delete this offer</h4>
                                                <p className="text-sm text-muted-foreground">
                                                    Once deleted, all variants and associated data will be permanently removed.
                                                    This action cannot be undone.
                                                </p>
                                            </div>
                                            <Button 
                                                variant="destructive" 
                                                onClick={() => setIsDeleteDialogOpen(true)}
                                                disabled={isDeleting}
                                            >
                                                {isDeleting ? 'Deleting...' : 'Delete Offer'}
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </OfferSettingsLayout>
            </div>

            {/* Delete confirmation dialog */}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the offer 
                            <span className="font-semibold"> {offer.name} </span> 
                            and all of its variants, settings, and associated data.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                            onClick={handleDeleteOffer}
                            className="bg-destructive text-white hover:bg-destructive/90"
                            disabled={isDeleting}
                        >
                            {isDeleting ? 'Deleting...' : 'Delete Offer'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </AppOfferLayout>
    );
} 