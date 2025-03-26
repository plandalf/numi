import { type PageType } from '@/types/offer';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ArrowRightToLine, FileText, CheckSquare } from 'lucide-react';

interface PageTypeDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSelect: (type: PageType) => void;
}

const PAGE_TYPES: { type: PageType; label: string; icon: React.ReactNode; description: string }[] = [
    {
        type: 'entry',
        label: 'Entry Page',
        icon: <ArrowRightToLine className="w-4 h-4" />,
        description: 'The first page users see when entering your offer'
    },
    {
        type: 'page',
        label: 'Standard Page',
        icon: <FileText className="w-4 h-4" />,
        description: 'A regular page in your offer flow'
    },
    {
        type: 'ending',
        label: 'Ending Page',
        icon: <CheckSquare className="w-4 h-4" />,
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