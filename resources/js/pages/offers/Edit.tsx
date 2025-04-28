import AppOfferLayout from '@/layouts/app/app-offer-layout';
import { Block, Offer, ViewSection, type OfferView, type Page, type PageType } from '@/types/offer';
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
import { Label } from '@/components/ui/label';
import { useEffect, useState, useRef, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { MoreVertical, ArrowRightToLine, FileText, CheckSquare } from 'lucide-react';
import PagePreview from '@/components/offers/page-preview';
import PageFlowEditor from '@/components/offers/page-flow-editor';
import { ReactFlowProvider } from '@xyflow/react';
import update from "immutability-helper";
import { Type, SquareStack, Image, CreditCard, List } from 'lucide-react';
import { GlobalStateProvider } from '@/pages/Checkout';
import { DndContext, DragOverlay, useDraggable, closestCenter, DragStartEvent, useDroppable, useDndMonitor, DragPendingEvent, useSensor, PointerSensor, useSensors, rectIntersection, DragOverEvent, DragEndEvent } from "@dnd-kit/core";

import { blockTypes, getBlockMeta } from '@/components/blocks';
import { v4 as uuidv4 } from 'uuid';
import React, { createContext, useContext } from 'react';
import { Sidebar } from '@/components/offers/sidebar';
import { Theme } from '@/types/theme';
import { PageShare } from '@/components/offers/page-share';
import { CheckoutSession, IntegrationClient } from '@/types/checkout';


export interface EditProps {
    offer: Offer;
    fonts: string[];
    weights: string[];
    themes: Theme[];
    showNameDialog?: boolean;
}


const PAGE_TYPE_ICONS: Record<PageType, React.ReactNode> = {
    entry: <ArrowRightToLine className="w-4 h-4" />,
    page: <FileText className="w-4 h-4" />,
    ending: <CheckSquare className="w-4 h-4" />
};

// Add icons to block types
const BLOCK_ICONS = {
  'text': <Type className="w-4 h-4" />,
  'heading': <Type className="w-4 h-4 font-bold" />,
  'button': <SquareStack className="w-4 h-4" />,
  'image': <Image className="w-4 h-4" />,
  'payment': <CreditCard className="w-4 h-4" />,
  'list': <List className="w-4 h-4" />
};

// Block item component for the Editor sidebar
interface BlockItemProps {
  blockType: typeof blockTypes[keyof typeof blockTypes];
}

// note: tempaltes?

const BlockTemplateItem = ({ id, blockType }: BlockItemProps) => {

  const meta = getBlockMeta(id);

  const {
    attributes,
    listeners,
    setNodeRef,
  } = useDraggable({
    id: `template:${id}`,
  });

  const style = {
    border: '1px dashed black',
  };

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      style={style}
      className={cn(
        "flex items-center gap-2 p-2 rounded cursor-move border border-border hover:bg-muted transition-all",
      )}
    >
      <span className="text-muted-foreground">{BLOCK_ICONS[blockType.id as keyof typeof BLOCK_ICONS]}</span>
      <span className="text-sm">{meta.icon} {meta.title}</span>
    </div>
  );
};

// --- Editor Context ---
interface EditorContextType {
  data: any;
  setData: typeof setData;
  put: typeof put;
  processing: boolean;
  errors: any;
  setDefaults: typeof setDefaults;

  themes: Theme[];

  isNameDialogOpen: boolean;
  setIsNameDialogOpen: React.Dispatch<React.SetStateAction<boolean>>;

  selectedPage: string;
  setSelectedPage: React.Dispatch<React.SetStateAction<string>>;

  editingPageName: string | null;
  setEditingPageName: React.Dispatch<React.SetStateAction<string | null>>;

  pageNameInput: string;
  setPageNameInput: React.Dispatch<React.SetStateAction<string>>;

  showPageLogic: boolean;
  setShowPageLogic: React.Dispatch<React.SetStateAction<boolean>>;

  inputRef: React.RefObject<HTMLInputElement>;

