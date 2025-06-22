import { PlaceholderPattern } from '@/components/ui/placeholder-pattern';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { ExternalLink, Plus, X } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TemplateSelectorModal } from '@/components/templates/template-selector-modal';
import { useState } from 'react';
import { Template } from '@/types/template';
import { Offer } from '@/types/offer';

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
    const [showOnboarding, setShowOnboarding] = useState(true);

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
          <div className="flex flex-1 flex-col rounded-xl p-8">

            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
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
                  variant="default"
                  onClick={handleCreateOffer}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create New Offer
                </Button>
              </div>
            </header>

            {/* Onboarding Block */}
            {showOnboarding && (
              <div className="mb-8">
                <Card className="!bg-orange-50 border-orange-200 relative">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-2 h-8 w-8 p-0 bg-orange-600 text-white border-none hover:bg-orange-700"
                      onClick={() => setShowOnboarding(false)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  
                  <CardContent>
                  <CardTitle className="pb-4">
                        <h1 className="text-xl">Getting Started with Offers</h1>
                      </CardTitle>
                    <div className="grid md:grid-cols-5 gap-6">
                      
                      {/* Video Section */}
                      <div className="md:col-span-2 space-y-3">
                        <div className="relative aspect-video rounded-md bg-white dark:bg-gray-900 border-2 border-amber-200 dark:border-amber-800 overflow-hidden shadow-sm">
                          <iframe
                            className="absolute inset-0 w-full h-full"
                            src="https://www.youtube.com/embed/dQw4w9WgXcQ"
                            title="How to Create Your First Offer"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          />
                        </div>
                        <p className="text-sm text-amber-700 dark:text-amber-300 text-center font-medium">
                          Quick tutorial (3 minutes)
                        </p>
                      </div>

                      {/* Info Section */}
                      <div className="md:col-span-3 space-y-5 flex items-center">
                        <div className="flex flex-col gap-4 pb-8">
                          <p className="leading-normal text-lg ">
                            Offers are <b>customizable checkout pages</b> that help convert visitors into customers. 
                            Use templates, add your branding, and track performance to optimize conversions.
                          </p>
                        <div className="flex gap-3">
                          <Button onClick={handleCreateOffer}>
                            <Plus className="mr-2 h-4 w-4" />
                            Create Offer
                          </Button>
                          <Button variant="outline" asChild>
                            <a href="https://www.plandalf.dev/docs/offers" target="_blank">Documentation <ExternalLink className="ml-2 h-4 w-4" /></a>
                          </Button>
                        </div>
                        </div>

                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            <div className="grid auto-rows-min gap-4 md:grid-cols-3">
              {offers.length > 0 ? (
                offers.map((offer) => (
                  <Card
                    key={offer.id}
                    className="cursor-pointer !bg-[#d1dafb1a] !hover:bg-[#d1dafb40] hover:scale-101 transition-all duration-200 active:scale-100"
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
