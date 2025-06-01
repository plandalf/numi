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
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { ImageUpload } from '@/components/ui/image-upload';
import type { Theme } from '@/types/theme';
import type { Offer as OfferBase } from '@/types/offer';
import { useEditor } from '@/contexts/offer/editor-context';

declare module '@/types/offer' {
  interface Offer {
    checkout_success_url?: string | null;
    checkout_cancel_url?: string | null;
  }
}

export default function OfferSettings() {
    const { offer } = usePage<EditProps>().props;

    return (
      <div className="offer-settings space-y-6 px-4">
        <OfferSettingsForm offer={offer}/>
      </div>
    )
}

function OfferSettingsForm({ offer }: { offer: OfferBase }) {
  const { organizationThemes } = usePage<{ organizationThemes: Theme[] }>().props;
  const { setTheme } = useEditor();
  
  const initialProductImageId = offer.product_image_id ?? null;
  const initialProductImageUrl = offer.product_image?.url ?? null;
  const [productImagePreview, setProductImagePreview] = useState<string | null>(initialProductImageUrl);
  const form = useForm({
    name: offer.name || '',
    description: offer.description || '',
    product_image_id: initialProductImageId,
    status: (offer.status as 'draft' | 'published' | 'archived') || 'draft',
    theme_id: offer.theme?.id?.toString() || '',
    checkout_success_url: offer.checkout_success_url ?? '',
    checkout_cancel_url: offer.checkout_cancel_url ?? '',
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    form.put(route('offers.update', offer.id));
  };

  const handleThemeChange = (value: string) => {
    form.setData('theme_id', value);
    const selectedTheme = organizationThemes.find(t => t.id.toString() === value);
    if (selectedTheme) {
      setTheme(selectedTheme);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-xl w-full">
      {/* General Section */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">General</h2>
        <div className="space-y-2">
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
        <div className="space-y-2">
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
        <div className="space-y-2">
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
      <div className="border-t pt-6 space-y-4">
        <h2 className="text-lg font-semibold">Checkout URLs</h2>
        <div className="space-y-2">
          <Label htmlFor="checkout_success_url">Checkout Success URL</Label>
          <Input
            id="checkout_success_url"
            value={form.data.checkout_success_url}
            onChange={e => form.setData('checkout_success_url', e.target.value)}
            placeholder="https://yourdomain.com/success"
            aria-invalid={!!form.errors.checkout_success_url}
          />
          {form.errors.checkout_success_url && <p className="text-destructive text-sm">{form.errors.checkout_success_url}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="checkout_cancel_url">Checkout Cancel URL</Label>
          <Input
            id="checkout_cancel_url"
            value={form.data.checkout_cancel_url}
            onChange={e => form.setData('checkout_cancel_url', e.target.value)}
            placeholder="https://yourdomain.com/cancel"
            aria-invalid={!!form.errors.checkout_cancel_url}
          />
          {form.errors.checkout_cancel_url && <p className="text-destructive text-sm">{form.errors.checkout_cancel_url}</p>}
        </div>
      </div>
      <div className="border-t pt-6 space-y-4">
        <h2 className="text-lg font-semibold">Settings</h2>
        <div className="space-y-2">
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
        <div className="space-y-2">
          <Label htmlFor="theme_id">Theme</Label>
          
          <Select
            value={form.data.theme_id}
            onValueChange={handleThemeChange}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select theme">
                {organizationThemes.find(t => t.id.toString() === form.data.theme_id)?.name || 'Select theme'}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {organizationThemes?.map((theme: Theme) => (
                <SelectItem key={theme.id} value={theme.id.toString()}>
                  {theme.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {form.errors.theme_id && <p className="text-destructive text-sm">{form.errors.theme_id}</p>}
        </div>
      </div>
      <div className="pt-6 flex flex-col gap-4">
        <Button type="submit" disabled={form.processing} className="w-full">
          {form.processing ? 'Saving...' : 'Save Settings'}
        </Button>
        {/* Danger Zone - Delete Offer */}
        <div className="border-t pt-6">
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

function DeleteOfferButton({ offer }: { offer: OfferBase }) {
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
