import Numi, { Appearance, Style, IconValue, FontValue } from "@/contexts/Numi";
import { BlockContextType } from "@/types/blocks";
import cx from "classnames";
import { useMemo } from "react";
import { MarkdownText } from "../ui/markdown-text";
import * as LucideIcons from "lucide-react";
import { IconRenderer } from "../ui/icon-renderer";
import { resolveThemeValue } from "@/lib/theme";

function QuoteBlockComponent({ context }: { context: BlockContextType }) {

  const theme = Numi.useTheme();

  const [quoteStyle] = Numi.useStateEnumeration({
    name: 'style',
    initialValue: 'modern',
    options: ['modern', 'classic', 'minimal'],
    labels: {
      modern: 'Modern',
      classic: 'Classic',
      minimal: 'Minimal',
    },
    icons: {
      modern: (<svg xmlns="http://www.w3.org/2000/svg" width="61" height="47" viewBox="0 0 61 47" fill="none">
        <path d="M6.78728 7.51802C6.78728 8.15203 6.55296 8.69916 6.082 9.15236C5.61104 9.6079 5.01248 9.83567 4.28632 9.83567C3.45344 9.83567 2.78064 9.5445 2.26792 8.96215C1.7552 8.3798 1.5 7.65422 1.5 6.78774C1.5 4.88102 2.01272 3.45802 3.03816 2.5164C4.0636 1.57478 5.20504 1.0394 6.46712 0.912598V2.84984C5.8036 2.95551 5.20736 3.24669 4.67144 3.72337C4.13784 4.20005 3.85944 4.78709 3.83856 5.48685C4.01024 5.38118 4.23296 5.32717 4.51136 5.32717C5.21664 5.32717 5.77112 5.52207 6.17712 5.91422C6.58312 6.30636 6.78496 6.8394 6.78496 7.51802H6.78728ZM13.1 7.51802C13.1 8.15203 12.8657 8.69916 12.3947 9.15236C11.9238 9.6079 11.3252 9.83567 10.599 9.83567C9.76616 9.83567 9.09336 9.5445 8.58064 8.96215C8.06792 8.3798 7.81272 7.65422 7.81272 6.78774C7.81272 4.88337 8.32544 3.45802 9.35088 2.5164C10.3763 1.57478 11.5178 1.0394 12.7798 0.912598V2.84984C12.1163 2.95551 11.5201 3.24669 10.9842 3.72337C10.4506 4.20005 10.1722 4.78709 10.1513 5.48685C10.323 5.38118 10.5457 5.32717 10.8241 5.32717C11.5294 5.32717 12.0838 5.52207 12.4898 5.91422C12.8958 6.30636 13.0977 6.8394 13.0977 7.51802H13.1Z" fill="#189AB4"/>
        <path d="M59.5 16.8257H1.5M59.5 24.4103H1.5M59.5 42.7026H20.5111M40.4889 32.8872H1.5" stroke="#DFF6FC" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <circle cx="5.06923" cy="42.851" r="3.56923" fill="#189AB4"/>
      </svg>),
      classic: (<svg xmlns="http://www.w3.org/2000/svg" width="67" height="36" viewBox="0 0 67 36" fill="none">
        <path d="M60.2152 6.03271H10.2319M60.2152 12.569H10.2319" stroke="#DFF6FC" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M50.7356 20.6826H23.1586" stroke="#189AB4" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <circle cx="14.5408" cy="23.2684" r="4.3089" fill="#189AB4"/>
        <rect x="1.25227" y="0.5" width="64.4953" height="34.333" rx="5.5" stroke="#DFF6FC"/>
        <path d="M24.8822 23.2676L25.4147 24.4021L26.6057 24.5852L25.7439 25.4678L25.9473 26.7147L24.8822 26.1257L23.817 26.7147L24.0204 25.4678L23.1586 24.5852L24.3496 24.4021L24.8822 23.2676Z" fill="#189AB4"/>
        <path d="M29.191 23.2676L29.7235 24.4021L30.9145 24.5852L30.0527 25.4678L30.2561 26.7147L29.191 26.1257L28.1258 26.7147L28.3292 25.4678L27.4674 24.5852L28.6584 24.4021L29.191 23.2676Z" fill="#189AB4"/>
        <path d="M33.5001 23.2676L34.0326 24.4021L35.2236 24.5852L34.3618 25.4678L34.5652 26.7147L33.5001 26.1257L32.4349 26.7147L32.6383 25.4678L31.7765 24.5852L32.9675 24.4021L33.5001 23.2676Z" fill="#189AB4"/>
        <path d="M37.8088 23.2676L38.3414 24.4021L39.5324 24.5852L38.6706 25.4678L38.874 26.7147L37.8088 26.1257L36.7437 26.7147L36.9471 25.4678L36.0853 24.5852L37.2763 24.4021L37.8088 23.2676Z" fill="#189AB4"/>
        <path d="M42.1176 23.2676L42.6502 24.4021L43.8412 24.5852L42.9794 25.4678L43.1828 26.7147L42.1176 26.1257L41.0525 26.7147L41.2559 25.4678L40.3941 24.5852L41.5851 24.4021L42.1176 23.2676Z" fill="#189AB4"/>
        <path d="M50.4836 25.7724C50.4836 26.2214 50.1324 26.5522 49.7014 26.5522C49.2703 26.5522 48.9191 26.2214 48.9191 25.7724C48.9191 25.3203 49.2703 24.9927 49.7014 24.9927C50.1324 24.9927 50.4836 25.3203 50.4836 25.7724ZM50.1412 25.7724C50.1412 25.4919 49.9376 25.2999 49.7014 25.2999C49.4651 25.2999 49.2616 25.4919 49.2616 25.7724C49.2616 26.0502 49.4651 26.2449 49.7014 26.2449C49.9376 26.2449 50.1412 26.0498 50.1412 25.7724Z" fill="#189AB4"/>
        <path d="M52.1708 25.7724C52.1708 26.2214 51.8196 26.5522 51.3886 26.5522C50.9576 26.5522 50.6064 26.2214 50.6064 25.7724C50.6064 25.3207 50.9576 24.9927 51.3886 24.9927C51.8196 24.9927 52.1708 25.3203 52.1708 25.7724ZM51.8284 25.7724C51.8284 25.4919 51.6249 25.2999 51.3886 25.2999C51.1523 25.2999 50.9488 25.4919 50.9488 25.7724C50.9488 26.0502 51.1523 26.2449 51.3886 26.2449C51.6249 26.2449 51.8284 26.0498 51.8284 25.7724Z" fill="#189AB4"/>
        <path d="M53.7879 25.0398V26.4397C53.7879 27.0156 53.4483 27.2508 53.0468 27.2508C52.6688 27.2508 52.4414 26.998 52.3556 26.7913L52.6537 26.6672C52.7068 26.7941 52.8369 26.9439 53.0464 26.9439C53.3034 26.9439 53.4627 26.7853 53.4627 26.4868V26.3747H53.4507C53.3741 26.4692 53.2264 26.5519 53.0401 26.5519C52.6502 26.5519 52.293 26.2123 52.293 25.7753C52.293 25.3351 52.6502 24.9927 53.0401 24.9927C53.2261 24.9927 53.3737 25.0753 53.4507 25.1671H53.4627V25.0401H53.7879V25.0398ZM53.4869 25.7753C53.4869 25.5007 53.3038 25.2999 53.0707 25.2999C52.8344 25.2999 52.6365 25.5007 52.6365 25.7753C52.6365 26.047 52.8344 26.2449 53.0707 26.2449C53.3038 26.2449 53.4869 26.047 53.4869 25.7753Z" fill="#189AB4"/>
        <path d="M54.3242 24.2188V26.5039H53.9902V24.2188H54.3242Z" fill="#189AB4"/>
        <path d="M55.6258 26.0285L55.8915 26.2057C55.8058 26.3326 55.599 26.5512 55.2418 26.5512C54.7989 26.5512 54.468 26.2088 54.468 25.7715C54.468 25.3078 54.8017 24.9917 55.2035 24.9917C55.6082 24.9917 55.8061 25.3137 55.8708 25.4878L55.9063 25.5764L54.8639 26.0081C54.9437 26.1645 55.0678 26.2443 55.2418 26.2443C55.4162 26.2443 55.5372 26.1585 55.6258 26.0285ZM54.8077 25.7479L55.5045 25.4586C55.4661 25.3612 55.3508 25.2933 55.2151 25.2933C55.0411 25.2933 54.7989 25.447 54.8077 25.7479Z" fill="#189AB4"/>
        <path d="M47.6547 25.5692V25.2384H48.7695C48.7804 25.296 48.786 25.3642 48.786 25.4381C48.786 25.6863 48.7182 25.9932 48.4995 26.2118C48.2868 26.4333 48.0151 26.5515 47.655 26.5515C46.9878 26.5515 46.4267 26.0079 46.4267 25.3407C46.4267 24.6734 46.9878 24.1299 47.655 24.1299C48.0242 24.1299 48.2872 24.2747 48.4847 24.4635L48.2513 24.697C48.1096 24.5641 47.9177 24.4607 47.6547 24.4607C47.1674 24.4607 46.7863 24.8534 46.7863 25.3407C46.7863 25.8279 47.1674 26.2206 47.6547 26.2206C47.9708 26.2206 48.1508 26.0937 48.2661 25.9784C48.3596 25.8849 48.4211 25.7513 48.4454 25.5688L47.6547 25.5692Z" fill="#189AB4"/>
      </svg>),
      minimal: (<svg xmlns="http://www.w3.org/2000/svg" width="67" height="21" viewBox="0 0 67 21" fill="none">
        <path d="M66.0001 2.27588H25.0346M66.0001 10.2414H25.0346" stroke="#DFF6FC" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M56.4153 18.2065H25.0346" stroke="#189AB4" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <circle cx="10.2414" cy="10.2414" r="10.2414" fill="#189AB4"/>
      </svg>),
    },
    inspector: 'card',
    label: 'Quote Style',
  });

  const [icon] = Numi.useStateJsonSchema({
    name: 'icon',
    label: 'Icon',
    defaultValue: { icon: null,  emoji: null, url: null } as IconValue,
    schema: {
      $schema: "http://json-schema.org/draft-07/schema#",
      type: "object",
      meta: { editor: "iconSelector" },
    },
  });

  const [quote] = Numi.useStateString({
    label: 'Quote',
    name: 'quote',
    defaultValue: '',
    inspector: 'multiline',
    format: 'markdown',
  });

  const [author] = Numi.useStateString({
    label: 'Author',
    name: 'author',
    defaultValue: '',
    inspector: 'multiline',
    format: 'markdown',
  });

  const [affiliation] = Numi.useStateString({
    label: 'Affiliation',
    name: 'affiliation',
    defaultValue: '',
    inspector: 'multiline',
    format: 'markdown',
  });

  const [image] = Numi.useStateString({
    label: 'Image',
    name: 'image',
    defaultValue: '',
    inspector: 'file',
  });
  
  const fontConfig = {
    config: {
      hideVerticalAlignment: true,
      hideHorizontalAlignment: true,
    },
  };

  const style = Numi.useStyle([
    Style.backgroundColor('backgroundColor', 'Background Color', {}, ''),

    Style.alignment('iconAlignment', 'Icon Alignment', {
      options: {
        start: 'start',
        center: 'center',
        end: 'end',
      },
    }, 'start'),
    Style.backgroundColor('iconColor', 'Icon Color', {}, '#000000'),
    Style.dimensions('iconSize', 'Icon Size', {
      config: {
        hideWidth: true
      }
    }, { height: '42px'}),

    Style.alignment('quoteTextAlignment', 'Quote Text Alignment', {
      options: {
        left: 'left',
        center: 'center',
        right: 'right',
      },
    }, 'left'),
    Style.font('quoteTextFont', 'Quote Text Font & Color', fontConfig, {}),
    Style.font('authorFont', 'Author Font & Color', fontConfig, {}),
    Style.font('affiliationFont', 'Affiliation Font & Color', fontConfig, {}),

    Style.dimensions('imageSize', 'Image Size', {},
      quoteStyle === 'minimal'
        ? { width: '100px', height: '100px'}
        : { width: '56px', height: '56px'}
    ),
    Style.backgroundColor('imageBackgroundColor', 'Image Background Color', {}, ''),
    Style.border('imageBorder', 'Image Border', {}, { width: '0px', style: 'solid' }),
    Style.borderRadius('imageBorderRadius', 'Image Border Radius', {}, theme?.border_radius),
    Style.borderColor('imageBorderColor', 'Image Border Color', {}, theme?.primary_color),
    Style.shadow('imageShadow', 'Image Shadow', {}),

    Style.border('border', 'Border', {}, { width: '0px', style: 'solid' }),
    Style.borderRadius('borderRadius', 'Border Radius', {}, '0px'),
    Style.borderColor('borderColor', 'Border Color', {}, ''),
    Style.shadow('shadow', 'Shadow', {}, '0px 0px 0px 0px'),
    Style.hidden('hidden', 'Hidden', {}, false),
  ]);

  const appearance = Numi.useAppearance([
    Appearance.padding('padding', 'Padding', {}, '0px'),
    Appearance.margin('margin', 'Margin', {}),
    Appearance.spacing('spacing', 'Spacing', { config: { format: 'single' } }),
    Appearance.spacing('imageSpacing', 'Image Spacing', { config: { format: 'single' } }),
    Appearance.spacing('authorSpacing', 'Author Spacing', { config: { format: 'single' } }),
    Appearance.visibility('visibility', 'Visibility', {}, { conditional: [] }),
  ]);

  const quoteTextFont = resolveThemeValue(style.quoteTextFont, theme, 'body_typography') as FontValue;
  const authorFont = resolveThemeValue(style.authorFont, theme, 'label_typography') as FontValue;
  const affiliationFont = resolveThemeValue(style.affiliationFont, theme, 'body_typography') as FontValue;

  const containerStyles = useMemo(() => ({
    backgroundColor: resolveThemeValue(style.backgroundColor, theme),
    color: resolveThemeValue(style.textColor, theme),
    borderColor: resolveThemeValue(style.borderColor, theme),
    borderWidth: style.border?.width,
    borderStyle: style.border?.style,
    borderRadius : style.borderRadius ?? '3px',
    boxShadow: style?.shadow,
    padding: resolveThemeValue(appearance.padding, theme, 'padding'),
    margin: resolveThemeValue(appearance.margin, theme, 'margin'),
    gap: resolveThemeValue(appearance.spacing, theme, 'spacing'),
  }), [style, appearance]);

  const imageSpacing = resolveThemeValue(appearance.imageSpacing, theme, 'spacing') as string;
  const authorSpacing = resolveThemeValue(appearance.authorSpacing, theme, 'spacing') as string;

  const imageStyles = useMemo(() => ({
    backgroundColor: resolveThemeValue(style.imageBackgroundColor, theme),
    width: style.imageSize?.width,
    height: style.imageSize?.height,
    borderColor: resolveThemeValue(style.imageBorderColor, theme),
    borderWidth: style.imageBorder?.width,
    borderStyle: style.imageBorder?.style,
    borderRadius : style.imageBorderRadius ?? '3px',
    boxShadow: style?.imageShadow,
  }), [style]);

  const quoteTextStyles = useMemo(() => ({
    textAlign: style?.quoteTextAlignment,
    color: resolveThemeValue(quoteTextFont?.color, theme),
    fontSize: quoteTextFont?.size,
    fontWeight: quoteTextFont?.weight,
    fontFamily: quoteTextFont?.font,
    lineHeight: quoteTextFont?.lineHeight,
    letterSpacing: quoteTextFont?.letterSpacing,
  }), [style, quoteTextFont]);

  const authorStyles = useMemo(() => ({
    color: resolveThemeValue(authorFont?.color, theme),
    fontSize: authorFont?.size,
    fontWeight: authorFont?.weight,
    fontFamily: authorFont?.font,
    lineHeight: authorFont?.lineHeight,
    letterSpacing: authorFont?.letterSpacing,
  }), [style, authorFont]);

  const affiliationStyles = useMemo(() => ({
    color: resolveThemeValue(affiliationFont?.color, theme),
    fontSize: affiliationFont?.size,
    fontWeight: affiliationFont?.weight,
    fontFamily: affiliationFont?.font,
    lineHeight: affiliationFont?.lineHeight,
    letterSpacing: affiliationFont?.letterSpacing,
  }), [style, affiliationFont]);

  const iconStyles = useMemo(() => ({
    alignment: style?.iconAlignment,
    size: style?.iconSize?.height ?? '42px',
    color: resolveThemeValue(style?.iconColor, theme),
  }), [style]);

  const quoteValue = quote || "Insert your inspirational quote here";

  const quoteText = (
    <MarkdownText
      text={quoteValue}
      theme={theme}
      style={quoteTextStyles}
    />
  );

  const authorText = (
    <MarkdownText
      className="text-base font-medium"
      text={author || "Quote author"}
      theme={theme}
      style={authorStyles}
    />
  );

  const affiliationText = (
    <MarkdownText
      className="text-sm"
      text={affiliation || "Affiliation"}
      theme={theme}
      style={affiliationStyles}
    />
  );
   
  const defaultIcon = (
    <svg
      style={{
        alignSelf: iconStyles?.alignment,
      }}
      width={iconStyles?.size ?? '42px'}
      height={iconStyles?.size ?? '42px'}
      viewBox="0 0 42 33" fill="none" xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M19.1436 24.1816C19.1436 26.4553 18.2952 28.4174 16.59 30.0426C14.8848 31.6763 12.7176 32.4932 10.0884 32.4932C7.0728 32.4932 4.6368 31.449 2.7804 29.3605C0.924 27.2721 0 24.67 0 21.5626C0 14.7247 1.8564 9.62158 5.5692 6.24474C9.282 2.8679 13.4148 0.947901 17.9844 0.493164V7.44053C15.582 7.81948 13.4232 8.86369 11.4828 10.5732C9.5508 12.2826 8.5428 14.3879 8.4672 16.8974C9.0888 16.5184 9.8952 16.3247 10.9032 16.3247C13.4568 16.3247 15.4644 17.0237 16.9344 18.43C18.4044 19.8363 19.1352 21.7479 19.1352 24.1816H19.1436ZM42 24.1816C42 26.4553 41.1516 28.4174 39.4464 30.0426C37.7412 31.6763 35.574 32.4932 32.9448 32.4932C29.9292 32.4932 27.4932 31.449 25.6368 29.3605C23.7804 27.2721 22.8564 24.67 22.8564 21.5626C22.8564 14.7332 24.7128 9.62158 28.4256 6.24474C32.1384 2.8679 36.2712 0.947901 40.8408 0.493164V7.44053C38.4384 7.81948 36.2796 8.86369 34.3392 10.5732C32.4072 12.2826 31.3992 14.3879 31.3236 16.8974C31.9452 16.5184 32.7516 16.3247 33.7596 16.3247C36.3132 16.3247 38.3208 17.0237 39.7908 18.43C41.2608 19.8363 41.9916 21.7479 41.9916 24.1816H42Z"
        fill={iconStyles?.color ?? 'black'}
      />
    </svg>
  );

  if (quoteStyle === 'modern') {
    return (
      <div className="flex flex-col gap-2" style={containerStyles}>
          <IconRenderer icon={icon} style={iconStyles} defaultIcon={defaultIcon}/>
          {quoteText}
          <div className="flex flex-row gap-4 items-center" style={{ gap: imageSpacing}}>
            {image && (
              <img
                src={image}
                className="object-cover w-14 h-14 rounded-full"
                style={imageStyles}
              />
            )}
            <div className="flex flex-col" style={{ gap: authorSpacing }}>
              {authorText}
              {affiliationText}
            </div>
          </div>
      </div>
    );
  }


  if(quoteStyle === 'classic') {
    return (
      <div className="flex flex-col gap-2 p-4" style={containerStyles}>
          {quoteText}
          <div className="flex flex-row gap-4 items-center" style={{ gap: imageSpacing }}>
            {image && (
              <img
                src={image}
                className="object-cover w-14 h-14 rounded-full"
                style={imageStyles}
              />
            )}
            <div className="flex flex-col" style={{ gap: authorSpacing }}>
              {authorText}
              {affiliationText}
            </div>
          </div>
      </div>
    );
  }

  if(quoteStyle === 'minimal') {
    return (
      <div className="flex flex-row gap-2 p-4 items-center" style={{...containerStyles, gap: imageSpacing}}>
        {image && (
          <img
            src={image}
            className="object-cover w-32 h-32 rounded-full"
            style={imageStyles}
          />
        )}
          <div className="flex flex-col gap-4 items-center">
            {quoteText}
            <div className="flex flex-col" style={{ gap: authorSpacing }}>
              {authorText}
              {affiliationText}
            </div>
          </div>
      </div>
    );
  }
}

export default QuoteBlockComponent;