  isRenamingFromDropdown: boolean;
  setIsRenamingFromDropdown: React.Dispatch<React.SetStateAction<boolean>>;

  showAddPageDialog: boolean;
  setShowAddPageDialog: React.Dispatch<React.SetStateAction<boolean>>;

  isReady: boolean;
  setIsReady: React.Dispatch<React.SetStateAction<boolean>>;

  selectedBlockId: string | null;
  setSelectedBlockId: React.Dispatch<React.SetStateAction<string | null>>;

  viewMode: 'editor' | 'preview' | 'share';
  setViewMode: React.Dispatch<React.SetStateAction<'editor' | 'preview' | 'share'>>;

  handleSave: () => void;
  handleNameSubmit: (e: React.FormEvent) => void;
  handlePageNameClick: (pageId: string, currentName: string) => void;
  handlePageNameSave: (pageId: string) => void;
  handlePageAction: (pageId: string, action: 'rename' | 'duplicate' | 'delete') => void;
  handlePageUpdate: (updatedPage: Page) => void;
  getOrderedPages: (view: OfferView) => [string, Page][];
  handleAddPage: (type: PageType) => void;
  offer: Offer;
  updateBlock: (block: Block) => void;
}

const EditorContext = createContext<EditorContextType | undefined>(undefined);

export function useEditor() {
  const ctx = useContext(EditorContext);
  if (!ctx) throw new Error('useEditor must be used within an EditorProvider');
  return ctx;
}

