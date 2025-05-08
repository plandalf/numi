import AppOfferLayout from '@/layouts/app/app-offer-layout';
import { Block, Offer, Price, Product, ViewSection, type OfferView, type Page, type PageType } from '@/types/offer';
import { Head } from '@inertiajs/react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from '@/components/ui/input';
import { useContext, useState } from 'react';
import { cn } from '@/lib/utils';
import { MoreVertical, ArrowRightToLine, FileText, CheckSquare, Plus } from 'lucide-react';
import PagePreview from '@/components/offers/page-preview';
import PageFlowEditor from '@/components/offers/page-flow-editor';
import { ReactFlowProvider } from '@xyflow/react';
import update from "immutability-helper";
import { CreditCard } from 'lucide-react';
import { GlobalStateProvider } from '@/pages/checkout-main';
import { DndContext, DragOverlay, DragStartEvent, useSensor, PointerSensor, useSensors, rectIntersection, DragOverEvent, DragEndEvent } from "@dnd-kit/core";

import { v4 as uuidv4 } from 'uuid';
import React from 'react';
import { Sidebar } from '@/components/offers/sidebar';
import { Theme } from '@/types/theme';
import { PageShare } from '@/components/offers/page-share';
import { CheckoutSession, IntegrationClient } from '@/types/checkout';
import { EditorProvider, useEditor } from '@/contexts/offer/editor-context';
import { Template } from '@/types/template';
import { PageProps } from '@inertiajs/core';

import { allElementTypes, CustomElementIcon } from '@/components/offers/page-elements';
export interface EditProps extends PageProps {
    offer: Offer;
    fonts: string[];
    weights: string[];
    organizationThemes: Theme[];
    organizationTemplates: Template[];
    globalThemes: Theme[];
    showNameDialog?: boolean;
    products: Product[];
}

const PAGE_TYPE_ICONS: Record<PageType, React.ReactNode> = {
    entry: <ArrowRightToLine className="w-4 h-4" />,
    page: <FileText className="w-4 h-4" />,
    ending: <CheckSquare className="w-4 h-4" />,
    payment: <CreditCard className="w-4 h-4" />
};

function Edit({ offer, organizationThemes, organizationTemplates, globalThemes, showNameDialog }: EditProps) {
  return (
    <EditorProvider
      offer={offer}
      organizationThemes={organizationThemes}
      organizationTemplates={organizationTemplates}
      globalThemes={globalThemes}
      showNameDialog={showNameDialog}
    >
      <EditApp />
    </EditorProvider>
  );
}

function parseDndId(id: string): { type: string; id: string } {
  const [type, ...rest] = id?.split(":") || [];
  return { type, id: rest.join(":") };
}


function findSectionIndexById(sections, sectionId: string) {
  return sections[sectionId]
}

function findBlockIndexById(blocks: Block[], blockId: string) {
  return blocks.findIndex((block: Block) => block.id === blockId);
}

function getOverBlockIndex(section: ViewSection, overBlockId: string) {
  return section.blocks.findIndex((block: Block) => block.id === overBlockId);
}

