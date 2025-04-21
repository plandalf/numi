import { router } from "@inertiajs/react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { formatMoney } from "@/lib/utils";

interface Price {
    id: string;
    product: string;
    active: boolean;
    currency: string;
    unit_amount: number;
    recurring?: {
        interval: string;
        interval_count: number;
    };
    lookup_key?: string;
    metadata?: Record<string, any>;
}

interface PricesTableProps {
    prices: {
        data: Price[];
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

export default function PricesTable({ prices, filters }: PricesTableProps) {
    const handlePerPageChange = (value: string) => {
        const params = {
            per_page: parseInt(value)
        };
        router.get(
            route('integrations.show', { integration: window.location.pathname.split('/').pop() }),
            params,
            { preserveState: true, preserveScroll: true }
        );
    };

    const handleNextPage = () => {
        if (prices.data.length > 0) {
            const params = {
                ...filters,
                starting_after: prices.data[prices.data.length - 1].id,
            };
            delete params.ending_before;

            router.get(
                route('integrations.show', { integration: window.location.pathname.split('/').pop() }),
                params,
                { preserveState: true, preserveScroll: true }
            );
        }
    };

    const handlePreviousPage = () => {
        if (prices.data.length > 0) {
            const params = {
                ...filters,
                ending_before: prices.data[0].id,
            };
            delete params.starting_after;

            router.get(
                route('integrations.show', { integration: window.location.pathname.split('/').pop() }),
                params,
                { preserveState: true, preserveScroll: true }
            );
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                    <span className="text-sm text-muted-foreground">Show</span>
                    <Select
                        value={filters.per_page.toString()}
                        onValueChange={handlePerPageChange}
                    >
                        <SelectTrigger className="w-[70px]">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="10">10</SelectItem>
                            <SelectItem value="25">25</SelectItem>
                            <SelectItem value="50">50</SelectItem>
                        </SelectContent>
                    </Select>
                    <span className="text-sm text-muted-foreground">entries</span>
                </div>
                <div className="flex items-center space-x-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handlePreviousPage}
                        disabled={prices.data.length === 0}
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleNextPage}
                        disabled={!prices.has_more}
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {prices.data.length > 0 ? (
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Product</TableHead>
                                <TableHead>Amount</TableHead>
                                <TableHead>Interval</TableHead>
                                <TableHead>Lookup Key</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Metadata</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {prices.data.map((price) => (
                                <TableRow key={price.id}>
                                    <TableCell className="font-medium">{price.product}</TableCell>
                                    <TableCell>{formatMoney(price.unit_amount, price.currency)}</TableCell>
                                    <TableCell>
                                        {price.recurring
                                            ? `${price.recurring.interval_count} ${price.recurring.interval}${price.recurring.interval_count > 1 ? 's' : ''}`
                                            : 'One-time'}
                                    </TableCell>
                                    <TableCell>{price.lookup_key || '-'}</TableCell>
                                    <TableCell>
                                        <span
                                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                                price.active
                                                    ? 'bg-green-100 text-green-800'
                                                    : 'bg-gray-100 text-gray-800'
                                            }`}
                                        >
                                            {price.active ? 'Active' : 'Inactive'}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        {price.metadata ? (
                                            <pre className="text-xs">
                                                {JSON.stringify(price.metadata, null, 2)}
                                            </pre>
                                        ) : (
                                            '-'
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            ) : (
                <div className="text-center py-4 text-muted-foreground">
                    No prices found
                </div>
            )}
        </div>
    );
}
