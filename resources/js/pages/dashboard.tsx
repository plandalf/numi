import { PlaceholderPattern } from '@/components/ui/placeholder-pattern';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TemplateSelectorModal } from '@/components/templates/template-selector-modal';
import { useState } from 'react';
import { Template } from '@/types/template';
import { Offer } from '@/types/offer';
import { Separator } from '@/components/ui/separator';

interface Props {
    offers: Offer[];
    globalTemplates: Template[];
    organizationTemplates: Template[];
    categories: string[];
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
];

export default function Dashboard({ offers, globalTemplates, organizationTemplates, categories }: Props) {
    const [isSelectorOpen, setIsSelectorOpen] = useState(false);

    const templates = [...organizationTemplates, ...globalTemplates];

    const createNewOffer = () => {
        router.post(route('offers.store'), {});
    };

    const handleCreateOffer = () => {
        if (templates.length === 0) {
            // If no templates available, create offer directly
            createNewOffer();
        } else {
            // If templates available, show template selector
            setIsSelectorOpen(true);
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
          <div className="flex h-full flex-1 flex-col rounded-xl p-8">

            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white">
                  Offers
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Manage your checkout experiences here
                </p>
              </div>
              <div className="flex justify-end">
                <Button
                  onClick={handleCreateOffer}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create New Offer
                </Button>
              </div>
            </header>

            <br/>

              <div className="grid auto-rows-min gap-4 md:grid-cols-3">
                {offers.length > 0 ? (
                  offers.map((offer) => (
                    <Card
                      key={offer.id}
                      className="cursor-pointer"
                      onClick={() => router.get(route('offers.edit', offer.id))}
                    >
                      <CardHeader>
                        <CardTitle>{offer.name || 'Untitled Offer'}</CardTitle>
                        <CardDescription>
                          Created {new Date(offer.created_at).toLocaleDateString()}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        {offer.screenshot && (
                          <img src={offer.screenshot.url} alt="" />
                        )}
                        {!offer.screenshot && (
                          <PlaceholderPattern
                            className="h-32 w-full stroke-neutral-900/20 dark:stroke-neutral-100/20" />
                        )}
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div
                    className="col-span-3 flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed p-8 text-center">
                    <p className="text-muted-foreground">No offers yet. Create your first offer to get started!</p>
                  </div>
                )}
              </div>
          </div>

          {/* Template Selector Modal */}
          <TemplateSelectorModal
            open={isSelectorOpen}
            onOpenChange={setIsSelectorOpen}
            templates={templates}
            categories={categories}
            onCreateNew={createNewOffer}
          />
        </AppLayout>
);
}
