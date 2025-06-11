import { Block, Offer, type Page, type PageType, ViewSection, Branch } from '@/types/offer';
import { useForm, InertiaFormProps } from '@inertiajs/react';
import { Theme } from '@/types/theme';
import React, { createContext, useContext, useState, useRef, useEffect, useCallback } from 'react';
import update from "immutability-helper";
import { toast } from 'sonner';
import { generateDefaultPage } from '@/components/offers/page-flow-editor';
import { Template } from '@/types/template';
import { useDebounce } from '@/hooks/use-debounce';
import { FormDataConvertible } from '@inertiajs/core';
import { SidebarTab } from '@/components/offers/sidebar';
import { router } from "@inertiajs/react";

interface EditorContextType {
  data: EditFormData;
  setData: InertiaFormProps<EditFormData>['setData'];
  put: InertiaFormProps<EditFormData>['put'];
  processing: boolean;
  errors: InertiaFormProps<EditFormData>['errors'];
  setDefaults: InertiaFormProps<EditFormData>['setDefaults'];

  organizationThemes: Theme[];
  organizationTemplates: Template[];
  globalThemes: Theme[];

  theme: Theme;
  setTheme: React.Dispatch<React.SetStateAction<Theme>>;

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

  showPageTypeDialog: boolean;
  setShowPageTypeDialog: (show: boolean) => void;

  editingPageId: string | null;
  setEditingPageId: React.Dispatch<React.SetStateAction<string | null>>;

  inputRef: React.RefObject<HTMLInputElement | null>;

  isRenamingFromDropdown: boolean;
  setIsRenamingFromDropdown: React.Dispatch<React.SetStateAction<boolean>>;

  showAddPageDialog: boolean;
  setShowAddPageDialog: React.Dispatch<React.SetStateAction<boolean>>;

  isReady: boolean;
  setIsReady: React.Dispatch<React.SetStateAction<boolean>>;

  selectedBlockId: string | null;
  setSelectedBlockId: (blockId: string | null) => void;

  selectedSectionId: string | null;
  setSelectedSectionId: (sectionId: string | null) => void;

  viewMode: 'editor' | 'preview' | 'share';
  setViewMode: React.Dispatch<React.SetStateAction<'editor' | 'preview' | 'share'>>;

  previewType: 'desktop' | 'mobile';
  setPreviewType: React.Dispatch<React.SetStateAction<'desktop' | 'mobile'>>;

  activeTab: SidebarTab;
  setActiveTab: React.Dispatch<React.SetStateAction<SidebarTab>>;

  previewSize: {
    width: number;
    height: number;
  };
  setPreviewSize: React.Dispatch<React.SetStateAction<{
    width: number;
    height: number;
  }>>;

  handleSave: () => void;
  handleNameSubmit: (e: React.FormEvent) => void;
  handlePageNameClick: (pageId: string, currentName: string) => void;
  handlePageNameSave: (pageId: string) => void;
  handlePageAction: (pageId: string, action: 'rename' | 'duplicate' | 'changeType' | 'delete') => void;
  handlePageUpdate: (updatedPage: Page) => void;
  getOrderedPages: (view: EditFormData['view']) => [string, Page][];
  handleAddPage: (type: PageType) => void;
  handlePageTypeChange: (pageId: string, type: PageType) => void;
  offer: Offer;
  updateBlock: (block: Block) => void;
  updateSection: (sectionId: string, sectionDataToMerge: Partial<ViewSection>) => void;
  deleteBlock: (blockId: string) => void;
}

export const EditorContext = createContext<EditorContextType | null>(null);

export function useEditor() {
    const ctx = useContext(EditorContext);
    if (!ctx) throw new Error('useEditor must be used within an EditorProvider');
    return ctx;
  }


function generateDefaultView() {
  const defaultPage = generateDefaultPage({ type: 'entry', position: { x: 100, y: 100 }, pageNumber: 1 });

  return {
    pages: {
      [defaultPage.id]: defaultPage
    },
    first_page: defaultPage.id
  }
}