function EditApp() {
  const {
    data,
    setData,
    selectedPage,
    offer,
  } = useEditor();

  const session: CheckoutSession = {
    id: '123',
    line_items: [
      {
        id: '123',
        slot: '123',
        name: '123',
        quantity: 1,
        subtotal: 100,
        taxes: 10,
        shipping: 5,
        discount: 10,
        total: 105,
      }
    ],
    currency: 'USD',
    subtotal: 100,
    discount: 10,
    total: 105,
    metadata: {},
    integration_client: IntegrationClient.STRIPE,
    status: 'open',
    taxes: 10,
    shipping: 5
  }
  const [prototype, setPrototype] = useState<null | { sectionId: string; index: number }>();
  const [activeItem, setActiveItem] = useState<any>(null);

  function setSections(newSections: ViewSection[]) {
    setData(update(data, { view: { pages: { [selectedPage]: { view: { $set: newSections } } } } }));
  }

  function handleDragStart(event: DragStartEvent) {
    // console.log('drag start', event);

    const [type, id] = event.active.id.split(':');

    setActiveItem({ type, id });

    if (type === 'template') {
      setPrototype(null);
    }
  }

  function handleDragOver(event: DragOverEvent) {

    const activeId = event.active.id;
    const overId = event.over?.id;

    const { type: activeType, id: activeRawId } = parseDndId(activeId);
    const { type: overType, id: overRawId } = parseDndId(overId);

    // active = the currently dragging item
    // over   = the item that the currently dragging item is over

    const sections = data.view.pages[selectedPage].view;

    // --- TEMPLATE DRAG LOGIC ---
    if (activeType === 'template') {
      // Only add prototype if over a block or section
      if (overType === 'block' || overType === 'section') {
        const sectionId = overType === 'block'
          ? String(event.over.data.current?.sortable.containerId.split(':')[1])
          : String(overRawId);

        // console.log('sectionIdx', sectionId);

        if (!sectionId) {
          // if the section is not found, remove the prototype if it exists
          if (prototype) {
            // Remove previous prototype if any
            let newSections = sections;
            const oldSectionIdx = findSectionIndexById(newSections, prototype.sectionId);
            if (oldSectionIdx !== -1) {
              newSections = update(newSections, {
                [oldSectionIdx]: {
                  blocks: { $splice: [[prototype.index, 1]] }
                }
              });
              setSections(newSections);
            }
            setPrototype(null);
          }
          return;
        }

        let insertIdx = null;
        if (overType === 'block') {
          insertIdx = getOverBlockIndex(sections[sectionId], overRawId);
          // console.log('insertIdx', insertIdx);
          if (insertIdx === -1) insertIdx = sections[sectionId].blocks?.length;
        } else {
          insertIdx = sections[sectionId].blocks.length;
        }
        // console.log('insertIdx', insertIdx);

        // If prototype is already at the correct position, do nothing
        if (prototype && prototype.sectionId === sectionId
          && prototype.index === insertIdx
        ) {
          return;
        }

        // Remove previous prototype if any
        let newSections = sections;
        if (prototype) {
          const oldSectionIdx = prototype.sectionId;
          // console.log('oldSectionIdx', oldSectionIdx);
          if (oldSectionIdx) {
            newSections = update(newSections, {
              [oldSectionIdx]: {
                blocks: { $splice: [[prototype.index, 1]] }
              }
            });
          }
        }
        // Insert prototype
        const protoBlock: BlockData = {
          id: uuidv4(),
          object: 'block',
          type: activeRawId,
          content: {
            value: '*new block*',
            format: 'markdown',
          }
        };


        newSections = update(newSections, {
          [sectionId]: {
            blocks: { $splice: [[insertIdx, 0, protoBlock]] }
          }
        });
        setPrototype({ sectionId, index: insertIdx });
        setSections(newSections);
      } else {
        // Not over a valid drop target, remove prototype if it exists
        if (prototype) {
          let newSections = sections;
          newSections = update(newSections, {
            [prototype.sectionId]: {
              blocks: { $splice: [[prototype.index, 1]] }
            }
          });
          setSections(newSections);
          // if (oldSectionIdx !== -1) {
          // }
          setPrototype(null);
        }
      }
      return;
    }

    // --- BLOCK DRAG LOGIC ---
    if (activeType === 'block') {
      const sections = data.view.pages[selectedPage].view;

      // Find current section/block
      const fromSectionId = String(event.active.data.current?.sortable?.containerId?.split(':')[1]);

      if (!fromSectionId) return;

      const blockIdx = findBlockIndexById(sections[fromSectionId]?.blocks || [], String(activeRawId));


      if (!fromSectionId || blockIdx === -1) return;
      let newSections = sections;

      // Remove block from old location
      newSections = update(newSections, {
        [fromSectionId]: {
          blocks: { $splice: [[blockIdx, 1]] }
        }
      });

      // Insert into new location
      if (overType === 'block') {
        const toSectionId = event.over.data.current?.sortable?.containerId?.split(':')[1];

        if (!toSectionId) return;

        const overBlockIdx = getOverBlockIndex(newSections[toSectionId], overRawId);
        if (toSectionId === -1 || overBlockIdx === -1) return;
        // Insert before or after depending on pointer position (y axis)
        // For simplicity, always insert before for now (can enhance with pointer position)
        const block = sections[fromSectionId]?.blocks?.[blockIdx];
        if (!block) return;
        newSections = update(newSections, {
          [toSectionId]: {
            blocks: { $splice: [[overBlockIdx, 0, block]] }
          }
        });
      } else if (overType === 'section') {
        const toSectionId = overRawId;

        if (!toSectionId) return;

        const block = sections[fromSectionId]?.blocks?.[blockIdx];
        if (!block) return;

        // console.log('abc', newSections, toSectionId, newSections[toSectionId])

        newSections = update(newSections, {
          [toSectionId]: {
            blocks: { $push: [block] }
          }
        });
      }
      setSections(newSections);
      return;
    }
  }

  function handleDragEnd(event: DragEndEvent) {

    if (!event.active) return;


    const activeId = String(event.active.id);
    const { type: activeType, id: activeRawId } = parseDndId(activeId);

    const sections = data.view.pages[selectedPage].view;
    const sectionId = event.over?.data.current?.sortable.containerId.split(':')[1];
    const section = sections[sectionId];
    let newSections = sections;

    // --- TEMPLATE DROP ---
    if (activeType === 'template') {
      if (prototype) {
        // Replace prototype with real block
        if (sectionId) {
          const newBlock: BlockData = {
            id: uuidv4(),
            type: activeRawId,
            object: 'block',
            content: {}
          };

          newSections = update(newSections, {
            [sectionId]: {
              blocks: { $splice: [[prototype.index, 1, newBlock]] }
            }
          });
        }
      }
      setPrototype(null);
      setSections(newSections);
      setActiveItem(null);
      return;
    }

    // --- BLOCK DROP ---
    if (activeType === 'block') {
      // No-op: all logic handled in dragOver for live reordering
      setActiveItem(null);
      return;
    }

    setActiveItem(null);
  }

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 10 }
    })
  )

  if (!data.view) {
    return <div>Loading...</div>;
  }

  return (
    <AppOfferLayout offer={offer}>
      <Head title={`Edit ${offer.name || 'Untitled Offer'}`} />

      <GlobalStateProvider offer={data} session={session}>

        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragOver={handleDragOver}
          collisionDetection={rectIntersection}
        >
          <DragOverlay dropAnimation={null}>
            {activeItem && (
              <DragOverlayPreview item={activeItem}/>
            )}
          </DragOverlay>
          <div className="flex flex-grow h-[calc(100vh-60px)]">
            <Sidebar />
            <MainContent />
          </div>
        </DndContext>

      </GlobalStateProvider>

      {/* Page Logic Dialog */}
      <PageLogicDialog />

      <AddPageDialog />

      {/* <div className="text-xs absolute bottom-0 w-[500px] right-0 border-t border-border bg-white h-full overflow-scroll">
        <pre>{JSON.stringify(data.view.pages[selectedPage], null, 2)}</pre>
      </div> */}
    </AppOfferLayout>
  );
}

