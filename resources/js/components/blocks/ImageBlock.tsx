import Numi, { Appearance, Style } from "@/contexts/Numi";
import { cn } from "@/lib/utils";
import { useMemo } from "react";


function ImageBlockComponent() {

  const [image] = Numi.useStateString({
    name: 'image',
    defaultValue: '',
    inspector: 'file',
  });

  const style = Numi.useStyle([
    Style.alignment('alignment', 'Alignment', {}, 'left'),
    Style.border('border', 'Border', {}, { width: '1px', style: 'solid' }),
    Style.borderRadius('borderRadius', 'Border Radius', {}, '5px'),
    Style.borderColor('borderColor', 'Border Color', {}, '#000000'),
  ]);    
  
  const appearance = Numi.useAppearance([
    Appearance.padding('padding', 'Padding', {}),
    Appearance.spacing('spacing', 'Spacing', {}),
    Appearance.visibility('visibility', 'Visibility', {}, { conditional: [] }),
  ]);

  const src = useMemo(() => {
    if (!image) {
      return '';
    }
    return image;
  }, [image]);

  const classList = useMemo(() => {
    return cn('flex', {
      'justify-start': style?.alignment === 'left',
      'justify-center': style?.alignment === 'center',
      'justify-end': style?.alignment === 'right',
      'w-full': style?.alignment === 'expand',
    })
  }, [style.alignment]);

  if (!image) {
    return (
      <div>Upload an image</div>
    )
  }

  return (
    <div className={classList}>  
      <img src={src} alt=""  style={{
        borderRadius: style?.borderRadius,
        borderColor: style?.borderColor,
        borderWidth: style?.border?.width,
        borderStyle: style?.border?.style,
      }} />
    </div>
  )
}

export default ImageBlockComponent;
