import { AppContent } from '@/components/app-content';
import { AppShell } from '@/components/app-shell';

import { Button } from '@/components/ui/button';
import { Link, router } from '@inertiajs/react';
import { ArrowLeft, CircleCheck, Eye, Flame, Folder, HomeIcon, LayoutGrid, Menu, Pencil, Redo, Search, Share, Undo, ChevronDown, X } from 'lucide-react';

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import { Separator } from '@/components/ui/separator';
import { useIsMobile } from '@/hooks/use-mobile';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useEditor } from '@/pages/offers/Edit';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { PublishStatusCard } from '@/components/offers/publish-status-card';

interface Offer {
    id: number;
    name: string;
    created_at: string;
    updated_at: string;
    status: string;
}

interface Props {
    children: React.ReactNode;
    offer: Offer;
}

interface AppHeaderProps {
    offer: Offer;
    isNameDialogOpen: boolean;
    setIsNameDialogOpen: (open: boolean) => void;
}

function OfferHeader({ offer, isNameDialogOpen, setIsNameDialogOpen }: AppHeaderProps) {
    const [name, setName] = useState(offer.name);
    const [status, setStatus] = useState(offer.status);
    const isMobile = useIsMobile();
    const { viewMode, setViewMode } = useEditor();
    
    const [showPublishDialog, setShowPublishDialog] = useState(false);

    // Preview mode state
    const [previewType, setPreviewType] = useState<'desktop' | 'mobile'>('desktop');
    const [previewDevice, setPreviewDevice] = useState<string>('iphone_14');

    // Device lists
    const mobileDevices = [
      { label: 'iPhone 14', value: 'iphone_14', width: 390, height: 844 },
      { label: 'iPhone SE', value: 'iphone_se', width: 375, height: 667 },
      { label: 'iPhone 13 Pro Max', value: 'iphone_13_pro_max', width: 428, height: 926 },
      { label: 'Samsung S23', value: 'samsung_s23', width: 412, height: 915 },
      { label: 'Google Pixel 7', value: 'pixel_7', width: 412, height: 915 },
      { label: 'OnePlus 11', value: 'oneplus_11', width: 412, height: 919 },
      { label: 'iPhone XR', value: 'iphone_xr', width: 414, height: 896 },
      { label: 'iPhone 12 Mini', value: 'iphone_12_mini', width: 360, height: 780 },
      { label: 'Samsung Note 20', value: 'note_20', width: 412, height: 915 },
      { label: 'iPhone 8 Plus', value: 'iphone_8_plus', width: 414, height: 736 },
    ];
    const desktopDevices = [
      { label: '1024 x 768', value: '1024x768', width: 1024, height: 768 },
      { label: '1280 x 800', value: '1280x800', width: 1280, height: 800 },
      { label: '1366 x 768', value: '1366x768', width: 1366, height: 768 },
      { label: '1440 x 900', value: '1440x900', width: 1440, height: 900 },
      { label: '1536 x 864', value: '1536x864', width: 1536, height: 864 },
      { label: '1600 x 900', value: '1600x900', width: 1600, height: 900 },
      { label: '1680 x 1050', value: '1680x1050', width: 1680, height: 1050 },
      { label: '1920 x 1080', value: '1920x1080', width: 1920, height: 1080 },
      { label: '2048 x 1152', value: '2048x1152', width: 2048, height: 1152 },
      { label: '2560 x 1440', value: '2560x1440', width: 2560, height: 1440 },
    ];
    const currentDevice = previewType === 'mobile'
      ? mobileDevices.find(d => d.value === previewDevice)
      : desktopDevices.find(d => d.value === previewDevice);
    const deviceOptions = previewType === 'mobile' ? mobileDevices : desktopDevices;

    const handleNameSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        router.put(route('offers.update', offer.id), {
            name: name,
        }, {
            preserveScroll: true,
            preserveState: true,
            onSuccess: () => setIsNameDialogOpen(false),
        });
    };

    const isPreviewMode = viewMode === 'preview';
    const isShareMode = viewMode === 'share';
    const isEditorMode = viewMode === 'editor';

    const offerUrl = `${window.location.origin}/o/${offer.id}`;

    const handlePublish = () => {
        setStatus('live');
        setShowPublishDialog(true);
    };

    return (
        <div className="border-sidebar-border/80 border-b bg-blue-950 flex justify-between h-14 items-center p-3 gap-x-4">
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
                        variant="link"
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
                        "bg-green-500": offer.status === 'live',
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
                                onClick={() => setPreviewType('desktop')}
                            >
                                Desktop
                            </Button>
                            <Button
                                variant='ghost'
                                size="sm"
                                className={cn('rounded px-4 py-2 text-sm font-medium w-24', previewType === 'mobile' ? 'bg-white text-black shadow' : 'text-gray-900')}
                                onClick={() => setPreviewType('mobile')}
                            >
                                Mobile
                            </Button>
                        </div>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="text-[#A3B6D6] px-2 py-1 flex items-center justify-between gap-1 text-sm font-medium w-40">
                                    {currentDevice ? (
                                        <span>{currentDevice.label}</span>
                                    ) : (
                                        <span>Select device</span>
                                    )}
                                    <ChevronDown className="w-4 h-4 ml-1" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                {deviceOptions.map(device => (
                                    <DropdownMenuItem
                                        key={device.value}
                                        onClick={() => setPreviewDevice(device.value)}
                                        className={cn(previewDevice === device.value && 'font-bold text-sm')}
                                    >
                                        <span>{device.label}</span>
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
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
                <Button 
                    variant="outline" 
                    tooltip="Preview the design of the Offer."
                    onClick={() => setViewMode('preview')}
                    className={cn(
                        "transition-colors",
                        isPreviewMode ? "bg-primary text-primary-foreground" : ""
                    )}
                >
                    {isMobile && <Eye className="size-4" />}
                    {!isMobile && 'Preview'}
                </Button>
                <DropdownMenu open={showPublishDialog} onOpenChange={setShowPublishDialog}>
                  <DropdownMenuTrigger asChild>
                    <Button
                      className="flex flex-row gap-x-2"
                      variant="outline-transparent"
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
                            onClick={() => navigator.clipboard.writeText(`htthttps://numi-main-tf0jzg.laravel.com/offer/${offer.id}`)}
                          >
                            Copy
                          </Button>
                        </div>
                      </div>
                      <Button className="w-full mt-2" variant="outline">
                        More sharing options
                      </Button>
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button
                    variant="outline-transparent"
                    tooltip="Share to other platforms"
                    onClick={() => setViewMode('share')}
                >
                    {isMobile && <Share className="size-4" />}
                    {!isMobile && 'Share'}
                </Button>
                <Button className="flex flex-row gap-x-2" variant="outline-transparent" tooltip="Save the current changes">
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
                            />
                        </div>
                        <div className="flex justify-end">
                            <Button type="submit">
                                Save
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
        <AppShell>
            <OfferHeader 
                offer={offer} 
                isNameDialogOpen={isNameDialogOpen}
                setIsNameDialogOpen={setIsNameDialogOpen}
            />
            <AppContent>
                {children}
            </AppContent>
        </AppShell>
    );
}
