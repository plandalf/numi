import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from '@/components/ui/popover';
import { Edit, Trash2, Plus, ChevronDown, Info, CornerDownRight } from 'lucide-react';
import { formatMoney } from '@/lib/utils';
import { Price } from '@/types/offer';
import React from 'react';

// Helper function to get the base price for complex pricing models
const getBasePrice = (price: Price): { amount: number; label: string } | null => {
  if (!price.properties) {
    // Fallback to simple amount if available
    if (price.amount > 0) {
      return {
        amount: price.amount,
        label: 'From'
      };
    }
    return null;
  }
  
  switch (price.type) {
    case 'tiered':
    case 'volume':
    case 'graduated':
      if (price.properties.tiers && Array.isArray(price.properties.tiers) && price.properties.tiers.length > 0) {
        const firstTier = price.properties.tiers[0];
        if (firstTier && typeof firstTier.unit_amount === 'number') {
          return {
            amount: firstTier.unit_amount,
            label: 'Start at'
          };
        }
      }
      break;
    case 'package':
      if (price.properties.package) {
        const { size, unit_amount } = price.properties.package;
        if (typeof size === 'number' && typeof unit_amount === 'number') {
          return {
            amount: unit_amount * size,
            label: `${size} pack for`
          };
        }
      }
      break;
  }
  
  // Fallback to simple amount if available
  if (price.amount > 0) {
    return {
      amount: price.amount,
      label: 'From'
    };
  }
  
  return null;
};

// Component to render pricing breakdown popover
const PricingBreakdown: React.FC<{ price: Price }> = ({ price }) => {
  if (!price.properties) return null;

  const renderTieredPricing = (tiers: any[]) => {
    if (!Array.isArray(tiers) || tiers.length === 0) return null;
    
    return (
      <div className="space-y-2">
        <div className="text-sm font-medium">Pricing Tiers</div>
        {tiers.map((tier, index) => {
          if (!tier || typeof tier.unit_amount !== 'number') return null;
          
          return (
            <div key={index} className="flex justify-between text-xs p-2 bg-gray-50 rounded">
              <span>
                {tier.from || 0}+ units
                {tier.to && ` (up to ${tier.to})`}
              </span>
              <span className="font-medium">
                {formatMoney(tier.unit_amount, price.currency)} / unit
              </span>
            </div>
          );
        }).filter(Boolean)}
      </div>
    );
  };

  const renderPackagePricing = (pkg: any) => {
    if (!pkg || typeof pkg.size !== 'number' || typeof pkg.unit_amount !== 'number') {
      return null;
    }
    
    return (
      <div className="space-y-2">
        <div className="text-sm font-medium">Package Pricing</div>
        <div className="text-xs p-2 bg-gray-50 rounded">
          <div className="flex justify-between">
            <span>Package Size:</span>
            <span className="font-medium">{pkg.size} units</span>
          </div>
          <div className="flex justify-between">
            <span>Unit Price:</span>
            <span className="font-medium">{formatMoney(pkg.unit_amount, price.currency)}</span>
          </div>
          <div className="flex justify-between border-t pt-1 mt-1">
            <span>Total Package:</span>
            <span className="font-medium">{formatMoney(pkg.unit_amount * pkg.size, price.currency)}</span>
          </div>
        </div>
      </div>
    );
  };

  switch (price.type) {
    case 'tiered':
      return price.properties.tiers ? renderTieredPricing(price.properties.tiers) : null;
    case 'volume':
      return price.properties.tiers ? (
        <div className="space-y-2">
          <div className="text-sm font-medium">Volume Pricing</div>
          <div className="text-xs text-muted-foreground mb-2">Price applies to entire quantity</div>
          {renderTieredPricing(price.properties.tiers)}
        </div>
      ) : null;
    case 'graduated':
      return price.properties.tiers ? (
        <div className="space-y-2">
          <div className="text-sm font-medium">Graduated Pricing</div>
          <div className="text-xs text-muted-foreground mb-2">Price applies per tier range</div>
          {renderTieredPricing(price.properties.tiers)}
        </div>
      ) : null;
    case 'package':
      return price.properties.package ? renderPackagePricing(price.properties.package) : null;
    default:
      return null;
  }
};

// Helper function to group prices into hierarchical structure
const groupPricesHierarchically = (prices: Price[]) => {
  // Separate parent and child prices
  const parentPrices = prices.filter(p => p.scope === 'list');
  const childPrices = prices.filter(p => p.scope !== 'list');
  
  // Create a map of parent ID to children
  const childrenByParent = childPrices.reduce((acc, child) => {
    const parentId = child.parent_list_price_id;
    if (parentId) {
      if (!acc[parentId]) {
        acc[parentId] = [];
      }
      acc[parentId].push(child);
    }
    return acc;
  }, {} as Record<number, Price[]>);
  
  // Group and sort: parents first, then their children
  const groupedPrices: Array<{ price: Price; isChild: boolean; parentName?: string }> = [];
  
  // Add parents and their children
  parentPrices.forEach(parent => {
    // Add parent
    groupedPrices.push({ price: parent, isChild: false });
    
    // Add children of this parent
    const children = childrenByParent[parent.id] || [];
    children.forEach(child => {
      groupedPrices.push({ 
        price: child, 
        isChild: true, 
        parentName: parent.name || `Price #${parent.id}` 
      });
    });
  });
  
  // Add orphaned child prices (those without valid parent) at the end
  const orphanedChildren = childPrices.filter(child => 
    !child.parent_list_price_id || 
    !parentPrices.find(p => p.id === child.parent_list_price_id)
  );
  
  orphanedChildren.forEach(orphan => {
    groupedPrices.push({ 
      price: orphan, 
      isChild: false // Render as standalone since parent is missing
    });
  });
  
  return groupedPrices;
};

