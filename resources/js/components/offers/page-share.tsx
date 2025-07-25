import { useEditor } from '@/contexts/offer/editor-context';
import { router } from "@inertiajs/react";
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { PublishStatusCard } from "./publish-status-card";
import { Copy, Fullscreen, Maximize, MessageSquare, PanelLeftClose, QrCode } from "lucide-react";
import { ExternalLink } from "lucide-react";
import { ToggleGroupItem } from "../ui/toggle-group";
import { ToggleGroup } from "../ui/toggle-group";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { QRCodeSVG } from "qrcode.react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { toast } from 'sonner';

const embedTypes = [
  { id: 'standard', icon: <Maximize className="size-6 text-white" />, name: 'Standard', description: 'Hosted link that opens in a new tab' },
  { id: 'popup', icon: <MessageSquare className="size-6 text-white" />, name: 'Popup', description: 'Opens in a popup window' },
  { id: 'fullscreen', icon: <Fullscreen className="size-6 text-white" />, name: 'Full Screen', description: 'Takes over the entire screen' },
  { id: 'slider', icon: <PanelLeftClose className="size-6 text-white" />, name: 'Slider', description: 'Slides in from the side' },
];


export function PageShare() {
  const { offer, setViewMode } = useEditor();
  const [showQrCode, setShowQrCode] = useState(false);
  const [showEmbedInfo, setShowEmbedInfo] = useState(false);
  const [selectedEmbedType, setSelectedEmbedType] = useState();

  const offerUrl = offer.public_url;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('URL copied to clipboard');
  };

  const getEmbedCode = (type: string) => {
      switch (type) {
          case 'standard':
              return `<a href="${offerUrl}" target="_blank">Open Offer</a>`;
          case 'popup':
              return `<button data-numi-offer="${offer.id}" data-numi-embed-type="popup">Open Offer</button>
<script src="${window.location.origin}/js/v1.js"></script>`;
          case 'fullscreen':
              return `<div data-numi-offer="${offer.id}" data-numi-embed-type="fullscreen">Open Offer</div>
<script src="${window.location.origin}/js/v1.js"></script>`;
          case 'slider':
              return `<button data-numi-offer="${offer.id}" data-numi-embed-type="slider">Open Offer</button>
<script src="${window.location.origin}/js/v1.js"></script>`;
          default:
              return '';
      }
  };

  const isPublished = offer.status === 'published';
  const hasTestIntegration = offer.test_checkout_url && offer.test_checkout_url.length > 0;

  return (
    <div className="max-w-2xl mx-auto space-y-8 py-12">
      <Card>
          <CardContent className="space-y-2">
              <CardTitle>Experience link</CardTitle>
              <CardDescription>
                <div className="flex flex-row gap-2">
                    <Input
                        readOnly
                        value={offerUrl}
                        className="text-muted-foreground"
                    />
                    <div className="flex gap-2">
                      {isPublished && (
                        <>
                          <Button
                              variant="ghost"
                              size="sm"
                              className='border-input border-1 h-full'
                              onClick={() => window.open(offerUrl, '_blank')}
                          >
                              <ExternalLink className="size-4" />
                          </Button>
                          <Button
                              variant="ghost"
                              size="sm"
                              className='border-input border-1 h-full'
                              onClick={() => setShowQrCode(true)}
                          >
                              <QrCode className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                        <Button
                            variant="default"
                            size="sm"
                            className='border-input border-1 h-full text-sm'
                            onClick={() => copyToClipboard(offerUrl)}
                        >
                            <Copy className="h-4 w-4" />
                            Copy
                        </Button>
                    </div>
                </div>
              </CardDescription>
          </CardContent>
          <CardContent className="space-y-2">
              <CardTitle>Embed your experience</CardTitle>
              <CardDescription>
                Choose how to embed this offer on your website.<br/>
                You can preview different sharing methods in <span className="text-teal-700 cursor-pointer" onClick={() => setViewMode('preview')}>preview</span>
                </CardDescription>
          </CardContent>
          <CardContent className="space-y-2">
              <ToggleGroup
                  type="single"
                  value={selectedEmbedType}
                  onValueChange={(value) => {
                      if (value) {
                          setSelectedEmbedType(value);
                      }
                      setShowEmbedInfo(true);
                  }}
                  className="grid grid-cols-4 gap-2"
              >
                  {embedTypes.map((type) => (
                      <ToggleGroupItem
                          key={type.id}
                          value={type.id}
                          className="flex flex-col justify-center items-center p-4 data-[state=on]:bg-primary/5 gap-2 border-input border-1 h-full rounded-md cursor-pointer"
                      >
                        <div className="p-1 bg-primary rounded-md">
                        {type.icon}
                        </div>
                        <div className="flex flex-col gap-0.5 items-center">
                          <div className="font-semibold">{type.name}</div>
                          <div className="text-xs text-muted-foreground">{type.description}</div>
                        </div>
                      </ToggleGroupItem>
                  ))}
              </ToggleGroup>
          </CardContent>
      </Card>

      {hasTestIntegration && (
        <Card>
          <CardHeader>
            <CardTitle>Test Checkout</CardTitle>
            <CardDescription>Test your offer with Stripe test mode (no real charges)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Input
                readOnly
                value={offer.test_checkout_url}
                className="pr-24"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(offer.test_checkout_url)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => window.open(offer.test_checkout_url, '_blank')}
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="text-sm text-orange-600 bg-orange-50 p-3 rounded-md">
              <strong>Note:</strong> This is a test checkout that uses Stripe test mode. No real payments will be processed.
            </div>
          </CardContent>
        </Card>
      )}


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
                  <div className="flex flex-row gap-2 justify-between">
                    <Button
                      variant="outline"
                      onClick={() => setViewMode('preview')}
                      className="w-fit"
                    >
                      Preview
                    </Button>
                    <Button
                      variant="default"
                        onClick={() => copyToClipboard(getEmbedCode(selectedEmbedType))}
                        className="w-fit"
                    >
                      Copy Code
                    </Button>
                  </div>
              </div>
          </DialogContent>
      </Dialog>
    </div>
  )
}
