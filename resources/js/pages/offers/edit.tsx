import AppOfferLayout from '@/layouts/app/app-offer-layout';
import { Block, Offer, Product, ViewSection, type PageType } from '@/types/offer';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getAllLayouts } from '@/config/layouts';
import { useState, useRef, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { MoreVertical, ArrowRightToLine, FileText, CheckSquare, Plus, BookmarkIcon } from 'lucide-react';
import PagePreview from '@/components/offers/page-preview';
import PageFlowEditor from '@/components/offers/page-flow-editor';
import { ReactFlowProvider } from '@xyflow/react';
import update from "immutability-helper";
import { CreditCard } from 'lucide-react';
import { GlobalStateProvider, NavigationProvider, useNavigation } from '@/pages/checkout-main';
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
import { blockTypes } from '@/components/blocks';
import { Font } from '@/types';
import axios from '@/lib/axios';
import WebFont from 'webfontloader';
import { PageIframePreview } from '@/components/offers/page-iframe-preview';
import { computeInclusiveTaxes } from '@/utils/editor-session';
import { PageEditorDialog, PageEditorDialogPayload } from '@/components/offers/dialogs/page-editor-dialog';

export interface EditProps extends PageProps {
  offer: Offer;
  theme: Theme;
  fonts: Font[];
  weights: string[];
  organizationThemes: Theme[];
  organizationTemplates: Template[];
  globalThemes: Theme[];
  showNameDialog?: boolean;
  products: Product[];
  publishableKey?: string;
}

const PAGE_TYPE_ICONS: Record<PageType, React.ReactNode> = {
  entry: <ArrowRightToLine className="w-4 h-4" />,
  page: <FileText className="w-4 h-4" />,
  ending: <CheckSquare className="w-4 h-4" />,
  payment: <CreditCard className="w-4 h-4" />
};

interface ActiveDndItem {
  type: string;
  id: string;
}

function Edit({ offer, theme, organizationThemes, organizationTemplates, globalThemes, showNameDialog, fonts, publishableKey }: EditProps) {

  WebFont.load({
    google: {
      families: fonts?.reduce<string[]>((items, font) => {
        return [...items, `${font.name}:${font.weights.join(',')}`];
      }, []),
    },
  });

  return (
    <EditorProvider
      offer={offer}
      theme={theme}
      organizationThemes={organizationThemes}
      organizationTemplates={organizationTemplates}
      globalThemes={globalThemes}
      showNameDialog={showNameDialog}
    >
      <EditApp publishableKey={publishableKey} />
    </EditorProvider>
  );
}

function parseDndId(id: string | undefined): { type: string | null; id: string | null } {
  if (typeof id !== 'string') return { type: null, id: null };
  const parts = id.split(":");
  const type = parts[0] || null;
  const rest = parts.slice(1).join(":") || null;
  return { type, id: rest };
}


function findSectionByBlockId(sections: Record<string, ViewSection>, blockId: string): string | null {
  for (const sectionId in sections) {
    if (sections[sectionId].blocks?.find(b => b.id === blockId)) {
      return sectionId;
    }
  }
  return null;
}

function findBlockIndexById(blocks: Block[] | undefined, blockId: string): number {
  return blocks?.findIndex((block: Block) => block.id === blockId) ?? -1;
}

function getOverBlockIndex(section: ViewSection | undefined, overBlockId: string): number {
  return section?.blocks?.findIndex((block: Block) => block.id === overBlockId) ?? -1;
}

function EditApp({ publishableKey }: { publishableKey: string | undefined }) {
  const {
    data,
    setData,
    selectedPage,
    offer,
    setSelectedBlockId,
    handlePageNameClick,
    showPageTypeDialog,
    setShowPageTypeDialog,
    handleAddPage,
    handlePageTypeChange,
    editingPageId,
  } = useEditor();

  const lineItems = useMemo(() => offer.items.filter(item => item.is_required).map(item => {
    const defaultPrice = item.prices.find(price => price.id === item.default_price_id);

    // const exclusiveTaxes = computeExclusiveTaxes(item, 1, defaultPrice);
    const inclusiveTaxes = computeInclusiveTaxes(item, 1, defaultPrice);

    return {
      id: item.id,
      name: defaultPrice?.name || defaultPrice?.product?.name || item.name,
      is_highlighted: item.is_highlighted,
      // is_tax_inclusive: item.is_tax_inclusive,
      // tax_rate: item.tax_rate,
      currency: defaultPrice?.currency || 'USD',
      quantity: 1,
      subtotal: defaultPrice?.amount ?? 0,
      taxes: 0,
      // exclusive_taxes: 0,
      inclusive_taxes: inclusiveTaxes,
      shipping: 0,
      discount: 0,
      total: defaultPrice?.amount ?? 0,
      product: defaultPrice?.product,
      price: defaultPrice,
      type: item.type,

    }
  }), [offer.items]);

  const session: CheckoutSession = useMemo(() => ({
    id: '123',
    line_items: lineItems,
    currency: lineItems[0]?.currency || 'USD',
    subtotal: lineItems.reduce((acc, item) => Number(acc) + Number(item.subtotal), 0),
    discount: 0,
    total: lineItems.reduce((acc, item) => Number(acc) + Number(item.total), 0),
    metadata: {},
    integration_client: IntegrationClient.STRIPE,
    status: 'open',
    intent_type: 'payment',
    // taxes: lineItems.reduce((acc, item) => Number(acc) + Number(item.taxes), 0),
    inclusive_taxes: lineItems.reduce((acc, item) => Number(acc) + Number(item.inclusive_taxes ?? 0), 0),
    // exclusive_taxes: lineItems.reduce((acc, item) => Number(acc) + Number(item.exclusive_taxes ?? 0), 0),
    publishable_key: publishableKey,
    properties: {},
    taxes: 0,
    shipping: 0,
  }), [lineItems, publishableKey]);


  const [prototype, setPrototype] = useState<null | { sectionId: string; index: number; block: Block }>();
  const [activeItem, setActiveItem] = useState<ActiveDndItem | null>(null);
  const dragOverRafRef = useRef<number | null>(null); // Ref for requestAnimationFrame

  function generateIdForBlockType(type: string) {
    // Convert snake_case to camelCase
    const camelCaseType = type
      .split('_')
      .map((word, index) => {
        if (index === 0) {
          return word.toLowerCase();
        }
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      })
      .join('');

    // Collect all existing IDs for blocks of this type
    const existingIds = new Set<string>();
    const existingNumbers: number[] = [];

    // Iterate through all pages and sections to find existing IDs
    Object.values(data.view.pages).forEach(page => {
      Object.values(page.view).forEach(section => {
        if (section.blocks) {
          section.blocks.forEach(block => {
            if (block.type === type && block.id) {
              existingIds.add(block.id);

              // Extract number suffix if it matches our pattern
              const regex = new RegExp(`^${camelCaseType}(\\d+)$`);
              const match = block.id.match(regex);
              if (match) {
                existingNumbers.push(parseInt(match[1], 10));
              }
            }
          });
        }
      });
    });

    // Find the next available number
    let nextNumber = 1;

    if (existingNumbers.length > 0) {
      // Sort numbers to find gaps or get the next sequential number
      existingNumbers.sort((a, b) => a - b);

      // Look for the first gap in the sequence
      for (let i = 1; i <= existingNumbers[existingNumbers.length - 1] + 1; i++) {
        const proposedId = `${camelCaseType}${i}`;
        if (!existingIds.has(proposedId)) {
          nextNumber = i;
          break;
        }
      }
    }

    return `${camelCaseType}${nextNumber}`;
  }

  function setSections(newSectionsForPage: Record<string, ViewSection> | ((currentSections: Record<string, ViewSection>) => Record<string, ViewSection>)) {
    setData(currentEditorData => {
      const currentSectionsOfPage = currentEditorData.view.pages[selectedPage]?.view;
      if (!currentSectionsOfPage && typeof newSectionsForPage === 'function') {
        // This case should ideally not happen if selectedPage is always valid and has a view.
        // If it does, we can't compute newSections if it's a function needing currentSections.
        // console.warn('setSections called with a function but current page view is undefined');
        return currentEditorData;
      }

      const sectionsToSet = typeof newSectionsForPage === 'function'
        ? newSectionsForPage(currentSectionsOfPage || {}) // Provide empty if current is undefined, though guarded above.
        : newSectionsForPage;

      return update(currentEditorData, {
        view: {
          pages: {
            [selectedPage]: {
              view: { $set: sectionsToSet }
            }
          }
        }
      });
    });
  }

  function handleDragStart(event: DragStartEvent) {
    const { type, id } = parseDndId(String(event.active.id));
    if (type && id) {
      setActiveItem({ type, id });
      if (type === 'template' || type === 'reusable') {
        setPrototype(null); // Clear prototype when a new template or library drag starts
      }
    } else {
      setActiveItem(null);
    }
  }

  function handleDragOver(event: DragOverEvent) {
    if (!activeItem) return;

    const { id: activeId, type: activeType } = activeItem;
    const overIdRaw = event.over?.id;

    if (!activeId || !activeType) return;

    if (activeType === 'template' || activeType === 'reusable') {
      if (dragOverRafRef.current) {
        cancelAnimationFrame(dragOverRafRef.current);
      }
      dragOverRafRef.current = requestAnimationFrame(() => {
        // Use setData's callback to get the freshest currentEditorData
        setData(currentEditorData => {
          const currentSectionsFromData = currentEditorData.view.pages[selectedPage]?.view;
          if (!currentSectionsFromData) return currentEditorData; // Should have a view

          const { type: overTypeOriginal, id: overElementIdOriginal } = parseDndId(overIdRaw ? String(overIdRaw) : undefined);

          if (prototype && overElementIdOriginal === prototype.block.id) {
            return currentEditorData; // No change if hovering over self
          }

          let modifiedSections = { ...currentSectionsFromData };
          let prototypeActuallyChangedOrMoved = false;
          let newPrototypeState: { sectionId: string; index: number; block: Block } | null = null;

          if (prototype) {
            const oldProtoSection = modifiedSections[prototype.sectionId];
            if (oldProtoSection?.blocks &&
              prototype.index < oldProtoSection.blocks.length &&
              oldProtoSection.blocks[prototype.index]?.id === prototype.block.id) {
              modifiedSections = update(modifiedSections, {
                [prototype.sectionId]: {
                  blocks: { $splice: [[prototype.index, 1]] }
                }
              });
            }
          }

          if (overTypeOriginal === 'block' || overTypeOriginal === 'section') {
            const targetSectionId = overTypeOriginal === 'block'
              ? String(event.over?.data.current?.sortable.containerId?.split(':')[1])
              : overElementIdOriginal;

            if (targetSectionId && modifiedSections[targetSectionId]) {
              let insertIdx: number;
              const targetSectionForIndexCalc = modifiedSections[targetSectionId];
              if (overTypeOriginal === 'block' && overElementIdOriginal) {
                insertIdx = getOverBlockIndex(targetSectionForIndexCalc, overElementIdOriginal);
                if (insertIdx === -1) {
                  insertIdx = targetSectionForIndexCalc.blocks?.length ?? 0;
                }
              } else {
                insertIdx = targetSectionForIndexCalc.blocks?.length ?? 0;
              }
              const protoBlock: Block = {
                id: `prototype-${uuidv4()}`,
                object: 'block',
                type: activeId,
                content: { value: '*new block*', format: 'markdown' },
                appearance: {},
              };
              modifiedSections = update(modifiedSections, {
                [targetSectionId]: {
                  blocks: { $splice: [[insertIdx, 0, protoBlock]] }
                }
              });
              newPrototypeState = { sectionId: targetSectionId, index: insertIdx, block: protoBlock };
            }
          }

          if (prototype?.block.id !== newPrototypeState?.block.id ||
            prototype?.index !== newPrototypeState?.index ||
            prototype?.sectionId !== newPrototypeState?.sectionId ||
            (!prototype && newPrototypeState) ||
            (prototype && !newPrototypeState)
          ) {
            setPrototype(newPrototypeState); // This is a React state setter, it's fine.
            prototypeActuallyChangedOrMoved = true;
          }

          if (prototypeActuallyChangedOrMoved) {
            // Return the updated editor data for setData
            return update(currentEditorData, {
              view: {
                pages: {
                  [selectedPage]: {
                    view: { $set: modifiedSections }
                  }
                }
              }
            });
          }
          return currentEditorData; // No change to data if prototype didn't change
        });
      });
      return;
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    if (dragOverRafRef.current) {
      cancelAnimationFrame(dragOverRafRef.current);
      dragOverRafRef.current = null;
    }
    if (!activeItem) {
      setPrototype(null);
      return;
    }

    if (activeItem.type !== 'template' && activeItem.type !== 'reusable' && !event.over) {
      if ((activeItem.type === 'template' || activeItem.type === 'reusable') && prototype) {
        // If template drag ended nowhere, remove prototype (using callback form of setSections)
        setSections(currentSections => {
          if (!prototype || !currentSections[prototype.sectionId]) return currentSections;
          const oldProtoSection = currentSections[prototype.sectionId];
          if (oldProtoSection?.blocks && prototype.index < oldProtoSection.blocks.length && oldProtoSection.blocks[prototype.index]?.id === prototype.block.id) {
            return update(currentSections, {
              [prototype.sectionId]: {
                blocks: { $splice: [[prototype.index, 1]] }
              }
            });
          }
          return currentSections;
        });
      }
      setPrototype(null);
      setActiveItem(null);
      return;
    }

    const { id: activeBlockId, type: activeTypeCalculated } = activeItem;

    // --- TEMPLATE DROP (NEW BLOCK) ---
    if (activeTypeCalculated === 'template') {
      if (prototype && prototype.sectionId) {
        const newBlockToAdd: Block = {
          id: generateIdForBlockType(prototype.block.type),
          object: 'block',
          type: prototype.block.type,
          content: {},
          appearance: prototype.block.appearance,
        };

        // Use setData callback form to ensure we're working with the latest state
        setData(currentEditorData => {
          const sectionsForCurrentPage = currentEditorData.view.pages[selectedPage]?.view;
          if (!sectionsForCurrentPage || !prototype || !sectionsForCurrentPage[prototype.sectionId!]) {
            // console.warn("Section not found in handleDragEnd for template drop, prototype might be stale or section removed.");
            return currentEditorData;
          }

          let targetIndex = prototype.index;
          const currentBlocksInTargetSection = sectionsForCurrentPage[prototype.sectionId!]?.blocks || [];

          // Clamp targetIndex to be within valid bounds for splice
          if (targetIndex > currentBlocksInTargetSection.length) {
            targetIndex = currentBlocksInTargetSection.length;
          }

          let operation;
          // Check if the prototype is actually at the targetIndex in the current data state
          if (targetIndex < currentBlocksInTargetSection.length && currentBlocksInTargetSection[targetIndex]?.id === prototype.block.id) {
            operation = { $splice: [[targetIndex, 1, newBlockToAdd]] }; // Replace prototype
          } else {
            operation = { $splice: [[targetIndex, 0, newBlockToAdd]] }; // Insert new block
          }

          return update(currentEditorData, {
            view: {
              pages: {
                [selectedPage]: {
                  view: { // This 'view' is Record<string, ViewSection>
                    [prototype.sectionId!]: {
                      blocks: operation // operation is {$splice: ...}
                    }
                  }
                }
              }
            }
          } as any); // Using 'as any' temporarily to bypass complex type issue for immutability-helper
        });
        setSelectedBlockId(newBlockToAdd.id);
      } else if (prototype) {
        // Prototype exists but sectionId is invalid. Attempt to clean up visual prototype from current data.
        setSections(currentSections => {
          if (!prototype || !currentSections[prototype.sectionId]) return currentSections;
          // ... (similar cleanup as above for !event.over) ...
          const oldProtoSection = currentSections[prototype.sectionId];
          if (oldProtoSection?.blocks && prototype.index < oldProtoSection.blocks.length && oldProtoSection.blocks[prototype.index]?.id === prototype.block.id) {
            return update(currentSections, {
              [prototype.sectionId]: {
                blocks: { $splice: [[prototype.index, 1]] }
              }
            });
          }
          return currentSections;
        });
      }
      setPrototype(null);
      setActiveItem(null);
      return;
    }

    // --- REUSABLE BLOCK DROP (SAVED BLOCK) ---
    if (activeTypeCalculated === 'reusable') {
      if (prototype && prototype.sectionId) {
        // Fetch the saved block configuration and create new block
        const fetchAndCreateReusableBlock = async () => {
          try {
            const response = await axios.post(`/reusable-blocks/${activeBlockId}/use`);
            const reusableBlock = response.data.configuration;

            const newBlockToAdd: Block = {
              ...reusableBlock,
              id: generateIdForBlockType(reusableBlock.type),
            };

            // Use setData callback form to ensure we're working with the latest state
            setData(currentEditorData => {
              const sectionsForCurrentPage = currentEditorData.view.pages[selectedPage]?.view;
              if (!sectionsForCurrentPage || !prototype || !sectionsForCurrentPage[prototype.sectionId!]) {
                return currentEditorData;
              }

              let targetIndex = prototype.index;
              const currentBlocksInTargetSection = sectionsForCurrentPage[prototype.sectionId!]?.blocks || [];

              // Clamp targetIndex to be within valid bounds for splice
              if (targetIndex > currentBlocksInTargetSection.length) {
                targetIndex = currentBlocksInTargetSection.length;
              }

              let operation;
              // Check if the prototype is actually at the targetIndex in the current data state
              if (targetIndex < currentBlocksInTargetSection.length && currentBlocksInTargetSection[targetIndex]?.id === prototype.block.id) {
                operation = { $splice: [[targetIndex, 1, newBlockToAdd]] }; // Replace prototype
              } else {
                operation = { $splice: [[targetIndex, 0, newBlockToAdd]] }; // Insert new block
              }

              return update(currentEditorData, {
                view: {
                  pages: {
                    [selectedPage]: {
                      view: {
                        [prototype.sectionId!]: {
                          blocks: operation
                        }
                      }
                    }
                  }
                }
              } as any);
            });
            setSelectedBlockId(newBlockToAdd.id);
          } catch (error) {
            console.error('Failed to load reusable block:', error);
            // Clean up prototype on error
            setSections(currentSections => {
              if (!prototype || !currentSections[prototype.sectionId]) return currentSections;
              const oldProtoSection = currentSections[prototype.sectionId];
              if (oldProtoSection?.blocks && prototype.index < oldProtoSection.blocks.length && oldProtoSection.blocks[prototype.index]?.id === prototype.block.id) {
                return update(currentSections, {
                  [prototype.sectionId]: {
                    blocks: { $splice: [[prototype.index, 1]] }
                  }
                });
              }
              return currentSections;
            });
          }
        };

        fetchAndCreateReusableBlock();
      } else if (prototype) {
        // Prototype exists but sectionId is invalid. Clean up.
        setSections(currentSections => {
          if (!prototype || !currentSections[prototype.sectionId]) return currentSections;
          const oldProtoSection = currentSections[prototype.sectionId];
          if (oldProtoSection?.blocks && prototype.index < oldProtoSection.blocks.length && oldProtoSection.blocks[prototype.index]?.id === prototype.block.id) {
            return update(currentSections, {
              [prototype.sectionId]: {
                blocks: { $splice: [[prototype.index, 1]] }
              }
            });
          }
          return currentSections;
        });
      }
      setPrototype(null);
      setActiveItem(null);
      return;
    }

    // --- EXISTING BLOCK DROP --- (Requires event.over to be valid)
    // This part also needs to be use the setData callback form if it modifies data
    if (!event.over) {
      setActiveItem(null);
      return;
    }

    if (activeTypeCalculated === 'block' && activeBlockId && event.over) { // Ensure event.over is present for this logic
      const overIdRawLocal = String(event.over.id); // Make sure to use event.over.id for parsing
      const { type: overTypeLocal, id: overElementIdLocal } = parseDndId(overIdRawLocal);


      // Ensure overElementId is valid before proceeding
      if (!overElementIdLocal) {
        // console.warn("DragEnd: Over element ID is null after parsing, cannot drop existing block.");
        setActiveItem(null);
        return;
      }

      setData(currentEditorData => {
        const sectionsForCurrentPage = currentEditorData.view.pages[selectedPage]?.view;
        if (!sectionsForCurrentPage) {
          // console.warn("DragEnd: Sections not found for current page when dropping existing block.");
          return currentEditorData;
        }

        const fromSectionId = findSectionByBlockId(sectionsForCurrentPage, activeBlockId);
        if (!fromSectionId || !sectionsForCurrentPage[fromSectionId]) {
          // console.warn(`DragEnd: Source section ${fromSectionId} not found for block ${activeBlockId}.`);
          return currentEditorData;
        }

        const fromBlockIndex = findBlockIndexById(sectionsForCurrentPage[fromSectionId].blocks, activeBlockId);
        if (fromBlockIndex === -1) {
          // console.warn(`DragEnd: Block ${activeBlockId} not found in source section ${fromSectionId}.`);
          return currentEditorData;
        }

        const blockToMove = sectionsForCurrentPage[fromSectionId].blocks[fromBlockIndex];
        if (!blockToMove) {
          // console.warn(`DragEnd: Block to move is undefined at index ${fromBlockIndex} in section ${fromSectionId}.`);
          return currentEditorData;
        }

        let targetSectionId: string | null = null;
        let targetBlockIndex: number = -1;

        if (overTypeLocal === 'block') {
          // The containerId is the ID of the section droppable area.
          const containerId = event.over!.data.current?.sortable?.containerId;
          if (typeof containerId === 'string') {
            targetSectionId = parseDndId(String(containerId)).id;
          }

          if (targetSectionId && sectionsForCurrentPage[targetSectionId]) {
            const overBlockIdx = getOverBlockIndex(sectionsForCurrentPage[targetSectionId], overElementIdLocal); // overElementIdLocal is the block being hovered
            if (activeBlockId === overElementIdLocal) { // Dropping on itself
              // If targetSectionId is different from fromSectionId, this implies moving to another list on itself (unlikely)
              // For now, assume if activeBlockId === overElementIdLocal, it's a no-op within the same list.
              // The splice logic handles this naturally if fromSectionId === targetSectionId.
              targetBlockIndex = overBlockIdx; // or fromBlockIndex, effectively the same if same section.
            } else {
              targetBlockIndex = overBlockIdx;
            }
            // If overBlockIdx is -1 (e.g., something went wrong with getOverBlockIndex or ID parsing)
            // this will be caught by targetBlockIndex !== -1 check later.
          }
        } else if (overTypeLocal === 'section') {
          targetSectionId = overElementIdLocal; // Here, overElementIdLocal is the section ID
          if (targetSectionId && sectionsForCurrentPage[targetSectionId]) {
            targetBlockIndex = sectionsForCurrentPage[targetSectionId].blocks?.length ?? 0; // Append
          }
        }

        if (!targetSectionId || targetBlockIndex === -1) {
          // console.warn("DragEnd: Could not determine target section or index for block drop.");
          return currentEditorData;
        }

        if (!sectionsForCurrentPage[targetSectionId]) {
          // console.warn(`DragEnd: Target section ${targetSectionId} does not exist in current page view.`);
          return currentEditorData;
        }

        let newEditorData = currentEditorData;

        // 1. Remove from old position
        newEditorData = update(newEditorData, {
          view: {
            pages: {
              [selectedPage]: {
                view: {
                  [fromSectionId]: { blocks: { $splice: [[fromBlockIndex, 1]] } }
                }
              }
            }
          }
        });

        let adjustedTargetBlockIndex = targetBlockIndex;
        if (fromSectionId === targetSectionId && fromBlockIndex < targetBlockIndex) {
          adjustedTargetBlockIndex--;
        }

        // After removing, the blocks in the target section (if same as fromSection) might have shifted.
        // Re-evaluate target section blocks from the intermediate newEditorData.
        const targetSectionBlocksAfterRemoval = newEditorData.view.pages[selectedPage]?.view[targetSectionId]?.blocks || [];
        if (adjustedTargetBlockIndex > targetSectionBlocksAfterRemoval.length) {
          adjustedTargetBlockIndex = targetSectionBlocksAfterRemoval.length;
        }
        if (adjustedTargetBlockIndex < 0) { // Should not happen with valid logic but as a safeguard.
          adjustedTargetBlockIndex = 0;
        }


        // 2. Add to new position
        newEditorData = update(newEditorData, {
          view: {
            pages: {
              [selectedPage]: {
                view: {
                  [targetSectionId]: { blocks: { $splice: [[adjustedTargetBlockIndex, 0, blockToMove]] } }
                }
              }
            }
          }
        });

        setSelectedBlockId(activeBlockId);
        return newEditorData;
      });

      setActiveItem(null);
      return;
    }

    setActiveItem(null);
    setPrototype(null);
  }

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 10 }
    })
  )

  const onPageEditSubmit = ({
    type,
    pageName,
    layout
  }: PageEditorDialogPayload) => {
    if (!type) return;

    if (editingPageId && data.view.pages[editingPageId] != undefined) {
      handlePageTypeChange(editingPageId, type);
    } else {
      handleAddPage(type, layout, pageName);
    }
  }

  if (!data.view) {
    return <div>Loading...</div>;
  }

  return (
    <AppOfferLayout offer={offer}>
      <Head title={`Edit ${offer.name || 'Untitled Offer'}`} />

      <GlobalStateProvider offer={data} offerItems={offer.items} session={session} editor>
        <NavigationProvider onPageChange={handlePageNameClick}>

          <DndContext
            sensors={sensors}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragOver={handleDragOver}
            collisionDetection={rectIntersection}
          >
            <DragOverlay dropAnimation={null}>
              {activeItem && (
                <DragOverlayPreview item={activeItem} />
              )}
            </DragOverlay>
            <div className="flex flex-grow h-[calc(100vh-60px)]">
              <Sidebar />
              <MainContent />
            </div>
          </DndContext>
        </NavigationProvider>
        <PageLogicDialog />

      </GlobalStateProvider>

      <PageEditorDialog
        open={showPageTypeDialog}
        onOpenChange={setShowPageTypeDialog}
        currentPage={editingPageId ? data.view.pages[editingPageId] : undefined}
        onSubmit={onPageEditSubmit}
      />

      {/* <div className="text-xs absolute bottom-0 w-[500px] right-0 border-t border-border bg-white h-full overflow-scroll">
        <pre>{JSON.stringify(data.view.pages[selectedPage] || {}, null, 2)}</pre>
      </div> */}
    </AppOfferLayout>
  );
}