function DragOverlayPreview({ item }: { item: any }) {

  if (item.type === 'template') {
    const type = allElementTypes.find(t => t.type === item.id);
    return (
      <div

        className={cn(
          'flex flex-col items-center justify-center rounded-md cursor-move transition-all min-h-20 w-full'
        )}
      >
        <div className="flex items-center justify-center bg-slate-800 rounded-md w-full h-14 mb-2">
        <span className="text-white">
          <CustomElementIcon type={item.id} />
        </span>
        </div>
        <span className="text-sm text-black">{type?.title || item.id}</span>
      </div>
    )
  }

  // todo: the preview

  return (
    <div>
      <h3>{item?.type} : {item?.id} </h3>
      {/* <pre>{JSON.stringify(activeItemData, null, 2)}</pre> */}
    </div>
  );
}

function MainContent() {
  const {
    data,
    selectedPage,
    handlePageUpdate,
    viewMode
  } = useEditor();

  const isShareMode = viewMode === 'share';

  return (
    <div className="flex-1 flex flex-col min-w-0 relative">
      {/* Preview Area - Make it fill the available space */}
      <div className="absolute inset-0 bottom-[68px] overflow-hidden">
      <div className="h-full bg-[#F7F9FF]">
          {isShareMode ? (
            <PageShare />
          ) : (
            <PagePreview
              page={data.view.pages[selectedPage]}
              onUpdatePage={handlePageUpdate}
            />
          )}
        </div>
      </div>

      {/* Toolbar */}
      <Toolbar />
    </div>
  )
}

