import { useCallback, useMemo, useState, useEffect, createContext, useContext } from 'react';
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
import { Flag, Plus, X } from 'lucide-react';
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
import { QueryBuilder, RuleGroupType } from 'react-querybuilder';
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
    id, type, position 
}: { 
    id?: string;
    type: PageType; 
    position: XYPosition 
}): Page {
    if (!id) {
        id = `page_${Math.random().toString(36).substr(2, 9)}`;
    }

    console.log('Creating new page:', { id, type, position });
    
    return {
        id,
        name: 'New Page',
        type,
        position,
        view: {
            title: {
                id: 'title',
                label: 'Title',
                style: {
                    backgroundColor: '#FBF9FA'
                },
                blocks: []
            },
            content: {
                id: 'content',
                label: 'Content',
                style: {
                    backgroundColor: '#FBF9FA'
                },
                blocks: []
            },
            action: {
                id: 'action',
                label: 'Action',
                style: {
                    backgroundColor: '#FFFFFF'
                },
                blocks: []
            },
            promo: {
                id: 'promo',
                label: 'Promo',
                style: {
                    backgroundColor: '#EFF6FF'
                },
                blocks: []
            },
        },
        layout: { sm: 'split-checkout@v1' },
        provides: [],
        next_page: {
            branches: [],
            default_next_page: null
        }
    };
}


