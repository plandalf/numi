import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
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
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Lookup Key</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Scope</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Interval</TableHead>
            <TableHead>Status</TableHead>
            {showActions && <TableHead className="text-right">Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {prices.map((price) => (
            <TableRow key={price.id}>
              <TableCell>{price.name || '-'}</TableCell>
              <TableCell>{price.lookup_key || '-'}</TableCell>
              <TableCell>{price.type}</TableCell>
              <TableCell>{price.scope}</TableCell>
              <TableCell className="text-right">
                {['one_time', 'recurring'].includes(price.type)
                  ? formatMoney(price.amount, price.currency)
                  : <span className="text-muted-foreground text-xs italic">Complex</span>
                }
              </TableCell>
              <TableCell>
                {price.type === 'recurring'
                  ? `${price.recurring_interval_count || ''} ${price.renew_interval}(s)`
                  : '-'
                }
              </TableCell>
              <TableCell>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${price.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                  {price.is_active ? 'Active' : 'Inactive'}
                </span>
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
    ) : (
      <p className="text-center text-muted-foreground py-4">No prices defined yet.</p>
    )
  )
};

export default PriceTable;
