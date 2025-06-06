import { Link, router } from '@inertiajs/react';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cx } from 'class-variance-authority';
import { ProductStatus } from '@/types/product';
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
  created_at: string;
  integration?: {
    name: string;
  };
  prices?: any[];
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
              <TableHead className="min-w-[100px]">Status</TableHead>
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
                  <Badge className={cx('text-white whitespace-nowrap', {
                    'bg-[#7EB500]': product.status === ProductStatus.ACTIVE,
                    'bg-[#808ABF]': product.status === ProductStatus.DRAFT,
                    'bg-red-400': product.status === ProductStatus.ARCHIVED,
                    'bg-red-600': product.status === ProductStatus.DELETED,
                  })}>
                    {product.status}
                  </Badge>
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  {formatDate(product.created_at)}
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  {product.integration?.name || 'Plandalf'}
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  {product.prices?.length || 0} {pluralize('price', product.prices?.length || 0)}
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