function PageNode({ data, id }: { data: { page: Page; isStart?: boolean }; id: string }) {
    const { page, isStart } = data;
    const { setNodes, getNode } = useReactFlow();
    const [showAddBranch, setShowAddBranch] = useState(false);
    const { editingBranch, setEditingBranch, onUpdateBranches } = useContext(PageFlowContext);

    // Check if this branch already has a connection
    const hasBranchConnection = useCallback((index: number) => {
        return page.next_page.branches?.[index]?.next_page !== null;
    }, [page.next_page.branches]);

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
        // Set the branch to edit in the parent component
        setEditingBranch({
            sourceId: id,
            branchIndex: index
        });
    };


    return (
        <>
            {/* Default connection handle */}
            {page.type !== 'ending' && (
                <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-10">
                    <Handle
                        type="source"
                        position={Position.Right}
                        id="default"
                        className="!w-6 !h-6 !bg-primary hover:!bg-primary/80 !border-2 !border-background rounded-full flex items-center justify-center cursor-grab active:cursor-grabbing"
                        isConnectable={true}
                        data-handleid="default"
                    >
                        <Plus className="w-4 h-4 text-background pointer-events-none" />
                    </Handle>
                </div>
            )}

            <div className="bg-card border border-border rounded-lg shadow-sm p-4 w-[250px] relative">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        {isStart && <Flag className="w-4 h-4 text-primary" />}
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
                                                        "!w-6 !h-6 !border-2 !border-background rounded-full flex items-center justify-center",
                                                        branch.next_page 
                                                            ? "!bg-muted-foreground/50" 
                                                            : "!bg-secondary hover:!bg-secondary/80 cursor-grab active:cursor-grabbing"
                                                    )}
                                                    isConnectable={true}
                                                    data-branch-index={index}
                                                    data-handleid={`branch-${index}`}
                                                >
                                                    {!branch.next_page && (
                                                        <Plus className="w-4 h-4 text-background pointer-events-none" />
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

                {/* Target connection handle */}
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
    sourceHandle, 
    data, 
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
        const isBranch = sourceHandle?.startsWith('branch-');
        const branchIndex = isBranch ? parseInt(sourceHandle.split('-')[1]) : undefined;
        
        console.log('Deleting connection:', { 
            id, source, target, 
            type: isBranch ? 'branch' : 'default',
            branchIndex
        });
        
        // Delete connection from view data
        onDeleteConnection(source, target, isBranch ? branchIndex : undefined);
        
        // Remove edge from ReactFlow
        setEdges(edges => edges.filter(edge => edge.id !== id));
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
}>({
    editingBranch: null,
    setEditingBranch: () => {},
    onUpdateBranches: () => {},
    onDeleteConnection: () => {}
});

export default function PageFlowEditor({ view, onUpdateFlow }: PageFlowEditorProps) {
    const [showPageTypeDialog, setShowPageTypeDialog] = useState(false);
    const [showBranchDialog, setShowBranchDialog] = useState(false);
    const [pendingPosition, setPendingPosition] = useState<XYPosition | null>(null);
    const [pendingConnection, setPendingConnection] = useState<{
        source?: string;
        sourceHandle?: string;
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
                
                // Check if this branch already has a connection
                const currentTarget = updatedBranches[branchIndex].next_page;
                if (currentTarget && currentTarget !== targetId) {
                    // Remove the old edge from ReactFlow
                    const oldEdgeId = `${sourceId}-${currentTarget}-branch-${branchIndex}`;
                    reactFlowInstance.setEdges(edges => 
                        edges.filter(edge => edge.id !== oldEdgeId)
                    );
                }
                
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
                
                // Manually add the edge to ReactFlow to see it immediately
                const newEdge = {
                    id: `${sourceId}-${targetId}-branch-${branchIndex}`,
                    source: sourceId,
                    target: targetId,
                    sourceHandle: `branch-${branchIndex}`,
                    type: 'default',
                    animated: true,
                    data: { type: 'branch' }
                };
                
                // Add the edge to ReactFlow
                reactFlowInstance.addEdges([newEdge]);
                
                // Don't show the branch condition dialog automatically
                // setEditingBranch({
                //     sourceId: sourceId,
                //     branchIndex
                // });
                // setShowBranchDialog(true);
            } else {
                console.error('Branch index out of bounds:', { branchIndex, branchesLength: sourcePage.next_page.branches.length });
            }
        } else {
            // Handle default connection
            
            // Check if there's already a default connection
            const currentTarget = sourcePage.next_page.default_next_page;
            if (currentTarget && currentTarget !== targetId) {
                // Remove the old edge from ReactFlow
                const oldEdgeId = `${sourceId}-${currentTarget}`;
                reactFlowInstance.setEdges(edges => 
                    edges.filter(edge => edge.id !== oldEdgeId)
                );
            }
            
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
            
            // Manually add the edge to ReactFlow to see it immediately
            const newEdge = {
                id: `${sourceId}-${targetId}`,
                source: sourceId,
                target: targetId,
                sourceHandle: 'default',
                type: 'default',
                animated: true,
                data: { type: 'default' }
            };
            
            // Add the edge to ReactFlow
            reactFlowInstance.addEdges([newEdge]);
        }
    }, [view.pages, view.first_page, onUpdateFlow, reactFlowInstance]);
    
    // Replace onConnect with our custom handler
    const onConnect = useCallback((connection: Connection) => {
        console.log('onConnect called with:', connection);
        addConnection(connection);
    }, [addConnection]);

    // Get ordered pages based on the flow
    const getOrderedPages = useCallback(() => {
        const orderedPages: [string, Page][] = [];
        let currentPageId: string | null = view.first_page;
        
        while (currentPageId && view.pages[currentPageId]) {
            const currentPage: Page = view.pages[currentPageId];
            orderedPages.push([currentPageId, currentPage]);
            currentPageId = currentPage.next_page?.default_next_page ?? null;
        }
        
        return orderedPages;
    }, [view.pages, view.first_page]);

    // Derive nodes from ordered pages
    const initialNodes = useMemo(() => {
        const nodes: Node[] = [];
        const pages = Object.entries(view.pages);
        
        // Calculate grid dimensions
        const gridCols = Math.ceil(Math.sqrt(pages.length));
        const gridRows = Math.ceil(pages.length / gridCols);
        
        // Create nodes in the correct order with grid positions
        pages.forEach(([pageId, page], index) => {
            // If page has no position, calculate grid position
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
                    isStart: pageId === view.first_page
                }
            });
        });

        return nodes;
    }, [view.pages, view.first_page]);

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
    useEffect(() => {
        const viewPageIds = new Set(Object.keys(view.pages));
        const nodeIds = new Set(nodes.map(node => node.id));
        
        // Check for node deletions (nodes that exist but not in view)
        const nodesDeleted = nodes.some(node => !viewPageIds.has(node.id));
        
        // Check for node additions (pages in view but not in nodes)
        const nodesAdded = Array.from(viewPageIds).some(pageId => !nodeIds.has(pageId));
        
        // Update nodes if needed
        if (nodesDeleted || nodesAdded) {
            console.log('Syncing nodes with view state:', { 
                nodesDeleted,
                nodesAdded, 
                viewPageCount: viewPageIds.size,
                nodeCount: nodeIds.size
            });
            
            // Create updated nodes array based on current view
            const updatedNodes = Object.entries(view.pages).map(([pageId, page]) => {
                // Try to find existing node to preserve position
                const existingNode = nodes.find(n => n.id === pageId);
                
                // Create or update node
                return {
                    id: pageId,
                    type: 'pageNode',
                    position: existingNode?.position || page.position || { x: 0, y: 0 },
                    data: { 
                        page,
                        isStart: pageId === view.first_page
                    }
                };
            });
            
            setNodes(updatedNodes);
            
            // Also update edges to match new node structure
            const updatedEdges = initialEdges;
            setEdges(updatedEdges);
        }
    }, [view.pages, view.first_page, nodes, initialEdges, setNodes, setEdges]);

    const handleCreatePage = useCallback((type: PageType) => {
        if (!pendingPosition) return;

        const id = `page_${Math.random().toString(36).substr(2, 9)}`;

        const newPage = generateDefaultPage({ id, type, position: pendingPosition });

        // Create updated pages object
        const updatedPages = {
            ...view.pages,
            [id]: newPage
        };

        // Handle connections if there's a pending connection
        if (pendingConnection?.source) {
            const sourcePage = view.pages[pendingConnection.source];
            if (sourcePage) {
                if (pendingConnection.sourceHandle?.startsWith('branch-')) {
                    // Handle branch connection
                    const branchIndex = parseInt(pendingConnection.sourceHandle.split('-')[1]);
                    const updatedBranches = [...(sourcePage.next_page.branches || [])];
                    
                    console.log('Creating page for branch connection:', { 
                        branchIndex, 
                        sourcePage: pendingConnection.source,
                        targetPage: id 
                    });
                    
                    // Check if this branch already has a connection
                    const currentTarget = updatedBranches[branchIndex].next_page;
                    if (currentTarget) {
                        // Will need to remove the old edge from ReactFlow after the update
                        setTimeout(() => {
                            const oldEdgeId = `${pendingConnection.source}-${currentTarget}-branch-${branchIndex}`;
                            reactFlowInstance.setEdges(edges => 
                                edges.filter(edge => edge.id !== oldEdgeId)
                            );
                        }, 50);
                    }
                    
                    // Update the branch with the new target
                    updatedBranches[branchIndex] = {
                        ...updatedBranches[branchIndex],
                        next_page: id,
                        condition: updatedBranches[branchIndex]?.condition || { field: '', operator: '', value: '' }
                    };

                    // Update the source page
                    updatedPages[pendingConnection.source] = {
                        ...sourcePage,
                        next_page: {
                            ...sourcePage.next_page,
                            branches: updatedBranches
                        }
                    };

                    // Don't show branch condition dialog
                    // setEditingBranch({
                    //     sourceId: pendingConnection.source,
                    //     branchIndex
                    // });
                    // setShowBranchDialog(true);
                } else {
                    // Handle default connection
                    console.log('Creating page for default connection:', {
                        sourcePage: pendingConnection.source,
                        targetPage: id
                    });
                    
                    // Check if there's already a default connection
                    const currentTarget = sourcePage.next_page.default_next_page;
                    if (currentTarget) {
                        // Will need to remove the old edge from ReactFlow after the update
                        setTimeout(() => {
                            const oldEdgeId = `${pendingConnection.source}-${currentTarget}`;
                            reactFlowInstance.setEdges(edges => 
                                edges.filter(edge => edge.id !== oldEdgeId)
                            );
                        }, 50);
                    }
                    
                    updatedPages[pendingConnection.source] = {
                        ...sourcePage,
                        next_page: {
                            ...sourcePage.next_page,
                            default_next_page: id
                        }
                    };
                }
            }
        }

        // Update the view configuration
        console.log('Updating view with new page:', updatedPages);
        onUpdateFlow({
            pages: updatedPages,
            first_page: Object.keys(view.pages).length === 0 ? id : view.first_page
        });

        // If there was a pending connection, manually add the edge to ReactFlow
        if (pendingConnection?.source) {
            const source = pendingConnection.source; // Assign to a constant to satisfy TypeScript
            
            setTimeout(() => {
                // Create appropriate edge
                let newEdge;
                if (pendingConnection.sourceHandle?.startsWith('branch-')) {
                    const branchIndex = parseInt(pendingConnection.sourceHandle.split('-')[1]);
                    newEdge = {
                        id: `${source}-${id}-branch-${branchIndex}`,
                        source: source,
                        target: id,
                        sourceHandle: pendingConnection.sourceHandle,
                        type: 'default',
                        animated: true,
                        data: { type: 'branch' }
                    };
                } else {
                    newEdge = {
                        id: `${source}-${id}`,
                        source: source,
                        target: id,
                        sourceHandle: 'default',
                        type: 'default',
                        animated: true,
                        data: { type: 'default' }
                    };
                }
                
                // Add the edge to ReactFlow
                reactFlowInstance.addEdges([newEdge]);
            }, 100); // Short delay to ensure the node is rendered
        }

        // Reset state
        setPendingPosition(null);
        setShowPageTypeDialog(false);
        setPendingConnection(null);

        // Fit view after a short delay to ensure the new node is rendered
        setTimeout(() => {
            fitView({ padding: 0.2, duration: 200 });
        }, 50);
    }, [pendingConnection, pendingPosition, view.pages, view.first_page, onUpdateFlow, fitView, reactFlowInstance]);

    const onConnectStart: OnConnectStart = useCallback(
        (event, params) => {
            setDragPreviewPosition(null);
            if (event instanceof MouseEvent && params.nodeId && params.handleId) {
                console.log('Connection start:', { node: params.nodeId, handle: params.handleId });
                setDragStartPosition({ x: event.clientX, y: event.clientY });
                setPendingConnection({
                    source: params.nodeId,
                    sourceHandle: params.handleId,
                    target: ''
                });
            }
        },
        []
    );

    // Handle connection end event
    const onConnectEnd: OnConnectEnd = useCallback(
        (event) => {
            console.log('Connection end:', { pendingConnection, event });
            
            if (pendingConnection?.source) {
                // Check if we're dropping on a valid target
                if (event instanceof MouseEvent) {
                    const targetElement = document.elementFromPoint(event.clientX, event.clientY);
                    console.log('Target element:', targetElement);
                    
                    // Check if we're dropping on a handle
                    const targetHandle = targetElement?.closest('.react-flow__handle');
                    const targetNode = targetElement?.closest('.react-flow__node');
                    
                    if (targetHandle && targetNode) {
                        // Get the node id from the node element - ReactFlow nodes store id in data-id attribute
                        const targetNodeId = targetNode.getAttribute('data-id');
                        console.log('Dropping on handle in node:', targetNodeId);
                        
                        if (targetNodeId && pendingConnection.sourceHandle) {
                            // Manually create connection
                            const connection: Connection = {
                                source: pendingConnection.source,
                                sourceHandle: pendingConnection.sourceHandle,
                                target: targetNodeId,
                                targetHandle: targetHandle.getAttribute('data-handleid')
                            };
                            
                            console.log('Creating manual connection:', connection);
                            addConnection(connection);
                        }
                    } else if (!targetNode) {
                        // Dropping on blank area, show page type dialog
                        console.log('Dropping on blank area, showing page type dialog');
                        
                        // Calculate position for new page
                        const bounds = event.currentTarget instanceof Element 
                            ? event.currentTarget.getBoundingClientRect() 
                            : document.querySelector('.react-flow')?.getBoundingClientRect();
                        
                        if (bounds) {
                            const position = {
                                x: event.clientX - bounds.left - NODE_WIDTH / 2,
                                y: event.clientY - bounds.top - NODE_HEIGHT / 2,
                            };
                            
                            setPendingPosition(position);
                            setShowPageTypeDialog(true);
                        }
                    }
                }
            }
            
            // Clear pending states after processing
            setPendingPosition(null);
            setPendingConnection(null);
        },
        [pendingConnection, view.pages, setPendingConnection, setPendingPosition, addConnection]
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
        if (updatedPages[node.id]) {
            updatedPages[node.id] = {
                ...updatedPages[node.id],
                position: node.position
            };
        }

        // Update view configuration
        onUpdateFlow({
            pages: updatedPages,
            first_page: view.first_page
        });
    }, [view.pages, view.first_page, onUpdateFlow]);

    // Sync nodes with view state when branches change
    useEffect(() => {
        let needsUpdate = false;
        const updatedNodes = nodes.map(node => {
            const pageId = node.id;
            const viewPage = view.pages[pageId];
            
            // Skip if page doesn't exist in view
            if (!viewPage) return node;
            
            // Check if branches differ between view and node
            const nodeData = node.data as { page: Page; isStart?: boolean };
            const nodeBranches = (nodeData.page.next_page?.branches || []).length;
            const viewBranches = (viewPage.next_page?.branches || []).length;
            
            if (nodeBranches !== viewBranches) {
                console.log('Branches changed for node:', pageId, {
                    nodeBranches,
                    viewBranches
                });
                needsUpdate = true;
                return {
                    ...node,
                    data: {
                        ...nodeData,
                        page: viewPage
                    }
                };
            }
            
            return node;
        });
        
        // Update nodes if needed
        if (needsUpdate) {
            console.log('Updating nodes to sync with view state');
            setNodes(updatedNodes);
        }
    }, [view.pages, nodes, setNodes]);

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
        
        // Run again whenever nodes change
        return () => {
            // Cleanup if needed
        };
    }, [nodes]);

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

    // Define edge types with custom edge
    const edgeTypes = useMemo<EdgeTypes>(() => ({
        default: CustomEdge,
    }), []);

    // Provide context to child components
    const contextValue = useMemo(() => ({
        editingBranch,
        setEditingBranch,
        onUpdateBranches: handleUpdateBranches,
        onDeleteConnection: handleDeleteConnection
    }), [editingBranch, setEditingBranch, handleUpdateBranches, handleDeleteConnection]);

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
                                    setDragPreviewPosition(null);
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

                    <Panel position="top-right" className="bg-background border border-border rounded-lg shadow-sm p-4">
                        <div className="space-y-2">
                            <Button 
                                variant="outline" 
                                size="sm" 
                                className="w-full"
                                onClick={() => {
                                    setPendingPosition({ x: 100, y: 100 }); // Set a default position
                                    setShowPageTypeDialog(true);
                                }}
                            >
                                <Plus className="w-3 h-3 mr-1" />
                                Add Page
                            </Button>
                        </div>
                    </Panel>
                </ReactFlow>

                <PageTypeDialog
                    open={showPageTypeDialog}
                    onOpenChange={setShowPageTypeDialog}
                    onSelect={handleCreatePage}
                />

                {/* Branch Condition Dialog */}
                <Dialog open={showBranchDialog} onOpenChange={(open) => {
                    if (!open) {
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
                                        ...prev || { field: '', operator: '', value: '' }, 
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
                                        ...prev || { field: '', operator: '', value: '' }, 
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
                                        ...prev || { field: '', operator: '', value: '' }, 
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