import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const buttonVariants = cva(
  "relative isolate inline-flex items-center justify-center gap-x-2 rounded-[var(--radius-lg)] before:rounded-[var(--radius-lg)] after:rounded-[var(--radius-lg)] border text-base/6 font-semibold px-[calc(theme(spacing.3.5)-1px)] py-[calc(theme(spacing.2.5)-1px)] sm:px-[calc(theme(spacing.3)-1px)] sm:py-[calc(theme(spacing.1.5)-1px)] sm:text-sm/6 focus:not-data-focus:outline-hidden data-focus:outline-2 data-focus:outline-offset-2 data-focus:outline-blue-500 data-disabled:opacity-50 *:data-[slot=icon]:mx-0 *:data-[slot=icon]:my-0 *:data-[slot=icon]:size-5 *:data-[slot=icon]:shrink-0 *:data-[slot=icon]:self-center *:data-[slot=icon]:text-[--btn-icon] sm:*:data-[slot=icon]:my-0 sm:*:data-[slot=icon]:size-4 before:absolute before:inset-0 before:-z-10 before:shadow-sm dark:before:hidden dark:border-white/5 after:absolute after:inset-0 after:-z-10 after:shadow-[inset_0_1px_theme(colors.white/15%)] data-active:after:bg-[--btn-hover-overlay] data-hover:after:bg-[--btn-hover-overlay] dark:after:-inset-px data-disabled:before:shadow-none data-disabled:after:shadow-none cursor-pointer outline-none transition-[color,box-shadow] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 [&_svg]:shrink-0 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default:
          "bg-[#007D96] text-white border-transparent before:bg-[#189AB4] before:opacity-80 hover:before:opacity-100 active:before:opacity-90 active:before:bg-[#189AB4] font-semibold",
        destructive:
          "bg-[#a32a1f] text-white border-transparent before:bg-[#e71f05] before:opacity-80 hover:before:opacity-100 active:before:opacity-90 active:before:bg-[#e71f05] font-semibold",
        outline:
          "border border-input bg-background shadow-xs hover:bg-accent hover:text-accent-foreground",
        "outline-transparent": "border text-white transform transition-all hover:bg-accent hover:text-accent-foreground shadow-xs ",
        secondary:
          "bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        "dark-outline":
          "bg-[#23272b] text-white border border-[#3a3f44] before:opacity-80 hover:before:opacity-100 active:before:opacity-90 active:before:bg-[#3a3f44] font-semibold",
      },
      size: {
        xs: "h-6 w-6 text-xs has-[>svg]:px-1.5 active:scale-95",
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 rounded-mdX px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
        icon: "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

interface ButtonProps
  extends React.ComponentProps<"button">,
  VariantProps<typeof buttonVariants> {
    tooltip?: React.ReactNode;
    tooltipSide?: "top" | "right" | "bottom" | "left";
    tooltipAlign?: "start" | "center" | "end";
    asChild?: boolean
  }

function Button({
  className,
  variant,
  size,
  asChild = false,
  tooltip,
  tooltipSide = "top",
  tooltipAlign = "center",
  ...otherProps
}: ButtonProps) {
  const Comp = asChild ? Slot : "button"

  const props = {
    ...otherProps,
    "data-slot": "button",
    className: cn(buttonVariants({ variant, size, className })),
  }

  if(tooltip) {
    return (
      <TooltipProvider delayDuration={100000}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Comp {...props} />
          </TooltipTrigger>
          <TooltipContent side={tooltipSide} align={tooltipAlign}>
            {tooltip}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return (
    <Comp {...props} />
  )
}

export { Button, buttonVariants }
