import * as React from "react";
import { TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { DialogDescription, DialogTitle } from "../ui/dialog";
import { DialogContent, DialogHeader } from "../ui/dialog";
import { useEditor } from "@/contexts/offer/editor-context";
import { Block, PageView } from "@/types/offer";
import { allElementTypes } from './page-elements';
import { cn } from "@/lib/utils";
import { ChevronRight, CircleChevronRight, DiamondPlus, EyeOff, SquarePlus } from "lucide-react";
import { Button } from "../ui/button";
import { Dialog, DialogTrigger } from "../ui/dialog";
import { Tabs } from "../ui/tabs";
import { StringEditor } from "../editor/string-editor";
import { EnumerationEditor } from "../editor/enumeration-editor";
import { useState } from "react";
import { router } from "@inertiajs/react";
import { Separator } from "../ui/separator";

export interface PageLayersProps {
  onAddNewElementClick: () => void;
}

export const PageLayers: React.FC<PageLayersProps> = ({ onAddNewElementClick }) => {
  const {
    organizationTemplates,
    data,
    selectedPage,
    selectedBlockId,
    setSelectedBlockId,
    selectedSectionId,
    setSelectedSectionId,
    setHoveredBlockId,
    setHoveredSectionId,
    theme,
  } = useEditor();

  // Helper function to get block type title from page-elements
  const getBlockTypeTitle = (blockType: string): string => {
    const element = allElementTypes.find(el => el.type === blockType);
    return element?.title ?? blockType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const [dialogOpen, setDialogOpen] = useState(false);
  const [layerTemplateTab, setLayerTemplateTab] = useState<'new' | 'saved'>('new');
  const [templateName, setTemplateName] = useState('');
  const [templateNameError, setTemplateNameError] = useState<string | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [selectTemplateError, setSelectTemplateError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Get sections and blocks for the selected page
  const page = data.view.pages[selectedPage];
  const sections: { id: string; name: string; blocks: Block[]; hidden?: boolean }[] = [];

  if (page && page.view) {
    Object.entries(page.view as PageView).forEach(([sectionId, section]) => {
      if (section && Array.isArray(section.blocks)) {
        sections.push({
          id: sectionId,
          name: section?.label ?? sectionId.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
          blocks: section.blocks,
          hidden: section?.style?.hidden as boolean | undefined ?? false
        });
      }
    });
  }

  // Sort sections in chronological order
  const sortedSections = sections.sort((a, b) => {
    const order = ['title', 'content', 'action', 'promo_box', 'promo_header', 'promo_content'];

    // Get index from order array, return -1 if not found
    const getOrderIndex = (id: string): number => {
      return order.findIndex(section => id.toLowerCase() === section);
    };

    const aIndex = getOrderIndex(a.id);
    const bIndex = getOrderIndex(b.id);

    // If both sections are not in the order array, maintain their relative position
    if (aIndex === -1 && bIndex === -1) return 0;

    // If one section is not in order array, put it at the end
    if (aIndex === -1) return 1;
    if (bIndex === -1) return -1;

    // Sort by index in order array
    return aIndex - bIndex;
  });

  const closeDialog = () => {
    setDialogOpen(false);
    setTemplateName('');
    setTemplateNameError(null);
    setSelectedTemplateId('');
    setSelectTemplateError(null);
  }

  const handleSaveTemplate = () => {
    if (!selectedTemplateId) {
      setSelectTemplateError('Please select a template to update to.');
      return;
    }

    setSelectTemplateError(null);
    setSaving(true);

    router.put(route('templates.update', selectedTemplateId), {
      view: JSON.stringify(data.view),
      theme: theme,
      ...(data?.screenshot?.url && {
        preview_images: [data.screenshot.url]
      }),
    }, {
      onSuccess: () => {
        setSaving(false);
        closeDialog();
      },
      onError: (e) => {
        console.log(e);
        setSaving(false);
        closeDialog();
      },
    });
  };

  const handleCreateTemplate = () => {
    if (!templateName.trim()) {
      setTemplateNameError('Template name is required.');
      return;
    }

    setTemplateNameError(null);
    setSaving(true);

    router.post(route('templates.store'), {
      name: templateName,
      view: JSON.stringify(data.view),
      theme: theme,
      ...(data?.screenshot?.url && {
        preview_images: [data.screenshot.url]
      }),
     }, {
      onSuccess: () => {
        setSaving(false);
        closeDialog();
      },
      onError: () => {
        setSaving(false);
        closeDialog();
      },
    });
  }

  return (
    <div className="flex flex-col h-full">
      <div
        className="flex-1 overflow-y-auto p-4"
        onClick={(e) => {
          // Clear hover states when clicking on empty areas
          if (e.target === e.currentTarget) {
            setHoveredBlockId(null);
            setHoveredSectionId(null);
          }
        }}
      >
        <div className="flex flex-col">
          {sortedSections.length === 0 ? (
            <div className="text-muted-foreground text-center py-8">No sections on this page.</div>
          ) : (
            sortedSections.map((section, index) => (
                <React.Fragment key={section.id}>
                  {index > 0 && <Separator className="my-2" />}
                  <div className="flex flex-col gap-2 mb-2">
                    <div
                      className={cn(
                        "pt-2 pb-1 pl-2 transition-all group cursor-pointer flex flex-row items-center gap-x-2 w-full",
                        selectedSectionId === section.id && 'ring-2 ring-primary bg-primary/10',
                        section.hidden && 'opacity-50'
                      )}
                      onClick={() => {
                        setSelectedSectionId(section.id);
                        setHoveredSectionId(null);
                        setHoveredBlockId(null);
                      }}
                      onMouseEnter={() => setHoveredSectionId(section.id)}
                      onMouseLeave={() => setHoveredSectionId(null)}
                    >
                      <span className="font-bold text-base text-black/90 flex items-center gap-x-2">
                        {section.hidden && <EyeOff className="w-4 h-4 text-muted-foreground" />}
                        {section.name}
                      </span>
                      <ChevronRight className="w-4 h-4 text-black/90 group-hover:ml-1 transition-all" />
                    </div>
                    {section.blocks.length > 0 && (
                      <div className="flex flex-col gap-2 pl-4">
                        {section.blocks.map((block) => {
                          const blockTypeTitle = getBlockTypeTitle(block.type);
                          return (
                            <button
                              key={block.id}
                              className={cn(
                                'flex items-center justify-between w-full px-4 py-2 rounded-lg bg-[#EBEFFF] hover:bg-[#EBEFFF]/75 transition-colors group cursor-pointer',
                                selectedBlockId === block.id && 'ring-2 ring-primary bg-primary/10'
                              )}
                              onClick={() => {
                                setSelectedBlockId(block.id);
                                setHoveredBlockId(null);
                                setHoveredSectionId(null);
                              }}
                              onMouseEnter={() => setHoveredBlockId(block.id)}
                              onMouseLeave={() => setHoveredBlockId(null)}
                              type="button"
                            >
                              <div className="flex items-center justify-between w-full">
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-sm text-left text-black group-hover:text-black transition-colors">
                                    {block.id}
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    {blockTypeTitle}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <CircleChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-black transition-all group-hover:mr-1" />
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </React.Fragment>
              )
            )
          )}
        </div>
        <Button
          variant="default"
          className="w-full mt-4 \"
          onClick={onAddNewElementClick}
        >
          <span>Add another element</span>
          <DiamondPlus className="w-4 h-4" />
        </Button>
      </div>
      <div className="p-4 flex-shrink-0">
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild className="w-full flex items-center justify-between">
            <Button
              variant="outline"
              className="w-full flex items-center justify-between"
              type="button"
            >
              Save experience as a new template
              <SquarePlus className="w-4 h-4 text-muted-foreground" />
            </Button>
          </DialogTrigger>
          <DialogContent className="w-[400px]">
            <DialogHeader>
              <DialogTitle>Save experience as a new template</DialogTitle>
            </DialogHeader>
            <DialogDescription>
              <Tabs value={layerTemplateTab} onValueChange={v => setLayerTemplateTab(v as 'new' | 'saved')} className="w-full">
                <TabsList className="grid grid-cols-2">
                  <TabsTrigger value="new" disabled={saving}>Create new template</TabsTrigger>
                  <TabsTrigger value="saved" disabled={saving}>Update to existing</TabsTrigger>
                </TabsList>
                <TabsContent value="new" className="space-y-3">
                  <StringEditor
                    value={templateName}
                    onChange={v => setTemplateName(v)}
                    placeholder="e.g. My Template"
                  />
                  {templateNameError && <div className="text-xs text-red-500">{templateNameError}</div>}
                  <Button
                    variant="default"
                    className="w-full flex items-center"
                    type="button"
                    onClick={handleCreateTemplate}
                    disabled={saving}
                  >
                    {saving
                      ? 'Creating...'
                      : 'Create Template'
                    }
                  </Button>
                  <div className="text-sm text-muted-foreground">
                    Save this template to use it on other experiences.
                  </div>
                </TabsContent>
                <TabsContent value="saved" className="space-y-3">
                  <EnumerationEditor
                    placeholder="Select a template"
                    value={selectedTemplateId}
                    onChange={setSelectedTemplateId}
                    options={organizationTemplates.map(t => t.id)}
                    labels={organizationTemplates.reduce((acc, t) => ({
                      ...acc,
                      [t.id]: t.name
                    }), {})}
                  />
                  {selectTemplateError && <div className="text-xs text-red-500">{selectTemplateError}</div>}
                  <Button
                    variant="default"
                    className="w-full flex items-center"
                    type="button"
                    onClick={handleSaveTemplate}
                    disabled={saving}
                  >
                    {saving
                      ? 'Updating...'
                      : 'Update Template'
                    }
                  </Button>
                  <div className="text-sm text-muted-foreground">
                    Save this experience to an existing template.
                  </div>
                </TabsContent>
              </Tabs>
            </DialogDescription>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
