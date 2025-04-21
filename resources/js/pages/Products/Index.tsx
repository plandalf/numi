import { Link, Head } from '@inertiajs/react';
// Correct layout import
import AppLayout from "@/layouts/app-layout";
// import { PageProps, PaginatedResponse, Product } from "@/types"; // Commented out potentially wrong path

// --- Placeholder Types (Replace with actual imports if available) ---
type User = { id: number; name: string; email: string; /* ... other user fields */ };
interface PageProps {
    auth: {
        user: User;
    };
    // Add other common page props like errors, flash messages, etc.
    errors?: Record<string, string>;
    flash?: { success?: string; error?: string };
}

interface Price { // Basic Price type
    id: number;
    amount: number;
    currency: string;
    // Add other price fields
}

interface PaginatedResponse<T> {
    data: T[];
    links: { url: string | null; label: string; active: boolean }[];
    // Add other pagination meta if needed (current_page, total, etc.)
}
// --- End Placeholder Types ---

import { Button } from '@/components/ui/button';
import {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
    CardContent,
    CardFooter
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus } from 'lucide-react';
import { useState } from 'react';
// Trying capitalized path based on linter error context
import ProductForm from '@/components/Products/ProductForm';
import { Integration } from '@/types/integration';
import { Product } from '@/types/product';

interface ProductsIndexProps extends PageProps {
    products: PaginatedResponse<Product>;
    integrations: Integration[];
}

export default function Index({ auth, products, integrations }: ProductsIndexProps) {
    const [isProductFormOpen, setIsProductFormOpen] = useState(false);

    return (
        // Remove user prop - likely handled by shared props
        <AppLayout>
            <Head title="Products" />

            <div className="container mx-auto py-10 px-4 sm:px-6 lg:px-8">
                <header className="mb-8 flex justify-between items-center">
                    <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
                        Products
                    </h1>
                    <Button onClick={() => setIsProductFormOpen(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Create Product
                    </Button>
                </header>

                {products.data.length === 0 ? (
                    <div className="text-center py-12">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">No products found</h3>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                            Get started by creating your first product.
                        </p>
                        <div className="mt-6">
                            <Button onClick={() => setIsProductFormOpen(true)}>
                                <Plus className="w-4 h-4 mr-2" />
                                Create Product
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {products.data.map((product: Product) => (
                            <Card key={product.id} className="flex flex-col">
                                <CardHeader>
                                    <CardTitle>{product.name}</CardTitle>
                                    <CardDescription>{product.lookup_key}</CardDescription>
                                </CardHeader>
                                <CardContent className="flex-grow">
                                    <div className="space-y-2">
                                        <p className="text-sm text-muted-foreground">
                                            {product.prices?.length || 0} active price(s)
                                        </p>
                                        {product.integration && (
                                            <div className="flex gap-2">
                                                <Badge variant="secondary">
                                                    {product.integration.name}
                                                </Badge>
                                                <Badge variant="outline">
                                                    {product.integration.type}
                                                </Badge>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                                <CardFooter>
                                    <Link
                                        href={route('products.show', product.id)}
                                        className="text-sm font-medium text-primary hover:underline"
                                    >
                                        View Details
                                    </Link>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                )}

                {/* Pagination Links */}
                {/* ... */}

                {/* Product Create/Edit Dialog */}
                <ProductForm
                    open={isProductFormOpen}
                    onOpenChange={setIsProductFormOpen}
                    integrations={integrations}
                />

            </div>
        </AppLayout>
    );
}