import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2 } from 'lucide-react';
import { formatMoney } from '@/lib/utils';
import { Price } from '@/types/offer';
import React from 'react';

interface PriceTableProps {
  prices: Price[];
  onEdit?: (price: Price) => void;
  onDelete?: (price: Price) => void;
  showActions?: boolean;
}

export const PriceTable: React.FC<PriceTableProps> = ({ prices, onEdit, onDelete, showActions = false }) => {
  return (
    prices && prices.length > 0 ? (
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[150px]">Prices</TableHead>
              <TableHead className="min-w-[100px]">Status</TableHead>
              <TableHead className="min-w-[100px]">Lookup Key</TableHead>
              <TableHead className="min-w-[80px]">Model</TableHead>
              <TableHead className="min-w-[100px]">Price</TableHead>
              {showActions && <TableHead className="text-right">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {prices.map((price) => (
              <TableRow key={price.id}>
                <TableCell className="font-medium line-clamp-1">
                  {price.name || '-'}
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  <Badge className={`whitespace-nowrap text-white ${price.is_active ? 'bg-[#7EB500]' : 'bg-[#808ABF]'}`}>
                    {price.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </TableCell>
                <TableCell className="whitespace-nowrap">{price.lookup_key || '-'}</TableCell>
                <TableCell className="whitespace-nowrap">{price.type}</TableCell>
                <TableCell className="whitespace-nowrap">
                  {['one_time', 'recurring'].includes(price.type)
                    ? formatMoney(price.amount, price.currency)
                    : <span className="text-muted-foreground text-xs italic">Complex</span>
                  }
                </TableCell>
                {showActions && (
                  <TableCell className="text-right">
                    {onEdit && (
                      <Button variant="ghost" size="icon" onClick={() => onEdit(price)} title="Edit Price">
                        <Edit className="h-4 w-4" />
                      </Button>
                    )}
                    {onDelete && (
                      <Button variant="ghost" size="icon" onClick={() => onDelete(price)} title="Delete Price">
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    )}
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    ) : (
      <p className="text-center text-muted-foreground py-4">No prices defined yet.</p>
    )
  )
};

export default PriceTable;
