import * as React from "react";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "./accordion";
import { CircleChevronRight, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./button";

interface AccordionSectionProps {
  items: any[];
  onAdd?: () => void;
  onDelete?: (index: number) => void;
  renderSection: (item: any, index: number) => React.ReactNode;
  getSectionTitle?: (item: any, index: number) => string;
  addLabel?: string;
  className?: string;
}

export const AccordionSection: React.FC<AccordionSectionProps> = ({
  items,
  onAdd,
  onDelete,
  renderSection,
  getSectionTitle = (item, i) => `Section ${i + 1}`,
  addLabel = "Add another section",
  className,
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
          <AccordionItem
            key={i}
            value={`section-${i}`}
            className="rounded-lg border-none shadow-none space-y-4"
          >
            <AccordionTrigger
              className={cn(
                'flex items-center justify-between w-full px-4 py-3',
                'rounded-lg transition-colors group cursor-pointer',
                'no-underline hover:no-underline bg-gray-200 text-muted-foreground',
                open === `section-${i}` && 'bg-teal-600 text-white'
              )}
            >
              <span className="font-medium text-sm text-left">{getSectionTitle(item, i)}</span>
              {onDelete && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(i);
                  }}
                  className={cn(
                    "p-1 ml-auto mr-2 h-6 w-6",
                    open === `section-${i}` ? "text-white hover:text-white/80" : "text-gray-500 hover:text-gray-700"
                  )}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </AccordionTrigger>
            <AccordionContent className="bg-transparent rounded-b-lg">
              {renderSection(item, i)}
            </AccordionContent>
          </AccordionItem>
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
