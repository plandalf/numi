import React, { useState, useMemo, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Separator } from './separator';
import { IconValue } from '@/contexts/Numi';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './tabs';
import SearchBar from '../offers/search-bar';
import { ScrollArea } from './scroll-area';
import { useIcons } from '@/hooks/use-icons';
import { useEmojis } from '@/hooks/use-emojis';
import { ImageUpload } from './image-upload';

interface IconPickerProps {
  value: IconValue;
  onChange: (value: IconValue) => void;
  onClose?: () => void;
  className?: string;
}

interface RecentIcon {
  type: 'icon' | 'emoji';
  value: string;
  name?: string;
}

const ICONS_PER_PAGE = 50;
const MAX_RECENT_ICONS = 7;
const RECENT_ICONS_STORAGE_KEY = 'numi_recent_icons';

const IconPicker: React.FC<IconPickerProps> = ({ value, onChange, onClose, className }) => {
  const [search, setSearch] = useState('');
  const [emojiSearch, setEmojiSearch] = useState('');
  const [visibleIcons, setVisibleIcons] = useState(ICONS_PER_PAGE);
  const [recentIcons, setRecentIcons] = useState<RecentIcon[]>([]);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const emojiScrollContainerRef = useRef<HTMLDivElement>(null);

  const icons = useIcons();
  const emojis = useEmojis();

  // Load recent icons from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(RECENT_ICONS_STORAGE_KEY);
    if (stored) {
      try {
        setRecentIcons(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to parse recent icons from localStorage:', e);
      }
    }
  }, []);

  // Save recent icons to localStorage when it changes
  const updateRecentIcons = (newRecentIcon: RecentIcon) => {
    const updated = [
      newRecentIcon,
      ...recentIcons.filter(item => 
        !(item.type === newRecentIcon.type && item.value === newRecentIcon.value)
      )
    ].slice(0, MAX_RECENT_ICONS);
    
    setRecentIcons(updated);
    localStorage.setItem(RECENT_ICONS_STORAGE_KEY, JSON.stringify(updated));
  };

  const filteredIcons = useMemo(() => {
    return icons
      .filter(icon => icon?.name.toLowerCase().includes(search.toLowerCase()));
  }, [search]);

  const groupedEmojis = useMemo(() => {
    const filtered = emojis.filter(emoji =>
      emoji.name.toLowerCase().includes(emojiSearch.toLowerCase()) ||
      emoji.category.toLowerCase().includes(emojiSearch.toLowerCase())
    );

    return filtered.reduce((acc, emoji) => {
      if (!acc[emoji.category]) {
        acc[emoji.category] = [];
      }
      acc[emoji.category].push(emoji);
      return acc;
    }, {} as Record<string, typeof emojis>);
  }, [emojiSearch, emojis]);

  const handleIconSelect = (iconName: string) => {
    onChange({ icon: iconName, emoji: undefined, url: undefined });
    updateRecentIcons({ type: 'icon', value: iconName, name: iconName });
    onClose?.();
  };

  const handleEmojiSelect = (emoji: string, name?: string) => {
    onChange({ icon: undefined, emoji: emoji, url: undefined });
    updateRecentIcons({ type: 'emoji', value: emoji, name: name });
    onClose?.();
  };

  const handleImageUpload = (media: { id: number; url: string; } | null) => {
    if (media) {
      onChange({ icon: undefined, emoji: undefined, url: media.url });
      onClose?.();
    }
  };

  const getRecentIconsForType = (type: 'icon' | 'emoji') => {
    return recentIcons.filter(item => item.type === type);
  };

  const renderRecentIcons = (type: 'icon' | 'emoji') => {
    const recent = getRecentIconsForType(type);
    if (recent.length === 0) return null;

    return (
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-muted-foreground px-1">Recently Used</h3>
        <div className="grid grid-cols-7 gap-2">
          {recent.map((recentItem, index) => {
            if (type === 'icon') {
              const iconData = icons.find(icon => icon.name === recentItem.value);
              if (!iconData) return null;
              
              return (
                <button
                  key={`recent-icon-${index}`}
                  onClick={() => handleIconSelect(recentItem.value)}
                  className={cn(
                    "p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800",
                    "flex flex-col items-center gap-1 group relative",
                    "cursor-pointer",
                    value?.icon === recentItem.value && "bg-gray-100 dark:bg-gray-800"
                  )}
                  title={recentItem.name || recentItem.value}
                >
                  <iconData.Icon className="w-6 h-6" />
                </button>
              );
            } else {
              return (
                <button
                  key={`recent-emoji-${index}`}
                  onClick={() => handleEmojiSelect(recentItem.value, recentItem.name)}
                  className={cn(
                    "p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800",
                    "flex flex-col items-center gap-1 group relative",
                    "cursor-pointer text-2xl",
                    value?.emoji === recentItem.value && "bg-gray-100 dark:bg-gray-800"
                  )}
                  title={recentItem.name || recentItem.value}
                >
                  {recentItem.value}
                </button>
              );
            }
          })}
        </div>
        <Separator className="mb-3"/>
      </div>
    );
  };

  useEffect(() => {
    const scrollContainer = scrollContainerRef.current?.querySelector('[data-radix-scroll-area-viewport]');
    if (!scrollContainer) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = scrollContainer as HTMLDivElement;
      if (scrollHeight - scrollTop <= clientHeight + 100) {
        setVisibleIcons(prev => Math.min(prev + ICONS_PER_PAGE, filteredIcons.length));
      }
    };

    scrollContainer.addEventListener('scroll', handleScroll);
    return () => scrollContainer.removeEventListener('scroll', handleScroll);
  }, [filteredIcons.length]);

  // Reset visible icons when search changes
  useEffect(() => {
    setVisibleIcons(ICONS_PER_PAGE);
  }, [search]);

  const displayedIcons = filteredIcons.slice(0, visibleIcons);

  const defaultTab = useMemo(() => {
    if (value.icon) return 'icons';
    if (value.emoji) return 'emojis';
    if (value.url) return 'uploads';
    return 'icons';
  }, [value]);

  return (
    <div className={cn("py-4 px-2.5 flex flex-col items-center gap-2 w-full", className)}>
      <Tabs defaultValue={defaultTab} className="w-full">
        <TabsList className="flex w-full border-b">
          <TabsTrigger value="icons" className="flex-1">Icons</TabsTrigger>
          <TabsTrigger value="emojis" className="flex-1">Emojis</TabsTrigger>
          <TabsTrigger value="uploads" className="flex-1">Uploads</TabsTrigger>
        </TabsList>
        <TabsContent value="icons" className="space-y-2">
          <Separator className="mt-4"/>
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Search"
            className="mb-0"
            inputClassName="w-full border-none !ring-0 focus:!ring-0 shadow-none"
          />
          <Separator className="mb-3"/>
          <ScrollArea
            ref={scrollContainerRef}
            className="h-[300px]"
          >
            <div className="space-y-4">
              {renderRecentIcons('icon')}
              <div className="grid grid-cols-7 gap-2">
                {displayedIcons.map(({ name, Icon }) => (
                  <button
                    key={name}
                    onClick={() => handleIconSelect(name)}
                    className={cn(
                      "p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800",
                      "flex flex-col items-center gap-1 group relative",
                      "cursor-pointer",
                      value?.icon === name && "bg-gray-100 dark:bg-gray-800"
                    )}
                    title={name}
                  >
                    <Icon className="w-6 h-6" />
                  </button>
                ))}
              </div>
            </div>
          </ScrollArea>
        </TabsContent>
        <TabsContent value="emojis" className="space-y-2">
          <Separator className="mt-4"/>
          <SearchBar
            value={emojiSearch}
            onChange={setEmojiSearch}
            placeholder="Search emojis"
            className="mb-0"
            inputClassName="w-full border-none !ring-0 focus:!ring-0 shadow-none"
          />
          <Separator className="mb-3"/>
          <ScrollArea
            ref={emojiScrollContainerRef}
            className="h-[300px]"
          >
            <div className="space-y-6">
              {renderRecentIcons('emoji')}
              {Object.entries(groupedEmojis).map(([category, categoryEmojis]) => (
                <div key={category} className="space-y-2">
                  <h3 className="text-sm font-medium capitalize text-muted-foreground px-1">
                    {category}
                  </h3>
                  <div className="grid grid-cols-7 gap-2">
                    {categoryEmojis.map((emojiData) => (
                      <button
                        key={emojiData.name}
                        onClick={() => handleEmojiSelect(emojiData.emoji, emojiData.name)}
                        className={cn(
                          "p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800",
                          "flex flex-col items-center gap-1 group relative",
                          "cursor-pointer text-2xl",
                          value?.emoji === emojiData.emoji && "bg-gray-100 dark:bg-gray-800"
                        )}
                        title={emojiData.name}
                      >
                        {emojiData.emoji}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>
        <TabsContent value="uploads" className="space-y-2">
          <ImageUpload onChange={handleImageUpload} preview={value.url} label="Upload an image" />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default IconPicker;
