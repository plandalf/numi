import { PlaceholderPattern } from '@/components/ui/placeholder-pattern';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Copy, CopyPlus, ExternalLink, Plus } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TemplateSelectorModal } from '@/components/templates/template-selector-modal';
import { useState } from 'react';
import { Template } from '@/types/template';
import { Offer } from '@/types/offer';
import { TutorialCard } from '@/components/onboarding/TutorialCard';
import { Separator } from '@/components/ui/separator';
import { Kebab } from '@/components/ui/kebab';
import { toast } from 'sonner';

interface Props {
    offers: Offer[];
    globalTemplates: Template[];
    organizationTemplates: Template[];
    categories: string[];
    showOffersTutorial: boolean;
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
];

export default function Dashboard({ offers, globalTemplates, organizationTemplates, categories, showOffersTutorial }: Props) {
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

    const tutorialActions = [
        {
            label: 'Create Offer',
            onClick: handleCreateOffer,
            icon: Plus
        },
        {
            label: 'Documentation',
            onClick: () => window.open('https://www.plandalf.dev/docs/offers', '_blank'),
            variant: 'outline' as const,
            icon: ExternalLink
        }
    ];

    const onCopyOfferLinkClick = (offer: Offer) => {
      navigator.clipboard.writeText(offer.public_url);
      toast.success('Offer link copied to clipboard');
    };

    const onDuplicateOfferClick = (offer: Offer) => {
      router.put(route('offers.duplicate', offer.id), {}, {
        onSuccess: () => {
          toast.success('Offer duplicated');
        }
      });
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

            {/* Onboarding Tutorial */}
            <TutorialCard
                title="Getting Started with Offers"
                description="Offers are <b>customizable checkout pages</b> that help convert visitors into customers. Use templates, add your branding, and track performance to optimize conversions."
                // videoUrl="https://www.youtube.com/embed/dQw4w9WgXcQ"
                // videoTitle="How to Create Your First Offer"
                // videoDuration="Quick tutorial (3 minutes)"
                actions={tutorialActions}
                onboardingKey="offers_tutorial"
                show={showOffersTutorial}
                backgroundColor="bg-orange-50"
                borderColor="border-orange-200"
                textColor="text-amber-700 dark:text-amber-300"
                accentColor="bg-orange-600"
                accentHoverColor="hover:bg-orange-700"
            />

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

              <div className="grid auto-rows-min gap-4 md:grid-cols-3">
                {offers.length > 0 ? (
                  offers.map((offer) => (
                    <Card
                      key={offer.id}
                      className="cursor-pointer !bg-[#d1dafb1a] !hover:bg-[#d1dafb40] hover:scale-101 transition-all duration-200 active:scale-100"
                      onClick={() => router.get(route('offers.edit', offer.id))}
                    >
                      <CardHeader className="flex flex-row justify-between items-center">
                        <div className="flex flex-col items-start">
                          <CardTitle>{offer.name || 'Untitled Offer'}</CardTitle>
                          <CardDescription>
                            Created {new Date(offer.created_at).toLocaleDateString()}
                          </CardDescription>
                        </div>
                        <Kebab items={[{
                          label: (
                            <div className="flex flex-row gap-2 items-center">
                              <ExternalLink className="h-4 w-4" />
                              View
                            </div>
                          ),
                          onClick: (e: React.MouseEvent<HTMLButtonElement>) => {
                            e.stopPropagation();
                            window.open(offer.public_url, '_blank', 'noopener,noreferrer');
                          }
                        }, {
                          label: (
                            <div className="flex flex-row gap-2 items-center">
                              <Copy className="h-4 w-4" />
                              Copy offer link
                            </div>
                          ),
                          onClick: (e: React.MouseEvent<HTMLButtonElement>) => {
                            e.stopPropagation();
                            onCopyOfferLinkClick(offer)
                          }
                        },  {
                          label: (
                            <div className="flex flex-row gap-2 items-center">
                              <CopyPlus className="h-4 w-4" />
                              Duplicate
                            </div>
                          ),
                          onClick: (e: React.MouseEvent<HTMLButtonElement>) => {
                            e.stopPropagation();
                            onDuplicateOfferClick(offer);
                          }
                        }]} />
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
