import { Head } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ProductForm from '@/components/Products/ProductForm';
import { type Product } from '@/types/product';

interface Props {
    product: Product;
}

export default function Edit({ product }: Props) {
    return (
        <>
            <Head title={`Edit ${product.name}`} />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <Card>
                        <CardHeader>
                            <CardTitle>Edit Product</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ProductForm product={product} mode="edit" />
                        </CardContent>
                    </Card>
                </div>
            </div>
        </>
    );
}