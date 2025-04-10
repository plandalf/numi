import { Head } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ProductForm from '@/components/Products/ProductForm';

export default function Create() {
    return (
        <>
            <Head title="Create Product" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <Card>
                        <CardHeader>
                            <CardTitle>Create New Product</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ProductForm mode="create" />
                        </CardContent>
                    </Card>
                </div>
            </div>
        </>
    );
}