type EditFormData = {
  name: string;
  view: {
    first_page: string;
    pages: Record<string, Page>;
  };
  theme_id: string | null;
  screenshot: Offer['screenshot'];
  [key: string]: FormDataConvertible | Record<string, any> | null | undefined;
}

export interface EditProps {
  offer: Offer;
  theme: Theme;
  organizationThemes: Theme[];
  organizationTemplates: Template[];
  globalThemes: Theme[];
  showNameDialog?: boolean;
  children: React.ReactNode;
}

export function EditorProvider({ offer, organizationThemes, organizationTemplates, globalThemes, showNameDialog, children, ...props }: EditProps) {
  const [isNameDialogOpen, setIsNameDialogOpen] = useState(false);
  const [selectedPage, setSelectedPage] = useState<string>(offer.view?.first_page);
  const [editingPageName, setEditingPageName] = useState<string | null>(null);
  const [pageNameInput, setPageNameInput] = useState("");
  const [showPageLogic, setShowPageLogic] = useState(false);
  const [showPageTypeDialog, setShowPageTypeDialog] = useState(false);
  const [editingPageId, setEditingPageId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [isRenamingFromDropdown, setIsRenamingFromDropdown] = useState(false);
  const [showAddPageDialog, setShowAddPageDialog] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [viewMode, setViewMode] = useState<'editor' | 'preview' | 'share'>('editor');
  const [previewSize, setPreviewSize] = useState<{
    width: number;
    height: number;
  }>({ width: 1024, height: 768 });
  const [previewType, setPreviewType] = useState<'desktop' | 'mobile'>('desktop');
  const [theme, setTheme] = useState<Theme>(props.theme);
  const [enableAutoSave, setEnableAutoSave] = useState(false);
  const [activeTab, setActiveTab] = useState<SidebarTab>('elements');

  const { data, setData, put, processing, errors, setDefaults } = useForm<EditFormData>({
    name: offer.name,
    view: offer.view,
    theme_id: offer.theme?.id ?? null,
    screenshot: offer.screenshot,
  });

  useEffect(() => {
    if(!offer.view) {
      const defaultView = generateDefaultView();

      setData({
        name: offer.name,
        view: defaultView,
        theme_id: offer.theme_id,
        screenshot: offer.screenshot,
      });

      setSelectedPage(defaultView.first_page);
    }
  }, [offer.view]);

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
  }, [data]);

  const handleSaveError = (error: Record<string, string>) => {
    const errorMessages = Object.values(error).flat();
    toast.error(<>
      <p>Failed to save offer</p>
      <ul className='list-disc list-inside'>
        {errorMessages.map((e: string) => (
          <li key={e}>{e}</li>
        ))}
      </ul>
    </>);
  };

  const handleSave = () => {
    router.put(route('offers.update', offer.id), {
      ...data,
      view: JSON.stringify(data.view)
    }, {
      onSuccess: () => {
        toast.success('Offer updated successfully');
      },
      onError: handleSaveError,
    });
  };


  const debouncedView = useDebounce(data?.view, 250);

  useEffect(() => {
    if(!enableAutoSave) {
      setEnableAutoSave(true);
    }

    if (enableAutoSave) {
      router.put(route('offers.update', offer.id), {
        ...data,
        view: JSON.stringify(data.view)
      });
    }
  }, [debouncedView]);

  const handleNameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    router.put(route('offers.update', offer.id), {
      ...data,
      view: JSON.stringify(data.view)
    }, {
      onSuccess: () => setIsNameDialogOpen(false),
    });
  };

  const handlePageNameClick = (pageId: string, currentName: string) => {
    if (pageId === selectedPage) {
      setEditingPageName(pageId);
      setPageNameInput(currentName);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 250);
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
    setEditingPageName(null);
  };

  const sortPages = (pages: Record<string, Page>): Record<string, Page> => {
    const entries = Object.entries(pages);
    const sortedEntries = entries.sort((a, b) => {
      // Entry pages come first
      if (a[1].type === 'entry' && b[1].type !== 'entry') return -1;
      if (a[1].type !== 'entry' && b[1].type === 'entry') return 1;
      // Then sort by page number
      return (a[1].pageNumber || 0) - (b[1].pageNumber || 0);
    });

    return Object.fromEntries(sortedEntries);
  };

  const handlePageAction = (pageId: string, action: 'rename' | 'duplicate' | 'changeType' | 'delete') => {
    switch (action) {
      case 'rename':
        setEditingPageName(pageId);
        setPageNameInput(data.view.pages[pageId].name);
        setIsRenamingFromDropdown(true);
        break;
      case 'duplicate': {
        const newId = `page_${Math.random().toString(36).substr(2, 9)}`;
        const pageToDuplicate = data.view.pages[pageId];
        const updatedPages = sortPages({
          ...data.view.pages,
          [newId]: {
            ...pageToDuplicate,
            name: `${pageToDuplicate.name} (Copy)`,
          }
        });
        setData(update(data, { view: { pages: { $set: updatedPages } } }));
        setTimeout(() => { handleSave(); }, 0);
        break;
      }
      case 'changeType':
        setEditingPageId(pageId);
        setShowPageTypeDialog(true);
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
                branches: page.next_page.branches?.map((branch: any) =>
                  branch.next_page === pageId
                    ? { ...branch, next_page: null }
                    : branch
                )
              }
            };
          }
        });

        // If this was the last page, create a new default view
        if (Object.keys(pagesToUpdate).length === 0) {
          const defaultView = generateDefaultView();
          setData(update(data, {
            view: {
              pages: { $set: defaultView.pages },
              first_page: { $set: defaultView.first_page }
            }
          }));
          setSelectedPage(defaultView.first_page);
        } else {
          const sortedPages = sortPages(pagesToUpdate);
          setData(update(data, { view: { pages: { $set: sortedPages } }}));
          if (selectedPage === pageId) {
            const remainingPageIds = Object.keys(sortedPages);
            if (remainingPageIds.length > 0) {
              const firstPageId = data.view.first_page;
              const newSelectedPageId = (firstPageId && sortedPages[firstPageId])
                ? firstPageId
                : remainingPageIds[0];
              setSelectedPage(newSelectedPageId);
            }
          }
        }
        setTimeout(() => { handleSave(); }, 0);
        break;
    }
  };

  const handlePageTypeChange = (pageId: string, type: PageType) => {
    const currentPage = data.view.pages[pageId];
    const isDefaultLabel =
      currentPage.name === 'Entry Page' ||
      currentPage.name === 'New Page' ||
      currentPage.name === 'Ending Page';

    const updatedPage = {
      ...currentPage,
      type,
      name: isDefaultLabel
        ? type === 'entry'
          ? 'Entry Page'
          : type === 'ending'
            ? 'Ending Page'
            : 'New Page'
        : currentPage.name
    };

    const updatedPages = sortPages({
      ...data.view.pages,
      [pageId]: updatedPage
    });

    setData(update(data, { view: { pages: { $set: updatedPages } } }));
    setShowPageTypeDialog(false);
    setEditingPageId(null);
    handleSave();
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

  const getOrderedPages = (view: EditFormData['view']): [string, Page][] => {
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
        orderedPages.push([pageId, page as Page]);
        visitedPages.add(pageId);
      }
    });
    return orderedPages;
  };

  const handleAddPage = (type: PageType) => {
    const id = `page_${Math.random().toString(36).substr(2, 9)}`;

    const newPage = {
      ...generateDefaultPage({ id, type, position: { x: 0, y: 0 }, pageNumber: Object.keys(data.view.pages).length + 1 }),
      name: type === 'entry' ? 'Entry Page' : type === 'ending' ? 'Ending Page' : 'New Page',
    };

    const updatedPages = sortPages({
      ...data.view.pages,
      [id]: newPage
    });

    const updatedView = {
      ...data.view,
      pages: updatedPages,
      first_page: Object.keys(data.view.pages).length === 0 ? id : data.view.first_page
    };
    setData(update(data, { view: { $set: updatedView }}));

    handleSave();
    setShowPageTypeDialog(false);
  };

  const updateBlock = (block: Block) => {
    const page = {...data.view.pages[selectedPage]};

    const sectionId = Object.keys(page.view).find((section) => {
      const x = page.view[section].blocks?.findIndex((b) => b.id === block.id) ?? -1;
      if (x === -1) return false;
      return section;
    });

    if (!sectionId) return;

    const blockIndex = page.view[sectionId].blocks.findIndex((b) => b.id === block.id);

    if (blockIndex === -1) return;

    const thePage = update(page, { view: { [sectionId]: { blocks: { $set: page.view[sectionId].blocks.map((b, i) => i === blockIndex ? block : b) } } } });

    setData(update(data, { view: { pages: { [selectedPage]: { view: { $set: thePage.view } } } } }));
  }

  const [selectedBlockId, setSelectedBlockIdState] = useState<string | null>(null);
  const [selectedSectionId, setSelectedSectionIdState] = useState<string | null>(null);

  const onSelectBlock = useCallback((blockId: string | null) => {
    setSelectedBlockIdState(blockId);
  }, []);

  const onSelectSection = useCallback((sectionId: string | null) => {
    setSelectedSectionIdState(sectionId);
  }, []);

  const updateSection = (sectionId: string, sectionDataToMerge: Partial<ViewSection>) => {
    setData(prevData => {
      if (
        prevData.view &&
        prevData.view.pages &&
        prevData.view.pages[selectedPage] &&
        prevData.view.pages[selectedPage].view &&
        prevData.view.pages[selectedPage].view[sectionId]
      ) {
        return update(prevData, {
          view: {
            pages: {
              [selectedPage]: {
                view: {
                  [sectionId]: { $merge: sectionDataToMerge }
                }
              }
            }
          }
        });
      }
      console.warn(`[EditorContext] updateSection: Path to section "${sectionId}" on page "${selectedPage}" not found. No update performed.`);
      return prevData;
    });
  };

  const deleteBlock = (blockId: string) => {
    const page = {...data.view.pages[selectedPage]};

    const sectionId = Object.keys(page.view).find((section) => {
      const x = page.view[section].blocks?.findIndex((b) => b.id === blockId) ?? -1;
      if (x === -1) return false;
      return section;
    });

    if (!sectionId) return;

    const updatedBlocks = page.view[sectionId].blocks.filter((b) => b.id !== blockId);
    const thePage = update(page, { view: { [sectionId]: { blocks: { $set: updatedBlocks } } } });

    setData(update(data, { view: { pages: { [selectedPage]: { view: { $set: thePage.view } } } } }));
    setSelectedBlockIdState(null);
  };

  const handleShowPageTypeDialog = (show: boolean) => {
    setEditingPageId(null);
    setShowPageTypeDialog(show);
  }

  const value: EditorContextType = {
    data,
    setData,
    put,
    processing,
    errors,
    setDefaults,

    theme,
    setTheme,

    isNameDialogOpen, setIsNameDialogOpen,
    selectedPage, setSelectedPage,
    editingPageName, setEditingPageName,
    pageNameInput, setPageNameInput,
    showPageLogic, setShowPageLogic,
    showPageTypeDialog,
    setShowPageTypeDialog: handleShowPageTypeDialog,
    editingPageId, setEditingPageId,
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
    handlePageTypeChange,
    offer,
    organizationThemes,
    organizationTemplates,
    globalThemes,
    updateBlock,
    updateSection,
    selectedBlockId,
    setSelectedBlockId: onSelectBlock,
    selectedSectionId,
    setSelectedSectionId: onSelectSection,
    viewMode, setViewMode,
    previewSize, setPreviewSize,
    previewType, setPreviewType,
    activeTab, setActiveTab,
    deleteBlock,
  };

  return <EditorContext.Provider value={value}>{children}</EditorContext.Provider>;
}
