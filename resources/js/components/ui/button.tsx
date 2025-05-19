import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Redo } from "lucide-react"

const buttonVariants = cva(
  "cursor-pointer inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-[color,box-shadow] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-xs hover:bg-primary/90",
        destructive:
          "bg-destructive text-white shadow-xs hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40",
        outline:
          "border border-input bg-background shadow-xs hover:bg-accent hover:text-accent-foreground",
        "outline-transparent": "border text-white transform transition-all hover:bg-accent hover:text-accent-foreground shadow-xs ",
        secondary:
          "bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        xs: "h-6 w-6 text-xs has-[>svg]:px-1.5 active:scale-95",
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 rounded-md px-3 has-[>svg]:px-2.5",
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
