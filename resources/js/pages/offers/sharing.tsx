import AppOfferLayout from '@/layouts/app/app-offer-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { useState } from 'react';
import { Copy, ExternalLink, QrCode } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

interface Offer {
    id: number;
    name: string;
    status: 'draft' | 'published';
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

const embedTypes = [
    { id: 'standard', name: 'Standard', description: 'Hosted link that opens in a new tab' },
    { id: 'popup', name: 'Popup', description: 'Opens in a popup window' },
    { id: 'fullscreen', name: 'Full Screen', description: 'Takes over the entire screen' },
    { id: 'slider', name: 'Slider', description: 'Slides in from the side' },
];

export default function Sharing({ offer }: Props) {
    const [showQrCode, setShowQrCode] = useState(false);
    const [showEmbedInfo, setShowEmbedInfo] = useState(false);
    const [selectedEmbedType, setSelectedEmbedType] = useState('standard');

    const offerUrl = `${window.location.origin}/o/${offer.id}`;

    const handlePublish = () => {
        router.post(`/offers/${offer.id}/publish`);
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        // You might want to add a toast notification here
    };

    const getEmbedCode = (type: string) => {
        switch (type) {
            case 'standard':
                return `<a href="${offerUrl}" target="_blank">Open Offer</a>`;
            case 'popup':
                return `<script>
  function openOfferPopup() {
    window.open('${offerUrl}', 'offer', 'width=800,height=600');
  }
</script>
<button onclick="openOfferPopup()">Open Offer</button>`;
            case 'fullscreen':
                return `<script src="${window.location.origin}/embed.js"></script>
<button data-numi-offer="${offer.id}" data-type="fullscreen">Open Offer</button>`;
            case 'slider':
                return `<script src="${window.location.origin}/embed.js"></script>
<button data-numi-offer="${offer.id}" data-type="slider">Open Offer</button>`;
            default:
                return '';
        }
    };

    return (
        <AppOfferLayout offer={offer}>
            <Head title={`${offer.name || 'Untitled Offer'} - Sharing`} />
            <div className="max-w-4xl mx-auto space-y-8 p-6">
                <div className="flex justify-between items-center">
                    <h1 className="text-2xl font-semibold">Sharing for {offer.name || 'Untitled Offer'}</h1>
                    {offer.status === 'draft' && (
                        <Button onClick={handlePublish}>
                            Publish Offer
                        </Button>
                    )}
                </div>

                {offer.status === 'published' && (
                    <>
                        <Card>
                            <CardHeader>
                                <CardTitle>Offer Link</CardTitle>
                                <CardDescription>Share this link with your customers</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="relative">
                                    <Input
                                        readOnly
                                        value={offerUrl}
                                        className="pr-24"
                                    />
                                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-2">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => copyToClipboard(offerUrl)}
                                        >
                                            <Copy className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => window.open(offerUrl, '_blank')}
                                        >
                                            <ExternalLink className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setShowQrCode(true)}
                                        >
                                            <QrCode className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Embed Options</CardTitle>
                                <CardDescription>Choose how to embed this offer on your website</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ToggleGroup
                                    type="single"
                                    value={selectedEmbedType}
                                    onValueChange={(value) => {
                                        if (value) {
                                            setSelectedEmbedType(value);
                                            setShowEmbedInfo(true);
                                        }
                                    }}
                                    className="grid grid-cols-2 gap-4"
                                >
                                    {embedTypes.map((type) => (
                                        <ToggleGroupItem
                                            key={type.id}
                                            value={type.id}
                                            className="flex flex-col items-start p-4 data-[state=on]:bg-primary/5"
                                        >
                                            <div className="font-semibold">{type.name}</div>
                                            <div className="text-sm text-muted-foreground">{type.description}</div>
                                        </ToggleGroupItem>
                                    ))}
                                </ToggleGroup>
                            </CardContent>
                        </Card>
                    </>
                )}
            </div>

            <Dialog open={showQrCode} onOpenChange={setShowQrCode}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>QR Code</DialogTitle>
                    </DialogHeader>
                    <div className="flex justify-center p-6">
                        <QRCodeSVG value={offerUrl} size={256} />
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={showEmbedInfo} onOpenChange={setShowEmbedInfo}>
                <DialogContent className="sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>
                            {embedTypes.find(t => t.id === selectedEmbedType)?.name} Integration
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="p-4 bg-muted rounded-lg">
                            <pre className="whitespace-pre-wrap text-sm">
                                {getEmbedCode(selectedEmbedType)}
                            </pre>
                        </div>
                        <Button
                            onClick={() => copyToClipboard(getEmbedCode(selectedEmbedType))}
                            className="w-full"
                        >
                            Copy Code
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </AppOfferLayout>
    );
} 