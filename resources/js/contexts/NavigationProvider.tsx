import { type Block, type Page as OfferPage, type OfferConfiguration, } from '@/types/offer';
import { useContext, createContext, useMemo, useState } from 'react';
import { useCheckoutState } from './GlobalStateProvider';

export type PageType = 'page' | 'entry' | 'payment' | 'ending';

export interface Page extends OfferPage {
  type: PageType;
}
// Navigation logic
export const handleNavigationLogic = (page: Page, getFieldValue: (field: string) => any): string | null => {
  // Get branches
  const branches = page.next_page.branches || [];

  if (branches.length > 0) {
    // Find first matching branch
    const matchingBranch = branches.find(branch => {
      if (!branch.condition) {
        return true; // Default branch
      }

      const { field, operator, value } = branch.condition;
      const fieldValue = getFieldValue(field);

      // Compare based on operator
      switch (operator) {
        case 'eq':
          return fieldValue === value;
        case 'ne':
          return fieldValue !== value;
        case 'gt':
          return Number(fieldValue) > Number(value);
        case 'lt':
          return Number(fieldValue) < Number(value);
        case 'gte':
          return Number(fieldValue) >= Number(value);
        case 'lte':
          return Number(fieldValue) <= Number(value);
        case 'contains':
          return String(fieldValue).includes(String(value));
        case 'not_contains':
          return !String(fieldValue).includes(String(value));
        default:
          return false;
      }
    });

    if (matchingBranch && matchingBranch.next_page) {
      return matchingBranch.next_page;
    }
  }

  // Default next page
  return page.next_page.default_next_page || null;
};


// Navigation Types
export interface NavigationHistoryEntry {
  pageId: string;
  timestamp: number;
  direction: 'forward' | 'backward';
  pageType: PageType;
}

export interface NavigationState {
  currentPageId: string;
  pageHistory: string[];
  completedPages: string[];
  navigationHistory: NavigationHistoryEntry[];
}

export interface NavigationContextType {
  // State
  currentPage: Page;
  currentPageId: string;
  pageHistory: string[];
  completedPages: string[];
  navigationHistory: NavigationHistoryEntry[];

  // Navigation Methods
  goToNextPage: (fieldErrors: Record<string, string[]>) => Promise<void>;
  goToPrevPage: () => void;
  canGoBack: () => boolean;
  canGoForward: () => boolean;
}

export const NavigationContext = createContext<NavigationContextType | null>(null);

export const NavigationProvider = ({ children }: { children: React.ReactNode }) => {
  const { offer, fieldStates } = useCheckoutState();

  const pages = useMemo(() => {
    return offer.view.pages;
  }, [offer]);

  const [currentPageId, setCurrentPageId] = useState(offer.view.first_page);
  const [pageHistory, setPageHistory] = useState<string[]>([]);
  const [completedPages, setCompletedPages] = useState<string[]>([]);
  const [navigationHistory, setNavigationHistory] = useState<NavigationHistoryEntry[]>([]);

  const currentPage = useMemo(() => {
    return pages[currentPageId];
  }, [currentPageId, pages]);

  const canNavigateToNextPage = (fieldErrors: Record<string, string[]>) => {
    return Object.values(fieldErrors).every((error) => !error);
  };

  const canGoBack = () => {
    // Can't go back from entry pages
    if (currentPage.type === 'entry') return false;
    // Can go back if we have history
    return pageHistory.length > 0;
  };

  const canGoForward = () => {
    // Can't go forward from ending pages
    if (currentPage.type === 'ending') return false;

    const nextPage = handleNavigationLogic(currentPage, (field) => {
      return fieldStates[field]?.value;
    });
    return !!nextPage;
  };

  const addToNavigationHistory = (pageId: string, direction: 'forward' | 'backward', pageType: PageType) => {
    setNavigationHistory(prev => [...prev, {
      pageId,
      timestamp: Date.now(),
      direction,
      pageType
    }]);
  };

  const submitPageFields = async (pageId: string, fields: Record<string, any>) => {
    try {
      const response = await fetch(`/api/checkout/pages/${pageId}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fields }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit page fields');
      }

      return await response.json();
    } catch (error) {
      console.error('Error submitting page fields:', error);
      throw error;
    }
  };

  const goToPrevPage = () => {
    if (canGoBack()) {
      const previousPage = pageHistory[pageHistory.length - 1];
      setCurrentPageId(previousPage);
      setPageHistory(prev => prev.slice(0, -1));
      addToNavigationHistory(previousPage, 'backward', pages[previousPage].type);
    }
  };

  const goToNextPage = async (fieldErrors: Record<string, string[]>) => {
    if (!canNavigateToNextPage(fieldErrors)) {
      return;
    }

    const nextPageId = handleNavigationLogic(currentPage, (field) => {
      return fieldStates[field]?.value;
    });

    if (!nextPageId) {
      return;
    }

    const nextPage = pages[nextPageId];

    // Update navigation state
    setPageHistory(prev => [...prev, currentPageId]);

    if (!completedPages.includes(currentPageId)) {
      setCompletedPages(prev => [...prev, currentPageId]);
    }

    addToNavigationHistory(nextPageId, 'forward', nextPage.type);
    setCurrentPageId(nextPageId);
  };

  const value: NavigationContextType = {
    currentPage,
    goToNextPage,
    goToPrevPage,
    currentPageId,
    pageHistory,
    completedPages,
    canGoBack,
    canGoForward,
    navigationHistory
  };

  return (
    <NavigationContext.Provider value={value}>
      {children}
    </NavigationContext.Provider>
  );
};

// Update the useNavigation hook to handle null context
export const useNavigation = (): NavigationContextType => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
};
