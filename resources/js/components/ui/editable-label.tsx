import * as React from "react"

import { cn } from "@/lib/utils"
import { useState } from "react";
import { Input } from "@headlessui/react";

export interface EditableLabelProps {
  value: string;
  className?: string;
  children: React.ReactNode;
  error?: string | null;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onSave?: (value: string) => void;
  onStartEditing?: () => void;
  onCancelEditing?: () => void;
  onChange?: (value?: string) => void;
}

export function EditableLabel({ className, error, onSave, onStartEditing, onCancelEditing, onChange, onCancel, onKeyDown, ...props }: EditableLabelProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(props.value ?? '');

  const startEditing = () => { 
    setValue(props.value ?? '');
    setIsEditing(true);
    onStartEditing?.();
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setValue('');
    onCancelEditing?.();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value);
    onChange?.(e.target.value);
  };

  const handleSave = () => {
    onSave?.(value);
    cancelEditing();
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    onKeyDown?.(e);
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      cancelEditing();
    }
  };

  if(isEditing) {
    return (
      <div className="flex-1">
        <Input
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onBlur={handleSave}
          className={cn(
            className,
            "h-[28px] w-full text-sm font-bold p-1 border-none focus-visible:ring-0 focus-visible:ring-offset-0",
            error && "border-red-500 focus:border-red-500"
          )}
          autoFocus
        />
        {error && (
          <div className="text-xs text-red-500 mt-1">{error}</div>
        )}
      </div>
    )
  }

  return (
    <div
      className={cn(className)}
      onClick={startEditing}
    >
      {props.children}
    </div>
  )
}

export { Input }