function EditorProvider({ offer, themes, showNameDialog, children }: React.PropsWithChildren<EditProps>) {
  // --- move all state/logic from Edit here ---
  const [isNameDialogOpen, setIsNameDialogOpen] = useState(false);
  const [selectedPage, setSelectedPage] = useState<string>(offer.view?.first_page);
  const [editingPageName, setEditingPageName] = useState<string | null>(null);
  const [pageNameInput, setPageNameInput] = useState("");
  const [showPageLogic, setShowPageLogic] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [isRenamingFromDropdown, setIsRenamingFromDropdown] = useState(false);
  const [showAddPageDialog, setShowAddPageDialog] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [viewMode, setViewMode] = useState<'editor' | 'preview' | 'share'>('editor');

  // const { data, setData, put, processing, errors, setDefaults } = useForm({
  //   name: offer.name,
  //   view: offer.view
  // });

  const [data, setData] = useState({
    name: offer.name,
    view: offer.view,
    theme: offer.theme,
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (showNameDialog) {
      setIsNameDialogOpen(true);
    }
  }, [showNameDialog]);

  useEffect(() => {
    if (!isReady) {
      setIsReady(true);
      return;
    }
    // put(route('offers.update', offer.id), {
    //   preserveScroll: true,
    //   onSuccess: (a) => {
    //     setDefaults();
    //   }
    // });
  }, [data]);

  const handleSave = useCallback(() => {}, [
    setData
  ]);

  const handleNameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    put(route('offers.update', offer.id), {
      onSuccess: () => setIsNameDialogOpen(false),
    });
  };

  const handlePageNameClick = (pageId: string, currentName: string) => {
    if (pageId === selectedPage) {
      setEditingPageName(pageId);
      setPageNameInput(currentName);
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 0);
    } else {
      setSelectedPage(pageId);
    }
  };

  const handlePageNameSave = (pageId: string) => {
    if (isRenamingFromDropdown) {
      setIsRenamingFromDropdown(false);
      return;
    }
    const updatedPages = {
      ...data.view.pages,
      [pageId]: {
        ...data.view.pages[pageId],
        name: pageNameInput
      }
    };
    setData(update(data, { view: { pages: { $set: updatedPages } }}));
    handleSave();
    setEditingPageName(null);
  };

  const handlePageAction = (pageId: string, action: 'rename' | 'duplicate' | 'delete') => {
    switch (action) {
      case 'rename':
        setIsRenamingFromDropdown(true);
        handlePageNameClick(pageId, data.view.pages[pageId].name);
        break;
      case 'duplicate':
        const sourcePage = data.view.pages[pageId];
        const newId = `page_${Math.random().toString(36).substr(2, 9)}`;
        const newPage = {
          ...sourcePage,
          id: newId,
          name: `${sourcePage.name} (Copy)`
        };
        const updatedPages = {
          ...data.view.pages,
          [newId]: newPage
        };
        setData(update(data, { view: { pages: { $set: updatedPages } }}));
        setTimeout(() => { handleSave(); }, 0);
        break;
      case 'delete':
        const pagesToUpdate = { ...data.view.pages };
        delete pagesToUpdate[pageId];
        Object.keys(pagesToUpdate).forEach(pageKey => {
          const page = pagesToUpdate[pageKey];
          if (page.next_page.default_next_page === pageId) {
            pagesToUpdate[pageKey] = {
              ...page,
              next_page: {
                ...page.next_page,
                default_next_page: null
              }
            };
          }
          if (page.next_page.branches) {
            pagesToUpdate[pageKey] = {
              ...page,
              next_page: {
                ...page.next_page,
                branches: page.next_page.branches.map((branch: { next_page: string | null }) =>
                  branch.next_page === pageId
                    ? { ...branch, next_page: null }
                    : branch
                )
              }
            };
          }
        });
        setData(update(data, { view: { pages: { $set: pagesToUpdate } }}));
        if (selectedPage === pageId) {
          const remainingPageIds = Object.keys(pagesToUpdate);
          if (remainingPageIds.length > 0) {
            const firstPageId = data.view.first_page;
            const newSelectedPageId = (firstPageId && pagesToUpdate[firstPageId])
              ? firstPageId
              : remainingPageIds[0];
            setSelectedPage(newSelectedPageId);
          }
        }
        setTimeout(() => { handleSave(); }, 0);
        break;
    }
  };

  const handlePageUpdate = (updatedPage: Page) => {
    if (!isReady) return;
    const updatedView = {
      ...data.view,
      pages: {
        ...data.view.pages,
        [selectedPage]: updatedPage
      }
    };
    setData(update(data, { view: { $set: updatedView }}));
  };

  const getOrderedPages = (view: OfferView): [string, Page][] => {
    const orderedPages: [string, Page][] = [];
    const visitedPages = new Set<string>();
    let currentPageId: string | null = view.first_page;
    while (currentPageId && view.pages[currentPageId] && !visitedPages.has(currentPageId)) {
      const currentPage: Page = view.pages[currentPageId];
      orderedPages.push([currentPageId, currentPage]);
      visitedPages.add(currentPageId);
      currentPageId = currentPage.next_page?.default_next_page ?? null;
    }
    Object.entries(view.pages).forEach(([pageId, page]) => {
      if (!visitedPages.has(pageId)) {
        orderedPages.push([pageId, page]);
        visitedPages.add(pageId);
      }
    });
    return orderedPages;
  };

  const handleAddPage = (type: PageType) => {
    const id = `page_${Math.random().toString(36).substr(2, 9)}`;
    const newPage: Page = {
      id,
      name: type === 'entry' ? 'Entry Page' : type === 'ending' ? 'Ending Page' : 'New Page',
      type,
      position: { x: 0, y: 0 },
      view: {
        promo: { blocks: [] },
        title: { blocks: [] },
        action: { blocks: [] },
        content: { blocks: [] }
      },
      layout: { sm: 'split-checkout@v1' },
      provides: [],
      next_page: {
        branches: [],
        default_next_page: null
      }
    };
    const updatedPages = {
      ...data.view.pages,
      [id]: newPage
    };
    const updatedView = {
      ...data.view,
      pages: updatedPages,
      first_page: Object.keys(data.view.pages).length === 0 ? id : data.view.first_page
    };
    setData(update(data, { view: { $set: updatedView }}));
    handleSave();
    setShowAddPageDialog(false);
  };

  const updateBlock = (block: Block) => {
    console.log('updateBlock', block)
    // set the entire page all at once
    // blocks is an array on the section

    // find block in all sections
    const page = {...data.view.pages[selectedPage]};

    const sectionId = Object.keys(page.view).find((section) => {
      const x = page.view[section].blocks.findIndex((b) => b.id === block.id)

      // console.log("🚵‍♀️", { section, x })
      if (x === -1) return false;

      return section;
    });

    if (!sectionId) return;

    const blockIndex = page.view[sectionId].blocks.findIndex((b) => b.id === block.id);

    console.log("🚵‍♀️", { sectionId, blockIndex })

    // page.view[section].blocks[blockIndex] = block;

    const thePage = update(page, { view: { [sectionId]: { blocks: { $set: page.view[sectionId].blocks.map((b, i) => i === blockIndex ? block : b) } } } });
    console.log("PAGE!", { page })
    // const thePage = update(page, { view: { [blockIndex]: { blocks: { $set: block } } } });
    // gotta find the section first

    if (blockIndex === -1) return;

    setData(update(data, { view: { pages: { [selectedPage]: { view: { $set: thePage.view } } } } }));

  }

  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);

  const value: EditorContextType = {
    data,
    setData,
    // put,
    // processing,
    errors,
    // setDefaults,
    isNameDialogOpen, setIsNameDialogOpen,
    selectedPage, setSelectedPage,
    editingPageName, setEditingPageName,
    pageNameInput, setPageNameInput,
    showPageLogic, setShowPageLogic,
    inputRef,
    isRenamingFromDropdown, setIsRenamingFromDropdown,
    showAddPageDialog, setShowAddPageDialog,
    isReady, setIsReady,
    handleSave,
    handleNameSubmit,
    handlePageNameClick,
    handlePageNameSave,
    handlePageAction,
    handlePageUpdate,
    getOrderedPages,
    handleAddPage,

    offer,
    themes,
    updateBlock,

    selectedBlockId, setSelectedBlockId,

    viewMode, setViewMode,

  };
  return <EditorContext.Provider value={value}>{children}</EditorContext.Provider>;
}

