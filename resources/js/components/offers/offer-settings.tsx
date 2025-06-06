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
import { ImageIcon, Info, InfoIcon, TrashIcon } from "lucide-react";
import { useState } from "react";
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { ImageUpload } from '@/components/ui/image-upload';
import type { Theme } from '@/types/theme';
import type { Offer } from '@/types/offer';
import { useEditor } from '@/contexts/offer/editor-context';
import { Separator } from "../ui/separator";
import { StyleEditor, StyleItem } from "../editor/style-editor";
import { Style } from "@/contexts/Numi";
import { getThemeColors } from "./page-theme";
import { Switch } from "../ui/switch";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";
import { PageProps } from '@inertiajs/core';
import { HostedPage } from "@/types";

interface ImageUploadMedia {
  id: number;
  url: string;
}

interface Props extends PageProps {
  offer: Offer;
  organizationThemes: Theme[];
  globalThemes: Theme[];
}

interface FormData extends Pick<
  Offer, 
  'name' 
  | 'description' 
  | 'product_image_id' 
  | 'status' 
  | 'theme_id' 
  | 'checkout_success_url' 
  | 'checkout_cancel_url' 
  | 'is_hosted'
>{
  hosted_page: Pick<HostedPage, 'logo_image_id' | 'background_image_id' | 'style'>;
}

