import React from 'react';
import { Theme } from '@/types/theme';

interface ThemeTypographyProps {
  theme?: Theme;
  className?: string;
}

export const ThemeTypographyLoader: React.FC<ThemeTypographyProps> = ({ theme }) => {

  if(!theme) return null;
    
  const getTypographyStyle = (element: string) => {
    const typography = theme[`${element}_typography` as keyof Theme] as string[];
    if (!Array.isArray(typography) || typography.length < 3) return {};
    
    const [size, font, weight] = typography;
    return {
      'font-size': size,
      'font-family': font,
      'font-weight': weight,
    };
  };

  const styles = `
    .numi-markdown h1 { ${Object.entries(getTypographyStyle('h1')).map(([k, v]) => `${k}: ${v}`).join(';')} }
    .numi-markdown h2 { ${Object.entries(getTypographyStyle('h2')).map(([k, v]) => `${k}: ${v}`).join(';')} }
    .numi-markdown h3 { ${Object.entries(getTypographyStyle('h3')).map(([k, v]) => `${k}: ${v}`).join(';')} }
    .numi-markdown h4 { ${Object.entries(getTypographyStyle('h4')).map(([k, v]) => `${k}: ${v}`).join(';')} }
    .numi-markdown h5 { ${Object.entries(getTypographyStyle('h5')).map(([k, v]) => `${k}: ${v}`).join(';')} }
    .numi-markdown h6 { ${Object.entries(getTypographyStyle('h6')).map(([k, v]) => `${k}: ${v}`).join(';')} }
    .numi-markdown p, .numi-markdown span { ${Object.entries(getTypographyStyle('body')).map(([k, v]) => `${k}: ${v}`).join(';')} }
    .numi-markdown label { ${Object.entries(getTypographyStyle('label')).map(([k, v]) => `${k}: ${v}`).join(';')} }
  `;

  return (<style>{styles}</style>);
}; 