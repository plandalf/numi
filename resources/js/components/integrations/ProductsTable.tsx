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
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { useDebounce } from "@/hooks/use-debounce";

interface Product {
    id: string;
    name: string;
    description?: string;
    active?: boolean;
    metadata?: Record<string, any>;
}

interface ProductsTableProps {
    products: {
        data: Product[];
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

export default function ProductsTable({ products, filters }: ProductsTableProps) {
    const [searchQuery, setSearchQuery] = useState(filters.search || '');
    const debouncedSearchQuery = useDebounce(searchQuery, 500);

    useEffect(() => {
        // Only search if the query is at least 3 characters or if it's empty (to clear search)
        if ((debouncedSearchQuery.length >= 3 || debouncedSearchQuery.length === 0) && debouncedSearchQuery !== filters.search) {
            const params = {
                ...filters,
                search: debouncedSearchQuery || undefined
            };

            // Reset pagination when searching
            delete params.starting_after;
            delete params.ending_before;

            router.get(
                route('integrations.show', { integration: window.location.pathname.split('/').pop() }),
                params,
                { preserveState: true, preserveScroll: true }
            );
        }
    }, [debouncedSearchQuery]);

    const handlePerPageChange = (value: string) => {
        const params = {
            per_page: parseInt(value),
            search: filters.search
        };
        router.get(
            route('integrations.show', { integration: window.location.pathname.split('/').pop() }),
            params,
            { preserveState: true, preserveScroll: true }
        );
    };

    const handleNextPage = () => {
        if (products.data.length > 0) {
            const params = {
                ...filters,
                starting_after: products.data[products.data.length - 1].id,
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
        if (products.data.length > 0) {
            const params = {
                ...filters,
                ending_before: products.data[0].id,
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
                    <span className="text-sm text-muted-foreground">per page</span>
                </div>
                <div className="flex items-center space-x-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handlePreviousPage}
                        disabled={products.data.length === 0}
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleNextPage}
                        disabled={!products.has_more}
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search products (min. 3 characters)..."
                    className="pl-8"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            {products.data.length > 0 ? (
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Description</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Metadata</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {products.data.map((product) => (
                                <TableRow key={product.id}>
                                    <TableCell className="font-medium">{product.name}</TableCell>
                                    <TableCell>{product.description || '-'}</TableCell>
                                    <TableCell>
                                        <span
                                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                                product.active
                                                    ? 'bg-green-100 text-green-800'
                                                    : 'bg-gray-100 text-gray-800'
                                            }`}
                                        >
                                            {product.active ? 'Active' : 'Inactive'}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        {product.metadata ? (
                                            <pre className="text-xs">
                                                {JSON.stringify(product.metadata, null, 2)}
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
                <div className="rounded-md border p-6 text-center">
                    <p className="text-muted-foreground">
                        {filters.search
                            ? `No products found matching "${filters.search}"`
                            : 'No products found'}
                    </p>
                </div>
            )}
        </div>
    );
}
