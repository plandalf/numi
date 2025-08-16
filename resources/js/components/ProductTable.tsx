import { Link, router } from '@inertiajs/react';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cx } from 'class-variance-authority';
import { ProductStatus, Price } from '@/types/product';
import { formatDate, pluralize } from '@/lib/utils';
import { useState } from 'react';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';

type Product = {
  id: number;
  name: string;
  status: ProductStatus;
  current_state?: 'draft'|'testing'|'active'|'deprecated'|'retired';
  created_at: string;
  integration?: {
    name: string;
  };
  prices?: Price[];
};

interface ProductTableProps {
  products: {
    data: Product[];
  };
}

export function ProductTable({ products }: ProductTableProps) {
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  const handleDelete = () => {
    if (!productToDelete) return;

    const toastId = toast.loading('Deleting product...');

    router.delete(route('products.destroy', productToDelete.id), {
      preserveScroll: true,
      onSuccess: () => {
        toast.success('Product deleted successfully', { id: toastId });
        setProductToDelete(null);
      },
      onError: (errors) => {
        toast.error(`Failed to delete product: ${Object.values(errors).flat().join(", ")}`, { id: toastId });
      },
    });
  };

  return (
    <>
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[150px]">Product name</TableHead>
              <TableHead className="min-w-[100px]">State</TableHead>
              <TableHead className="min-w-[120px]">Created</TableHead>
              <TableHead className="min-w-[100px]">Source</TableHead>
              <TableHead className="min-w-[100px]">Prices</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.data.map((product: Product) => (
              <TableRow key={product.id}>
                <TableCell className="font-medium">
                  <Link
                    href={route('products.show', product.id)}
                    className="hover:underline line-clamp-1"
                  >
                    {product.name}
                  </Link>
                </TableCell>
                <TableCell>
                  {(() => {
                    const state = (product as any).current_state as Product['current_state'] | undefined;
                    const s = state || (product.status ? String(product.status).toLowerCase() : 'draft');
                    const className = cx('text-white whitespace-nowrap', {
                      'bg-[#7EB500]': s === 'active',
                      'bg-blue-600': s === 'testing',
                      'bg-[#808ABF]': s === 'draft',
                      'bg-amber-600': s === 'deprecated',
                      'bg-red-600': s === 'retired' || s === 'archived' || s === 'deleted',
                    });
                    const label = s.charAt(0).toUpperCase() + s.slice(1);
                    return <Badge className={className}>{label}</Badge>;
                  })()}
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  {formatDate(product.created_at)}
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  {product.integration?.name || 'Plandalf'}
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  {product.prices && product.prices.length > 0 ? (
                    <div className="space-y-1">
                      {(() => {
                        const listPrices = product.prices.filter(p => p.scope === 'list');
                        const customPrices = product.prices.filter(p => p.scope === 'custom');
                        const variantPrices = product.prices.filter(p => p.scope === 'variant');
                        
                        return (
                          <div className="flex flex-col space-y-0.5">
                            {listPrices.length > 0 && (
                              <div className="flex items-center space-x-2">
                                <Badge variant="outline" className="text-xs bg-green-50 border-green-200 text-green-700">
                                  List
                                </Badge>
                                <span className="text-sm text-gray-600">
                                  {listPrices.length} {pluralize('price', listPrices.length)}
                                </span>
                              </div>
                            )}
                            {customPrices.length > 0 && (
                              <div className="flex items-center space-x-2">
                                <Badge variant="outline" className="text-xs bg-blue-50 border-blue-200 text-blue-700">
                                  Custom
                                </Badge>
                                <span className="text-sm text-gray-600">
                                  {customPrices.length} {pluralize('price', customPrices.length)}
                                </span>
                              </div>
                            )}
                            {variantPrices.length > 0 && (
                              <div className="flex items-center space-x-2">
                                <Badge variant="outline" className="text-xs bg-purple-50 border-purple-200 text-purple-700">
                                  Variant
                                </Badge>
                                <span className="text-sm text-gray-600">
                                  {variantPrices.length} {pluralize('price', variantPrices.length)}
                                </span>
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  ) : (
                    <span className="text-sm text-gray-500">No prices</span>
                  )}
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon" onClick={() => setProductToDelete(product)} title="Delete Price">
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={!!productToDelete} onOpenChange={(open) => !open && setProductToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this product?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the product
              {productToDelete?.prices && productToDelete.prices.length > 0 && ' and all associated prices'}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 focus:ring-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