function DragOverlayPreview({ item }: { item: ActiveDndItem | null }) {

  if (!item) return null;

  if (item.type === 'template') {
    const elementTypeMeta = allElementTypes.find(t => t.type === item.id);
    return (
      <div
        className={cn(
          'flex flex-col items-center justify-center rounded-md cursor-move transition-all min-h-20 w-full'
        )}
      >
        <div className="flex items-center justify-center bg-slate-800 rounded-md w-full h-14 mb-2">
          <span className="text-white">
            <CustomElementIcon type={item.id as keyof typeof blockTypes} />
          </span>
        </div>
        <span className="text-sm text-black">{elementTypeMeta?.title || item.id}</span>
      </div>
    )
  }

  if (item.type === 'reusable') {
    return (
      <div
        className={cn(
          'flex flex-col items-center justify-center rounded-md cursor-move transition-all min-h-20 w-full bg-white border border-gray-200 shadow-lg'
        )}
      >
        <div className="flex items-center justify-center bg-indigo-600 rounded-md w-full h-14 mb-2">
          <span className="text-white">
            <BookmarkIcon className="w-6 h-6" />
          </span>
        </div>
        <span className="text-sm text-black font-medium">Reusable Block</span>
      </div>
    )
  }

  return (
    <div>
      <h3>{item?.type} : {item?.id} </h3>
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
  const isPreviewMode = viewMode === 'preview';

  return (
    <div className="flex-1 flex flex-col min-w-0 relative">
      {/* Preview Area - Make it fill the available space */}
      <div className={cn(
        "absolute inset-0 overflow-hidden",
        !isPreviewMode ? "bottom-[68px]" : "bottom-0"
      )}>
        <div className="h-full bg-[#F7F9FF]">
          {isShareMode ? (
            <PageShare />
          ) : isPreviewMode ? (
            <PageIframePreview />
          ) : (
            data.view.pages[selectedPage] ? (
              <PagePreview
                page={data.view.pages[selectedPage]}
                onUpdatePage={handlePageUpdate}
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <p className="text-muted-foreground">Page not found</p>
                  <p className="text-sm text-muted-foreground">The selected page may have been deleted</p>
                </div>
              </div>
            )
          )}
        </div>
      </div>

      {/* Toolbar */}
      {!isPreviewMode && <Toolbar />}
    </div>
  )
}

function Toolbar() {
  const { goToPage } = useNavigation();
  const {
    data,
    inputRef,
    selectedPage,
    editingPageName, setEditingPageName,
    pageNameInput, setPageNameInput,
    setIsRenamingFromDropdown,
    setShowPageTypeDialog,
    handlePageNameSave,
    handlePageNameClick,
    handlePageAction,
    getOrderedPages,
    viewMode,
    setShowPageLogic,
    setActiveTab,
    setSelectedBlockId,
    setSelectedSectionId
  } = useEditor();

  const onPageClick = (pageId: string, name: string) => {
    handlePageNameClick(pageId, name)
    goToPage(pageId);

    if (pageId != selectedPage) {
      setSelectedBlockId(null);
      setSelectedSectionId(null);
      setActiveTab('layers');
    }
  }

  return (
    <div className="absolute bottom-0 left-0 right-0 bg-[#F7F9FF]">
      <div className="p-4">
        <div className={cn(
          "flex items-center transition-all duration-300",
          viewMode === 'preview' ? "justify-center" : "justify-between"
        )}>
          <div className="flex items-center gap-2 overflow-x-auto">
            <button
              onClick={() => setShowPageTypeDialog(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium bg-transparent text-secondary-foreground hover:bg-white border-1 border-gray-300/50 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Add Page
            </button>

            {getOrderedPages(data.view).filter(([pageId]) => data.view.pages[pageId]).map(([pageId, page]) => (
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
                    onClick={() => onPageClick(pageId, page.name)}
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
                      <DropdownMenuItem onClick={() => handlePageAction(pageId, 'changeType')}>
                        Change Type
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

          <div className="flex items-center gap-4">
            {data.view.pages[selectedPage]?.next_page?.default_next_page && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Next:</span>
                <span className="text-sm font-medium">{data.view.pages[data.view.pages[selectedPage]?.next_page?.default_next_page]?.name}</span>
              </div>
            )}
          </div>
          <button
            onClick={() => setShowPageLogic(true)}
            className="flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-secondary/90 bg-secondary rounded-md"
          >
            Page Logic
          </button>
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
                console.log('Flow editor changes:', changes);
                setData(update(data, { view: { $set: changes } }));

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

export default Edit;
