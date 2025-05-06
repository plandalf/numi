import { TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { DialogDescription, DialogTitle } from "../ui/dialog";
import { DialogContent, DialogHeader } from "../ui/dialog";
import { useEditor } from "@/contexts/offer/editor-context";
import { Block } from "@/types/offer";
import { blockTypes, getBlockMeta } from '@/components/blocks';
import { cn } from "@/lib/utils";
import { CircleChevronRight, DiamondPlus, SquarePlus } from "lucide-react";
import { Button } from "../ui/button";
import { Dialog, DialogTrigger } from "../ui/dialog";
import { Tabs } from "../ui/tabs";
import { StringEditor } from "../editor/string-editor";
import { EnumerationEditor } from "../editor/enumeration-editor";
import { useState } from "react";
import { router } from "@inertiajs/react";

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
  } = useEditor();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [layerTemplateTab, setLayerTemplateTab] = useState<'new' | 'saved'>('new');
  const [templateName, setTemplateName] = useState('');
  const [templateNameError, setTemplateNameError] = useState<string | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [selectTemplateError, setSelectTemplateError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  
  // Get blocks for the selected page
  const page = data.view.pages[selectedPage];
  const blocks: Block[] = [];
  if (page && page.view) {
    Object.values(page.view).forEach((section: any) => {
      if (section && Array.isArray(section.blocks)) {
        blocks.push(...section.blocks);
      }
    });
  }

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
      view: data.view,
      theme: data.theme,
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
      view: data.view,
      theme: data.theme,
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
      <div className="flex-1 overflow-y-auto p-4">
        <div className="flex flex-col gap-3">
          {blocks.length === 0 ? (
            <div className="text-muted-foreground text-center py-8">No blocks on this page.</div>
          ) : (
            blocks.map((block, idx) => {
              const meta = getBlockMeta(block.type as keyof typeof blockTypes);
              return (
                <button
                  key={block.id}
                  className={cn(
                    'flex items-center justify-between w-full px-4 py-2 rounded-lg bg-[#EBEFFF] hover:bg-[#EBEFFF]/75 transition-colors group cursor-pointer',
                    selectedBlockId === block.id && 'ring-2 ring-primary bg-primary/10'
                  )}
                  onClick={() => setSelectedBlockId(block.id)}
                  type="button"
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="font-medium text-sm text-left text-black/90">
                      {meta?.title ?? block.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} {blocks.length > 1 ? idx + 1 : ''}
                    </span>
                    <CircleChevronRight className="w-4 h-4 text-muted-foreground" />
                  </div>
                </button>
              );
            })
          )}
        </div>
        <Button
          variant="default"
          className="w-full mt-6 bg-gray-900 text-white hover:bg-gray-800 flex items-center justify-center gap-2"
          onClick={onAddNewElementClick}
        >
          <span>Add another element</span>
          <DiamondPlus className="w-4 h-4" />
        </Button>
      </div>
      <div className="p-4 flex-shrink-0">
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger className="w-full">
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
              <DialogTitle  >Save experience as a new template</DialogTitle>
            </DialogHeader>
            <DialogDescription>
              <Tabs value={layerTemplateTab} onValueChange={v => setLayerTemplateTab(v as 'new' | 'saved')} className="w-full">
                <TabsList className="grid grid-cols-2">
                  <TabsTrigger value="new" disabled={saving}>Create new theme</TabsTrigger>
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
                    Save this theme to use it on other experiences.
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
