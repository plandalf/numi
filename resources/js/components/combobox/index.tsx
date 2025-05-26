"use client";

import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { PopoverProps } from "@radix-ui/react-popover";

export type ComboboxProps = {
  items: {
    value: string;
    label: string;
  }[];
  placeholderIcon?: React.ReactNode;
  placeholder?: string;
  className?: string;
  selected?: string | string[];
  onSelect?: (value: string | string[]) => void;
  hideSearch?: boolean;
  required?: boolean;
  multiple?: boolean;
  disabled?: boolean;
} & PopoverProps;

export function Combobox({
  items,
  placeholder = "Select",
  placeholderIcon,
  className,
  onSelect,
  selected: defaultSelected = "",
  hideSearch = true,
  required = false,
  multiple = false,
  disabled = false,
  ...props
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [value, setValue] = React.useState<string | string[]>(
    multiple
      ? Array.isArray(defaultSelected)
        ? defaultSelected
        : []
      : defaultSelected,
  );

  React.useEffect(() => {
    setValue(
      multiple
        ? Array.isArray(defaultSelected)
          ? defaultSelected
          : []
        : defaultSelected,
    );
  }, [defaultSelected, multiple]);

  const handleSelect = (selectedValue: string) => {
    if (required && !selectedValue) return;

    if (multiple) {
      const currentValues = Array.isArray(value) ? value : [];
      const newValues = currentValues.includes(selectedValue)
        ? currentValues.filter((v) => v !== selectedValue)
        : [...currentValues, selectedValue];
      setValue(newValues);
      onSelect?.(newValues);
    } else {
      setValue(selectedValue);
      onSelect?.(selectedValue);
    }
  };

  const getSelectedLabels = () => {
    if (multiple) {
      const values = Array.isArray(value) ? value : [];
      const selectedLabels = values
        .map((v) => items.find((item) => item.value === v)?.label)
        .filter(Boolean) as string[];

      if (selectedLabels.length <= 2) {
        return selectedLabels;
      }

      return [`${selectedLabels[0]}, ${selectedLabels[1]}, +${selectedLabels.length - 2}`];
    }
    return value
      ? [items.find((item) => item.value === value)?.label].filter(Boolean)
      : [];
  };

  return (
    <Popover open={open} onOpenChange={setOpen} {...props}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-required={required}
          disabled={disabled}
          className={cn(
            "w-full justify-between overflow-hidden",
            required &&
              (!value || (Array.isArray(value) && value.length === 0)) &&
              "border-red-500",
            disabled && "opacity-50 cursor-not-allowed",
            className,
          )}
        >
          <span className="truncate flex-1 text-left">
            {getSelectedLabels().length > 0
              ? multiple && Array.isArray(value) && value.length > 2
                ? (() => {
                    const labels = value
                      .slice(0, 2)
                      .map(v => items.find(item => item.value === v)?.label)
                      .filter(Boolean);
                    return `${labels.join(", ")} +${value.length - 2}`;
                  })()
                : getSelectedLabels().join(", ")
              : 
              (<span className={cn(
                  "flex flex-row gap-2 items-center",
                  placeholderIcon && "justify-center",
                  !placeholderIcon && "justify-start"
                )}>
                  {placeholderIcon}
                  {placeholder}
                </span>
              )
            }
            {required &&
              (!value || (Array.isArray(value) && value.length === 0)) && (
                <span className="text-red-500 ml-1">*</span>
              )}
          </span>
          <ChevronsUpDown className="opacity-50 ml-2 flex-shrink-0" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="p-0"
        style={{ width: "var(--radix-popover-trigger-width)" }}
        align="start"
      >
        <Command>
          {!hideSearch && (
            <CommandInput placeholder={placeholder} className="h-9" />
          )}
          <CommandList>
            <CommandEmpty>No results found</CommandEmpty>
            <CommandGroup>
              {multiple && (
                <>
                  <CommandItem
                    value="select-all"
                    onSelect={() => {
                      const allValues = items.map((item) => item.value);
                      setValue(allValues);
                      onSelect?.(allValues);
                    }}
                  >
                    Select All
                    <Check
                      className={cn(
                        "ml-auto",
                        Array.isArray(value) && value.length === items.length
                          ? "opacity-100"
                          : "opacity-0",
                      )}
                    />
                  </CommandItem>
                  <CommandItem
                    value="deselect-all"
                    onSelect={() => {
                      setValue([]);
                      onSelect?.([]);
                    }}
                  >
                    Deselect All
                    <Check
                      className={cn(
                        "ml-auto",
                        Array.isArray(value) && value.length === 0
                          ? "opacity-100"
                          : "opacity-0",
                      )}
                    />
                  </CommandItem>
                </>
              )}
              {items.map((item) => (
                <CommandItem
                  key={item.value}
                  value={item.value}
                  onSelect={(currentValue) => {
                    handleSelect(currentValue);
                    if (!multiple) {
                      setOpen(false);
                    }
                  }}
                >
                  {item.label}
                  <Check
                    className={cn(
                      "ml-auto",
                      multiple
                        ? Array.isArray(value) && value.includes(item.value)
                          ? "opacity-100"
                          : "opacity-0"
                        : value === item.value
                          ? "opacity-100"
                          : "opacity-0",
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
