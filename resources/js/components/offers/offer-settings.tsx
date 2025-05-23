import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogClose
} from "@/components/ui/dialog";
import { EditProps } from "@/pages/offers/edit";
import { router, useForm, usePage } from "@inertiajs/react";
import { TrashIcon } from "lucide-react";
import { useState } from "react";

export default function OfferSettings() {
    const { offer } = usePage<EditProps>().props;
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const { delete: destroy, processing } = useForm();

    const handleDeleteOffer = () => {
        destroy(route('offers.destroy', { offer: offer.id }), {
            onSuccess: () => {
                setIsDeleteDialogOpen(false);
                router.get(route('dashboard'));
            },
        });
    };

    return (
        <div className="offer-settings space-y-6 px-4">
            

            {/* Add your settings form or components here */}

            <div className="space-y-2 pt-4 border-t">
                 <h3 className="text-md font-medium text-destructive">Danger Zone</h3>
                <div className="flex items-center justify-between rounded-lg border border-transparent p-4 hover:border-destructive/50 transition-colors">
                    <div>
                        <h4 className="font-medium">Delete Offer</h4>
                        <p className="text-sm text-muted-foreground">
                            Permanently delete this offer and all of its associated data. This action cannot be undone.
                        </p>
                    </div>
                    <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                        <DialogTrigger asChild>
                            <Button variant="ghost" className="text-destructive hover:bg-destructive/10 hover:text-destructive gap-2">
                                <TrashIcon className="size-4" />
                                Delete
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Are you sure you want to delete this offer?</DialogTitle>
                                <DialogDescription>
                                    This action cannot be undone. This will permanently delete the offer
                                    "{offer.name || 'Unnamed Offer'}" and all its associated data.
                                </DialogDescription>
                            </DialogHeader>
                            <DialogFooter className="gap-2 sm:gap-0">
                                <DialogClose asChild>
                                    <Button variant="outline" disabled={processing}>
                                        Cancel
                                    </Button>
                                </DialogClose>
                                <Button variant="destructive" onClick={handleDeleteOffer} disabled={processing}>
                                    {processing ? "Deleting..." : "Delete Offer"}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>
        </div>
    )
}