function Toolbar() {
  const {
    data,
    inputRef,
    selectedPage,
    editingPageName, setEditingPageName,
    pageNameInput, setPageNameInput,
    setIsRenamingFromDropdown,
    setShowAddPageDialog,
    handlePageNameSave,
    handlePageNameClick,
    handlePageAction,
    getOrderedPages,
    viewMode,
  } = useEditor();

  return (
    <div className="absolute bottom-0 left-0 right-0 bg-[#F7F9FF]">
      <div className="p-4">
        <div className={cn(
          "flex items-center transition-all duration-300",
          viewMode === 'preview' ? "justify-center" : "justify-between"
        )}>
          <div className="flex items-center gap-2 overflow-x-auto">
            <button
              onClick={() => setShowAddPageDialog(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium bg-transparent text-secondary-foreground hover:bg-white border-1 border-gray-300/50 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Add Page
            </button>
            {getOrderedPages(data.view).map(([pageId, page]) => (
              <div
                key={pageId}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap ",
                  selectedPage === pageId
                    ? "bg-white border-1 border-teal-600"
                    : "bg-transparent border-none cursor-pointer"
                )}
              >
                {editingPageName === pageId ? (
                  <Input
                    ref={inputRef}
                    value={pageNameInput}
                    onChange={(e) => setPageNameInput(e.target.value)}
                    onBlur={() => handlePageNameSave(pageId)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        setIsRenamingFromDropdown(false);
                        handlePageNameSave(pageId);
                      } else if (e.key === 'Escape') {
                        setIsRenamingFromDropdown(false);
                        setEditingPageName(null);
                      }
                    }}
                    className={cn(
                      "h-5 px-1 py-0 w-[100px]",
                      "focus:!outline-none focus:!ring-0 focus:!ring-offset-0",
                      "!shadow-none !border-none !outline-none !ring-none",
                    )}
                  />
                ) : (
                  <button
                    onClick={() => handlePageNameClick(pageId, page.name)}
                    className="focus:outline-none flex items-center gap-2 cursor-pointer"
                  >
                    <span className="text-muted-foreground ">
                      {PAGE_TYPE_ICONS[page.type]}
                    </span>
                    {page.name}
                  </button>
                )}

                {selectedPage === pageId && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="focus:outline-none">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handlePageAction(pageId, 'rename')}>
                        Rename
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handlePageAction(pageId, 'duplicate')}>
                        Duplicate
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handlePageAction(pageId, 'delete')}
                        className="text-destructive"
                      >
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            ))}
          </div>

          {/* <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Layout:</span>
              <span className="text-sm font-medium">{data.view.pages[selectedPage].layout.sm}</span>
            </div>

            {data.view.pages[selectedPage].next_page?.default_next_page && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Next:</span>
                <span className="text-sm font-medium">{data.view.pages[data.view.pages[selectedPage].next_page.default_next_page].name}</span>
              </div>
            )}

            <button
              onClick={() => setShowPageLogic(true)}
              className="flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-secondary/90 bg-secondary rounded-md"
            >
              <Share2 className="w-4 h-4" />
              Page Logic
            </button>
          </div> */}
        </div>
      </div>
    </div>
  )
}

function PageLogicDialog() {

    const { showPageLogic, setShowPageLogic, data, setData, handleSave } = useEditor();

  return (
    <Dialog open={showPageLogic} onOpenChange={setShowPageLogic}>
      <DialogContent className="w-screen h-screen flex flex-col p-0 m-0 rounded-none sm:max-w-none">
        <div className="border-b border-border p-6">
          <DialogHeader>
            <DialogTitle>Page Logic</DialogTitle>
            <DialogDescription>
              Configure the flow between pages and define branch conditions
            </DialogDescription>
          </DialogHeader>
        </div>
        <div className="flex-1">
          <ReactFlowProvider>
            <PageFlowEditor
              view={data.view}
              onUpdateFlow={(changes) => {
                // console.log('Flow editor changes:', changes);
                setData(update(data, { view: { $set: changes }}));

                // Submit the update to backend
                console.log('Submitting update to backend...');
                handleSave();
              }}
            />
          </ReactFlowProvider>
        </div>
      </DialogContent>
    </Dialog>
  )
}


function AddPageDialog() {

    const { showAddPageDialog, setShowAddPageDialog, handleAddPage } = useEditor();

  return (
    <Dialog open={showAddPageDialog} onOpenChange={setShowAddPageDialog}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Page</DialogTitle>
          <DialogDescription>
            Choose the type of page you want to add
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-3 gap-4 py-4">
          <button
            onClick={() => handleAddPage('entry')}
            className="flex flex-col items-center gap-2 p-4 rounded-lg border border-border hover:bg-secondary/50"
          >
            <ArrowRightToLine className="w-6 h-6" />
            <span className="text-sm font-medium">Entry Page</span>
          </button>
          <button
            onClick={() => handleAddPage('page')}
            className="flex flex-col items-center gap-2 p-4 rounded-lg border border-border hover:bg-secondary/50"
          >
            <FileText className="w-6 h-6" />
            <span className="text-sm font-medium">Content Page</span>
          </button>
          <button
            onClick={() => handleAddPage('ending')}
            className="flex flex-col items-center gap-2 p-4 rounded-lg border border-border hover:bg-secondary/50"
          >
            <CheckSquare className="w-6 h-6" />
            <span className="text-sm font-medium">Ending Page</span>
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default Edit;
