import { Link, Head, router } from '@inertiajs/react';
import AppLayout from "@/layouts/app-layout";
import cx from "classnames";
import { pluralize, formatDate } from '@/lib/utils';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useDebounce } from '@/hooks/use-debounce';
import { useEffect, useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { TutorialCard } from '@/components/onboarding/TutorialCard';

type User = { id: number; name: string; email: string; /* ... other user fields */ };

interface PageProps {
  auth: {
    user: User;
  };
  // Add other common page props like errors, flash messages, etc.
  errors?: Record<string, string>;
  flash?: { success?: string; error?: string };
}

interface PaginatedResponse<T> {
  data: T[];
  links: { url: string | null; label: string; active: boolean }[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  // Add other pagination meta if needed
}
// --- End Placeholder Types ---

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, ExternalLink } from 'lucide-react';
// Trying capitalized path based on linter error context
import ProductForm from '@/components/Products/ProductForm';
import { Integration } from '@/types/integration';
import { Product, ProductStatus } from '@/types/product';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Pagination } from "@/components/pagination/Pagination";
import { Card } from '@/components/ui/card';
import AddNewProductDialog from '@/components/Products/AddNewProductDialog';
import AddExistingStripeProductDialog from '@/components/Products/AddExistingStripeProductDialog';
import { Separator } from '@/components/ui/separator';
import { Price } from '@/types/offer';
import PriceTable from '@/components/prices/PriceTable';
import { ProductTable } from '@/components/ProductTable';

interface ProductsIndexProps extends PageProps {
  products: PaginatedResponse<Product>;
  filters: {
    search: string;
    tab?: string;
  };
  integrations: Integration[];
  prices: PaginatedResponse<Price>;
  showProductsTutorial: boolean;
}

