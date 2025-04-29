import * as React from "react";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "./accordion";
import { CircleChevronRight, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./button";

interface AccordionSectionProps {
  items: any[];
  onAdd?: () => void;
  renderSection: (item: any, index: number) => React.ReactNode;
  getSectionTitle?: (item: any, index: number) => string;
  addLabel?: string;
  className?: string;
}

export const AccordionSection: React.FC<AccordionSectionProps> = ({
  items,
  onAdd,
  renderSection,
  getSectionTitle = (item, i) => `Section ${i + 1}`,
  addLabel = "Add another section",
  className,
}) => {
  const [open, setOpen] = React.useState<string>(items.length ? `section-0` : "");

  React.useEffect(() => {
    if (items.length && !open) {
      setOpen(`section-0`);
    }
  }, [items.length]);

  return (
    <div className={cn("w-full flex flex-col gap-2", className)}>
      <Accordion
        type="single"
        collapsible
        value={open}
        onValueChange={setOpen}
        className="rounded-xl space-y-2"
      >
        {items.map((item, i) => (
          <AccordionItem
            key={i}
            value={`section-${i}`}
            className="rounded-lg border-none shadow-none"
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
            </AccordionTrigger>
            <AccordionContent className="bg-white rounded-b-lg">
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