import { AppContent } from '@/components/app-content';
import { ActiveEditors } from '@/components/offers/active-editors';

import { Button } from '@/components/ui/button';
import { Link, router } from '@inertiajs/react';
import {
  ArrowLeft,
  CircleCheck,
  Eye,
  Flame,
  Pencil,
  Share,
  ChevronDown,
  X,
  DollarSign,
  Loader2,
  ExternalLinkIcon
} from 'lucide-react';

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useEffect, useState } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useEditor } from '@/contexts/offer/editor-context';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { PublishStatusCard } from '@/components/offers/publish-status-card';
import { toast } from 'sonner';
import { Offer } from '@/types/offer';

interface Props {
    children: React.ReactNode;
    offer: Offer;
}

interface AppHeaderProps {
    offer: Offer;
    isNameDialogOpen: boolean;
    setIsNameDialogOpen: (open: boolean) => void;
}

export const PREVIEW_SIZES = {
    'desktop': {
        width: 1024,
        height: 764,
    },
    'mobile': {
        width: 430,
        height: 650,
    },
}

function OfferHeader({ offer, isNameDialogOpen, setIsNameDialogOpen }: AppHeaderProps) {
    const [status, setStatus] = useState(offer.status);
    const isMobile = useIsMobile();
    const { data, viewMode, setViewMode, setPreviewSize, handleSave, previewType, setPreviewType } = useEditor();

    const [name, setName] = useState(data.name);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [showPublishDialog, setShowPublishDialog] = useState(false);

    // Preview mode state
    const onPreviewSizeChange = (size: 'desktop' | 'mobile') => {
        setPreviewType(size);
        setPreviewSize(PREVIEW_SIZES[size]);
    }

    const handleNameSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        router.put(route('offers.update', offer.id), {
            name,
            view: JSON.stringify(data.view),
            theme: data.theme,
            screenshot: data.screenshot,
        }, {
            preserveScroll: true,
            preserveState: true,
            onSuccess: () => {
                toast.success('Offer updated successfully');
                setIsSubmitting(false);
                setIsNameDialogOpen(false);
            },
            onError: (error: Record<string, string>) => {
                setIsSubmitting(false);
                const errorMessages = Object.values(error).flat();
                toast.error(<>
                    <p>Failed to save offer</p>
                    <ul className='list-disc list-inside'>
                    {errorMessages.map((e: string) => (
                        <li key={e}>{e}</li>
                    ))}
                    </ul>
                </>);
            },
        });
    };

    const isPreviewMode = viewMode === 'preview';
    const isShareMode = viewMode === 'share';
    const isEditorMode = viewMode === 'editor';

    const offerUrl = offer.public_url;

    const handlePublish = () => {
        setStatus('published');
        setShowPublishDialog(true);
    };

    const handleCopyOfferClick = () => {
      navigator.clipboard.writeText(offerUrl);
      toast.success('Copied to clipboard');
    }

    return (
        <div className="border-sidebar-border/80 border-b bg-gray-900 flex justify-between h-14 items-center p-3 gap-x-4">
            {/* Left side */}
            <div className="flex gap-x-4 items-center min-w-0">
                <Link href="/dashboard" prefetch>
                    <Button variant="outline" size="icon" className="flex-shrink-0 group">
                        <ArrowLeft className="size-4 text-black group-hover:mr-1 transition-all" />
                    </Button>
                </Link>
                <div className="flex items-center space-x-2 min-w-0">
                    <span className="text-lg font-bold text-white truncate">
                        {offer.name || 'Untitled Offer'}
                    </span>
                    <Button
                        // variant="link"
                        variant="dark-outline"
                        size="icon"
                        onClick={() => setIsNameDialogOpen(true)}
                        className="text-sm font-medium text-white flex-shrink-0"
                        tooltip="Edit Name"
                    >
                        <Pencil className="size-4" />
                    </Button>
                </div>
                {!isMobile && (
                    <Badge variant="secondary" className={cn("capitalize flex-shrink-0", {
                        "bg-green-500": offer.status === 'published',
                        "bg-white": offer.status === 'draft',
                    })}>{offer.status}</Badge>
                )}
            </div>


            {/* Right side */}
            {isPreviewMode && (
                <>
                    <div className="flex items-center gap-4 px-2 py-1 rounded-lg">
                        <div className="flex bg-[#E9EBFB] rounded p-1">
                            <Button
                                variant='ghost'
                                size="sm"
                                className={cn('rounded px-4 py-2 text-sm font-medium w-24', previewType === 'desktop' && 'bg-white text-black shadow')}
                                onClick={() => onPreviewSizeChange('desktop')}
                            >
                                Desktop
                            </Button>
                            <Button
                                variant='ghost'
                                size="sm"
                                className={cn('rounded px-4 py-2 text-sm font-medium w-24', previewType === 'mobile' ? 'bg-white text-black shadow' : 'text-gray-900')}
                                onClick={() => onPreviewSizeChange('mobile')}
                            >
                                Mobile
                            </Button>
                        </div>
                    </div>
                    <div className="flex items-center space-x-3 h-full flex-shrink-0">
                        <Button
                            variant="outline"
                            tooltip="Exit the current preview mode"
                            onClick={() => {
                                setViewMode('editor');
                                setPreviewSize(PREVIEW_SIZES['desktop']);
                            }}
                            className={cn(
                                "transition-colors"
                            )}
                        >
                            <X className="size-4" />
                            Exit Preview
                        </Button>
                    </div>
                </>
            )}

            {isShareMode && (
                <div className="flex items-center space-x-3 h-full flex-shrink-0">
                    <Button
                        variant="outline"
                        tooltip="Exit the current preview mode"
                        onClick={() => setViewMode('editor')}
                        className={cn(
                            "transition-colors"
                        )}
                    >
                        <X className="size-4" />
                        Exit Sharing
                    </Button>
                </div>
            )}

            {isEditorMode && (
              <div className="flex items-center space-x-3 h-full flex-shrink-0">

                <ActiveEditors offerId={offer.id} />

                <Button
                    variant="outline"
                    size="sm"
                    tooltip="Preview the design of the Offer."
                    onClick={() => setViewMode('preview')}
                    className={cn(
                        "transition-colors",
                        isPreviewMode ? "bg-gray-900 text-gray-900" : ""
                    )}
                >
                    {isMobile && <Eye className="size-4" />}
                    {!isMobile && 'Preview'}
                </Button>
                <DropdownMenu open={showPublishDialog} onOpenChange={setShowPublishDialog}>
                  <DropdownMenuTrigger asChild>
                    <Button
                      className="flex flex-row gap-x-2"
                      variant="dark-outline"
                      size="sm"
                      tooltip="Publish the Offer"
                      onClick={handlePublish}
                    >
                      <Flame className="size-4" />
                      {!isMobile && 'Publish'}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="center" className="w-[400px] mb-10 p-0 rounded-xl shadow-lg border">
                    <div className="p-4 flex flex-col items-center">
                      <PublishStatusCard isPublished={true} />
                      <div className="w-full mt-2 mb-4">
                        <Label className="text-xs mb-1">Experience link</Label>
                        <div className="flex items-center gap-2">
                          <Input
                            className="flex-1 text-xs"
                            value={offerUrl}
                            readOnly
                          />
                          <Button
                            type="button"
                            size="sm"
                            className="px-3"
                            onClick={handleCopyOfferClick}
                          >
                            Copy
                          </Button>
                        </div>
                      </div>
                      <Button className="w-full mt-2" variant="outline" onClick={() => setViewMode('share')}>
                        More sharing options
                      </Button>
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>

                <Button
                  asChild
                  variant="dark-outline"
                  size="sm"
                  tooltip="Go to your checkout"
                >
                  <a href={route('offers.show', offer.id)} target="_blank">
                    <ExternalLinkIcon className="size-4" />
                    {!isMobile && 'Checkout'}
                  </a>
                </Button>

                <Button
                    // variant="outline-transparent"
                    variant="dark-outline"
                    tooltip="Share to other platforms"
                    size="sm"
                    onClick={() => setViewMode('share')}
                >
                    {isMobile && <Share className="size-4" />}
                    {!isMobile && 'Share'}
                </Button>
                <Button
                    className="flex flex-row gap-x-2"
                    // variant="outline-transparent"
                    variant="dark-outline"
                    size="sm"
                    tooltip="Save the current changes"
                    onClick={handleSave}
                >
                    <CircleCheck className="size-4" />
                    {!isMobile && 'Save'}
                </Button>
            </div>
            )}

            {/* Dialogs */}
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
                                value={name}
                                onChange={e => setName(e.target.value)}
                                placeholder="Enter offer name"
                                autoFocus
                                autoComplete="off"
                            />
                        </div>
                        <div className="flex justify-end">
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    'Save'
                                )}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}

export default function AppOfferLayout({ children, offer }: Props) {
    const [isNameDialogOpen, setIsNameDialogOpen] = useState(false);

    return (
        <div>
            <OfferHeader
                offer={offer}
                isNameDialogOpen={isNameDialogOpen}
                setIsNameDialogOpen={setIsNameDialogOpen}
            />
            <AppContent>
                {children}
            </AppContent>
        </div>
    );
}
