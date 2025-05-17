import Numi, { Style } from "@/contexts/Numi";
import { cn } from "@/lib/utils";
import { useMemo } from "react";


function ImageBlockComponent() {

  const [image] = Numi.useStateString({
    name: 'image',
    defaultValue: '',
    inspector: 'file',
  });

  const appearance = Numi.useStyle([
    Style.alignment('alignment', 'Alignment', {}, 'left'),
    Style.border('border', 'Border', {}, { width: '1px', style: 'solid' }),
    Style.borderRadius('borderRadius', 'Border Radius', {}, '5px'),
    Style.borderColor('borderColor', 'Border Color', {}, '#000000'),
  ]);

  const src = useMemo(() => {
    if (!image) {
      return '';
    }
    return image;
  }, [image]);

  const classList = useMemo(() => {
    return cn('flex', {
      'justify-start': appearance.alignment === 'left',
      'justify-center': appearance.alignment === 'center',
      'justify-end': appearance.alignment === 'right',
      'w-full': appearance.alignment === 'expand',
    })
  }, [appearance.alignment]);

  console.log({appearance})
  if (!image) {
    return (
      <div>Upload an image</div>
    )
  }

  return (
    <div className={classList}>  
      <img src={src} alt=""  style={{
        borderRadius: appearance.borderRadius,
        borderColor: appearance.borderColor,
        borderWidth: appearance.border?.width,
        borderStyle: appearance.border?.style,
      }} />
    </div>
  )
}

export default ImageBlockComponent;
