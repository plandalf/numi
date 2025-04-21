import { Head } from "@inertiajs/react";
import AppLayout from "@/layouts/app-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ProductsTable from "@/components/integrations/ProductsTable";
import PricesTable from "@/components/integrations/PricesTable";
import { Integration } from "@/types/integration";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";

interface Props {
    integration: Integration;
    products: {
        data: any[];
        has_more: boolean;
        total_count: number;
    };
    prices: {
        data: any[];
        has_more: boolean;
        total_count: number;
    };
    filters: {
        per_page: number;
        starting_after?: string;
        ending_before?: string;
        search?: string;
    };
}

export default function Show({ integration, products, prices, filters }: Props) {
    const [activeTab, setActiveTab] = useState("products");

    return (
        <AppLayout>
            <Head title={`Integration: ${integration.name}`} />

            <div className="container mx-auto py-10 px-4 sm:px-6 lg:px-8">
                <Card>
                    <CardHeader>
                        <CardTitle>{integration.name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <h3 className="text-sm font-medium text-muted-foreground">Type</h3>
                                    <p className="mt-1">{integration.type}</p>
                                </div>
                                <div>
                                    <h3 className="text-sm font-medium text-muted-foreground">Status</h3>
                                    <p className="mt-1">
                                        <span
                                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                                integration.current_state === 'active'
                                                    ? "bg-green-100 text-green-800"
                                                    : "bg-gray-100 text-gray-800"
                                            }`}
                                        >
                                            {integration.current_state === 'active' ? "Active" : "Inactive"}
                                        </span>
                                    </p>
                                </div>
                            </div>

                            <Tabs defaultValue="products" value={activeTab} onValueChange={setActiveTab}>
                                <TabsList className="grid w-full grid-cols-2">
                                    <TabsTrigger value="products">Products</TabsTrigger>
                                    <TabsTrigger value="prices">Prices</TabsTrigger>
                                </TabsList>
                                <TabsContent value="products">
                                    <ProductsTable products={products} filters={filters} />
                                </TabsContent>
                                <TabsContent value="prices">
                                    <PricesTable prices={prices} filters={filters} />
                                </TabsContent>
                            </Tabs>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
