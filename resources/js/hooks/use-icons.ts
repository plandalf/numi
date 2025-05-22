import * as LucideIcons from 'lucide-react';
import { LucideIcon } from 'lucide-react';
import { useMemo } from 'react';

// Pre-filtered icons outside of the hook for static reference
const filteredIconKeys = Object.keys(LucideIcons)
  .filter(
    (key) => !key.endsWith('Icon') && key !== 'createLucideIcon' && key !== 'default' && typeof key === 'string'
  )
  .map(name => ({ 
    name, 
    Icon: LucideIcons[name as keyof typeof LucideIcons] as LucideIcon 
  }));

// Hook to memoize the icons array
export const useIcons = () => {
  return useMemo(() => filteredIconKeys, []);
};

// Export the static array for non-hook usage
export const icons = filteredIconKeys;