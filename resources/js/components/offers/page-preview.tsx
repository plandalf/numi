import { type Page, type ViewSection, type Block, type BlockContent, type PageView, type TextContent, type IconContent } from '@/types/offer';
import { cn } from '@/lib/utils';
import LayoutPreview from './layout-preview';
import BlockEditor from './block-editor';
import { useState, useRef, useEffect, useContext } from 'react';
import { X, Save, Type, Calendar, DollarSign, Mail, Lock, Link, ChevronDown, Circle, CheckSquare, ToggleLeft, List, Heading1, Square as ButtonIcon, Image as ImageIcon, AtSign, User, Phone, MapPin, Package, CreditCard } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { BlockType, DRAG_TYPES } from './layout-preview';
import edit, { useEditor } from '@/pages/offers/edit';
import { GlobalStateContext } from '@/pages/Checkout';
import { JSONSchemaEditor } from '@/components/editor/JSONSchemaEditor';
import { Button } from '../ui/button';



export const Inspector = ({
    block,
    onClose,
    onUpdate,
    onSave
}: {
    block: Block;
    onClose: () => void;
    onUpdate: (block: Block) => void;
    onSave: () => void;
}) => {
  const globalState = useContext(GlobalStateContext);
  const { updateBlock } = useEditor();

    // const [selectedBlock, setSelectedBlock] = useState<Block>(block);
    // const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Update local state when incoming block changes
    useEffect(() => {
      if (!block) return;
      console.log('Inspector received block:', block.id, block.type);
      // setSelectedBlock(block);
      window.globalState = globalState;
    }, [block]);
    
    // const handleUpdate = (updatedBlock: Block) => {
    //     console.log('Inspector updating block:', updatedBlock.id, updatedBlock.type);
    //     setSelectedBlock(updatedBlock);
    //
    //     // Update preview immediately
    //     onUpdate(updatedBlock);
    //
    //     // Debounce save operation
    //     if (saveTimeoutRef.current) {
    //         clearTimeout(saveTimeoutRef.current);
    //     }
    //
    //     saveTimeoutRef.current = setTimeout(() => {
    //         onSave();
    //     }, 1000); // 1 second debounce
    // };

    // // Clean up timeout on unmount
    // useEffect(() => {
    //     return () => {
    //         if (saveTimeoutRef.current) {
    //             clearTimeout(saveTimeoutRef.current);
    //         }
    //     };
    // }, []);
  const handleContentChange = (fieldName: string, value: any) => {
    if (!block) return;

    console.log('handleContentChange', fieldName, value, block);

    updateBlock({
      ...block,
      content: {
        ...block.content,
        [fieldName]: value
      }
    });
  };

  const handleValidationChange = (fieldName: string, value: boolean) => {
    if (!block) return;

    updateBlock({
      ...block,
      validation: {
        ...block.validation,
        [fieldName]: value
      }
    });
  };


  if (!block) {
    return <div>
      could not find block
    </div>;
  }

    return (
      <div className="p-4">
        <Button onClick={onClose} className="mb-4">Close Inspector</Button>
        <div className="mb-4">

        {block && globalState.hookUsage[block.id] && (
          <div>
            <h3 className="font-bold mb-2">Editing: {block.type}</h3>
            <div className="space-y-4">
              {globalState.hookUsage[block.id]
                .filter(hook => hook.inspector !== 'hidden')
                .map((hook) => (
                  <div key={hook.name}>
                    <label className="block text-sm font-medium mb-1">
                      {hook.name} ({hook.type})
                    </label>
                    {hook.type === 'boolean' && (
                      <input
                        type="checkbox"
                        checked={block.content[hook.name] ??
                          block.validation?.[hook.name] ??
                          hook.defaultValue}
                        onChange={(e) => {
                          if (hook.name === 'isRequired') {
                            updateBlock({
                              ...block,
                              validation: {
                                ...block.validation,
                                [hook.name]: e.target.checked
                              }
                            });
                          } else {
                            handleContentChange(hook.name, e.target.checked);
                          }
                        }}
                      />
                    )}
                    {hook.type === 'enumeration' && (
                      <select onChange={(e) => handleContentChange(hook.name, e.target.value)} className='border border-gray-300 rounded-md p-2'>
                        {hook.options?.map((option: any) => (
                          <option value={option}>{hook.labels?.[option] ?? option}</option>
                        ))}
                      </select>
                    )}
                    {/* // <input */}
                    {/* //   type="text"
                //   value={selectedBlock.content[hook.name] ?? hook.defaultValue}
                //   onChange={(e) => handleContentChange(hook.name, e.target.value)}
                //   className="w-full p-2 border rounded"
                // /> */}
                    {hook.type === 'string' && hook.inspector === 'text' && (
                      <textarea
                        className='border border-gray-300 rounded-md p-2 w-full'
                        value={block.content[hook.name] ?? hook.defaultValue}
                        onChange={(e) => handleContentChange(hook.name, e.target.value)}
                      />
                    )}
                    {hook.type === 'string' && hook.inspector === 'file' && (
                      <input
                        type="file"
                        className='border border-gray-300 rounded-md p-2'
                        // value={block.content[hook.name] ?? hook.defaultValue}
                        onChange={(e) => handleContentChange(hook.name, e.target.value)}
                      />
                      // todo: do real image uploader
                    )}
                    {hook.type === 'jsonSchema' && hook.schema && (
                      <div className="border p-2 rounded bg-gray-50">
                        <JSONSchemaEditor
                          schema={hook.schema}
                          value={block.content[hook.name] || []}
                          onChange={(newValue) => handleContentChange(hook.name, newValue)}
                        />
                      </div>
                    )}
                  </div>
                ))}
            </div>

            <h3>Validation</h3>
            <div>
              <input
                type="checkbox"
                name="isRequired"
                checked={block.validation?.isRequired ?? false}
                onChange={(e) => handleValidationChange('isRequired', e.target.checked)}
              />
              Is Required?
            </div>

            <h3>Interaction</h3>
            <div>
              <input
                type="checkbox"
                name="isDisabled"
                checked={block.interaction?.isDisabled ?? false}
                onChange={(e) => {
                  updateBlock({
                    ...block,
                    interaction: {
                      ...block.interaction,
                      isDisabled: e.target.checked
                    }
                  })
                }}
              />
              Is Disabled?
            </div>
          </div>
        )}
        <h4 className="font-bold mt-2">Selected Block</h4>
        <pre className="whitespace-pre-wrap bg-gray-100 p-2 rounded text-xs">{JSON.stringify(block, null, 2)}</pre>

        <h4 className="font-bold mt-2">Hook Usage</h4>
        <pre className="whitespace-pre-wrap bg-gray-100 p-2 rounded text-xs">{JSON.stringify(globalState.hookUsage, null, 2)}</pre>
      </div>
      </div>
    )
};

