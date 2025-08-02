import * as Headless from '@headlessui/react'
import clsx from 'clsx'
import type React from 'react'
import { useEffect, useRef } from 'react'
import { Text } from './text'
import { XIcon } from 'lucide-react';

const sizes = {
  xs: 'sm:max-w-xs',
  sm: 'sm:max-w-sm',
  md: 'sm:max-w-md',
  lg: 'sm:max-w-lg',
  xl: 'sm:max-w-xl',
  '2xl': 'sm:max-w-2xl',
  '3xl': 'sm:max-w-3xl',
  '4xl': 'sm:max-w-4xl',
  '5xl': 'sm:max-w-5xl',
  full: 'w-full min-h-full max-Xw-none maXx-h-none rounded-2xl',
}

export function Dialog({
  size = 'lg',
  position = 'center',
  className,
  children,
  ...props
}: {
  size?: keyof typeof sizes;
  position?: 'center' | 'top';
  className?: string;
  children: React.ReactNode
} & Omit<
  Headless.DialogProps,
  'as' | 'className'
>) {
  const isFullScreen = size === 'full';
  const dropdownOpenRef = useRef(false);
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  if (!props.onClose) {
    props.onClose = () => { }
  }

  // Enhanced dropdown protection with state tracking
  useEffect(() => {
    const handleDropdownStateChange = () => {
      // Check if any dropdown is currently open
      const hasOpenDropdown = !!(
        document.querySelector('[data-radix-select-content]') ||
        document.querySelector('[data-radix-popover-content]') ||
        document.querySelector('[data-slot="select-content"]') ||
        document.querySelector('[role="listbox"][data-state="open"]') ||
        document.querySelector('[data-state="open"][role="listbox"]') ||
        document.querySelector('[data-radix-select-trigger][data-state="open"]') ||
        document.querySelector('[data-radix-popover-trigger][data-state="open"]') ||
        document.querySelector('[aria-expanded="true"][role="combobox"]')
      );
      
      dropdownOpenRef.current = hasOpenDropdown;
      
      // Clear any pending close timeout when dropdown opens
      if (hasOpenDropdown && closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
        closeTimeoutRef.current = null;
      }
    };

    const handleGlobalClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      
      // Always check dropdown state on clicks
      handleDropdownStateChange();
      
      // Stop propagation for clicks within dropdown elements
      if (target && (
        target.closest('[data-radix-select-content]') ||
        target.closest('[data-radix-select-trigger]') ||
        target.closest('[data-radix-popover-content]') ||
        target.closest('[data-radix-popover-trigger]') ||
        target.closest('[data-slot="select-content"]') ||
        target.closest('[data-slot="select-trigger"]') ||
        target.closest('[role="listbox"]') ||
        target.closest('[role="option"]') ||
        target.closest('[role="combobox"]')
      )) {
        e.stopImmediatePropagation();
        return;
      }

      // If dropdown was just open, delay any dialog close to avoid race conditions
      if (dropdownOpenRef.current) {
        e.stopImmediatePropagation();
        
        // Set a small timeout to allow dropdown to fully close
        closeTimeoutRef.current = setTimeout(() => {
          handleDropdownStateChange();
          dropdownOpenRef.current = false;
        }, 150);
      }
    };

    // Monitor DOM changes for dropdown state
    const observer = new MutationObserver(handleDropdownStateChange);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['data-state', 'aria-expanded']
    });

    document.addEventListener('click', handleGlobalClick, true);
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        handleDropdownStateChange();
      }
    });

    return () => {
      document.removeEventListener('click', handleGlobalClick, true);
      observer.disconnect();
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
      }
    };
  }, []);

  return (
    <Headless.Dialog 
      {...props}
      onClose={(value) => {
        // Additional protection: Don't close if dropdown is currently open
        if (dropdownOpenRef.current) {
          return;
        }
        
        // Check one more time for any open dropdowns
        const hasOpenDropdown = !!(
          document.querySelector('[data-radix-select-content]') ||
          document.querySelector('[data-radix-popover-content]') ||
          document.querySelector('[data-slot="select-content"]') ||
          document.querySelector('[role="listbox"][data-state="open"]') ||
          document.querySelector('[data-state="open"][role="listbox"]') ||
          document.querySelector('[data-radix-select-trigger][data-state="open"]') ||
          document.querySelector('[data-radix-popover-trigger][data-state="open"]') ||
          document.querySelector('[aria-expanded="true"][role="combobox"]')
        );
        
        if (hasOpenDropdown) {
          return;
        }
        
        if (props.onClose) {
          props.onClose(value);
        }
      }}
    >
      <Headless.DialogBackdrop
        transition
        className={clsx(
          "fixed inset-0 z-50 flex w-screen overflow-y-auto bg-zinc-950/25 transition duration-100 focus:outline-0 data-closed:opacity-0 data-enter:ease-out data-leave:ease-in dark:bg-zinc-950/50",
          isFullScreen ? "p-0" : "px-2 py-2 sm:px-6 sm:py-8 lg:px-8 lg:py-16"
        )}
      />

      <div className={clsx(
        "fixed inset-0 w-screen z-55",
        isFullScreen
          ? "p-0"
          : position === 'top'
            ? "pt-40 pb-40"
            : "pt-6 sm:pt-0 overflow-y-auto"
      )}>
        <div className={clsx(
          "justify-items-center Xh-full",
          isFullScreen
            ? "flex p-10 max-h-full"
            : position === 'top'
              ? "flex flex-col items-center"
              : "grid min-h-full grid-rows-[1fr_auto] sm:grid-rows-[1fr_auto_3fr] sm:p-4"
        )}>
          <Headless.DialogPanel
            transition
            className={clsx(
              className,
              sizes[size],
              isFullScreen
                ? 'row-start-1 w-full max-hh-full bg-white shadow-lg ring-1 ring-zinc-950/10 dark:bg-zinc-900 dark:ring-white/10 forced-colors:outline overflow-y-auto'
                : position === 'top'
                  ? 'w-full min-w-0 h-full rounded-2xl bg-white p-0 shadow-lg ring-1 ring-zinc-950/10 dark:bg-zinc-900 dark:ring-white/10 forced-colors:outline overflow-hidden'
                  : 'row-start-2 w-full min-w-0 rounded-t-3xl bg-white p-(--gutter) shadow-lg ring-1 ring-zinc-950/10 [--gutter:--spacing(4)] sm:mb-auto sm:rounded-2xl dark:bg-zinc-900 dark:ring-white/10 forced-colors:outline',
              isFullScreen
                ? 'transition duration-100 will-change-transform data-closed:opacity-0 data-enter:ease-out data-leave:ease-in'
                : position === 'top'
                  ? 'transition duration-100 will-change-transform data-closed:-translate-y-12 data-closed:opacity-0 data-enter:ease-out data-leave:ease-in'
                  : 'transition duration-100 will-change-transform data-closed:translate-y-12 data-closed:opacity-0 data-enter:ease-out data-leave:ease-in sm:data-closed:translate-y-0 sm:data-closed:data-enter:scale-95'
            )}
          >
            {children}
          </Headless.DialogPanel>
        </div>
      </div>
    </Headless.Dialog>
  )
}

