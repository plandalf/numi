import { type PageType } from '@/types/offer';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ArrowRightToLine, FileText, CheckSquare, CreditCard } from 'lucide-react';

interface PageTypeDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSelect: (type: PageType) => void;
}

export const PAGE_TYPES: { type: PageType; label: string; icon: React.ReactNode; description: string }[] = [
    {
        type: 'entry',
        label: 'Entry Page',
        icon: <ArrowRightToLine className="w-6 h-6" />,
        description: 'The first page users see when entering your offer'
    },
    {
        type: 'page',
        label: 'Content Page',
        icon: <FileText className="w-6 h-6" />,
        description: 'A regular page in your offer flow'
    },
    {
        type: 'payment',
        label: 'Payment Page',
        icon: <CreditCard className="w-6 h-6" />,
        description: 'The payment page in your offer flow'
    },
    {
        type: 'ending',
        label: 'Ending Page',
        icon: <CheckSquare className="w-6 h-6" />,
        description: 'The final page in a flow branch'
    }
];

export default function PageTypeDialog({ open, onOpenChange, onSelect }: PageTypeDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Select Page Type</DialogTitle>
                    <DialogDescription>
                        Choose the type of page you want to create
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4">
                    {PAGE_TYPES.map(({ type, label, icon, description }) => (
                        <Button
                            key={type}
                            variant="outline"
                            className="flex items-start gap-4 h-auto p-4 justify-start"
                            onClick={() => {
                                onSelect(type);
                                onOpenChange(false);
                            }}
                        >
                            <div className="mt-1 p-2 rounded-md bg-primary/10">
                                {icon}
                            </div>
                            <div className="text-left">
                                <div className="font-medium">{label}</div>
                                <div className="text-sm text-muted-foreground">
                                    {description}
                                </div>
                            </div>
                        </Button>
                    ))}
                </div>
            </DialogContent>
        </Dialog>
    );
} 