export default function Index({ auth, products, filters, integrations, prices, showProductsTutorial }: ProductsIndexProps) {
  const [isProductFormOpen, setIsProductFormOpen] = useState(false);
  const [isAddNewProductDialogOpen, setIsAddNewProductDialogOpen] = useState(false);
  const [isAddExistingStripeProductDialogOpen, setIsAddExistingStripeProductDialogOpen] = useState(false);
  const [integrationId, setIntegrationId] = useState<string>('');
  const [search, setSearch] = useState(filters.search || '');
  const [activeTab, setActiveTab] = useState(filters.tab || 'products');
  const debouncedSearch = useDebounce(search, 300);

  const hasIntegrations = integrations.length > 0;
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const integrationIdParam = urlParams.get('integration_id');
    const tabParam = urlParams.get('tab');

    if (integrationIdParam) {
      setIntegrationId(integrationIdParam);
      setIsAddExistingStripeProductDialogOpen(true);
    }

    if (tabParam) {
      setActiveTab(tabParam);
    }
  }, []);

  useEffect(() => {
    router.get(
      route('products.index'),
      { search: debouncedSearch, tab: activeTab },
      { preserveState: true, preserveScroll: true }
    );
  }, [debouncedSearch]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    router.get(
      route('products.index'),
      { search: debouncedSearch, tab: value },
      { preserveState: true, preserveScroll: true }
    );
  };

  const ConnectToStripeButton = () => {
    const handleClick = () => {
      if (hasIntegrations) {
        setIntegrationId('');
        setIsAddExistingStripeProductDialogOpen(true);
      }
    }
    return (
      <Button className="w-full bg-[#6772E5] hover:bg-[#6772E5]/80" onClick={handleClick}>
        <img src="/assets/icons/stripe.svg" alt="Stripe" className="w-4 h-4 mr-2" />
        {hasIntegrations ? 'Import an existing product' : 'Connect to Stripe'}
      </Button>
    )
  }

  return (
    <AppLayout>
      <Head title="Products" />

      <div className="container max-w-[100vw] mx-auto py-4 sm:py-8 px-4 sm:px-6 lg:px-8">
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white">
              Your products
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Manage your products and prices
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-initial">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                type="search"
                placeholder="Search products..."
                className="pl-9 w-full sm:w-[250px]"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Button onClick={() => setIsAddNewProductDialogOpen(true)} className="flex-none">
              <Plus className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Add a Product</span>
              <span className="sm:hidden">Add</span>
            </Button>
          </div>
        </header>

        {/* Products Tutorial */}
        <TutorialCard
          title="Getting Started with Products"
          description="Products are the foundation of your offers. Create digital or physical products, set pricing, and manage inventory. <b>Connect to Stripe</b> to import existing products or create new ones from scratch."
          actions={[
            {
              label: 'Create Product',
              onClick: () => setIsAddNewProductDialogOpen(true),
              icon: Plus
            },
            {
              label: 'Learn More',
              onClick: () => window.open('https://www.plandalf.dev/docs/products', '_blank'),
              variant: 'outline' as const,
              icon: ExternalLink
            }
          ]}
          onboardingKey="products_tutorial"
          show={showProductsTutorial}
          backgroundColor="bg-orange-50"
          borderColor="border-orange-200"
          textColor="text-amber-700 dark:text-amber-300"
          accentColor="bg-orange-600"
          accentHoverColor="hover:bg-orange-700"
        />

        {products.data.length === 0 ? (
          <div className="flex flex-col items-center gap-8 sm:gap-12 py-6 sm:py-8 justify-center bg-[#F7F9FF] rounded-md p-4">
            <div className="text-center">
              <h3 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white">You don't have any products yet</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Create or import a product to get started
              </p>
            </div>
            <div className="grid grid-cols-1 gap-8 w-full max-w-[1200px] px-4">
              <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] items-center gap-6">
                <Card className="flex flex-col p-4 w-full">
                  <div className="mb-4">
                    <p className="text-xl sm:text-2xl font-semibold">Create a new product</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Make a new product in Plandalf
                    </p>
                  </div>
                  <Button onClick={() => setIsProductFormOpen(true)} className="w-full sm:w-auto">
                    <Plus className="w-4 h-4 mr-2" />
                    Create a new Product
                  </Button>
                </Card>
                <div className="text-xl sm:text-2xl font-semibold text-center py-4">or</div>
                <Card className="flex flex-col p-4 w-full">
                  <div className="mb-4">
                    <p className="text-xl sm:text-2xl font-semibold">Import an existing product</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Use products from your Stripe account
                    </p>
                  </div>
                  {integrations.length ? (
                    <ConnectToStripeButton />
                  ) : (
                    <Link href="/integrations/stripe/authorizations" method="post" as="button" className="w-full">
                      <ConnectToStripeButton />
                    </Link>
                  )}
                </Card>
              </div>
            </div>
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="products">Products</TabsTrigger>
              <TabsTrigger value="prices">Prices</TabsTrigger>
            </TabsList>
            <TabsContent value="products">
              <ProductTable products={products} />
              <div className="mt-4 flex items-center justify-center sm:justify-start">
                <Pagination
                  page={products.current_page}
                  pageSize={products.per_page}
                  totalCount={products.total}
                  onPageChange={(page) => {
                    router.get(
                      route('products.index'),
                      { page, search: debouncedSearch, tab: activeTab },
                      { preserveState: true, preserveScroll: true }
                    );
                  }}
                />
              </div>
            </TabsContent>
            <TabsContent value="prices">
              <PriceTable prices={prices.data} />
              <div className="mt-4 flex items-center justify-center sm:justify-start">
                <Pagination
                  page={prices.current_page}
                  pageSize={prices.per_page}
                  totalCount={prices.total}
                  onPageChange={(page) => {
                    router.get(
                      route('products.index'),
                      { page, search: debouncedSearch, tab: activeTab },
                      { preserveState: true, preserveScroll: true }
                    );
                  }}
                />
              </div>
            </TabsContent>
          </Tabs>
        )}

        {/* Product Create/Edit Dialog */}
        <ProductForm
          open={isProductFormOpen}
          onOpenChange={setIsProductFormOpen}
        />

        <AddNewProductDialog
          open={isAddNewProductDialogOpen}
          onOpenChange={setIsAddNewProductDialogOpen}
          onCreateProductPlandalfClick={() => setIsProductFormOpen(true)}
          integrations={integrations}
          onCreateExistingProductClick={() => setIsAddExistingStripeProductDialogOpen(true)}
        />

        {isAddExistingStripeProductDialogOpen && (
          <AddExistingStripeProductDialog
            open={isAddExistingStripeProductDialogOpen}
            onOpenChange={setIsAddExistingStripeProductDialogOpen}
            integrationId={integrationId ? Number(integrationId) : undefined}
            integrations={integrations}
          />
        )}
      </div>
    </AppLayout>
  );
}
