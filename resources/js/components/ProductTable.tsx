import { Link } from '@inertiajs/react';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cx } from 'class-variance-authority';
import { ProductStatus } from '@/types/product';
import { formatDate, pluralize } from '@/lib/utils';

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
  return (
    <div className="rounded-md border overflow-x-auto">
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="min-w-[150px]">Product name</TableHead>
          <TableHead className="min-w-[100px]">Status</TableHead>
          <TableHead className="min-w-[120px]">Created</TableHead>
          <TableHead className="min-w-[100px]">Source</TableHead>
          <TableHead className="min-w-[100px]">Prices</TableHead>
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
          </TableRow>
        ))}
      </TableBody>
    </Table>
    </div>
  );
}
