import AppOfferLayout from '@/layouts/app/app-offer-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, useForm } from '@inertiajs/react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useEffect, useState } from 'react';

interface Offer {
    id: number;
    name: string;
    created_at: string;
    updated_at: string;
}

interface Props {
    offer: Offer;
    showNameDialog?: boolean;
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

export default function Edit({ offer, showNameDialog }: Props) {
    const [isNameDialogOpen, setIsNameDialogOpen] = useState(false);
    const { data, setData, put, processing, errors } = useForm({
        name: offer.name,
    });

    useEffect(() => {
        if (showNameDialog) {
            setIsNameDialogOpen(true);
        }
    }, [showNameDialog]);

    const handleNameSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(route('offers.update', offer.id), {
            onSuccess: () => setIsNameDialogOpen(false),
        });
    };

    return (
        <AppOfferLayout offer={offer} breadcrumbs={breadcrumbs}>
            <Head title={`Edit ${offer.name || 'Untitled Offer'}`} />

            <Dialog open={isNameDialogOpen} onOpenChange={setIsNameDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Name your offer</DialogTitle>
                        <DialogDescription>
                            Give your offer a name that describes what you're selling.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleNameSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Name</Label>
                            <Input
                                id="name"
                                value={data.name}
                                onChange={e => setData('name', e.target.value)}
                                placeholder="Enter offer name"
                                autoFocus
                            />
                            {errors.name && (
                                <p className="text-sm text-red-500">{errors.name}</p>
                            )}
                        </div>
                        <div className="flex justify-end">
                            <button
                                type="submit"
                                className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                                disabled={processing}
                            >
                                Save
                            </button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            <div className=" h-full flex flex-grow">
                <div>
                    <h1 className="text-2xl font-semibold">{offer.name || 'Untitled Offer'}</h1>
                </div>
            </div>
        </AppOfferLayout>
    );
}
