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
  placeholder?: string;
  className?: string;
  selected?: string | string[];
  onSelect?: (value: string | string[]) => void;
  hideSearch?: boolean;
  required?: boolean;
  multiple?: boolean;
} & PopoverProps;

export function Combobox({
  items,
  placeholder = "Select",
  className,
  onSelect,
  selected: defaultSelected = "",
  hideSearch = true,
  required = false,
  multiple = false,
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
      return values
        .map((v) => items.find((item) => item.value === v)?.label)
        .filter(Boolean);
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
          className={cn(
            "w-full justify-between",
            required &&
              (!value || (Array.isArray(value) && value.length === 0)) &&
              "border-red-500",
            className,
          )}
        >
          <span className="truncate">
            {getSelectedLabels().length > 0
              ? getSelectedLabels().join(", ")
              : placeholder}
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
