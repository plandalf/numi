import { useCallback, useMemo, useState, useEffect, createContext, useContext, useRef } from 'react';
import {
    ReactFlow,
    Controls,
    Background,
    useNodesState,
    useEdgesState,
    Connection,
    Edge,
    Node,
    useReactFlow,
    Panel,
    NodeTypes,
    EdgeTypes,
    XYPosition,
    OnConnectStart,
    OnConnectEnd,
    Handle,
    Position,
    getBezierPath
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Flag, Plus, X, LogIn, LogOut, FileText, MoreHorizontal, AlertTriangle } from 'lucide-react';
import { type Page, type OfferView, type PageType } from '@/types/offer';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import PageTypeDialog from './page-type-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle
} from '@/components/ui/dialog';
import 'react-querybuilder/dist/query-builder.css';

interface PageFlowEditorProps {
    view: OfferView;
    onUpdateFlow: (changes: {
        pages: Record<string, Page>;
        first_page: string;
    }) => void;
}

const NODE_WIDTH = 250;
const NODE_HEIGHT = 150;
const GRID_SPACING = 20;

export function generateDefaultPage({
    id, type, position, pageNumber
}: {
    id?: string;
    type: PageType;
    position: XYPosition;
    pageNumber: number;
}): Page {
    if (!id) {
        id = `page_${Math.random().toString(36).substr(2, 9)}`;
    }

    console.log('Creating new page:', { id, type, position, pageNumber });

    // todo: abstract this out to layout generator
  // with defaults!
  // templates should contain their own layouts!

    // sections: [], one is asContainer?

    return {
      id,
      name: `Page ${pageNumber}`,
      type,
      position,
      view: {
        title: {
          style: {
              backgroundColor: '#FBF9FA'
          },
          blocks: []
        },
        content: {
          style: {
              backgroundColor: '#FBF9FA'
          },
          blocks: []
        },
        action: {
          style: {
              backgroundColor: '#FBF9FA'
          },
          blocks: []
        },
        promo_box: {
          asContainer: true,
          style: {
              backgroundColor: '#EFF6FF'
          },
          blocks: []
        },
        promo_header: {
          blocks: []
        },
        promo_content: {
          style: {},
          blocks: []
        },
      },
      layout: {
        sm: 'split-checkout@v1'
      },
      provides: [],
      next_page: {
        branches: [],
        default_next_page: null
      }
    };
}


