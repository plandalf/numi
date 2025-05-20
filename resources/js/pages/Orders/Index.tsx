import { Link, Head, router } from '@inertiajs/react';
import AppLayout from "@/layouts/app-layout";
import cx from "classnames";
import { formatDate, formatMoney } from '@/lib/utils';
import { Search } from 'lucide-react';
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
  status: string;
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
}

interface OrdersIndexProps extends PageProps {
  orders: PaginatedResponse<Order>;
  filters: {
    search: string;
  };
}

export default function Index({ auth, orders, filters }: OrdersIndexProps) {
  const [search, setSearch] = useState(filters.search || '');
  const debouncedSearch = useDebounce(search, 300);

  useEffect(() => {
    router.get(
      route('orders.index'),
      { search: debouncedSearch },
      { preserveState: true, preserveScroll: true }
    );
  }, [debouncedSearch]);

  return (
    <AppLayout>
      <Head title="Orders" />

      <div className="container max-w-[100vw] mx-auto py-6 sm:py-10 px-4 sm:px-6 lg:px-8">
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
                    <TableHead className="min-w-[100px] text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.data.map((order: Order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">
                        <Link
                          href={route('orders.show', order.uuid)}
                          className="hover:underline"
                        >
                          {order.uuid}
                        </Link>
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
                          'bg-[#7EB500]': order.status === 'completed',
                          'bg-[#808ABF]': order.status === 'pending',
                          'bg-red-400': order.status === 'cancelled',
                        })}>
                          {order.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {formatDate(order.created_at)}
                      </TableCell>
                      <TableCell>
                        {order.items?.length || 0} {order.items?.length === 1 ? 'item' : 'items'}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatMoney(order.total_amount, order.currency)}
                      </TableCell>
                    </TableRow>
                  ))}
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
