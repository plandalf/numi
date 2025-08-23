import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { getAllLayouts } from "@/config/layouts";
import { Page, PageType } from "@/types/offer";
import { useState, useEffect } from "react";
import { PAGE_TYPES } from "../page-type-dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

export interface PageEditorDialogPayload {
  type: PageType;
  pageName?: string;
  layout?: string;
}

export interface PageEditorDialogConfig {
  hideTypeSelector?: boolean;
  hideLayoutSelector?: boolean;
  hidePageNameInput?: boolean;
  disabledTypes?: PageType[];
}

export interface PageEditorDialogCopy {
  title?: string;
  description?: string;
  editingTitle?: string;
  editingDescription?: string;
}

export interface PageEditorDialogProps {
  open: boolean;
  onOpenChange: (value: boolean) => void;
  values?: PageEditorDialogPayload;
  onSubmit?: (props: PageEditorDialogPayload) => void;
  currentPage?: Page;
  config?: PageEditorDialogConfig;
  copy?: PageEditorDialogCopy;
}

export function PageEditorDialog({
  open,
  onOpenChange,
  values,
  onSubmit,
  currentPage,
  config,
  copy
} : PageEditorDialogProps) {
  
  const { 
    disabledTypes = []
  } = config || {};

  const { 
    title = 'Add New Page',
    description = 'Select a new type for this page', 
    editingTitle = 'Edit Page',
    editingDescription = 'Choose the type of page you want to change'
  } = copy || {};

    const [selectedType, setSelectedType] = useState<PageType | null>(values?.type ?? null);
    const [selectedLayout, setSelectedLayout] = useState<string>(values?.layout ?? 'promo');
    const [pageName, setPageName] = useState<string>(values?.pageName ?? '');
  
    const isEditing = currentPage != undefined;
  
    const availableLayouts = getAllLayouts();
  
    const handleSubmit = () => {
      if (!selectedType) return;
      
      onSubmit?.({ pageName, type: selectedType, layout: selectedLayout });
      onOpenChange(false);
    };
  
    // Reset state when dialog opens/closes
    useEffect(() => {
      if (open) {
        setSelectedType(currentPage?.type ?? values?.type ?? null);
        setSelectedLayout(currentPage?.layout?.sm ?? values?.layout ?? 'promo');
        setPageName(currentPage?.name ?? values?.pageName ?? '');
      }
    }, [open, currentPage?.type, currentPage?.name]);
  
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="w-full sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{isEditing ? editingTitle : title}</DialogTitle>
            <DialogDescription>
              {isEditing ? editingDescription : description}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div>
              <label className="text-sm font-medium mb-3 block">Page Type</label>
              <div className="grid grid-cols-4 gap-4">
                {PAGE_TYPES.map(({ type, label, icon }) => (
                  <button
                    key={type}
                    onClick={() => setSelectedType(type)}
                    className={cn(
                      "cursor-pointer flex flex-col items-center gap-2 p-4 rounded-lg border border-border hover:bg-secondary/50",
                      "disabled:cursor-not-allowed disabled:opacity-50",
                      selectedType === type && "bg-secondary border-primary",
                      // disabledOptions.includes(type) && ""
                    )}
                    disabled={disabledTypes.includes(type)}
                  >
                    {icon}
                    <span className="text-sm font-medium">{label}</span>
                  </button>
              ))}
              </div>
            </div>
  
            {!isEditing && (
              <>
                <div>
                  <label className="text-sm font-medium mb-3 block">Page Name</label>
                  <Input
                    value={pageName}
                    onChange={(e) => setPageName(e.target.value)}
                    placeholder="Enter page name..."
                    className="w-full"
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-3 block">Layout</label>
                  <Select value={selectedLayout} onValueChange={setSelectedLayout}>
                    <SelectTrigger className="w-full h-12">
                      <SelectValue placeholder="Select a layout" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableLayouts.map((layout) => {
                        const IconComponent = layout.icon;
                        return (
                          <SelectItem key={layout.id} value={layout.id}>
                            <div className="h-10 flex items-center gap-4">
                              <IconComponent className="w-4 h-4" />
                              <div className="items-start flex flex-col">
                                <div className="font-medium">{layout.name}</div>
                                <div className="text-xs text-muted-foreground">{layout.description}</div>
                              </div>
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
  
            <div className="flex justify-end gap-3">
              <button
                onClick={() => onOpenChange(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={!selectedType}
                className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isEditing ? 'Update Page' : 'Create Page'}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }