import Numi, { Appearance, IconValue, Style } from "@/contexts/Numi";
import { BlockContextType } from "@/types/blocks";
import React, { useMemo, useRef, useEffect, useState } from "react";
import { IconRenderer } from "../ui/icon-renderer";
import { MarkdownText } from "../ui/markdown-text";
import { resolveThemeValue } from "@/lib/theme";

interface TimelineItem {
  key?: string;
  label: string;
  caption?: string;
  icon?: IconValue;
  tooltip?: string;
  disabled?: boolean;
  hidden?: boolean;
}

interface CompletedTimelineItem extends TimelineItem {
  isCompleted: boolean;
}

function DetailTimelineBlock({ context }: { context: BlockContextType }) {

  const theme = Numi.useTheme();

  const [items] = Numi.useStateJsonSchema({
    name: 'items',
    schema: {
      $schema: "http://json-schema.org/draft-07/schema#",
      type: "array",
      items: {
        type: "object",
        properties: {
          key: {
            type: "string",
            meta: { editor: "hidden" }
          },
          children: {
            type: "array",
            items: {
              $ref: "#"
            }
          },
          label: {
            title: "Label",
            type: "string",
            meta: { editor: "markdown" },
          },
          caption: {
            title: "Caption",
            type: "string",
            meta: { editor: "markdown" },
          },
          icon: {
            title: 'Icon',
            type: "object",
            defaultValue: { icon: null,  emoji: null, url: null } as IconValue,
            meta: { editor: "iconSelector" },
          },
          tooltip: {
            title: "Tooltip",
            type: "string"
          },
          disabled: {
            title: "Disabled",
            type: "boolean"
          },
          hidden: {
            title: "Hidden",
            type: "boolean"
          }
        },
        required: ["key"]
      }
    },
    defaultValue: [{
      label: 'Item 1',
      caption: 'Item 1 caption',
      prefixIcon: 'circle'
    }],
  });

  const [completionPercentage] = Numi.useStateNumber({
    name: 'completionPercentage',
    label: 'Completion Percentage',
    defaultValue: 0,
    min: 0,
    max: 100,
    inspector: 'slider',
  });

  const fontConfig = {
    config: {
      hideVerticalAlignment: true,
      hideHorizontalAlignment: true,
    },
  };

  const style = Numi.useStyle([
    Style.alignment('textAlignment', 'Text Alignment', {
      options: {
        start: 'start',
        center: 'center',
        end: 'end',
      },
    }, 'start'),
    Style.backgroundColor('backgroundColor', 'Background Color', {}, ''),
    Style.font('labelFont', 'Label Font & Color', fontConfig, {}),
    Style.font('captionFont', 'Caption Font & Color', fontConfig, {}),
    Style.alignment('iconAlignment', 'Icon Alignment', {
      options: {
        start: 'start',
        center: 'center',
        end: 'end',
      },
    }, 'start'),
    Style.textColor('iconColor', 'Icon Color', {}, theme?.primary_color),
    Style.borderColor('progressLineColor', 'Progress Line Color', {}, theme?.success_color),
    Style.borderColor('timelineLineColor', 'Timeline Line Color', {}, '#dddddd'),
    Style.dimensions('iconSize', 'Icon Size', {
      config: {
        hideWidth: true
      }
    }, { width: '15px', height: '15px' }),
    Style.border('border', 'Border', {}, { width: '0px', style: 'solid' }),
    Style.borderRadius('borderRadius', 'Border Radius', {}, '0px'),
    Style.borderColor('borderColor', 'Border Color', {}, ''),
    Style.shadow('shadow', 'Button Shadow', {}, ''),
    Style.hidden('hidden', 'Hidden', {}, false),
  ]);

  const appearance = Numi.useAppearance([
    Appearance.padding('padding', 'Padding', {}, '0px'),
    Appearance.margin('margin', 'Margin', {}),
    Appearance.spacing('spacing', 'Spacing', { config: { format: 'single' } }),
    Appearance.spacing('labelAndCaptionSpacing', 'Label & Caption Spacing', { config: { format: 'single' } }),
    Appearance.spacing('iconAndTextSpacing', 'Icon & Text Spacing', { config: { format: 'single' } }),
    Appearance.visibility('visibility', 'Visibility', {}, { conditional: [] }),
  ]);

  const containerStyles = useMemo(() => ({
    backgroundColor: resolveThemeValue(style.backgroundColor, theme) as string,
    color: resolveThemeValue(style.textColor, theme) as string,
    borderColor: resolveThemeValue(style.borderColor, theme) as string,
    borderWidth: style.border?.width,
    borderStyle: style.border?.style,
    borderRadius : style.borderRadius,
    boxShadow: style.shadow,
    padding: appearance.padding,
    margin: appearance.margin,
    gap: appearance.spacing,
  }), [style, appearance]);

  const labelStyle = useMemo(() => ({
    color: resolveThemeValue(style.labelFont?.color, theme),
    fontSize: style.labelFont?.size,
    fontWeight: style.labelFont?.weight,
    fontFamily: style.labelFont?.font,
    lineHeight: style.labelFont?.lineHeight,
    letterSpacing: style.labelFont?.letterSpacing,
  }), [style]);

  const captionStyle = useMemo(() => ({
    color: resolveThemeValue(style.captionFont?.color, theme),
    fontSize: style.captionFont?.size,
    fontWeight: style.captionFont?.weight,
    fontFamily: style.captionFont?.font,
    lineHeight: style.captionFont?.lineHeight,
    letterSpacing: style.captionFont?.letterSpacing,
  }), [style]);

  const iconStyle = useMemo(() => ({
    alignSelf: style.iconAlignment ?? 'start',
    color: resolveThemeValue(style.iconColor, theme, 'primary_color'),
    size: style.iconSize?.height ?? '15px',
  }), [style]);

  const textContainerStyle = useMemo(() => ({
    gap: resolveThemeValue(appearance.labelAndCaptionSpacing, theme, 'spacing') as string
  }), [appearance]);

  // Generate unique keys and completion status
  const dataToRender = items && items.length > 0 ? items : [];
  const itemsWithKeys = useMemo(() => {
    return dataToRender.map((item: TimelineItem, index: number) => ({
      ...item,
      key: item.key || `timeline-item-${index}-${item.label?.slice(0, 10) || 'item'}`
    }));
  }, [dataToRender]);

  const itemsWithCompletion = useMemo(() => {
    const totalItems = itemsWithKeys.length;
    if (totalItems === 0) return [];
    const clampedCompletion = Math.min(100, completionPercentage);
    return itemsWithKeys.map((item: TimelineItem, index: number): CompletedTimelineItem => {
      if (totalItems === 1) {
        return { ...item, isCompleted: clampedCompletion > 0 };
      }
      return {
        ...item,
        isCompleted: clampedCompletion >= (index / (totalItems - 1)) * 100
      };
    });
  }, [itemsWithKeys, completionPercentage]);

  // --- Dynamic timeline line logic ---
  const timelineContainerRef = useRef<HTMLDivElement>(null);
  const [linePositions, setLinePositions] = useState<{
    background: { top: number; height: number } | null;
    progress: { top: number; height: number } | null;
  }>({ background: null, progress: null });

  // Create refs for each icon
  const iconRefs = useMemo(
    () => itemsWithCompletion.map(() => React.createRef<HTMLDivElement>()),
    [itemsWithCompletion.length]
  );

  useEffect(() => {
    if (!timelineContainerRef.current || iconRefs.length === 0) return;
    // Get bounding rect for container
    const containerRect = timelineContainerRef.current.getBoundingClientRect();
    // Get icon centers
    const iconCenters = iconRefs.map((ref: React.RefObject<HTMLDivElement>) => {
      if (!ref.current) return null;
      const rect = ref.current.getBoundingClientRect();
      return rect.top - containerRect.top + rect.height / 2;
    });
    // Only proceed if all icons are measured
    if (iconCenters.some((c: number | null) => c === null)) return;
    // Background line: from center of first to center of last icon
    const first = iconCenters[0]!;
    const last = iconCenters[iconCenters.length - 1]!;
    const bgTop = first;
    const bgHeight = last - first;
    // Progress line: interpolate smoothly between first and last icon
    const clampedCompletion = Math.min(100, completionPercentage);
    const progressTop = first;
    let progressHeight = 0;
    if (clampedCompletion > 0) {
      progressHeight = (last - first) * (clampedCompletion / 100);
    }
    setLinePositions({
      background: { top: bgTop, height: bgHeight },
      progress: clampedCompletion > 0 ? { top: progressTop, height: progressHeight } : null,
    });
  }, [itemsWithCompletion, iconRefs, completionPercentage]);

  if(style.hidden) return null;

  const renderTimelineItem = (item: CompletedTimelineItem, index: number, isLast: boolean) => {
    if (!item || item.hidden) return null;
    const iconSize = style.iconSize?.height ?? '24px';
    const iconSizeNum = parseInt(iconSize);
    const isCompleted = item.isCompleted;
    return (
      <div key={item.key} className="relative flex" style={{ marginBottom: isLast ? '0' : resolveThemeValue(appearance.spacing, theme, 'spacing') as string }}>
        {/* Timeline line column */}
        <div className="relative flex flex-col items-center" style={{ width: iconSize, minWidth: iconSize }}>
          {/* Icon container */}
          <div
            ref={iconRefs[index]}
            className="relative flex items-center justify-center rounded-full border-2"
            style={{
              width: iconSize,
              height: iconSize,
              backgroundColor: isCompleted ? (resolveThemeValue(style.progressColor, theme, 'success_color') as string) : '#ffffff',
              borderColor: isCompleted ? (resolveThemeValue(style.progressColor, theme, 'success_color') as string) : (resolveThemeValue(style.iconColor, theme, 'primary_color') as string),
              zIndex: 3,
            }}
          >
            <IconRenderer
              icon={item.icon || { icon: null, emoji: null, url: null }}
              style={{
                color: (isCompleted ? '#ffffff' : iconStyle.color) as string,
                size: `${Math.max(12, iconSizeNum * 0.6)}px`,
              }}
              defaultIcon={
                <span style={{
                  color: (isCompleted ? '#ffffff' : iconStyle.color) as string,
                  fontSize: `${Math.max(8, iconSizeNum * 0.4)}px`
                }}>●</span>
              }
            />
          </div>
        </div>
        {/* Content */}
        <div
          className="flex-1 flex flex-col"
          style={{
            ...textContainerStyle,
            marginLeft: resolveThemeValue(appearance.iconAndTextSpacing, theme, 'spacing') as string,
            paddingTop: '2px'
          }}
        >
          <div className="flex items-center">
            <MarkdownText
              className="font-medium"
              text={item.label}
              style={{ ...labelStyle, color: resolveThemeValue(style.labelFont?.color, theme) as string }}
              theme={theme}
            />
            {item.tooltip && (
              <div
                className="ml-2 text-gray-500 cursor-help"
                style={{ color: resolveThemeValue(style.captionFont?.color, theme) as string }}
                title={item.tooltip}
              >
                ⓘ
              </div>
            )}
          </div>
          {item.caption && (
            <MarkdownText
              className="text-sm text-gray-500"
              text={item.caption}
              style={{ ...captionStyle, color: resolveThemeValue(style.captionFont?.color, theme) as string }}
              theme={theme}
            />
          )}
        </div>
      </div>
    );
  };

  if(style.hidden) return null;

  return (
    <div style={containerStyles}>
      {dataToRender && dataToRender.length > 0 && (
        <div className="flex flex-col relative" ref={timelineContainerRef}>
          {/* Dynamic background timeline line */}
          {itemsWithCompletion.length > 1 && linePositions.background && (
            <div
              className="absolute"
              style={{
                backgroundColor: style.timelineLineColor ?? '#dddddd',
                width: '2px',
                left: `calc(${parseInt(style.iconSize?.height ?? '24px') / 2}px - 1px)`,
                top: `${linePositions.background.top}px`,
                height: `${linePositions.background.height}px`,
                zIndex: 1,
              }}
            />
          )}
          {/* Dynamic progress line */}
          {completionPercentage > 0 && linePositions.progress && (
            <div
              className="absolute"
              style={{
                backgroundColor: resolveThemeValue(style.progressLineColor, theme, 'success_color') as string,
                width: '2px',
                left: `calc(${parseInt(style.iconSize?.height ?? '24px') / 2}px - 1px)`,
                top: `${linePositions.progress.top}px`,
                height: `${linePositions.progress.height}px`,
                zIndex: 2,
              }}
            />
          )}
          {itemsWithCompletion.map((item: CompletedTimelineItem, index: number) =>
            renderTimelineItem(
              item,
              index,
              index === itemsWithCompletion.length - 1
            )
          )}
        </div>
      )}
      {(!dataToRender || dataToRender.length === 0) && (
        <div className="text-xs text-gray-500 mt-2 p-1 bg-gray-50 rounded">
          Note: Showing sample data. Edit in the JSONSchema editor to customize.
        </div>
      )}
    </div>
  );
}

export default DetailTimelineBlock;

