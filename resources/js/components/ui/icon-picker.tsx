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

const ICONS_PER_PAGE = 50;

const IconPicker: React.FC<IconPickerProps> = ({ value, onChange, onClose, className }) => {
  const [search, setSearch] = useState('');
  const [emojiSearch, setEmojiSearch] = useState('');
  const [visibleIcons, setVisibleIcons] = useState(ICONS_PER_PAGE);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const emojiScrollContainerRef = useRef<HTMLDivElement>(null);

  const icons = useIcons();
  const emojis = useEmojis();

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
    onClose?.();
  };

  const handleEmojiSelect = (emoji: string) => {
    onChange({ icon: undefined, emoji: emoji, url: undefined });
    onClose?.();
  };

  const handleImageUpload = (url: string) => {
    onChange({ icon: undefined, emoji: undefined, url: url });
    onClose?.();
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
              {Object.entries(groupedEmojis).map(([category, categoryEmojis]) => (
                <div key={category} className="space-y-2">
                  <h3 className="text-sm font-medium capitalize text-muted-foreground px-1">
                    {category}
                  </h3>
                  <div className="grid grid-cols-7 gap-2">
                    {categoryEmojis.map((emojiData) => (
                      <button
                        key={emojiData.name}
                        onClick={() => handleEmojiSelect(emojiData.emoji)}
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