function PageNode({ data, id }: { data: { page: Page; isStart?: boolean; isOrphan: boolean }; id: string }) {
    const { page, isStart, isOrphan } = data;
    const { setEditingBranch, onUpdateBranches, onDeletePage } = useContext(PageFlowContext);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const handleAddBranch = useCallback(() => {
        console.log('Adding branch for page:', id);

        // Create a new branch with empty condition
        const newBranch = {
            next_page: null,
            condition: { field: '', operator: '', value: '' }
        };

        // Update the branch collection
        const updatedBranches = [
            ...(page.next_page.branches || []),
            newBranch
        ];

        // Call parent context function to update main state
        onUpdateBranches(id, updatedBranches);
    }, [id, page, onUpdateBranches]);

    const handleEditBranch = (index: number) => {
        setEditingBranch({
            sourceId: id,
            branchIndex: index
        });
    };

    const hasDefaultConnection = !!page.next_page.default_next_page;

    // Determine icon and border style based on page type
    let typeIcon = null;
    let borderClass = 'border-border'; // Default border

    if (isOrphan) {
        borderClass = 'border-red-500 border-2'; // Orphan border takes precedence
        // Optionally, add or replace typeIcon with an AlertTriangle for orphans
        // typeIcon = <AlertTriangle className="w-4 h-4 text-red-500" />;
    }

    switch (page.type) {
        case 'entry':
            typeIcon = <LogIn className="w-4 h-4 text-blue-500" />;
            // Only apply blue border if not an orphan (orphan red border takes precedence)
            if (!isOrphan) borderClass = 'border-blue-500 border-2';
            break;
        case 'ending':
            typeIcon = <LogOut className="w-4 h-4 text-green-500" />;
            // Only apply green border if not an orphan
            if (!isOrphan) borderClass = 'border-green-500 border-2';
            break;
        default:
            // For other types, if it's the start page and not entry/ending, show Flag. Otherwise, a default FileText icon.
            if (isStart && !typeIcon) { // Ensure typeIcon isn't already set by orphan logic if we choose to show an icon for orphans
                typeIcon = <Flag className="w-4 h-4 text-primary" />;
            } else if (!typeIcon) { // if not isStart or if typeIcon still null
                typeIcon = <FileText className="w-4 h-4 text-muted-foreground" />;
            }
            // Default borderClass is already set, and orphan border would take precedence.
            break;
    }

    const handleDeleteClick = () => {
        onDeletePage(id);
        // No need to setShowDeleteConfirm(false) as the node will be removed
    };

    return (
        <>
            {/* Default connection handle (right) - only if not ending page */}
            {page.type !== 'ending' && (
                <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-10">
                    <Handle
                        type="source"
                        position={Position.Right}
                        id="default"
                        className={cn(
                            '!w-6 !h-6 !border-2 !border-background rounded-full flex items-center justify-center',
                            hasDefaultConnection
                                ? '!bg-muted-foreground/50 pointer-events-none cursor-not-allowed'
                                : '!bg-primary hover:!bg-primary/80 cursor-grab active:cursor-grabbing'
                        )}
                        isConnectable={!hasDefaultConnection}
                        data-handleid="default"
                    >
                        {hasDefaultConnection ? (
                            <X className="w-4 h-4 text-background pointer-events-none" />
                        ) : (
                            <Plus className="w-4 h-4 text-background pointer-events-none" />
                        )}
                    </Handle>
                </div>
            )}

            <div className={cn("bg-card rounded-lg shadow-sm p-4 w-[250px] relative", borderClass)}>
                <div className="absolute top-2 right-2">
                    {!showDeleteConfirm ? (
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setShowDeleteConfirm(true)}>
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    ) : (
                        <div className="flex items-center gap-1 bg-background p-1 rounded-md shadow-md">
                            <Button variant="destructive" size="sm" onClick={handleDeleteClick} className="h-6 px-2 text-xs">
                                Delete
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => setShowDeleteConfirm(false)} className="h-6 px-2 text-xs">
                                Cancel
                            </Button>
                        </div>
                    )}
                </div>
                <div className="flex items-center justify-between mb-4 pr-8"> {/* Added pr-8 to avoid overlap with delete icon*/}
                    <div className="flex items-center gap-2">
                        {/* Render the determined type icon, or the start flag if no specific type icon and isStart */}
                        {typeIcon}
                        {isOrphan && <AlertTriangle className="w-4 h-4 text-red-500 ml-1" />} {/* Added orphan icon here, removed title to fix lint */}
                        <h3 className="font-medium">{page.name}</h3>
                    </div>
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                        {page.type}
                    </span>
                </div>

                <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Layout:</span>
                        <span>{page.layout.sm}</span>
                    </div>


                    {/* Branch List with inline handles */}
                    {page.next_page.branches && page.next_page.branches.length > 0 && (
                        <div className="mt-4 space-y-2">
                            <h4 className="text-sm font-medium">Branches</h4>
                            <div className="space-y-1">
                                {page.next_page.branches.map((branch, index) => (
                                    <div
                                        key={index}
                                        className="text-xs p-2 bg-muted rounded-sm flex items-center justify-between h-8 relative group"
                                    >
                                        <span className="text-muted-foreground">
                                            {getBranchLabel(branch.condition)}
                                        </span>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => handleEditBranch(index)}
                                                className="text-primary hover:text-primary/80"
                                            >
                                                Edit
                                            </button>
                                            {/* Inline branch handle */}
                                            <div className="absolute right-0 translate-x-[150%]">
                                                <Handle
                                                    type="source"
                                                    position={Position.Right}
                                                    id={`branch-${index}`}
                                                    className={cn(
                                                        '!w-6 !h-6 !border-2 !border-background rounded-full flex items-center justify-center',
                                                        branch.next_page
                                                            ? '!bg-muted-foreground/50 cursor-grab opacity-60'
                                                            : '!bg-secondary hover:!bg-secondary/80 cursor-grab active:cursor-grabbing'
                                                    )}
                                                    isConnectable={true}
                                                    data-branch-index={index}
                                                    data-handleid={`branch-${index}`}
                                                >
                                                    {!branch.next_page && (
                                                        <Plus className="w-4 h-4 text-background pointer-events-none" />
                                                    )}
                                                    {branch.next_page && (
                                                        <Plus className="w-4 h-4 text-background pointer-events-none opacity-30" />
                                                    )}
                                                </Handle>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Add Branch button - only show if there are existing branches */}
                    {page.type !== 'ending' && page.next_page.branches && page.next_page.branches.length > 0 && (
                        <Button
                            variant="outline"
                            size="sm"
                            className="w-full mt-2"
                            onClick={handleAddBranch}
                        >
                            <Plus className="w-3 h-3 mr-1" />
                            Add Branch
                        </Button>
                    )}

                    {/* Initial Add Branch button - only show if no branches exist */}
                    {page.type !== 'ending' && (!page.next_page.branches || page.next_page.branches.length === 0) && (
                        <Button
                            variant="outline"
                            size="sm"
                            className="w-full mt-2"
                            onClick={handleAddBranch}
                        >
                            <Plus className="w-3 h-3 mr-1" />
                            Add First Branch
                        </Button>
                    )}
                </div>

                {/* Target connection handle (left) - only if not entry page */}
                {page.type !== 'entry' && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 z-10">
                        <Handle
                            type="target"
                            position={Position.Left}
                            id={`target-${page.id}`}
                            className="!w-3 !h-3 !bg-muted-foreground/50 !border-2 !border-background rounded-full cursor-pointer"
                            isConnectable={true}
                            data-handleid={`target-${page.id}`}
                        />
                    </div>
                )}
            </div>
        </>
    );
}

interface BranchCondition {
    field: string;
    operator: string;
    value: string;
}

// Helper function to get branch label
const getBranchLabel = (condition?: BranchCondition) => {
    if (!condition) return 'No condition';
    if (!condition.field && !condition.operator && !condition.value) {
        return 'No condition';
    }
    return `${condition.field || 'field'} ${condition.operator || '='} ${condition.value || 'value'}`;
};

// Define custom edge component with delete button
const CustomEdge = ({
    id,
    source,
    target,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourceHandleId, // Renamed from sourceHandle to avoid conflict if sourceHandle object is passed
    style = {},
    sourcePosition,
    targetPosition,
    markerEnd
}: any) => {
    const { setEdges, getEdges } = useReactFlow();
    const { onDeleteConnection } = useContext(PageFlowContext);

    // Calculate mid point for the delete button
    const midX = (sourceX + targetX) / 2;
    const midY = (sourceY + targetY) / 2;

    // Use getBezierPath to get the curved path
    const [edgePath] = getBezierPath({
        sourceX,
        sourceY,
        sourcePosition,
        targetX,
        targetY,
        targetPosition
    });

    const handleDeleteClick = (event: React.MouseEvent) => {
        event.stopPropagation();

        // Extract connection type and branch index if applicable
        const isBranch = sourceHandleId?.startsWith('branch-');
        const branchIndex = isBranch ? parseInt(sourceHandleId.split('-')[1]) : undefined;

        console.log('Deleting connection:', {
            id, source, target,
            type: isBranch ? 'branch' : 'default',
            branchIndex
        });

        // Delete connection from view data by calling the context function
        // This will trigger onUpdateFlow, which updates view.pages
        // The change in view.pages will cause initialEdges to recompute
        // And then useEffect will sync it with React Flow's edges state
        onDeleteConnection(source, target, isBranch ? branchIndex : undefined);

        // Remove edge from ReactFlow - NO LONGER NEEDED HERE
        // setEdges(edges => edges.filter(edge => edge.id !== id));
    };

    return (
        <>
            <path
                id={id}
                className="react-flow__edge-path"
                d={edgePath}
                markerEnd={markerEnd}
                style={style}
            />
            <circle
                cx={midX}
                cy={midY}
                r={12}
                fill="white"
                stroke="#d1d5db"
                strokeWidth={1}
                className="transition-opacity opacity-0 hover:opacity-100"
            />
            <foreignObject
                width={24}
                height={24}
                x={midX - 12}
                y={midY - 12}
                requiredExtensions="http://www.w3.org/1999/xhtml"
                className="transition-opacity opacity-0 hover:opacity-100"
            >
                <div
                    className="flex items-center justify-center h-full w-full cursor-pointer"
                    onClick={handleDeleteClick}
                >
                    <X className="h-4 w-4 text-destructive" />
                </div>
            </foreignObject>
        </>
    );
};

