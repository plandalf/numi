import { Block, Offer, type Page, type PageType } from '@/types/offer';
import { useForm } from '@inertiajs/react';
import { Theme } from '@/types/theme';
import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
import update from "immutability-helper";
import { toast } from 'sonner';
import { generateDefaultPage } from '@/components/offers/page-flow-editor';
import { Template } from '@/types/template';

interface EditorContextType {
  data: any;
  setData: (data: any) => void;
  put: (url: string, options?: any) => void;
  processing: boolean;
  errors: any;
  setDefaults: (data: any) => void;

  organizationThemes: Theme[];
  organizationTemplates: Template[];
  globalThemes: Theme[];

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

  inputRef: React.RefObject<HTMLInputElement | null>;

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
  handlePageAction: (pageId: string, action: 'rename' | 'duplicate' | 'delete') => void;
  handlePageUpdate: (updatedPage: Page) => void;
  getOrderedPages: (view: any) => [string, Page][];
  handleAddPage: (type: PageType) => void;
  offer: Offer;
  updateBlock: (block: Block) => void;
}

export const EditorContext = createContext<EditorContextType | undefined>(undefined);

export function useEditor() {
    const ctx = useContext(EditorContext);
    if (!ctx) throw new Error('useEditor must be used within an EditorProvider');
    return ctx;
  }

  
function generateDefaultView() {
  const defaultPage = generateDefaultPage({ type: 'page', position: { x: 100, y: 100 } });

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
  theme: Theme | null;
  [key: string]: any; // Allow additional properties for form data
}

export interface EditProps {
  offer: Offer;
  organizationThemes: Theme[];
  organizationTemplates: Template[];
  globalThemes: Theme[];
  showNameDialog?: boolean;
  children: React.ReactNode;
}

export function EditorProvider({ offer, organizationThemes, organizationTemplates, globalThemes, showNameDialog, children }: EditProps) {
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
  const [previewSize, setPreviewSize] = useState<{
    width: number;
    height: number;
  }>({ width: 1024, height: 768 });

  const { data, setData, put, processing, errors, setDefaults } = useForm<EditFormData>({
    name: offer.name,
    view: offer.view,
    theme: offer.theme,
    screenshot: offer.screenshot,
  });

  useEffect(() => {
    if(!offer.view) {
      const defaultView = generateDefaultView();

      setData({
        name: offer.name,
        view: defaultView,
        theme: offer.theme,
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

  const handleSave = () => {
    put(route('offers.update', offer.id), {
      onError: (error: any) => {
        const errorMessages = Object.values(error).flat();
        toast.error(<>
          <p>Failed to save offer</p>
          <ul className='list-disc list-inside'>
            {errorMessages.map((e: string) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        </>);
      },
    });
  };

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
                branches: page.next_page.branches.map((branch: any) =>
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

  const getOrderedPages = (view: any): [string, Page][] => {
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
    const page = {...data.view.pages[selectedPage]};

    const sectionId = Object.keys(page.view).find((section) => {
      const x = page.view[section].blocks.findIndex((b) => b.id === block.id)
      if (x === -1) return false;
      return section;
    });

    if (!sectionId) return;

    const blockIndex = page.view[sectionId].blocks.findIndex((b) => b.id === block.id);

    if (blockIndex === -1) return;

    const thePage = update(page, { view: { [sectionId]: { blocks: { $set: page.view[sectionId].blocks.map((b, i) => i === blockIndex ? block : b) } } } });

    setData(update(data, { view: { pages: { [selectedPage]: { view: { $set: thePage.view } } } } }));
  }

  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);

  const value: EditorContextType = {
    data,
    setData,
    put,
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
    organizationThemes,
    organizationTemplates,
    globalThemes,
    updateBlock,
    selectedBlockId, setSelectedBlockId,
    viewMode, setViewMode,
    previewSize, setPreviewSize,
  };

  return <EditorContext.Provider value={value}>{children}</EditorContext.Provider>;
}
