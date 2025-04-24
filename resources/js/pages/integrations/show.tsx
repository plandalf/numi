import { Head } from "@inertiajs/react";
import AppLayout from "@/layouts/app-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Integration } from "@/types/integration";
import { useState } from "react";

interface Props {
    integration: Integration;
}

export default function Show({ integration }: Props) {
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
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
