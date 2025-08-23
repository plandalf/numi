import * as React from "react";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "./accordion";
import { Plus, Trash2, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./button";
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface AccordionSectionProps {
  items: unknown[];
  onAdd?: () => void;
  onDelete?: (index: number) => void;
  renderSection: (item: unknown, index: number) => React.ReactNode;
  getSectionTitle?: (item: unknown, index: number) => string;
  addLabel?: string;
  className?: string;
  enableDragAndDrop?: boolean;
  activeId?: string | number | null;
  overId?: string | number | null;
}

// Drop Indicator Component
function DropIndicator({ 
  isActive, 
  position 
}: { 
  isActive: boolean; 
  position: 'top' | 'bottom';
}) {
  if (!isActive) return null;

  return (
    <div 
      className={cn(
        "h-0.5 bg-blue-500 mx-4 transition-opacity duration-150",
        position === 'top' ? "-mb-0.5" : "-mt-0.5"
      )}
    />
  );
}

// Sortable Accordion Item Component
function SortableAccordionItem({
  item,
  index,
  renderSection,
  getSectionTitle,
  onDelete,
  open,
  enableDragAndDrop = false,
  activeId,
  overId,
}: {
  item: unknown;
  index: number;
  renderSection: (item: unknown, index: number) => React.ReactNode;
  getSectionTitle: (item: unknown, index: number) => string;
  onDelete?: (index: number) => void;
  open: string;
  enableDragAndDrop?: boolean;
  activeId?: string | number | null;
  overId?: string | number | null;
}) {
  const isOpen = open === `section-${index}`;
  const isDraggingDisabled = !enableDragAndDrop || isOpen; // Disable dragging when section is open

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: index.toString(), 
    disabled: isDraggingDisabled 
  });

  // Remove transition when not dragging to prevent jump-back animation
  const style = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging ? transition : 'none',
    opacity: isDragging ? 0.5 : 1,
  };

  const isBeingDraggedOver = overId === index.toString() && activeId !== overId && !isOpen; // Don't show drop indicators on open sections
  const currentIndexNum = parseInt(index.toString());
  const activeIndexNum = activeId ? parseInt(activeId.toString()) : -1;

  // Determine if we should show drop indicators
  const showTopIndicator = isBeingDraggedOver && activeIndexNum > currentIndexNum;
  const showBottomIndicator = isBeingDraggedOver && activeIndexNum < currentIndexNum;

  return (
    <>
      <DropIndicator isActive={showTopIndicator} position="top" />
      <AccordionItem
        ref={setNodeRef}
        style={style}
        key={index}
        value={`section-${index}`}
        className="rounded-lg border-none shadow-none space-y-2"
      >
        <AccordionTrigger
          className={cn(
            'flex items-center justify-between w-full pl-2 pr-3 py-2',
            'rounded-lg transition-colors group cursor-pointer',
            'no-underline hover:no-underline bg-gray-200 text-muted-foreground',
            'max-w-[300px] truncate overflow-hidden',
            isOpen && 'bg-teal-600 text-white',
            isBeingDraggedOver && 'ring-2 ring-blue-300 ring-opacity-50'
          )}
        >
          <div className="flex items-center flex-1 truncate">
            {enableDragAndDrop && !isOpen && ( // Only show drag handle when section is closed
              <div
                {...attributes}
                {...listeners}
                className="mr-2 p-1 cursor-grab active:cursor-grabbing opacity-50 group-hover:opacity-100 transition-opacity"
                style={{ touchAction: 'none' }}
                onClick={(e) => e.stopPropagation()}
              >
                <GripVertical className="h-4 w-4" />
              </div>
            )}
            <span className="font-medium text-sm text-left">{getSectionTitle(item, index)}</span>
          </div>
          {onDelete && (
            <div
              type="button"
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(index);
              }}
              className={cn(
                "p-1 ml-auto mr-2 h-6 w-6",
                isOpen ? "text-white hover:text-white/80" : "text-gray-500 hover:text-gray-700"
              )}
            >
              <Trash2 className="h-4 w-4" />
            </div>
          )}
        </AccordionTrigger>
        <AccordionContent className="bg-transparent rounded-b-lg">
          {renderSection(item, index)}
        </AccordionContent>
      </AccordionItem>
      <DropIndicator isActive={showBottomIndicator} position="bottom" />
    </>
  );
}

export const AccordionSection: React.FC<AccordionSectionProps> = ({
  items,
  onAdd,
  onDelete,
  renderSection,
  getSectionTitle = (item, i) => `Section ${i + 1}`,
  addLabel = "Add another section",
  className,
  enableDragAndDrop = false,
  activeId,
  overId,
}) => {
  const [open, setOpen] = React.useState<string>("");

  return (
    <div className={cn("w-full flex flex-col gap-2", className)}>
      <Accordion
        type="single"
        collapsible
        value={open}
        onValueChange={setOpen}
      >
        {items.map((item, i) => (
          <SortableAccordionItem
            key={enableDragAndDrop ? i : `section-${i}`}
            item={item}
            index={i}
            renderSection={renderSection}
            getSectionTitle={getSectionTitle}
            onDelete={onDelete}
            open={open}
            enableDragAndDrop={enableDragAndDrop}
            activeId={activeId}
            overId={overId}
          />
        ))}
      </Accordion>
      {onAdd && (
        <Button
          type="button"
          onClick={onAdd}
          className="w-full flex items-center justify-between gap-2 text-sm text-white py-4 rounded-lg transition"
        >
          {addLabel}
          <Plus className="w-4 h-4 ml-2" />
        </Button>
      )}
    </div>
  );
};