export function DialogTitle({
  className,
  children,
  ...props
}: { className?: string } & Omit<Headless.DialogTitleProps, 'as' | 'className'>) {
  return (
    <div className="relative">
      <Headless.DialogTitle
        {...props}
        className={clsx(className, 'text-lg/6 font-semibold text-balance text-zinc-950 sm:text-base/6 dark:text-white')}
      >
        {children}
      </Headless.DialogTitle>
      <Headless.CloseButton className="ring-offset-background focus:ring-ring data-[state=open]:bg-accent data-[state=open]:text-muted-foreground absolute top-4 right-4 rounded-xs opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 cursor-pointer">
           <XIcon />
           <span className="sr-only">Close</span>
      </Headless.CloseButton>
    </div>
  )
}

export function DialogDescription({
                                    className,
                                    ...props
                                  }: { className?: string } & Omit<Headless.DescriptionProps<typeof Text>, 'as' | 'className'>) {
  return <Headless.Description as={Text} {...props} className={clsx(className, 'mt-2 text-pretty')} />
}

export function DialogBody({ className, ...props }: React.ComponentPropsWithoutRef<'div'>) {
  return <div {...props} className={clsx(className, 'mt-6')} />
}

export function DialogActions({ className, ...props }: React.ComponentPropsWithoutRef<'div'>) {
  return (
    <div
      {...props}
      className={clsx(
        className,
        'mt-8 flex flex-col-reverse items-center justify-end gap-3 *:w-full sm:flex-row sm:*:w-auto'
      )}
    />
  )
}



// import * as React from "react"
// import * as DialogPrimitive from "@radix-ui/react-dialog"
// import { XIcon } from "lucide-react"
//
// import { cn } from "@/lib/utils"
//
// function Dialog({
//   ...props
// }: React.ComponentProps<typeof DialogPrimitive.Root>) {
//   return <DialogPrimitive.Root data-slot="dialog" {...props} />
// }
//
// function DialogTrigger({
//   ...props
// }: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
//   return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />
// }
//
// function DialogPortal({
//   ...props
// }: React.ComponentProps<typeof DialogPrimitive.Portal>) {
//   return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />
// }
//
// function DialogClose({
//   ...props
// }: React.ComponentProps<typeof DialogPrimitive.Close>) {
//   return <DialogPrimitive.Close data-slot="dialog-close" {...props} />
// }
//
// function DialogOverlay({
//   className,
//   ...props
// }: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
//   return (
//     <DialogPrimitive.Overlay
//       data-slot="dialog-overlay"
//       className={cn(
//         "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/80",
//         className
//       )}
//       {...props}
//     />
//   )
// }
//
export function DialogContent() {
  return (
    <div></div>
  )
}
export function DialogHeader() {
  return (
    <div></div>
  )
}
export function DialogTrigger() {
  return (
    <div></div>
  )
}

// function DialogContent({
//   className,
//   children,
//   variant = "default",
//   ...props
// }: React.ComponentProps<typeof DialogPrimitive.Content> & {
//   variant?: "default" | "full-height" | "wizard"
// }) {
//
//   const contentClasses = cn(
//     "bg-background data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed z-50 grid gap-4 border shadow-lg duration-200",
//     variant === "default" && "top-[50%] left-[50%] w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] rounded-lg p-6 sm:max-w-lg",
//     variant === "full-height" && "top-10 left-10 right-10 bottom-10 w-auto h-auto translate-x-0 translate-y-0 rounded-lg p-6",
//     variant === "wizard" && "top-[50%] left-[50%] w-full max-w-4xl h-[85vh] translate-x-[-50%] translate-y-[-50%] rounded-lg p-0 flex flex-col",
//     className
//   )
//
//   return (
//     <DialogPortal data-slot="dialog-portal">
//       <DialogOverlay />
//       <DialogPrimitive.Content
//         onCloseAutoFocus={(event) => {
//           event.preventDefault();
//           document.body.style.pointerEvents = '';
//         }}
//         data-slot="dialog-content"
//         onWheel={(e) => e.stopPropagation()}
//         className={contentClasses}
//         {...props}
//       >
//         {children}
//         <DialogPrimitive.Close className="ring-offset-background focus:ring-ring data-[state=open]:bg-accent data-[state=open]:text-muted-foreground absolute top-4 right-4 rounded-xs opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4">
//           <XIcon />
//           <span className="sr-only">Close</span>
//         </DialogPrimitive.Close>
//       </DialogPrimitive.Content>
//     </DialogPortal>
//   )
// }
//
// function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
//   return (
//     <div
//       data-slot="dialog-header"
//       className={cn("flex flex-col gap-2 text-center sm:text-left", className)}
//       {...props}
//     />
//   )
// }
//
// function DialogFooter({ className, ...props }: React.ComponentProps<"div">) {
//   return (
//     <div
//       data-slot="dialog-footer"
//       className={cn(
//         "flex flex-col-reverse gap-2 sm:flex-row sm:justify-end",
//         className
//       )}
//       {...props}
//     />
//   )
// }
//
// function DialogTitle({
//   className,
//   ...props
// }: React.ComponentProps<typeof DialogPrimitive.Title>) {
//   return (
//     <DialogPrimitive.Title
//       data-slot="dialog-title"
//       className={cn("text-lg leading-none font-semibold", className)}
//       {...props}
//     />
//   )
// }
//
// function DialogDescription({
//   className,
//   ...props
// }: React.ComponentProps<typeof DialogPrimitive.Description>) {
//   return (
//     <DialogPrimitive.Description
//       data-slot="dialog-description"
//       className={cn("text-muted-foreground text-sm", className)}
//       {...props}
//     />
//   )
// }
//
// export {
//   Dialog,
//   DialogClose,
//   DialogContent,
//   DialogDescription,
//   DialogFooter,
//   DialogHeader,
//   DialogOverlay,
//   DialogPortal,
//   DialogTitle,
//   DialogTrigger,
// }
