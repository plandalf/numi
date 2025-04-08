import Numi from "@/contexts/Numi";
import { BlockContextType } from "@/types/blocks";
import cx from "classnames";

function QuoteBlockComponent({ context }: { context: BlockContextType }) {
  const [quote] = Numi.useStateString({
    name: 'quote',
    defaultValue: '',
    inspector: 'text',
  });

  const [author] = Numi.useStateString({
    name: 'author',
    defaultValue: '',
    inspector: 'text',
  });

  const [affiliation] = Numi.useStateString({
    name: 'affiliation',
    defaultValue: '',
    inspector: 'text',
  });

  const [image] = Numi.useStateString({
    name: 'image',
    defaultValue: '',
    inspector: 'file',
  });

  const [quoteStyle] = Numi.useStateEnumeration({
    name: 'style',
    initialValue: 'modern',
    options: ['modern', 'classic', 'minimal'],
    labels: {
      modern: 'Modern',
      classic: 'Classic',
      minimal: 'Minimal',
    },
    inspector: 'select',
    label: 'Quote Style',
  });

  return (
    <div className={cx("", {
      '': quoteStyle === 'modern',
      'bg-gray-50 border border-gray-200': quoteStyle === 'classic',
      'border-l-4 border-gray-300 pl-4': quoteStyle === 'minimal',
    })}>
      <div className="text-xs bg-gray-100 mb-4 p-1 rounded">QuoteBlockComponent: {context.blockId}</div>
      
      <div className="flex">
        {/* Big opening quote icon */}
        <div className={cx("text-6xl leading-none mr-3", {
          'text-gray-300': quoteStyle === 'modern',
          'text-gray-400': quoteStyle === 'classic',
          'text-gray-500': quoteStyle === 'minimal',
        })}>
          "
        </div>
        
        <div className="flex-1">
          {/* Quote text */}
          <div className={cx("mb-6", {
            'text-lg italic': quoteStyle === 'modern' || quoteStyle === 'classic',
            'text-base': quoteStyle === 'minimal',
          })}>
            {quote || "Insert your inspirational quote here"}
          </div>
          
          {/* Author info and image */}
          <div className="flex items-center mt-4 border-t pt-3">
            {image && (
              <div className="mr-3">
                <img 
                  src={image} 
                  alt={author || "Quote author"} 
                  className={cx("object-cover", {
                    'w-14 h-14 rounded-full': quoteStyle === 'modern',
                    'w-12 h-12 rounded-md': quoteStyle === 'classic',
                    'w-10 h-10 rounded': quoteStyle === 'minimal',
                  })}
                />
              </div>
            )}
            
            <div>
              {author && (
                <div className={cx({
                  'font-semibold text-gray-800': quoteStyle === 'modern' || quoteStyle === 'classic',
                  'font-medium text-gray-700': quoteStyle === 'minimal',
                })}>
                  {author}
                </div>
              )}
              
              {affiliation && (
                <div className="text-sm text-gray-600">
                  {affiliation}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default QuoteBlockComponent;