export default function OfferSettings() {
  const { offer, organizationThemes, globalThemes } = usePage<Props>().props;
  const { setTheme, theme } = useEditor();

  const themes = [...globalThemes, ...organizationThemes];
  
  const initialProductImageId = offer.product_image_id ?? null;
  const initialProductImageUrl = offer.product_image?.url ?? null;
  const [productImagePreview, setProductImagePreview] = useState<string | null>(initialProductImageUrl);

  const initialLogoImageId = offer.hosted_page?.logo_image_id ?? null;
  const initialLogoImageUrl = offer.hosted_page?.logo_image?.url ?? null;
  const [logoImagePreview, setLogoImagePreview] = useState<string | null>(initialLogoImageUrl);

  const initialBackgroundImageId = offer.hosted_page?.background_image_id ?? null;
  const initialBackgroundImageUrl = offer.hosted_page?.background_image?.url ?? null;
  const [backgroundImagePreview, setBackgroundImagePreview] = useState<string | null>(initialBackgroundImageUrl);

  const form = useForm<FormData>({
    name: offer.name || '',
    description: offer.description || '',
    product_image_id: initialProductImageId,
    status: offer.status || 'draft',
    theme_id: offer.theme?.id?.toString() || '',
    checkout_success_url: offer.checkout_success_url ?? '',
    checkout_cancel_url: offer.checkout_cancel_url ?? '',
    is_hosted: offer.is_hosted ?? false,
    hosted_page: {
      logo_image_id: initialLogoImageId,
      background_image_id: initialBackgroundImageId,
      style: offer.hosted_page?.style ?? {},
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    form.put(route('offers.update', offer.id));
  };

  const handleThemeChange = (value: string) => {
    form.setData('theme_id', value);
    const selectedTheme = themes.find(t => t.id.toString() === value);
    if (selectedTheme) {
      setTheme(selectedTheme);
    }
  };

  const handleStyleChange = (key: string, value: string | boolean) => {
    console.log({key, value});

    form.setData('hosted_page', {
      ...form.data.hosted_page,
      style: {
        ...form.data.hosted_page.style,
        [key]: value
      }
    });
  };

  const handleStyleDelete = (key: string) => {
    form.setData('hosted_page', {
      ...form.data.hosted_page,
      style: {
        ...form.data.hosted_page.style,
        [key]: undefined
      }
    });
  };

  const handleLogoImageChange = (media: ImageUploadMedia | null) => {
    form.setData('hosted_page', {
      ...form.data.hosted_page,
      logo_image_id: media?.id ?? null,
    });
    setLogoImagePreview(media?.url ?? null);
  };

  const handleBackgroundImageChange = (media: ImageUploadMedia | null) => {
    form.setData('hosted_page', {
      ...form.data.hosted_page,
      background_image_id: media?.id ?? null,
    });
    setBackgroundImagePreview(media?.url ?? null);
  };

  const themeColors = getThemeColors(theme);


  const styleItems: StyleItem[] = [
    Style.dimensions('maxHeight', 'Maximum height', {
      config: {
        hideWidth: true,
        maxHeight: 1000,
      }
    }, { height: '764px'}),
    Style.dimensions('logoDimension', 'Logo Dimension', {
      config: {
        maxHeight: 500,
      }
    }, {height: '60px', width: '60px'}),
    Style.dimensions('logoSpacing', 'Logo Spacing', {
      config: {
        hideWidth: true,
        maxHeight: 500,
      }
    }, {height: '30px'}),
    Style.backgroundColor('backgroundColor', 'Background Color', {}, ''),
    Style.shadow('shadow', 'Shadow', {}, ''),
    Style.border('border', 'Border', {}, { width: '0px', style: 'solid' }),
    Style.borderColor('borderColor', 'Border Color', {}, ''),
    Style.borderRadius('borderRadius', 'Border Radius', {}, '12px'),
  ].map(style => ({
    name: style.type,
    label: style.label,
    value: form.data.hosted_page?.style?.[style.type],
    defaultValue: style.defaultValue,
    inspector: style.inspector as StyleItem['inspector'],
    options: style.options,
    config: style?.config ?? {},
  }));

  return (
    <form onSubmit={handleSubmit} className="offer-settings flex flex-col h-full p-4 w-full gap-3 overflow-y-hidden">
      {/* General Section */}
      <div className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold">General</h2>
        <div className="flex flex-col gap-2">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            value={form.data.name}
            onChange={e => form.setData('name', e.target.value)}
            placeholder="Offer name"
            aria-invalid={!!form.errors.name}
          />
          {form.errors.name && <p className="text-destructive text-sm">{form.errors.name}</p>}
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={form.data.description}
            onChange={e => form.setData('description', e.target.value)}
            placeholder="Describe this offer"
            aria-invalid={!!form.errors.description}
          />
          {form.errors.description && <p className="text-destructive text-sm">{form.errors.description}</p>}
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="product_image_id">Product Image</Label>
          <ImageUpload
            value={form.data.product_image_id}
            preview={productImagePreview}
            onChange={media => {
              if (media) {
                form.setData('product_image_id', media.id);
                setProductImagePreview(media.url);
              } else {
                form.setData('product_image_id', null);
                setProductImagePreview(null);
              }
            }}
          />
          {form.errors.product_image_id && <p className="text-destructive text-sm">{form.errors.product_image_id}</p>}
        </div>
      </div>
      <Separator className="!my-2"/>



      {/* Checkout URLs */}
      <div className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold">Checkout URLs</h2>
        <div className="flex flex-col gap-2">
          <Label htmlFor="checkout_success_url">Checkout Success URL</Label>
          <Input
            id="checkout_success_url"
            value={form.data.checkout_success_url}
            onChange={e => form.setData('checkout_success_url', e.target.value)}
            placeholder="https://yourdomain.com/success"
            aria-invalid={!!form.errors.checkout_success_url}
            className="w-full bg-white"
          />
          {form.errors.checkout_success_url && <p className="text-destructive text-sm">{form.errors.checkout_success_url}</p>}
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="checkout_cancel_url">Checkout Cancel URL</Label>
          <Input
            id="checkout_cancel_url"
            value={form.data.checkout_cancel_url}
            onChange={e => form.setData('checkout_cancel_url', e.target.value)}
            placeholder="https://yourdomain.com/cancel"
            aria-invalid={!!form.errors.checkout_cancel_url}
            className="w-full bg-white"
          />
          {form.errors.checkout_cancel_url && <p className="text-destructive text-sm">{form.errors.checkout_cancel_url}</p>}
        </div>
      </div>


      {/* Sharing Options */}
      <Separator className="!my-2"/>
      <div className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold">Sharing Options</h2>
        <div className="flex flex-row items-center gap-4">
          <Label className="flex flex-row items-center gap-2">
            Hosted Page 
            <TooltipProvider delayDuration={1500}>
              <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="size-4 cursor-help text-gray-500 hover:text-gray-700 hover:scale-110 transition-all duration-300 ease-in-out" />
                  </TooltipTrigger>
                  <TooltipContent
                    side="top"
                    align="center"
                    className="max-w-[200px]"
                  >
                    This converts your offer into a hosted page.
                  </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </Label>
          <Switch
            className="cursor-pointer"
            id="is_hosted"
            checked={form.data.is_hosted}
            onCheckedChange={value => form.setData('is_hosted', value)}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="status">Branding</Label>
          <div className="flex flex-col gap-3 h-full rounded-md p-2 border bg-gray-100/50">
            <span className="text-sm">These options only apply to hosted pages</span>
            <div className="flex flex-col gap-2">
              <ImageUpload
                logo={<ImageIcon className="h-6 w-6 transition-transform group-hover:scale-110 cursor-pointer" />}
                label="Upload a logo"
                buttonClassName="bg-white text-gray-500 justify-start !px-4"
                previewType="text"
                value={form.data.hosted_page.logo_image_id}
                preview={logoImagePreview}
                onChange={handleLogoImageChange}
              />
            </div>
            <div className="flex flex-col gap-2">
              <ImageUpload
                logo={<ImageIcon className="h-6 w-6 transition-transform group-hover:scale-110 cursor-pointer" />}
                label="Upload a background image"
                buttonClassName="bg-white text-gray-500 justify-start !px-4"
                previewType="text"
                value={form.data.hosted_page.background_image_id}
                preview={backgroundImagePreview}
                onChange={handleBackgroundImageChange}
              />
            </div>
          </div>
        </div>

        {/* Style */}
        <div className="flex flex-col gap-2">
          <Label htmlFor="status">Style</Label>
          <StyleEditor
            items={styleItems}
            onChange={handleStyleChange}
            onDelete={handleStyleDelete}
            themeColors={themeColors}
          />
        </div>
      </div>


      {/* Other Settings */}
      <Separator className="!my-2"/>
      <div className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold">Others</h2>
        <div className="flex flex-col gap-2">
          <Label htmlFor="status">Status</Label>
          <Select
            value={form.data.status}
            onValueChange={value => form.setData('status', value as 'draft' | 'published' | 'archived')}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>
          {form.errors.status && <p className="text-destructive text-sm">{form.errors.status}</p>}
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="theme_id">Theme</Label>
          <Select
            value={form.data.theme_id}
            onValueChange={handleThemeChange}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select theme">
                {themes.find(t => t.id.toString() === form.data.theme_id)?.name || 'Select theme'}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {themes?.map((theme: Theme) => (
                <SelectItem key={theme.id} value={theme.id.toString()}>
                  {theme.name}
                  <span style={{backgroundClip: theme.primary_color}} className="m-2 rounded-full"></span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {form.errors.theme_id && <p className="text-destructive text-sm">{form.errors.theme_id}</p>}
        </div>
        <Button type="submit" disabled={form.processing} className="w-full">
          {form.processing ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>


      {/* Save and Delete */}
      <Separator className="!my-2"/>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <h3 className="text-md font-medium text-destructive mb-2">Danger Zone</h3>
          <div className="flex items-center justify-between rounded-lg border border-transparent p-4 hover:border-destructive/50 transition-colors">
            <div>
              <h4 className="font-medium">Delete Offer</h4>
              <p className="text-sm text-muted-foreground">
                Permanently delete this offer and all of its associated data. This action cannot be undone.
              </p>
            </div>
            <DeleteOfferButton offer={offer} />
          </div>
        </div>
      </div>
    </form>
  );
}

function DeleteOfferButton({ offer }: { offer: Offer }) {
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
    <>
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
    </>
  );
}
