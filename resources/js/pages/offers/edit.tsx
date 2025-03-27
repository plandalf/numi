// @ts-nocheck
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
import { useEffect, useState, useRef, useCallback, use } from 'react';
import { cn } from '@/lib/utils';
import { MoreVertical, ArrowRightToLine, FileText, CheckSquare, Share2, Plus } from 'lucide-react';
import PagePreview from '@/components/offers/page-preview';
import PageFlowEditor from '@/components/offers/page-flow-editor';
import { ReactFlowProvider } from '@xyflow/react';
import update from "immutability-helper";
import { DndProvider, useDrag } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { BLOCK_TYPES, DRAG_TYPES } from '@/components/offers/page-preview';
import { GripVertical, Type, SquareStack, Image, CreditCard, List } from 'lucide-react';

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

type FormData = {
    name: string;
    view: OfferView;
}

const PAGE_TYPE_ICONS: Record<PageType, React.ReactNode> = {
    entry: <ArrowRightToLine className="w-4 h-4" />,
    page: <FileText className="w-4 h-4" />,
    ending: <CheckSquare className="w-4 h-4" />
};

// Add icons to block types
const BLOCK_ICONS = {
  'text': <Type className="w-4 h-4" />,
  'heading': <Type className="w-4 h-4 font-bold" />,
  'button': <SquareStack className="w-4 h-4" />,
  'image': <Image className="w-4 h-4" />,
  'payment': <CreditCard className="w-4 h-4" />,
  'list': <List className="w-4 h-4" />
};

// Block item component for the Editor sidebar
interface BlockItemProps {
  blockType: typeof BLOCK_TYPES[keyof typeof BLOCK_TYPES];
}

const BlockItem = ({ blockType }: BlockItemProps) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: DRAG_TYPES.NEW_BLOCK,
    item: { blockType },
    collect: monitor => ({
      isDragging: !!monitor.isDragging()
    })
  }));

  return (
    <div
      // @ts-ignore - React DnD type mismatch with refs
      ref={(node) => drag(node)}
      className={cn(
        "flex items-center gap-2 p-2 rounded cursor-move border border-border hover:bg-muted transition-all",
        isDragging && "opacity-50"
      )}
    >
      <GripVertical className="w-4 h-4 text-muted-foreground" />
      <span className="text-muted-foreground">{BLOCK_ICONS[blockType.id as keyof typeof BLOCK_ICONS]}</span>
      <span className="text-sm">{blockType.name}</span>
    </div>
  );
};