// --- Refactored Edit component ---
function Edit({ offer, themes, showNameDialog }: EditProps) {
  return (
    <EditorProvider offer={offer} themes={themes} showNameDialog={showNameDialog}>
      <EditApp />
    </EditorProvider>
  );
}

function parseDndId(id: string): { type: string; id: string } {
  const [type, ...rest] = id.split(":");
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

// --- Main App UI, now using useEditor() ---
function EditApp() {
  const {
    data,
    setData,
    processing,
    errors,
    setDefaults,
    isNameDialogOpen, setIsNameDialogOpen,
    selectedPage, setSelectedPage,
    editingPageName, setEditingPageName,
    pageNameInput, setPageNameInput,
    showPageLogic, setShowPageLogic,
    inputRef,
    isRenamingFromDropdown, setIsRenamingFromDropdown,
    showAddPageDialog, setShowAddPageDialog,
    isReady, setIsReady,
    handleSave,
    handleNameSubmit,
    handlePageNameClick,
    handlePageNameSave,
    handlePageAction,
    handlePageUpdate,
    getOrderedPages,
    handleAddPage,
    offer,

    selectedBlockId,
    setSelectedBlockId
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

  const [activeBlock, setActiveBlock] = useState<any>(null);

  function handleDragStart(event: DragStartEvent) {
    console.log('drag start', event);

    const [type, id] = event.active.id.split(':');

    setActiveItem({ type, id });

    if (type === 'template') {
      setPrototype(null);
    }
  }

  function setSections(newSections: ViewSection[]) {
    setData(update(data, { view: { pages: { [selectedPage]: { view: { $set: newSections } } } } }));
  }



  function handleDragOver(event: DragOverEvent) {
    console.log('drag over', event);
    if (!event.active || !event.over) return;

    const activeId = event.active.id;
    const overId = event.over.id;

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

        console.log('sectionIdx', sectionId);

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
          console.log('insertIdx', insertIdx);
          if (insertIdx === -1) insertIdx = sections[sectionId].blocks?.length;
        } else {
          insertIdx = sections[sectionId].blocks.length;
        }
        console.log('insertIdx', insertIdx);

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
          console.log('oldSectionIdx', oldSectionIdx);
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
          id: '__proto__',
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
      }
      return;
    }

    // --- BLOCK DRAG LOGIC ---
    if (activeType === 'block') {
      const sections = data.view.pages[selectedPage].view;

      // Find current section/block
      const fromSectionId = String(event.active.data.current?.sortable.containerId?.split(':')[1]);

      const blockIdx = findBlockIndexById(sections[fromSectionId]?.blocks || [], String(activeRawId));
      console.log('blockIdx', blockIdx);

      if (!fromSectionId || blockIdx === -1) return;
      let newSections = sections;

      // Remove block from old location
      newSections = update(newSections, {
        [fromSectionId]: {
          blocks: { $splice: [[blockIdx, 1]] }
        }
      });


      console.log('newSections', { fromSectionId, blockIdx, newSections });

      // Insert into new location
      if (overType === 'block') {
        const toSectionId = event.over.data.current?.sortable.containerId?.split(':')[1];

        const o =  event.over.data ;
        console.log("🧑‍🎤 ", { toSectionId, newSections,o, overRawId })

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

        console.log('abc', newSections, toSectionId, newSections[toSectionId])

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
            content: {
            }
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
              <div>
                <h3>{activeItem?.type} : {activeItem?.id} </h3>
                {/* <pre>{JSON.stringify(activeItemData, null, 2)}</pre> */}
              </div>
            )}
          </DragOverlay>
          <div className="flex flex-grow border-dashed border-1 border-red-500 h-[calc(100vh-60px)]">
            <Sidebar />
            <MainContent />
          </div>
        </DndContext>

      </GlobalStateProvider>

      {/* Page Logic Dialog */}
      <PageLogicDialog />

      <AddPageDialog />

      <EditNameDialog />

      {/* <div className="text-xs absolute bottom-0 w-[500px] right-0 border-t border-border bg-white h-full overflow-scroll">
        <pre>{JSON.stringify(data.view.pages[selectedPage], null, 2)}</pre>
      </div> */}
    </AppOfferLayout>
  );
}

