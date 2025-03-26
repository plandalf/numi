import AppOfferLayout from '@/layouts/app/app-offer-layout';
import { type BreadcrumbItem } from '@/types';
import { type OfferView, type Page, type PageType } from '@/types/offer';
import { Head, useForm } from '@inertiajs/react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useEffect, useState, useRef } from 'react';
import { cn } from '@/lib/utils';
import { MoreVertical, ArrowRightToLine, FileText, CheckSquare, Share2 } from 'lucide-react';
import PagePreview from '@/components/offers/page-preview';
import PageFlowEditor from '@/components/offers/page-flow-editor';
import { ReactFlowProvider } from '@xyflow/react';

interface Offer {
    id: number;
    name: string;
    view: OfferView;
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

const PAGE_TYPE_ICONS: Record<PageType, React.ReactNode> = {
    entry: <ArrowRightToLine className="w-4 h-4" />,
    page: <FileText className="w-4 h-4" />,
    ending: <CheckSquare className="w-4 h-4" />
};

export default function Edit({ offer, showNameDialog }: Props) {
    const [isNameDialogOpen, setIsNameDialogOpen] = useState(false);
    const [selectedPage, setSelectedPage] = useState<string>(offer.view.first_page);
    const [editingPageName, setEditingPageName] = useState<string | null>(null);
    const [pageNameInput, setPageNameInput] = useState("");
    const [showPageLogic, setShowPageLogic] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const [isRenamingFromDropdown, setIsRenamingFromDropdown] = useState(false);
    
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

    const handlePageNameClick = (pageId: string, currentName: string) => {
        if (pageId === selectedPage) {
            setEditingPageName(pageId);
            setPageNameInput(currentName);
            setTimeout(() => {
                inputRef.current?.focus();
                inputRef.current?.select();
            }, 0);
        } else {
            setSelectedPage(pageId);
        }
    };

    const handlePageNameSave = (pageId: string) => {
        if (isRenamingFromDropdown) {
            setIsRenamingFromDropdown(false);
            return;
        }
        // TODO: Implement API call to save page name
        console.log('Saving page name:', pageId, pageNameInput);
        setEditingPageName(null);
    };

    const handlePageAction = (pageId: string, action: 'rename' | 'duplicate' | 'delete') => {
        switch (action) {
            case 'rename':
                setIsRenamingFromDropdown(true);
                handlePageNameClick(pageId, offer.view.pages[pageId].name);
                break;
            case 'duplicate':
                // TODO: Implement page duplication
                console.log('Duplicate page:', pageId);
                break;
            case 'delete':
                // TODO: Implement page deletion
                console.log('Delete page:', pageId);
                break;
        }
    };

    const currentPage = offer.view.pages[selectedPage];
    const nextPageId = currentPage.next_page.default_next_page;
    const nextPage = nextPageId ? offer.view.pages[nextPageId] : null;

    // Add this function to get pages in the correct order
    const getOrderedPages = (view: OfferView): [string, Page][] => {
        const orderedPages: [string, Page][] = [];
        let currentPageId: string | null = view.first_page;
        
        while (currentPageId && view.pages[currentPageId]) {
            const currentPage: Page = view.pages[currentPageId];
            orderedPages.push([currentPageId, currentPage]);
            currentPageId = currentPage.next_page?.default_next_page ?? null;
        }
        
        return orderedPages;
    };

    return (
        <AppOfferLayout offer={offer}>
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

            <div className="flex h-full flex-grow">
                {/* Sidebar - Fixed width, no shrink */}
                <div className="w-[300px] flex-none border-r border-border bg-card">
                    <div className="p-4 space-y-4">
                        <h2 className="text-lg font-semibold">Edit Options</h2>
                        <div className="space-y-2">
                            <button
                                onClick={() => setIsNameDialogOpen(true)}
                                className="w-full rounded-md bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground hover:bg-secondary/90"
                            >
                                Edit Name
                            </button>
                            {/* Add more sidebar options here */}
                        </div>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 flex flex-col min-w-0 relative">
                    {/* Preview Area */}
                    <div className="absolute inset-0 bottom-[68px] overflow-auto">
                        <div className="h-full">
                            <PagePreview page={currentPage} />
                        </div>
                    </div>

                    {/* Toolbar */}
                    <div className="absolute bottom-0 left-0 right-0 border-t border-border bg-muted">
                        <div className="p-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 overflow-x-auto">
                                    {getOrderedPages(offer.view).map(([pageId, page]) => (
                                        <div
                                            key={pageId}
                                            className={cn(
                                                "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap",
                                                selectedPage === pageId
                                                    ? "bg-primary text-primary-foreground"
                                                    : "bg-secondary text-secondary-foreground hover:bg-secondary/90"
                                            )}
                                        >
                                            {selectedPage !== pageId && (
                                                <span className="text-muted-foreground">
                                                    {PAGE_TYPE_ICONS[page.type]}
                                                </span>
                                            )}
                                            
                                            {editingPageName === pageId ? (
                                                <Input
                                                    ref={inputRef}
                                                    value={pageNameInput}
                                                    onChange={(e) => setPageNameInput(e.target.value)}
                                                    onBlur={() => handlePageNameSave(pageId)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') {
                                                            setIsRenamingFromDropdown(false);
                                                            handlePageNameSave(pageId);
                                                        } else if (e.key === 'Escape') {
                                                            setIsRenamingFromDropdown(false);
                                                            setEditingPageName(null);
                                                        }
                                                    }}
                                                    className={cn(
                                                        "h-6 px-1 py-0 w-[120px]",
                                                        selectedPage === pageId
                                                            ? "bg-primary text-primary-foreground"
                                                            : "bg-secondary text-secondary-foreground"
                                                    )}
                                                />
                                            ) : (
                                                <button
                                                    onClick={() => handlePageNameClick(pageId, page.name)}
                                                    className="focus:outline-none"
                                                >
                                                    {page.name}
                                                </button>
                                            )}

                                            {selectedPage === pageId && (
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <button className="focus:outline-none">
                                                            <MoreVertical className="w-4 h-4" />
                                                        </button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onClick={() => handlePageAction(pageId, 'rename')}>
                                                            Rename
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handlePageAction(pageId, 'duplicate')}>
                                                            Duplicate
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem 
                                                            onClick={() => handlePageAction(pageId, 'delete')}
                                                            className="text-destructive"
                                                        >
                                                            Delete
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm text-muted-foreground">Layout:</span>
                                        <span className="text-sm font-medium">{currentPage.layout.sm}</span>
                                    </div>

                                    {nextPage && (
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm text-muted-foreground">Next:</span>
                                            <span className="text-sm font-medium">{nextPage.name}</span>
                                        </div>
                                    )}

                                    <div className="flex items-center gap-2">
                                        <span className="text-sm text-muted-foreground">Provides:</span>
                                        <div className="flex gap-1">
                                            {currentPage.provides.map(provide => (
                                                <span 
                                                    key={provide}
                                                    className="bg-secondary px-2 py-0.5 rounded text-xs"
                                                >
                                                    {provide}
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => setShowPageLogic(true)}
                                        className="flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-secondary/90 bg-secondary rounded-md"
                                    >
                                        <Share2 className="w-4 h-4" />
                                        Page Logic
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Page Logic Dialog */}
            <Dialog open={showPageLogic} onOpenChange={setShowPageLogic}>
                <DialogContent className="w-screen h-screen flex flex-col p-0 m-0 rounded-none sm:max-w-none">
                    <div className="border-b border-border p-6">
                        <DialogHeader>
                            <DialogTitle>Page Logic</DialogTitle>
                            <DialogDescription>
                                Configure the flow between pages and define branch conditions
                            </DialogDescription>
                        </DialogHeader>
                    </div>
                    <div className="flex-1">
                        <ReactFlowProvider>
                            <PageFlowEditor 
                                view={offer.view} 
                                onUpdateFlow={(changes) => {
                                    // TODO: Implement update logic
                                    console.log('Update flow:', changes);
                                }} 
                            />
                        </ReactFlowProvider>
                    </div>
                </DialogContent>
            </Dialog>
        </AppOfferLayout>
    );
}