export default function Edit({ offer, showNameDialog }: Props) {
    // console.log({ offer });
    const [isNameDialogOpen, setIsNameDialogOpen] = useState(false);
    const [selectedPage, setSelectedPage] = useState<string>(offer.view?.first_page);
    const [editingPageName, setEditingPageName] = useState<string | null>(null);
    const [pageNameInput, setPageNameInput] = useState("");
    const [showPageLogic, setShowPageLogic] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const [isRenamingFromDropdown, setIsRenamingFromDropdown] = useState(false);
    const [showAddPageDialog, setShowAddPageDialog] = useState(false);
    const [isReady, setIsReady] = useState(false);
    const { data, setData, put, processing, errors, setDefaults } = useForm({
        name: offer.name,
        view: offer.view
    });

    useEffect(() => {
        if (showNameDialog) {
            setIsNameDialogOpen(true);
        }
    }, [showNameDialog]);

    useEffect(() => {
        if (!isReady) {
            setIsReady(true);
            return;
        }

        put(route('offers.update', offer.id), {
            preserveScroll: true,
            onSuccess: (a) => {
                // Update view from the response
                // setData('view', offer.view);
                console.log("SUCCESS!", a.props.offer); 
                setDefaults();
            }
        });
    }, [data]);

    // Handle saving changes
    const handleSave = useCallback(() => {
        
    }, [put, offer.id, offer.view, setData]);

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

        // Update the page name in the view
        const updatedPages = {
            ...data.view.pages,
            [pageId]: {
                ...data.view.pages[pageId],
                name: pageNameInput
            }
        };

        // Update the form data
        setData(update(data, { view: { pages: { $set: updatedPages } }}));

        // Use setTimeout to ensure state update is completed
        handleSave();
        setEditingPageName(null);
    };

    const handlePageAction = (pageId: string, action: 'rename' | 'duplicate' | 'delete') => {
        switch (action) {
            case 'rename':
                setIsRenamingFromDropdown(true);
                handlePageNameClick(pageId, data.view.pages[pageId].name);
                break;
            case 'duplicate':
                const sourcePage = data.view.pages[pageId];
                const newId = `page_${Math.random().toString(36).substr(2, 9)}`;
                const newPage = {
                    ...sourcePage,
                    id: newId,
                    name: `${sourcePage.name} (Copy)`
                };

                const updatedPages = {
                    ...data.view.pages,
                    [newId]: newPage
                };
                setData(update(data, { view: { pages: { $set: updatedPages } }}));

                // Use setTimeout to ensure state update is completed
                setTimeout(() => {
                    handleSave();
                }, 0);
                break;
            case 'delete':
                const pagesToUpdate = { ...data.view.pages };
                delete pagesToUpdate[pageId];

                Object.keys(pagesToUpdate).forEach(pageKey => {
                    const page = pagesToUpdate[pageKey];
                    if (page.next_page.default_next_page === pageId) {
                        pagesToUpdate[pageKey] = {
                            ...page,
                            next_page: {
                                ...page.next_page,
                                default_next_page: null
                            }
                        };
                    }
                    if (page.next_page.branches) {
                        pagesToUpdate[pageKey] = {
                            ...page,
                            next_page: {
                                ...page.next_page,
                                branches: page.next_page.branches.map((branch: { next_page: string | null }) =>
                                    branch.next_page === pageId
                                        ? { ...branch, next_page: null }
                                        : branch
                                )
                            }
                        };
                    }
                });

                // setData('view', {
                //     ...data.view,
                //     pages: pagesToUpdate
                // });
                setData(update(data, { view: { pages: { $set: pagesToUpdate } }}));

                // If the deleted page was the selected page, select a new page
                if (selectedPage === pageId) {
                    // Choose the first page, or any other page if available
                    const remainingPageIds = Object.keys(pagesToUpdate);
                    if (remainingPageIds.length > 0) {
                        // Try to select the first page in the flow if it exists
                        const firstPageId = data.view.first_page;
                        const newSelectedPageId = (firstPageId && pagesToUpdate[firstPageId]) 
                            ? firstPageId 
                            : remainingPageIds[0];
                        
                        setSelectedPage(newSelectedPageId);
                    }
                }

                // Use setTimeout to ensure state update is completed
                setTimeout(() => {
                    handleSave();
                }, 0);
                break;
        }
    };

    // Handle block updates
    const handlePageUpdate = (updatedPage: Page) => {
        if (!isReady) return;
        
        // @ts-ignore - Ignore TypeScript errors for now to focus on functionality
        const updatedView = {
            ...data.view,
            pages: {
                // @ts-ignore
                ...data.view.pages,
                [selectedPage]: updatedPage
            }
        };

        // @ts-ignore
        setData(update(data, { view: { $set: updatedView }}));
    };

    const currentPage = data.view?.pages[selectedPage];
    const nextPageId = currentPage?.next_page?.default_next_page;
    const nextPage = nextPageId ? data.view?.pages[nextPageId] : null;

    // Add this function to get pages in the correct order
    const getOrderedPages = (view: OfferView): [string, Page][] => {
        const orderedPages: [string, Page][] = [];
        const visitedPages = new Set<string>();
        
        // First, add pages in the main flow starting from first_page
        let currentPageId: string | null = view.first_page;
        while (currentPageId && view.pages[currentPageId] && !visitedPages.has(currentPageId)) {
            const currentPage: Page = view.pages[currentPageId];
            orderedPages.push([currentPageId, currentPage]);
            visitedPages.add(currentPageId);
            currentPageId = currentPage.next_page?.default_next_page ?? null;
        }

        // Then, add any remaining pages that aren't in the main flow
        Object.entries(view.pages).forEach(([pageId, page]) => {
            if (!visitedPages.has(pageId)) {
                orderedPages.push([pageId, page]);
                visitedPages.add(pageId);
            }
        });

        return orderedPages;
    };

    // Add this function to handle page creation
    const handleAddPage = (type: PageType) => {
        const id = `page_${Math.random().toString(36).substr(2, 9)}`;
        
        // Create the new page
        const newPage: Page = {
            id,
            name: type === 'entry' ? 'Entry Page' : type === 'ending' ? 'Ending Page' : 'New Page',
            type,
            position: { x: 0, y: 0 },
            view: {
                promo: { blocks: [] },
                title: { blocks: [] },
                action: { blocks: [] },
                content: { blocks: [] }
            },
            layout: { sm: 'split-checkout@v1' },
            provides: [],
            next_page: {
                branches: [],
                default_next_page: null
            }
        };

        // Create updated pages object
        const updatedPages = {
            ...data.view.pages,
            [id]: newPage
        };

        // If this is the first page, set it as the first page
        const updatedView = {
            ...data.view,
            pages: updatedPages,
            first_page: Object.keys(data.view.pages).length === 0 ? id : data.view.first_page
        };

        // Update the form data
        // setData('view', updatedView);
        setData(update(data, { view: { $set: updatedView }}));

        // Submit the update
        handleSave();

        setShowAddPageDialog(false);
    };

    if (!data.view) {
        return <div>Loading...</div>;
    }

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

            <DndProvider backend={HTML5Backend}>
                <div className="flex h-full flex-grow">
                    {/* Sidebar - Fixed width, no shrink */}
                    <div className="w-[300px] flex-none border-r border-border bg-card overflow-y-auto">
                        <div className="p-4 space-y-4">
                            <h2 className="text-lg font-semibold">Edit Options</h2>
                            <div className="space-y-2">
                                <button
                                    onClick={() => setIsNameDialogOpen(true)}
                                    className="w-full rounded-md bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground hover:bg-secondary/90"
                                >
                                    Edit Name
                                </button>
                            
                            </div>
                        </div>

                        {/* Available Block Types */}
                        <div className="p-4 border-t border-border">
                            <h3 className="text-md font-medium mb-3">Available Blocks</h3>
                            <p className="text-xs text-muted-foreground mb-4">Drag blocks to add them to your page</p>
                            
                            <div className="space-y-2">
                                {Object.values(BLOCK_TYPES).map((blockType) => (
                                    <BlockItem 
                                        key={blockType.id} 
                                        blockType={blockType}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Main Content Area */}
                    <div className="flex-1 flex flex-col min-w-0 relative">
                        {/* Preview Area - Make it fill the available space */}
                        <div className="absolute inset-0 bottom-[68px] overflow-hidden">
                            <div className="h-full">
                                <PagePreview 
                                    page={currentPage} 
                                    onUpdatePage={handlePageUpdate}
                                />
                            </div>
                        </div>

                        {/* Toolbar */}
                        <div className="absolute bottom-0 left-0 right-0 border-t border-border bg-muted">
                            <div className="p-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 overflow-x-auto">
                                        {getOrderedPages(data.view).map(([pageId, page]) => (
                                            <div
                                                key={pageId}
                                                className={cn(
                                                    "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap",
                                                    selectedPage === pageId
                                                        ? "bg-primary text-primary-foreground"
                                                        : "bg-secondary text-secondary-foreground hover:bg-secondary/90"
                                                )}
                                            >
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
                                                        className="focus:outline-none flex items-center gap-2"
                                                    >
                                                        <span className="text-muted-foreground">
                                                        {PAGE_TYPE_ICONS[page.type]}
                                                    </span>

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
                                        <button
                                            onClick={() => setShowAddPageDialog(true)}
                                            className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium bg-secondary text-secondary-foreground hover:bg-secondary/90"
                                        >
                                            <Plus className="w-4 h-4" />
                                            Add Page
                                        </button>
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

                                        <div className="flex items-center gap-2 hidden">
                                            <span className="text-sm text-muted-foreground">Provides:</span>
                                            <div className="flex gap-1">
                                                {currentPage.provides.map((provide: string) => (
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
            </DndProvider>

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
                                view={data.view}
                                onUpdateFlow={(changes) => {
                                    console.log('Flow editor changes:', changes);
                                    setData(update(data, { view: { $set: changes }}));

                                    // Submit the update to backend
                                    console.log('Submitting update to backend...');
                                    handleSave();
                                }}
                            />
                        </ReactFlowProvider>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Add Page Dialog */}
            <Dialog open={showAddPageDialog} onOpenChange={setShowAddPageDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add New Page</DialogTitle>
                        <DialogDescription>
                            Choose the type of page you want to add
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid grid-cols-3 gap-4 py-4">
                        <button
                            onClick={() => handleAddPage('entry')}
                            className="flex flex-col items-center gap-2 p-4 rounded-lg border border-border hover:bg-secondary/50"
                        >
                            <ArrowRightToLine className="w-6 h-6" />
                            <span className="text-sm font-medium">Entry Page</span>
                        </button>
                        <button
                            onClick={() => handleAddPage('page')}
                            className="flex flex-col items-center gap-2 p-4 rounded-lg border border-border hover:bg-secondary/50"
                        >
                            <FileText className="w-6 h-6" />
                            <span className="text-sm font-medium">Content Page</span>
                        </button>
                        <button
                            onClick={() => handleAddPage('ending')}
                            className="flex flex-col items-center gap-2 p-4 rounded-lg border border-border hover:bg-secondary/50"
                        >
                            <CheckSquare className="w-6 h-6" />
                            <span className="text-sm font-medium">Ending Page</span>
                        </button>
                    </div>
                </DialogContent>
            </Dialog>
        </AppOfferLayout>
    );
}