interface PreviewProps {
  page: Page;
  onUpdatePage?: (page: Page) => void;
}


export function findBlockInPage(page: Page, blockId: string): Block | null {
    if (!page || !page.view) {
        console.error('Invalid page or view in findBlockInPage');
        return null;
    }

    const sections = Object.keys(page.view);

    for (const sectionName of sections) {
        const section = page.view[sectionName];
        if (!section || !section.blocks) continue;

        const block = section.blocks.find(block => block.id === blockId);
        if (block) return block;
    }

    return null;
}

// Helper function to find nested blocks
function findNestedBlock(blocks: Block[], blockId: string): Block | null {
    for (const block of blocks) {
        if (block.id === blockId) return block;

        if (block.children) {
            const nestedBlock = findNestedBlock(block.children, blockId);
            if (nestedBlock) return nestedBlock;
        }
    }

    return null;
}

// Helper function to convert style object to className string
export function styleToClassName(style: Record<string, string>): string {
    // This is a simple implementation - you might want to expand this
    // to handle more complex style conversions
    const classNames: string[] = [];

    if (style.textAlign) {
        const alignmentMap: Record<string, string> = {
            'left': 'text-left',
            'center': 'text-center',
            'right': 'text-right',
            'justify': 'text-justify'
        };
        classNames.push(alignmentMap[style.textAlign] || '');
    }

    if (style.color) {
        // This is simplified - in a real app you'd map colors to Tailwind classes
        classNames.push(`text-[${style.color}]`);
    }

    if (style.backgroundColor) {
        classNames.push(`bg-[${style.backgroundColor}]`);
    }

    return classNames.join(' ');
}

// Helper function to update a block in the page
function updateBlockInPage(page: Page, updatedBlock: Block): boolean {
    if (!page || !page.view || !updatedBlock.id) return false;

    const sections = ['title', 'content', 'action', 'promo'] as const;

    for (const sectionName of sections) {
        const section = page.view[sectionName];
        if (!section || !section.blocks) continue;

        const blockIndex = section.blocks.findIndex(b => b.id === updatedBlock.id);
        if (blockIndex >= 0) {
            section.blocks[blockIndex] = updatedBlock;
            return true;
        }
    }

    return false;
}


export default function PagePreview({ page, onUpdatePage }: PreviewProps) {

  const [pendingChanges, setPendingChanges] = useState<Block | null>(null);
  const [livePreviewPage, setLivePreviewPage] = useState<Page>(page);

  const { selectedBlockId, setSelectedBlockId } = useEditor();

  // Update live preview when page changes from outside
  useEffect(() => {
      setLivePreviewPage(page);
  }, [page]);

  const selectedBlock = selectedBlockId ? findBlockInPage(livePreviewPage, selectedBlockId) : null;


  useEffect(() => {
      console.log('Current selected block:', selectedBlock);
  }, [selectedBlock]);

  const handleBlockUpdate = (updatedBlock: Block) => {
      if (!updatedBlock.id) return;

      // Apply changes to the live preview immediately
      const updatedPreviewPage = JSON.parse(JSON.stringify(livePreviewPage));
      updateBlockInPage(updatedPreviewPage, updatedBlock);

      // Update live preview
      setLivePreviewPage(updatedPreviewPage);
      setPendingChanges(updatedBlock);
  };

  const handleSaveChanges = () => {
      if (!pendingChanges || !pendingChanges.id || !onUpdatePage) return;
      onUpdatePage(livePreviewPage);
      setPendingChanges(null);
  };

return (

  <div className="h-full flex bg-zinc-100">
    <div className="flex-1 flex items-center justify-center p-8 h-full overflow-auto">
      <div className="bg-background rounded-lg shadow-lg w-full max-w-5xl">
        {/* The layout preview - using live preview page */}
        <LayoutPreview
          page={livePreviewPage}
          selectedBlockId={selectedBlockId}
          onSelectBlock={setSelectedBlockId}
        />
      </div>
    </div>
  </div>
);
}