interface PriceTableProps {
  prices: Price[];
  onEdit?: (price: Price) => void;
  onDelete?: (price: Price) => void;
  onCreateChild?: (parentPrice: Price, scope: 'custom' | 'variant') => void;
  showActions?: boolean;
}

export const PriceTable: React.FC<PriceTableProps> = ({ prices, onEdit, onDelete, onCreateChild, showActions = false }) => {
  const groupedPrices = groupPricesHierarchically(prices);
  
  return (
    prices && prices.length > 0 ? (
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[150px]">Prices</TableHead>
              <TableHead className="min-w-[80px]">Scope</TableHead>
              <TableHead className="min-w-[100px]">Status</TableHead>
              <TableHead className="min-w-[100px]">Lookup Key</TableHead>
              <TableHead className="min-w-[80px]">Type</TableHead>
              <TableHead className="min-w-[100px]">Price</TableHead>
              {showActions && <TableHead className="text-right">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {groupedPrices.map(({ price, isChild, parentName }, index) => (
              <TableRow 
                key={`${price.id}-${index}`}
                className={isChild ? 'bg-gray-50/50' : ''}
              >
                <TableCell className="font-medium line-clamp-1">
                  <div className="flex items-center gap-2">
                    {isChild && (
                      <div className="flex items-center text-muted-foreground">
                        <CornerDownRight className="h-3 w-3" />
                        <span className="text-xs ml-1">from "{parentName}"</span>
                      </div>
                    )}
                    <span className={isChild ? 'text-sm' : ''}>
                      {price.name || '-'}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  <Badge className={`whitespace-nowrap text-white ${
                    price.scope === 'list' ? 'bg-green-600' :
                    price.scope === 'custom' ? 'bg-blue-600' : 
                    'bg-purple-600'
                  }`}>
                    {price.scope === 'list' ? 'List' :
                     price.scope === 'custom' ? 'Custom' : 
                     'Variant'}
                  </Badge>
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  <Badge className={`whitespace-nowrap text-white ${price.is_active ? 'bg-[#7EB500]' : 'bg-[#808ABF]'}`}>
                    {price.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </TableCell>
                <TableCell className="whitespace-nowrap">{price.lookup_key || '-'}</TableCell>
                <TableCell className="whitespace-nowrap capitalize">{price.type.replace('_', ' ')}</TableCell>
                <TableCell className="whitespace-nowrap">
                  {(() => {
                    // Simple pricing types
                    if (['one_time', 'recurring'].includes(price.type)) {
                      return `${formatMoney(price.amount, price.currency)} ${price.currency.toUpperCase()}`;
                    }
                    
                    // Complex pricing types
                    const basePrice = getBasePrice(price);
                    const hasBreakdown = price.properties && (
                      price.properties.tiers?.length > 0 || price.properties.package
                    );

                    if (basePrice) {
                      const content = (
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-muted-foreground">{basePrice.label}</span>
                          <span className="font-medium">
                            {formatMoney(basePrice.amount, price.currency)} {price.currency.toUpperCase()}
                          </span>
                          {hasBreakdown && (
                            <Info className="h-3 w-3 text-muted-foreground" />
                          )}
                        </div>
                      );

                      if (hasBreakdown) {
                        return (
                          <Popover>
                            <PopoverTrigger asChild>
                              <button className="hover:bg-gray-50 p-1 rounded transition-colors cursor-pointer">
                                {content}
                              </button>
                            </PopoverTrigger>
                            <PopoverContent className="w-80" align="start">
                              <PricingBreakdown price={price} />
                            </PopoverContent>
                          </Popover>
                        );
                      }

                      return content;
                    }

                    // Fallback for complex prices without proper configuration
                    return <span className="text-muted-foreground text-xs italic">Complex</span>;
                  })()}
                </TableCell>
                {showActions && (
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
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
                      {/* Add child price option for list prices only */}
                      {price.scope === 'list' && onCreateChild && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" title="Create variant or custom price">
                              <Plus className="h-4 w-4 text-green-600" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => onCreateChild(price, 'custom')}>
                              <div className="flex flex-col">
                                <span className="font-medium">Custom Price</span>
                                <span className="text-xs text-muted-foreground">One-off price for specific customers</span>
                              </div>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => onCreateChild(price, 'variant')}>
                              <div className="flex flex-col">
                                <span className="font-medium">Variant Price</span>
                                <span className="text-xs text-muted-foreground">Alternative version of this price</span>
                              </div>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
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
