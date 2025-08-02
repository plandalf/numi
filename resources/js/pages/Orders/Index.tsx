import { Link, Head, router } from '@inertiajs/react';
import AppLayout from "@/layouts/app-layout";
import cx from "classnames";
import { formatDate, formatMoney, formatTimestamp } from '@/lib/utils';
import { Search, ExternalLink, FileText, Package, AlertTriangle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useDebounce } from '@/hooks/use-debounce';
import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Pagination } from "@/components/pagination/Pagination";
import { TutorialCard } from '@/components/onboarding/TutorialCard';

type User = { id: number; name: string; email: string; };

interface PageProps {
  auth: {
    user: User;
  };
  errors?: Record<string, string>;
  flash?: { success?: string; error?: string };
}

interface PaginatedResponse<T> {
  data: T[];
  links: { url: string | null; label: string; active: boolean }[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

interface OrderItem {
  id: number;
  quantity: number;
  total_amount: number;
  price: {
    id: number;
    amount: number;
    currency: string;
    product: {
      id: number;
      name: string;
    };
  };
}

interface Order {
  id: number;
  uuid: string;
  status: {
    value: string;
    label: string;
  };
  currency: string;
  total_amount: number;
  completed_at: string | null;
  created_at: string;
  customer: {
    id: number;
    name: string;
    email: string;
  } | null;
  items: OrderItem[];
  checkout_session: {
    id: number;
    status: string;
  } | null;
  fulfillment_summary: {
    total_items: number;
    fulfilled_items: number;
    pending_items: number;
    unprovisionable_items: number;
  };
}

interface OrdersIndexProps extends PageProps {
  orders: PaginatedResponse<Order>;
  filters: {
    search: string;
  };
  showOrdersTutorial: boolean;
}

export default function Index({ orders, filters, showOrdersTutorial }: OrdersIndexProps) {
  const [search, setSearch] = useState(filters.search || '');
  const debouncedSearch = useDebounce(search, 300);

  useEffect(() => {
    router.get(
      route('orders.index'),
      { search: debouncedSearch },
      { preserveState: true, preserveScroll: true }
    );
  }, [debouncedSearch]);

  const getFulfillmentStatus = (order: Order) => {
    const { total_items, fulfilled_items, unprovisionable_items } = order.fulfillment_summary;

    if (total_items === 0) return { status: 'no-items', label: 'No Items', color: 'bg-gray-100 text-gray-700' };
    if (fulfilled_items === total_items) return { status: 'fulfilled', label: 'Fulfilled', color: 'bg-green-100 text-green-700' };
    if (unprovisionable_items === total_items) return { status: 'unprovisionable', label: 'Unprovisionable', color: 'bg-red-100 text-red-700' };
    if (fulfilled_items > 0) return { status: 'partial', label: 'Partially Fulfilled', color: 'bg-yellow-100 text-yellow-700' };
    return { status: 'pending', label: 'Pending Fulfillment', color: 'bg-blue-100 text-blue-700' };
  };

  const requiresFulfillment = (order: Order) => {
    const { total_items, fulfilled_items, unprovisionable_items } = order.fulfillment_summary;
    return total_items > 0 && fulfilled_items < total_items && unprovisionable_items < total_items;
  };

  return (
    <AppLayout>
      <Head title="Orders" />

      <div className="container max-w-[100vw] mx-auto py-6 sm:py-8 px-4 sm:px-6 lg:px-8">
        <header className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white">
              Orders
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              All your orders and their status
            </p>
          </div>
          <div className="relative flex-1 sm:flex-initial">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              type="search"
              placeholder="Search orders..."
              className="pl-9 w-full sm:w-[250px]"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </header>

        {/* Orders Tutorial */}
        <TutorialCard
          title="Getting Started with Orders"
          description="Orders are customer purchases that flow through your offers. Track payment status, view customer details, and manage fulfillment. <b>Monitor your revenue</b> and analyze purchasing patterns to optimize your business."
          actions={[
            // {
            //   label: 'View Analytics',
            //   onClick: () => router.get('/analytics'),
            //   icon: FileText
            // },
            {
              label: 'Learn More',
              onClick: () => window.open('https://www.plandalf.dev/docs/orders', '_blank'),
              variant: 'outline' as const,
              icon: ExternalLink
            }
          ]}
          onboardingKey="orders_tutorial"
          show={showOrdersTutorial}
          backgroundColor="bg-orange-50"
          borderColor="border-orange-200"
          textColor="text-amber-700 dark:text-amber-300"
          accentColor="bg-orange-600"
          accentHoverColor="hover:bg-orange-700"
        />

        {!orders.data || orders.data.length === 0 ? (
          <div className="flex flex-col items-center justify-center bg-[#F7F9FF] rounded-md p-8">
            <h3 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white">No orders found</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              When you receive orders, they will appear here
            </p>
          </div>
        ) : (
          <>
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[150px]">Order ID</TableHead>
                    <TableHead className="min-w-[150px]">Customer</TableHead>
                    <TableHead className="min-w-[100px]">Status</TableHead>
                    <TableHead className="min-w-[120px]">Date</TableHead>
                    <TableHead className="min-w-[100px]">Items</TableHead>
                    <TableHead className="min-w-[140px]">Fulfillment</TableHead>
                    <TableHead className="min-w-[100px] text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.data.map((order: Order) => {
                    const fulfillmentStatus = getFulfillmentStatus(order);
                    const needsFulfillment = requiresFulfillment(order);

                    return (
                      <TableRow
                        key={order.id}
                        className={cx({
                          'bg-yellow-50 border-l-4 border-l-yellow-400': needsFulfillment,
                        })}
                      >
                        <TableCell className="font-medium">
                          <Link
                            href={route('orders.show', order.id)}
                            className="hover:underline"
                          >
                            Order #{order.order_number}
                          </Link>
                          {needsFulfillment && (
                            <div className="flex items-center gap-1 mt-1">
                              <AlertTriangle className="h-3 w-3 text-yellow-600" />
                              <span className="text-xs text-yellow-600 font-medium">Needs Fulfillment</span>
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          {order.customer ? (
                            <div>
                              <div className="font-medium">{order.customer.name}</div>
                              <div className="text-sm text-gray-500">{order.customer.email}</div>
                            </div>
                          ) : (
                            <span className="text-gray-500">Guest</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge className={cx('text-white whitespace-nowrap', {
                            'bg-[#7EB500]': order.status.value === 'completed',
                            'bg-[#808ABF]': order.status.value === 'pending',
                            'bg-red-400': order.status.value === 'cancelled',
                          })}>
                            {order.status.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          {formatTimestamp(order.completed_at)}
                        </TableCell>
                        <TableCell>
                          {order.items?.length || 0} {order.items?.length === 1 ? 'item' : 'items'}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Badge className={cx('whitespace-nowrap', fulfillmentStatus.color)}>
                              {fulfillmentStatus.label}
                            </Badge>
                            {order.fulfillment_summary.total_items > 0 && (
                              <span className="text-xs text-gray-500">
                                {order.fulfillment_summary.fulfilled_items}/{order.fulfillment_summary.total_items}
                              </span>
                            )}
                          </div>
                          {needsFulfillment && (
                            <Link
                              href={route('orders.fulfillment', order.id)}
                              className="inline-flex items-center gap-1 mt-1 text-xs text-blue-600 hover:text-blue-800 font-medium"
                            >
                              <Package className="h-3 w-3" />
                              Manage Fulfillment
                            </Link>
                          )}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatMoney(order.total_amount, order.currency)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            <div className="mt-4 flex items-center justify-center sm:justify-start">
              <Pagination
                page={orders.current_page}
                pageSize={orders.per_page}
                totalCount={orders.total}
                onPageChange={(page) => {
                  window.location.href = route('orders.index', { page });
                }}
              />
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
}
