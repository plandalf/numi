"use client";

import { type ReactNode } from "react";
import {
  Pagination as PaginationBase,
  PaginationButton,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

export interface PaginationWithLinksProps {
  totalCount: number;
  pageSize: number;
  page: number;
  onPageChange?: (page: number) => void;
}

export function Pagination({
  pageSize,
  totalCount,
  page,
  onPageChange,
}: PaginationWithLinksProps) {
  const totalPageCount = Math.ceil(totalCount / pageSize);

  const renderPageNumbers = () => {
    const items: ReactNode[] = [];
    const maxVisiblePages = 5;

    if (totalPageCount <= maxVisiblePages) {
      for (let i = 1; i <= totalPageCount; i++) {
        items.push(
          <PaginationItem key={i}>
            <PaginationButton
              onClick={() => onPageChange?.(i)}
              isActive={page === i}
            >
              {i}
            </PaginationButton>
          </PaginationItem>,
        );
      }
    } else {
      items.push(
        <PaginationItem key={1}>
          <PaginationButton
            onClick={() => onPageChange?.(1)}
            isActive={page === 1}
          >
            1
          </PaginationButton>
        </PaginationItem>,
      );

      if (page > 3) {
        items.push(
          <PaginationItem key="ellipsis-start">
            <PaginationEllipsis />
          </PaginationItem>,
        );
      }

      const start = Math.max(2, page - 1);
      const end = Math.min(totalPageCount - 1, page + 1);

      for (let i = start; i <= end; i++) {
        items.push(
          <PaginationItem key={i}>
            <PaginationButton
              onClick={() => onPageChange?.(i)}
              isActive={page === i}
            >
              {i}
            </PaginationButton>
          </PaginationItem>,
        );
      }

      if (page < totalPageCount - 2) {
        items.push(
          <PaginationItem key="ellipsis-end">
            <PaginationEllipsis />
          </PaginationItem>,
        );
      }

      items.push(
        <PaginationItem key={totalPageCount}>
          <PaginationButton
            onClick={() => onPageChange?.(totalPageCount)}
            isActive={page === totalPageCount}
          >
            {totalPageCount}
          </PaginationButton>
        </PaginationItem>,
      );
    }

    return items;
  };

  return (
    <div className="flex flex-col md:flex-row items-center gap-3 w-full">
      <PaginationBase>
        <PaginationContent className="max-sm:gap-0">
          <PaginationItem>
            <PaginationPrevious
              onClick={() => onPageChange?.(Math.max(page - 1, 1))}
              aria-disabled={page === 1}
              tabIndex={page === 1 ? -1 : undefined}
              className={
                page === 1 ? "pointer-events-none opacity-50" : undefined
              }
            />
          </PaginationItem>
          {renderPageNumbers()}
          <PaginationItem>
            <PaginationNext
              onClick={() => onPageChange?.(Math.min(page + 1, totalPageCount))}
              aria-disabled={page === totalPageCount}
              tabIndex={page === totalPageCount ? -1 : undefined}
              className={
                page === totalPageCount
                  ? "pointer-events-none opacity-50"
                  : undefined
              }
            />
          </PaginationItem>
        </PaginationContent>
      </PaginationBase>
    </div>
  );
}