function MainContent() {
  const {
    data,
    selectedPage,
    handlePageUpdate,
    viewMode,
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
    data, setData, processing, errors, setDefaults,
    isNameDialogOpen, setIsNameDialogOpen,
    selectedPage, setSelectedPage,
    editingPageName, setEditingPageName,
    pageNameInput, setPageNameInput,
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
            {getOrderedPages(data.view).map(([pageId, page]) => (
              <div
                key={pageId}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap",
                  selectedPage === pageId
                    ? "bg-white border-1 border-teal-600"
                    : "bg-transparent border-none"
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
                      "h-6 px-1 py-0 w-[120px]",
                      selectedPage === pageId
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-secondary-foreground"
                    )}
                  />
                ) : (
                  <button
                    onClick={() => handlePageNameClick(pageId, page.name)}
                    className="focus:outline-none flex items-center gap-2"
                  >
                    <span className="text-muted-foreground">
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
            {/* <button
              onClick={() => setShowAddPageDialog(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium bg-secondary text-secondary-foreground hover:bg-secondary/90"
            >
              <Plus className="w-4 h-4" />
              Add Page
            </button> */}
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

    const { showPageLogic, setShowPageLogic, data } = useEditor();

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
                console.log('Flow editor changes:', changes);
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

function EditNameDialog() {

    const { isNameDialogOpen, setIsNameDialogOpen, data, setData, handleNameSubmit, errors, processing } = useEditor();

  return (
    <Dialog open={isNameDialogOpen} onOpenChange={setIsNameDialogOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Name your offer</DialogTitle>
          <DialogDescription>
            Give your offer a name that describes what you're selling.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleNameSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={data.name}
              onChange={e => setData('name', e.target.value)}
              placeholder="Enter offer name"
              autoFocus
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name}</p>
            )}
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              disabled={processing}
            >
              Save
            </button>
          </div>
        </form>
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
