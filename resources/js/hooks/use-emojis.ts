import { useMemo } from 'react';
import emojiData from 'unicode-emoji-json/data-by-group.json';

interface EmojiType {
  emoji: string;
  name: string;
  slug: string;
  category: string;
}

interface EmojiCategory {
  name: string;
  slug: string;
  emojis: EmojiType[];
}

const processEmojiData = () => {
  const processedEmojis: EmojiType[] = [];
  
  // Process each category in the emoji data
  Object.entries(emojiData).forEach(([key, data]) => {
    
    const formattedCategory = data?.name
      .toLowerCase()
      .replace(/-/g, ' & ')
      .replace(/_/g, ' ');

    // Process each emoji in the category
    Object.entries(data?.emojis).forEach(([_, emojiType]) => {
      processedEmojis.push({
        emoji: emojiType.emoji,
        name: emojiType.name,
        slug: emojiType?.slug,
        category: formattedCategory
      });
    });
  });

  return processedEmojis;
};

export const useEmojis = () => {
  const emojis = useMemo(() => processEmojiData(), []);
  return emojis;
}; 