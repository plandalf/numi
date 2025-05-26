import Numi, { Appearance, Style } from "@/contexts/Numi";
import { cn } from "@/lib/utils";
import { useMemo } from "react";

function ImageBlockComponent() {

  const [image] = Numi.useStateString({
    label: 'Image',
    name: 'image',
    defaultValue: '',
    inspector: 'file',
  });

  const style = Numi.useStyle([
    Style.alignment('alignment', 'Alignment', {
      options: {
        left: 'Left',
        center: 'Center',
        right: 'Right',
      },
    }, 'left'),
    Style.dimensions('dimensions', 'Dimensions', {
      config: {
        minWidth: 10,
        maxWidth: 500,
        minHeight: 10,
        maxHeight: 500,
      },
    }, { width: '100%', height: '100%' }),
    Style.border('border', 'Border', {}, { width: '-px', style: 'solid' }),
    Style.borderRadius('borderRadius', 'Border Radius', {}, '0px'),
    Style.borderColor('borderColor', 'Border Color', {}, '#000000'),
    Style.shadow('shadow', 'Shadow', {}, '0px 0px 0px 0px #000000'),
  ]);

  const appearance = Numi.useAppearance([
    Appearance.padding('padding', 'Padding', {}),
    Appearance.margin('margin', 'Margin', {}),
    Appearance.visibility('visibility', 'Visibility', {}, { conditional: [] }),
  ]);

  const src = useMemo(() => {
    if (!image) {
      return '';
    }
    return image;
  }, [image]);

  const styleProps = useMemo(() => {
    return {
      borderRadius: style?.borderRadius,
      borderColor: style?.borderColor,
      borderWidth: style?.border?.width,
      borderStyle: style?.border?.style,
      boxShadow: style?.shadow,
      padding: appearance?.padding,
      margin: appearance?.margin,
      width: style?.dimensions?.width,
      height: style?.dimensions?.height,
    }
  }, [style, appearance]);

  const classList = useMemo(() => {
    return cn('flex', {
      'justify-start': style?.alignment === 'left',
      'justify-center': style?.alignment === 'center',
      'justify-end': style?.alignment === 'right',
      'w-full': style?.alignment === 'expand',
    })
  }, [style.alignment]);

  if (!image) {
    console.log('no image');
    return (
      <div className='text-center'>
        <div className="text-gray-500">Upload an image</div>
      </div>
    )
  }

  return (
    <div className={classList}>
      <img src={src} alt=""  style={styleProps} />
    </div>
  )
}

export default ImageBlockComponent;
