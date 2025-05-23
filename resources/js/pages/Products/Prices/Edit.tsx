import { Head } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import PriceForm from '@/components/Products/Prices/PriceForm';
import { type Product, type Price } from '@/types/product';

interface Props {
    product: Product;
    price: Price;
}

/**  @deprecated */
export default function Edit({ product, price }: Props) {
    return (
        <>
            <Head title={`Edit Price for ${product.name}`} />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <Card>
                        <CardHeader>
                            <CardTitle>Edit Price for {product.name}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <PriceForm productId={product.id} price={price} mode="edit" />
                        </CardContent>
                    </Card>
                </div>
            </div>
        </>
    );
}