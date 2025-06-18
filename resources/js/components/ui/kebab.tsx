import React from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./dropdown-menu";
import { Button } from "./button";
import { MoreVertical } from "lucide-react";
import { cn } from "@/lib/utils";

interface KebabProps extends React.HTMLAttributes<HTMLDivElement> {
  items: {
    label: React.ReactNode;
    onClick: (e?: React.MouseEvent) => void;
    className?: string;
    disabled?: boolean;
  }[];
  triggerClassName?: string;
  contentClassName?: string;
}

export function Kebab({ items, className, triggerClassName, contentClassName, ...props }: KebabProps) {
  return (
    <div className={cn("relative", className)} {...props}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className={cn(
              "h-8 w-8 p-0 hover:bg-muted focus-visible:ring-1 focus-visible:ring-primary",
              triggerClassName
            )}
          >
            <MoreVertical className="h-4 w-4" />
            <span className="sr-only">Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className={cn("w-full", contentClassName)}>
          {items.map((item, index) => (
            <DropdownMenuItem
              key={index}
              onClick={item.onClick}
              className={cn("cursor-pointer", item.className)}
              disabled={item.disabled}
            >
              {item.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