// Create a context for sharing state between PageFlowEditor and PageNode
const PageFlowContext = createContext<{
    editingBranch: { sourceId: string; branchIndex: number } | null;
    setEditingBranch: (branch: { sourceId: string; branchIndex: number } | null) => void;
    onUpdateBranches: (pageId: string, branches: any[]) => void;
    onDeleteConnection: (source: string, target: string, branchIndex?: number) => void;
    onDeletePage: (pageId: string) => void;
}>({
    editingBranch: null,
    setEditingBranch: () => {},
    onUpdateBranches: () => {},
    onDeleteConnection: () => {},
    onDeletePage: () => {}
});

export default function PageFlowEditor({ view, onUpdateFlow }: PageFlowEditorProps) {
    const [showPageTypeDialog, setShowPageTypeDialog] = useState(false);
    const [showBranchDialog, setShowBranchDialog] = useState(false);
    const [pendingPosition, setPendingPosition] = useState<XYPosition | null>(null);
    const [pendingConnection, setPendingConnection] = useState<{
        source?: string;
        sourceHandleId?: string;
        target?: string;
    } | null>(null);
    const [editingBranch, setEditingBranch] = useState<{
        sourceId: string;
        branchIndex: number;
    } | null>(null);
    const [branchCondition, setBranchCondition] = useState<BranchCondition | null>(null);
    const [dragPreviewPosition, setDragPreviewPosition] = useState<XYPosition | null>(null);
    const [dragStartPosition, setDragStartPosition] = useState<XYPosition | null>(null);
    const { fitView } = useReactFlow();

    // Move ReactFlow state to main component instead of hooks for better control
    const reactFlowInstance = useReactFlow();

    // Ref to hold connection data during a drag operation, bridging async state updates for onConnectStart/End
    const connectingNodeRef = useRef<{ source: string; sourceHandleId: string } | null>(null);

    // Handle connection logic directly using ReactFlow's built-in methods
    const addConnection = useCallback((params: Connection) => {
        if (!params.source || !params.target) return;

        console.log('Adding connection with params:', params);

        const sourceId = params.source;
        const targetId = params.target;
        const sourcePage = view.pages[sourceId];

        if (!sourcePage) {
            console.error('Source page not found:', sourceId);
            return;
        }

        const updatedPages = { ...view.pages };

        if (params.sourceHandle?.startsWith('branch-')) {
            const branchIndex = parseInt(params.sourceHandle.split('-')[1]);
            console.log('Branch connection:', { sourceId, targetId, branchIndex });

            // Make sure branch exists
            if (branchIndex >= 0 && branchIndex < sourcePage.next_page.branches.length) {
                const updatedBranches = [...sourcePage.next_page.branches];

                // Check if this branch already has a connection to a *different* target
                const currentTarget = updatedBranches[branchIndex].next_page;
                // if (currentTarget && currentTarget !== targetId) {
                    // Old edge removal will be handled by React Flow based on new edges prop
                // }

                // Update branch target
                updatedBranches[branchIndex] = {
                    ...updatedBranches[branchIndex],
                    next_page: targetId,
                    condition: updatedBranches[branchIndex].condition || { field: '', operator: '', value: '' }
                };

                console.log('Updated branch:', updatedBranches[branchIndex]);

                // Update source page
                updatedPages[sourceId] = {
                    ...sourcePage,
                    next_page: {
                        ...sourcePage.next_page,
                        branches: updatedBranches
                    }
                };

                // Update flow state
                console.log('Updating view with branch connection:', {
                    sourceId,
                    targetId,
                    branchIndex,
                    updatedBranch: updatedBranches[branchIndex]
                });

                onUpdateFlow({
                    pages: updatedPages,
                    first_page: view.first_page
                });

                // Manually add the edge to ReactFlow to see it immediately - NO LONGER NEEDED
                // const newEdge = {
                //     id: `${sourceId}-${targetId}-branch-${branchIndex}`,
                //     source: sourceId,
                //     target: targetId,
                //     sourceHandle: `branch-${branchIndex}`,
                //     type: 'default',
                //     animated: true,
                //     data: { type: 'branch' }
                // };
                // reactFlowInstance.addEdges([newEdge]);

            } else {
                console.error('Branch index out of bounds:', { branchIndex, branchesLength: sourcePage.next_page.branches.length });
            }
        } else {
            // Handle default connection

            // Check if there's already a default connection to a *different* target
            const currentTarget = sourcePage.next_page.default_next_page;
            // if (currentTarget && currentTarget !== targetId) {
                // Old edge removal will be handled by React Flow based on new edges prop
            // }

            updatedPages[sourceId] = {
                ...sourcePage,
                next_page: {
                    ...sourcePage.next_page,
                    default_next_page: targetId
                }
            };

            // Update flow state
            onUpdateFlow({
                pages: updatedPages,
                first_page: view.first_page
            });

            // Manually add the edge to ReactFlow to see it immediately - NO LONGER NEEDED
            // const newEdge = {
            //     id: `${sourceId}-${targetId}`,
            //     source: sourceId,
            //     target: targetId,
            //     sourceHandle: 'default',
            //     type: 'default',
            //     animated: true,
            //     data: { type: 'default' }
            // };
            // reactFlowInstance.addEdges([newEdge]);
        }
    }, [view.pages, view.first_page, onUpdateFlow]);

    // Replace onConnect with our custom handler
    const onConnect = useCallback((connection: Connection) => {
        console.log('onConnect called with:', connection);
        addConnection(connection);
    }, [addConnection]);

    // Calculate orphan nodes (nodes with no incoming connections, excluding the first_page if it's an entry)
    const orphanNodeIds = useMemo(() => {
        const ids = new Set<string>();
        const allPageIds = Object.keys(view.pages);
        const incomingConnections: Record<string, number> = {};

        allPageIds.forEach(id => { incomingConnections[id] = 0; });

        for (const pageId in view.pages) {
            const page = view.pages[pageId];
            if (page.next_page.default_next_page && view.pages[page.next_page.default_next_page]) {
                incomingConnections[page.next_page.default_next_page]++;
            }
            page.next_page.branches?.forEach(branch => {
                if (branch.next_page && view.pages[branch.next_page]) {
                    incomingConnections[branch.next_page]++;
                }
            });
        }

        allPageIds.forEach(id => {
            // A page is an orphan if it has no incoming connections AND it's not the designated first page (unless the first page itself is unlinked somehow, which is a different issue)
            // More accurately, if it's not the first_page and has no incoming connections.
            // Or if it IS the first_page but its type is not 'entry' and has no incoming (this implies a broken flow start).
            // For simplicity: if not first_page and 0 incoming, it's an orphan.
            // If it IS the first_page, it should ideally be an 'entry' type to not be considered an "orphan" in a problematic sense.
            if (id !== view.first_page && incomingConnections[id] === 0) {
                ids.add(id);
            }
            // Special case: if the first page is NOT an entry type and has no connections to it (shouldn't happen in a valid flow from UI start)
            // This might be too aggressive. Let's stick to non-first pages first.
        });
        return ids;
    }, [view.pages, view.first_page]);

    // Derive nodes from ordered pages
    const initialNodes = useMemo(() => {
        const nodes: Node[] = [];
        const pages = Object.entries(view.pages);

        const gridCols = Math.ceil(Math.sqrt(pages.length));

        pages.forEach(([pageId, page], index) => {
            const position = page.position || {
                x: (index % gridCols) * (NODE_WIDTH + GRID_SPACING) + 50,
                y: Math.floor(index / gridCols) * (NODE_HEIGHT + GRID_SPACING) + 50
            };
            nodes.push({
                id: pageId,
                type: 'pageNode',
                position,
                data: {
                    page,
                    isStart: pageId === view.first_page,
                    isOrphan: orphanNodeIds.has(pageId)
                }
            });
        });
        return nodes;
    }, [view.pages, view.first_page, orphanNodeIds]);

    // Derive edges from view configuration
    const initialEdges = useMemo(() => {
        const edges: Edge[] = [];

        // Create edges for each page's connections
        Object.entries(view.pages).forEach(([pageId, page]) => {
            // Add default next page edge
            if (page.next_page.default_next_page) {
                edges.push({
                    id: `${pageId}-${page.next_page.default_next_page}`,
                    source: pageId,
                    target: page.next_page.default_next_page,
                    sourceHandle: 'default',
                    type: 'default',
                    animated: true,
                    data: { type: 'default' }
                } as Edge);
            }

            // Add branch edges
            page.next_page.branches?.forEach((branch, index) => {
                if (branch.next_page) {
                    edges.push({
                        id: `${pageId}-${branch.next_page}-branch-${index}`,
                        source: pageId,
                        target: branch.next_page,
                        sourceHandle: `branch-${index}`,
                        type: 'default',
                        animated: true,
                        label: getBranchLabel(branch.condition),
                        data: { type: 'branch', condition: branch.condition }
                    } as Edge);
                }
            });
        });

        return edges;
    }, [view.pages]);

    // Initialize React Flow state
    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

    // Sync nodes with view state when pages are added or removed
    // This effect ensures that React Flow's internal node state is updated
    // whenever the `initialNodes` (derived from `view.pages`) changes.
    useEffect(() => {
        console.log('Initial nodes changed, updating React Flow nodes.');
        setNodes(initialNodes);
    }, [initialNodes, setNodes]);

    // This effect ensures that React Flow's internal edge state is updated
    // whenever the `initialEdges` (derived from `view.pages`) changes.
    useEffect(() => {
        console.log('Initial edges changed, updating React Flow edges.');
        setEdges(initialEdges);
    }, [initialEdges, setEdges]);

    const handleCreatePage = useCallback((type: PageType) => {
        // Guard: If pendingPosition or pendingConnection.source is missing, something went wrong.
        // This might happen if the dialog was dismissed and state was cleared, then this was called.
        if (!pendingPosition || !pendingConnection?.source) {
            setShowPageTypeDialog(false); // Ensure dialog is closed
            setPendingPosition(null);
            setPendingConnection(null);
            setDragPreviewPosition(null);
            console.error('handleCreatePage called with invalid pending state');
            return;
        }

        const id = `page_${Math.random().toString(36).substr(2, 9)}`;
        // Calculate the next page number
        const nextPageNumber = Object.keys(view.pages).length + 1;
        const newPage = generateDefaultPage({ id, type, position: pendingPosition, pageNumber: nextPageNumber });
        const updatedPages = {
            ...view.pages,
            [id]: newPage
        };

        // pendingConnection.source is guaranteed by the guard above.
        const sourcePage = view.pages[pendingConnection.source];
        if (sourcePage) {
            if (pendingConnection.sourceHandleId?.startsWith('branch-')) {
                const branchIndex = parseInt(pendingConnection.sourceHandleId.split('-')[1]);
                const updatedBranches = [...(sourcePage.next_page.branches || [])];
                // Ensure branchIndex is valid before assignment
                if (branchIndex >= 0 && branchIndex < updatedBranches.length) {
                    updatedBranches[branchIndex] = {
                        ...updatedBranches[branchIndex],
                        next_page: id,
                        condition: updatedBranches[branchIndex]?.condition || { field: '', operator: '', value: '' }
                    };
                    updatedPages[pendingConnection.source] = {
                        ...sourcePage,
                        next_page: {
                            ...sourcePage.next_page,
                            branches: updatedBranches
                        }
                    };
                } else {
                    console.error(`Invalid branchIndex ${branchIndex} for page ${pendingConnection.source}`);
                    // Decide how to handle: create page but don't link? Or abort?
                    // For now, page is created but this specific branch link might fail.
                }
            } else {
                // Default connection
                updatedPages[pendingConnection.source] = {
                    ...sourcePage,
                    next_page: {
                        ...sourcePage.next_page,
                        default_next_page: id
                    }
                };
            }
        } else {
            console.error(`Source page ${pendingConnection.source} not found during handleCreatePage`);
            // New page is created but not linked from source.
        }

        onUpdateFlow({
            pages: updatedPages,
            first_page: Object.keys(view.pages).length === 0 ? id : view.first_page
        });

        // Reset state
        setPendingPosition(null);
        setShowPageTypeDialog(false);
        setPendingConnection(null);
        setDragPreviewPosition(null);

        setTimeout(() => {
            fitView({ padding: 0.2, duration: 200 });
        }, 50);
    }, [
        pendingConnection, pendingPosition, view.pages, view.first_page, onUpdateFlow, fitView,
        setShowPageTypeDialog, setPendingPosition, setPendingConnection, setDragPreviewPosition
    ]);

    const onConnectStart: OnConnectStart = useCallback(
        (event, params) => {
            console.log('onConnectStart TRACE: Start', { event, params });
            setDragPreviewPosition(null);

            if (event instanceof MouseEvent && params.nodeId && params.handleId) {
                const node = nodes.find(n => n.id === params.nodeId);
                let isConnectable = true;
                if (node) {
                    const page = node.data.page as Page;
                    if (params.handleId === 'default' && page.next_page.default_next_page) {
                        isConnectable = false;
                    }
                }

                console.log('onConnectStart TRACE: After node check, before setting ref/drag start', {
                    nodeId: params.nodeId,
                    handleId: params.handleId,
                    isConnectable
                });

                if (!isConnectable) {
                    console.log('onConnectStart TRACE: Handle not connectable, returning.');
                    return;
                }

                setDragStartPosition({ x: event.clientX, y: event.clientY });
                // Store connection attempt details in the ref for immediate access in onConnectEnd
                connectingNodeRef.current = { source: params.nodeId, sourceHandleId: params.handleId };

                console.log('onConnectStart TRACE: End - connectingNodeRef.current was set to:', {
                    source: params.nodeId,
                    sourceHandleId: params.handleId
                });
            }
        },
        [nodes, setDragPreviewPosition, setDragStartPosition]
    );

    // Handle connection end event
    const onConnectEnd: OnConnectEnd = useCallback(
        (event) => {
            const currentConnectingNode = connectingNodeRef.current;
            console.log('onConnectEnd TRACE: Start', {
                refSource: currentConnectingNode?.source,
                refHandleId: currentConnectingNode?.sourceHandleId
            });

            // Guard: If there's no connection data from the ref, something is wrong or it's not a relevant event.
            if (!currentConnectingNode?.source) {
                console.log('onConnectEnd TRACE: No connectingNodeRef.current.source, clearing and exiting.');
                setPendingPosition(null);
                setPendingConnection(null); // Ensure any stale pending state is cleared
                setDragPreviewPosition(null);
                connectingNodeRef.current = null; // Clear the ref
                return;
            }

            if (event instanceof MouseEvent) {
                const targetElement = document.elementFromPoint(event.clientX, event.clientY);
                const targetHandle = targetElement?.closest('.react-flow__handle');
                const targetNode = targetElement?.closest('.react-flow__node');
                const targetNodeIdAttr = targetNode?.getAttribute('data-id');

                console.log('onConnectEnd TRACE: Event details', {
                    clientX: event.clientX, clientY: event.clientY,
                    targetElemTag: targetElement?.tagName,
                    targetHandleFound: !!targetHandle,
                    targetNodeFound: !!targetNode,
                    targetNodeId: targetNodeIdAttr
                });

                console.log('onConnectEnd TRACE: About to check drop target type.');

                // Case 1: Dropped on a valid handle of another node
                if (targetHandle && targetNode) {
                    console.log('onConnectEnd TRACE: Path taken - Dropped on existing handle');
                    const targetNodeId = targetNode.getAttribute('data-id');

                    if (targetNodeId && currentConnectingNode.sourceHandleId) {
                        const connection: Connection = {
                            source: currentConnectingNode.source,
                            sourceHandle: currentConnectingNode.sourceHandleId,
                            target: targetNodeId,
                            targetHandle: targetHandle.getAttribute('data-handleid')
                        };
                        addConnection(connection);
                        setDragPreviewPosition(null);
                        setPendingPosition(null); // Clear any pending position from a potential blank drop
                        setPendingConnection(null); // Clear pending connection state as it's now handled or aborted
                        connectingNodeRef.current = null; // Clear the ref
                        return;
                    }
                }
                // Case 2: Dropped on a blank area (not on a node)
                else if (!targetNode) {
                    console.log('onConnectEnd TRACE: Path taken - Dropped on blank area (targetNode is falsy)');
                    const bounds = event.currentTarget instanceof Element
                        ? event.currentTarget.getBoundingClientRect()
                        : (document.querySelector('.react-flow') || event.currentTarget as Element)?.getBoundingClientRect();

                    console.log('onConnectEnd TRACE: Bounds for blank area drop', { bounds });
                    if (bounds) {
                        const position = {
                            x: event.clientX - bounds.left - NODE_WIDTH / 2,
                            y: event.clientY - bounds.top - NODE_HEIGHT / 2,
                        };
                        setPendingPosition(position);
                        // NOW set pendingConnection state, which will be used by handleCreatePage after modal interaction
                        setPendingConnection({
                            source: currentConnectingNode.source,
                            sourceHandleId: currentConnectingNode.sourceHandleId
                        });
                        setShowPageTypeDialog(true);
                        console.log('onConnectEnd TRACE: setShowPageTypeDialog(true) called, pendingConnection state set with ref data');
                        setDragPreviewPosition(null);
                        connectingNodeRef.current = null; // Clear the ref
                        return;
                    } else {
                        console.log('onConnectEnd TRACE: Bounds check failed for blank area drop');
                    }
                } else {
                    console.log('onConnectEnd TRACE: Path taken - Fallthrough within MouseEvent (targetNode was truthy but not a handle drop)', { targetNodeId: targetNode?.getAttribute('data-id') });
                }
            } else {
                console.log('onConnectEnd TRACE: Path taken - Not a MouseEvent');
            }

            console.log('onConnectEnd TRACE: Reached final fallthrough (about to clear all pending states and ref)');
            setPendingPosition(null);
            setPendingConnection(null);
            setDragPreviewPosition(null);
            connectingNodeRef.current = null; // Clear the ref in all exit paths
        },
        [addConnection, view.pages, setPendingConnection, setPendingPosition, setShowPageTypeDialog, setDragPreviewPosition]
    );

    // Handle node position changes
    const handleNodesChange = useCallback((changes: any) => {
        // Only apply changes to React Flow state
        onNodesChange(changes);
    }, [onNodesChange]);

    // Handle node drag stop
    const handleNodeDragStop = useCallback((event: any, node: Node) => {
        // Update view with new position
        const updatedPages = { ...view.pages };
        const pageToUpdate = updatedPages[node.id];
        if (pageToUpdate) {
            updatedPages[node.id] = {
                ...pageToUpdate,
                position: node.position
            };
        }

        // Update view configuration
        onUpdateFlow({
            pages: updatedPages,
            first_page: view.first_page
        });
    }, [view.pages, view.first_page, onUpdateFlow]);

    // Function to check if a position is near any existing nodes
    const isNearNode = useCallback((position: XYPosition) => {
        const SNAP_DISTANCE = 60; // Snap distance in pixels

        // Check against all nodes
        return nodes.some(node => {
            const nodeRect = {
                left: node.position.x,
                right: node.position.x + NODE_WIDTH,
                top: node.position.y,
                bottom: node.position.y + NODE_HEIGHT
            };

            // Check if position is within snap distance of any node
            return (
                position.x >= nodeRect.left - SNAP_DISTANCE &&
                position.x <= nodeRect.right + SNAP_DISTANCE &&
                position.y >= nodeRect.top - SNAP_DISTANCE &&
                position.y <= nodeRect.bottom + SNAP_DISTANCE
            );
        });
    }, [nodes]);

    // Function to check if we're far enough from the drag start position
    const isFarFromStart = useCallback((position: XYPosition) => {
        if (!dragStartPosition) return false;
        const dx = Math.abs(position.x - dragStartPosition.x);
        const dy = Math.abs(position.y - dragStartPosition.y);
        return Math.sqrt(dx * dx + dy * dy) > 50; // Minimum drag distance of 50px
    }, [dragStartPosition]);

    const nodeTypes = useMemo<NodeTypes>(() => ({
        pageNode: PageNode
    }), []);

    // Fetch initial view data and set up handles
    useEffect(() => {
        // Enhanced connection detection
        const enhanceHandles = () => {
            // Get all handles in the flow
            const handles = document.querySelectorAll('.react-flow__handle');

            handles.forEach(handle => {
                // Make sure we can accurately identify handles
                const isTarget = handle.classList.contains('react-flow__handle-left');
                const isSource = handle.classList.contains('react-flow__handle-right');

                if (isTarget || isSource) {
                    const nodeElement = handle.closest('.react-flow__node');
                    if (nodeElement) {
                        const nodeId = nodeElement.getAttribute('data-id');
                        if (nodeId) {
                            // Store the node ID directly on the handle for easier access
                            handle.setAttribute('data-node-id', nodeId);

                            // Log the enhanced handle to help with debugging
                            console.log('Enhanced handle:', {
                                nodeId,
                                isTarget,
                                isSource,
                                handleId: handle.getAttribute('data-handleid')
                            });
                        }
                    }
                }
            });
        };

        // Run once on mount
        setTimeout(enhanceHandles, 500);

        // This effect should ideally run when nodes in the DOM might have changed structure,
        // for example, after `nodes` state from `useNodesState` is updated.
        // However, direct DOM manipulation like this can be brittle.
        // Consider if React Flow's data attributes or context can provide this info more reliably.
    }, []); // Running only on mount for now, as `nodes` dependency could cause too many runs.

    // Set branch condition when editing a branch
    useEffect(() => {
        if (editingBranch && view.pages[editingBranch.sourceId]) {
            const page = view.pages[editingBranch.sourceId];
            if (!page) return;

            if (editingBranch.branchIndex >= page.next_page.branches.length) {
                console.error('Branch index out of bounds:', editingBranch);
                return;
            }

            const branch = page.next_page.branches[editingBranch.branchIndex];

            console.log('Setting up branch condition dialog:', {
                page: editingBranch.sourceId,
                branchIndex: editingBranch.branchIndex,
                branch
            });

            setBranchCondition(branch.condition || { field: '', operator: '', value: '' });
            setShowBranchDialog(true);
        }
    }, [editingBranch, view.pages]);

    // Handle saving branch condition
    const handleSaveBranchCondition = useCallback(() => {
        if (!editingBranch || !branchCondition) return;

        console.log('Saving branch condition:', {
            sourceId: editingBranch.sourceId,
            branchIndex: editingBranch.branchIndex,
            condition: branchCondition
        });

        // Get the source page
        const sourcePage = view.pages[editingBranch.sourceId];
        if (!sourcePage) return;

        // Update branches
        const updatedBranches = [...sourcePage.next_page.branches];
        updatedBranches[editingBranch.branchIndex] = {
            ...updatedBranches[editingBranch.branchIndex],
            condition: branchCondition
        };

        // Update pages
        const updatedPages = {
            ...view.pages,
            [editingBranch.sourceId]: {
                ...sourcePage,
                next_page: {
                    ...sourcePage.next_page,
                    branches: updatedBranches
                }
            }
        };

        // Update the flow
        onUpdateFlow({
            pages: updatedPages,
            first_page: view.first_page
        });

        // Show confirmation
        console.log('Branch condition saved successfully!');

        // Reset state
        setShowBranchDialog(false);
        setEditingBranch(null);
        setBranchCondition(null);
    }, [editingBranch, branchCondition, view.pages, view.first_page, onUpdateFlow]);

    // Function to update branches for a specific page
    const handleUpdateBranches = useCallback((pageId: string, branches: any[]) => {
        console.log('Updating branches for page:', { pageId, branchCount: branches.length });

        // Get the source page
        const sourcePage = view.pages[pageId];
        if (!sourcePage) return;

        // Create updated pages object with new branches
        const updatedPages = {
            ...view.pages,
            [pageId]: {
                ...sourcePage,
                next_page: {
                    ...sourcePage.next_page,
                    branches
                }
            }
        };

        // Update the flow state immediately
        onUpdateFlow({
            pages: updatedPages,
            first_page: view.first_page
        });
    }, [view.pages, view.first_page, onUpdateFlow]);

    // Function to delete a connection
    const handleDeleteConnection = useCallback((source: string, target: string, branchIndex?: number) => {
        // Get the source page
        const sourcePage = view.pages[source];
        if (!sourcePage) return;

        const updatedPages = { ...view.pages };

        // If branchIndex is provided, delete branch connection
        if (typeof branchIndex === 'number') {
            // Ensure branch exists
            if (branchIndex < 0 || branchIndex >= sourcePage.next_page.branches.length) {
                console.error('Branch index out of bounds:', branchIndex);
                return;
            }

            // Update branch target
            const updatedBranches = [...sourcePage.next_page.branches];
            updatedBranches[branchIndex] = {
                ...updatedBranches[branchIndex],
                next_page: null // Set next_page to null to disconnect
            };

            // Update source page
            updatedPages[source] = {
                ...sourcePage,
                next_page: {
                    ...sourcePage.next_page,
                    branches: updatedBranches
                }
            };
        } else {
            // Delete default connection
            updatedPages[source] = {
                ...sourcePage,
                next_page: {
                    ...sourcePage.next_page,
                    default_next_page: null // Set default_next_page to null to disconnect
                }
            };
        }

        // Update flow state
        console.log('Updating view after deleting connection:', {
            source,
            target,
            branchIndex
        });

        onUpdateFlow({
            pages: updatedPages,
            first_page: view.first_page
        });
    }, [view.pages, view.first_page, onUpdateFlow]);

    // Function to delete a page
    const handleDeletePage = useCallback((pageIdToDelete: string) => {
        const updatedPages = { ...view.pages };
        let updatedFirstPage = view.first_page;

        // 1. Delete the page itself
        delete updatedPages[pageIdToDelete];

        // 2. Remove connections pointing to the deleted page
        for (const pageId in updatedPages) {
            const page = updatedPages[pageId];
            let pageModified = false;

            // Check default next page
            if (page.next_page.default_next_page === pageIdToDelete) {
                updatedPages[pageId] = {
                    ...page,
                    next_page: { ...page.next_page, default_next_page: null }
                };
                pageModified = true;
            }

            // Check branches
            if (page.next_page.branches) {
                const newBranches = page.next_page.branches.map(branch =>
                    branch.next_page === pageIdToDelete ? { ...branch, next_page: null } : branch
                );
                if (JSON.stringify(newBranches) !== JSON.stringify(page.next_page.branches)) {
                    updatedPages[pageId] = {
                        ...updatedPages[pageId], // Ensure we spread the latest version if modified by default_next_page check
                        next_page: { ...updatedPages[pageId].next_page, branches: newBranches }
                    };
                    pageModified = true;
                }
            }
        }

        // 3. Handle if the first_page was deleted
        if (view.first_page === pageIdToDelete) {
            // Simple strategy: if other pages exist, pick one to be the new first_page.
            // More complex logic might be needed (e.g., finding an entry page).
            const remainingPageIds = Object.keys(updatedPages);
            if (remainingPageIds.length > 0) {
                // Try to find another 'entry' page, otherwise just pick the first available
                const newFirstEntry = remainingPageIds.find(id => updatedPages[id].type === 'entry');
                updatedFirstPage = newFirstEntry || remainingPageIds[0];
            } else {
                updatedFirstPage = ''; // No pages left
            }
            console.warn(`Deleted the first page. New first page is: ${updatedFirstPage}`);
        }

        onUpdateFlow({
            pages: updatedPages,
            first_page: updatedFirstPage
        });

    }, [view.pages, view.first_page, onUpdateFlow]);

    // Define edge types with custom edge
    const edgeTypes = useMemo<EdgeTypes>(() => ({
        default: CustomEdge,
    }), []);

    // Provide context to child components
    const contextValue = useMemo(() => ({
        editingBranch,
        setEditingBranch,
        onUpdateBranches: handleUpdateBranches,
        onDeleteConnection: handleDeleteConnection,
        onDeletePage: handleDeletePage
    }), [editingBranch, setEditingBranch, handleUpdateBranches, handleDeleteConnection, handleDeletePage]);

    return (
        <PageFlowContext.Provider value={contextValue}>
            <div className="w-full h-full">
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={handleNodesChange}
                    onNodeDragStop={handleNodeDragStop}
                    onEdgesChange={onEdgesChange}
                    onConnect={onConnect}
                    onConnectStart={onConnectStart}
                    onConnectEnd={onConnectEnd}
                    connectionRadius={50}
                    snapToGrid={true}
                    snapGrid={[GRID_SPACING, GRID_SPACING]}
                    defaultEdgeOptions={{
                        type: 'default',
                        animated: true
                    }}
                    onMouseMove={(event) => {
                        if (event.buttons === 1) {
                            const bounds = event.currentTarget.getBoundingClientRect();
                            const position = {
                                x: event.clientX - bounds.left,
                                y: event.clientY - bounds.top
                            };

                            if (isFarFromStart({ x: event.clientX, y: event.clientY })) {
                                if (isNearNode(position)) {
                                    setDragPreviewPosition(null); // Hide preview if near a node
                                } else {
                                    setDragPreviewPosition({
                                        x: position.x - NODE_WIDTH / 2,
                                        y: position.y - NODE_HEIGHT / 2
                                    });
                                }
                            } else {
                                setDragPreviewPosition(null);
                            }
                        }
                    }}
                    nodeTypes={nodeTypes}
                    edgeTypes={edgeTypes}
                    fitView
                    className="bg-background"
                >
                    <Background />
                    <Controls />

                    {/* Preview Node */}
                    {dragPreviewPosition && (
                        <div
                            className="absolute pointer-events-none border-2 border-dashed border-primary rounded-lg w-[250px] h-[150px] bg-primary/10"
                            style={{
                                left: dragPreviewPosition.x,
                                top: dragPreviewPosition.y,
                            }}
                        />
                    )}


                </ReactFlow>

                <PageTypeDialog
                  open={showPageTypeDialog}
                  onOpenChange={(open) => {
                    setShowPageTypeDialog(open);
                    if (!open) {
                      console.log('PageTypeDialog TRACE: Closing - Clearing pendingConnection state', {
                        currentPendingConnStateSource: pendingConnection?.source,
                        currentPendingConnStateHandleId: pendingConnection?.sourceHandleId
                      });
                      setPendingPosition(null);
                      setPendingConnection(null); // Clear the state-based pendingConnection
                      setDragPreviewPosition(null);
                      // Note: connectingNodeRef should already be null if onConnectEnd completed its relevant path.
                    }
                  }}
                  onSelect={handleCreatePage}
                />

                {/* Branch Condition Dialog */}
                <Dialog open={showBranchDialog} onOpenChange={(open) => {
                    if (!open) {
                        console.log('BranchDialog TRACE: Closing', { // Removed mention of pendingConnection here as it does not directly interact
                             // currentPendingConnSource: pendingConnection?.source,
                             // currentPendingConnHandleId: pendingConnection?.sourceHandleId
                       });
                        setShowBranchDialog(false);
                        setEditingBranch(null);
                        setBranchCondition(null);
                    }
                }}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Branch Condition</DialogTitle>
                            <DialogDescription>
                                Define the logic for this branch
                            </DialogDescription>
                        </DialogHeader>
                        <div className="mt-4 space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="field">Field</Label>
                                <Input
                                    id="field"
                                    value={branchCondition?.field || ''}
                                    onChange={(e) => setBranchCondition(prev => ({
                                        ...(prev || { field: '', operator: '', value: '' }),
                                        field: e.target.value
                                    }))}
                                    placeholder="e.g., email, name, age"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="operator">Operator</Label>
                                <Select
                                    value={branchCondition?.operator || ''}
                                    onValueChange={(value) => setBranchCondition(prev => ({
                                        ...(prev || { field: '', operator: '', value: '' }),
                                        operator: value
                                    }))}
                                >
                                    <SelectTrigger id="operator">
                                        <SelectValue placeholder="Select operator" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="=">Equal to (=)</SelectItem>
                                        <SelectItem value="!=">Not equal to (!=)</SelectItem>
                                        <SelectItem value="gt">Greater than (&gt;)</SelectItem>
                                        <SelectItem value="gte">Greater than or equal to (&gt;=)</SelectItem>
                                        <SelectItem value="lt">Less than (&lt;)</SelectItem>
                                        <SelectItem value="lte">Less than or equal to (&lt;=)</SelectItem>
                                        <SelectItem value="contains">Contains</SelectItem>
                                        <SelectItem value="not_contains">Does not contain</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="value">Value</Label>
                                <Input
                                    id="value"
                                    value={branchCondition?.value || ''}
                                    onChange={(e) => setBranchCondition(prev => ({
                                        ...(prev || { field: '', operator: '', value: '' }),
                                        value: e.target.value
                                    }))}
                                    placeholder="Comparison value"
                                />
                            </div>

                            <div className="flex justify-end space-x-2 pt-4">
                                <Button variant="outline" onClick={() => {
                                    setShowBranchDialog(false);
                                    setEditingBranch(null);
                                    setBranchCondition(null);
                                }}>
                                    Cancel
                                </Button>
                                <Button onClick={handleSaveBranchCondition}>
                                    Save Condition
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        </PageFlowContext.Provider>
    );
}
