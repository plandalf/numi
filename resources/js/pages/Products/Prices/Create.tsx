import { Head } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import PriceForm from '@/components/Products/Prices/PriceForm';
import { type Product } from '@/types/product';

interface Props {
    product: Product;
}

/** @deprecated */
export default function Create({ product }: Props) {
    return (
        <>
            <Head title={`Create Price for ${product.name}`} />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <Card>
                        <CardHeader>
                            <CardTitle>Create New Price for {product.name}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <PriceForm productId={product.id} mode="create" />
                        </CardContent>
                    </Card>
                </div>
            </div>
        </>
    );
}