import { useCallback, useMemo, useState, useEffect } from 'react';
import {
    ReactFlow,
    Controls,
    Background,
    useNodesState,
    useEdgesState,
    addEdge,
    Connection,
    Edge,
    Node,
    useReactFlow,
    Panel,
    NodeTypes,
    EdgeTypes,
    XYPosition,
    OnConnectStartParams,
    OnConnectStart,
    OnConnectEnd,
    Handle,
    Position,
    useOnViewportChange,
    getNodesBounds,
    useViewport
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Flag, Plus, ArrowRight, ArrowRightToLine } from 'lucide-react';
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

function PageNode({ data, id }: { data: { page: Page; isStart?: boolean }; id: string }) {
    const { page, isStart } = data;
    const { setNodes, setEdges, getNode } = useReactFlow();
    const [showAddBranch, setShowAddBranch] = useState(false);
    const [editingBranchIndex, setEditingBranchIndex] = useState<number | null>(null);
    const [showBranchDialog, setShowBranchDialog] = useState(false);

    // Check if this branch already has a connection
    const hasBranchConnection = useCallback((index: number) => {
        return page.next_page.branches?.[index]?.next_page !== null;
    }, [page.next_page.branches]);

    const handleAddBranch = useCallback(() => {
        const node = getNode(id);
        if (node) {
            const branchIndex = (page.next_page.branches?.length || 0);

            // Update the page with a new empty branch
            const updatedPage = {
                ...page,
                next_page: {
                    ...page.next_page,
                    branches: [
                        ...(page.next_page.branches || []),
                        { 
                            next_page: null, 
                            condition: { field: '', operator: '', value: '' }
                        }
                    ]
                }
            };

            // Update the node
            setNodes(nodes => nodes.map(n => 
                n.id === id ? { ...n, data: { ...n.data, page: updatedPage } } : n
            ));
        }
        setShowAddBranch(false);
    }, [id, page, getNode, setNodes]);

    const handleEditBranch = (index: number) => {
        setEditingBranchIndex(index);
        setShowBranchDialog(true);
    };

    // Calculate the offset for branch handles based on the content above
    const getBranchHandleOffset = useCallback((index: number) => {
        const HEADER_HEIGHT = 40; // Header with name and type
        const LAYOUT_INFO_HEIGHT = 24; // Layout info row
        const PROVIDES_HEIGHT = page.provides.length > 0 ? 28 : 0; // Provides section if present
        const BRANCHES_TITLE_HEIGHT = 32; // "Branches" title
        const BRANCH_ITEM_HEIGHT = 32; // Height of each branch item

        return HEADER_HEIGHT + LAYOUT_INFO_HEIGHT + PROVIDES_HEIGHT + BRANCHES_TITLE_HEIGHT + (index * BRANCH_ITEM_HEIGHT);
    }, [page.provides.length]);

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
                    
                    {page.provides.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                            {page.provides.map(provide => (
                                <span 
                                    key={provide}
                                    className="bg-secondary px-2 py-0.5 rounded text-xs"
                                >
                                    {provide}
                                </span>
                            ))}
                        </div>
                    )}

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
                    />
                </div>
            </div>

            {/* Branch Logic Dialog */}
            <Dialog open={showBranchDialog} onOpenChange={setShowBranchDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Branch Condition</DialogTitle>
                        <DialogDescription>
                            Define the logic for this branch
                        </DialogDescription>
                    </DialogHeader>
                    <div className="mt-4">
                        <QueryBuilder
                            fields={[
                                { name: 'email', label: 'Email' },
                                { name: 'name', label: 'Name' },
                                { name: 'age', label: 'Age', inputType: 'number' }
                            ]}
                            onQueryChange={(query) => {
                                // TODO: Convert query to condition and save
                                console.log(query);
                            }}
                            query={{
                                combinator: 'and',
                                rules: []
                            }}
                        />
                    </div>
                </DialogContent>
            </Dialog>
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
    const [dragPreviewPosition, setDragPreviewPosition] = useState<XYPosition | null>(null);
    const [dragStartPosition, setDragStartPosition] = useState<XYPosition | null>(null);
    const { fitView } = useReactFlow();

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

    // Only update React Flow state when pages are added or removed
    useEffect(() => {
        const currentPageIds = new Set(Object.keys(view.pages));
        const nodeIds = new Set(nodes.map(n => n.id));
        
        // Only update if pages were added or removed
        if (currentPageIds.size !== nodeIds.size) {
            // Preserve existing node positions
            const updatedNodes = initialNodes.map(newNode => {
                const existingNode = nodes.find(n => n.id === newNode.id);
                return existingNode ? { ...newNode, position: existingNode.position } : newNode;
            });

            setNodes(updatedNodes);
            setEdges(initialEdges);
        }
    }, [initialNodes, initialEdges, setNodes, setEdges, view.pages, nodes]);

    const handleCreatePage = useCallback((type: PageType) => {
        if (!pendingPosition) return;

        const id = `page_${Math.random().toString(36).substr(2, 9)}`;
        
        // Create the new page
        const newPage: Page = {
            id,
            name: 'New Page',
            type,
            position: pendingPosition,
            view: {
                promo: { blocks: [] },
                title: { blocks: [] },
                action: { blocks: [] },
                content: { blocks: [] }
            },
            layout: { sm: 'split-checkout@v1' },
            provides: [],
            next_page: {
                branches: [],
                default_next_page: null
            }
        };

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
                    
                    // Update the branch with the new target
                    updatedBranches[branchIndex] = {
                        ...updatedBranches[branchIndex],
                        next_page: id
                    };

                    // Update the source page
                    updatedPages[pendingConnection.source] = {
                        ...sourcePage,
                        next_page: {
                            ...sourcePage.next_page,
                            branches: updatedBranches
                        }
                    };

                    // Show branch condition dialog
                    setPendingConnection({
                        ...pendingConnection,
                        target: id,
                        sourceHandle: `branch-${branchIndex}`
                    });
                    setShowBranchDialog(true);
                } else {
                    // Handle default connection
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
        onUpdateFlow({
            pages: updatedPages,
            first_page: Object.keys(view.pages).length === 0 ? id : view.first_page
        });

        // Reset state
        setPendingPosition(null);
        setShowPageTypeDialog(false);
        if (!pendingConnection?.sourceHandle?.startsWith('branch-')) {
            setPendingConnection(null);
        }

        // Fit view after a short delay to ensure the new node is rendered
        setTimeout(() => {
            fitView({ padding: 0.2, duration: 200 });
        }, 50);
    }, [pendingConnection, pendingPosition, view.pages, view.first_page, onUpdateFlow, fitView]);

    const onConnect = useCallback(
        (connection: Connection) => {
            // Skip if missing essential data
            if (!connection.source || !connection.target) return;

            console.log('Connection created:', connection);
            
            const sourceId = connection.source;
            const targetId = connection.target;
            const sourcePage = view.pages[sourceId];
            const updatedPages = { ...view.pages };

            // Skip if the source page doesn't exist
            if (!sourcePage) {
                console.error('Source page not found:', sourceId);
                return;
            }

            if (connection.sourceHandle?.startsWith('branch-')) {
                console.log('Branch connection detected:', { 
                    sourceId, 
                    targetId,
                    sourceHandle: connection.sourceHandle 
                });
                
                const branchIndex = parseInt(connection.sourceHandle.split('-')[1]);
                
                // Update the branch with the new target
                const updatedBranches = [...(sourcePage.next_page.branches || [])];
                
                // Make sure we have the branch at this index
                if (branchIndex >= 0 && branchIndex < updatedBranches.length) {
                    console.log('Updating branch:', { 
                        branchIndex,
                        currentBranch: updatedBranches[branchIndex],
                        targetId
                    });
                    
                    updatedBranches[branchIndex] = {
                        ...updatedBranches[branchIndex],
                        next_page: targetId,
                        // Ensure condition is always initialized
                        condition: updatedBranches[branchIndex]?.condition || { field: '', operator: '', value: '' }
                    };

                    updatedPages[connection.source] = {
                        ...sourcePage,
                        next_page: {
                            ...sourcePage.next_page,
                            branches: updatedBranches
                        }
                    };
                    
                    console.log('Branch updated:', updatedBranches[branchIndex]);
                    
                    // Update view configuration
                    onUpdateFlow({
                        pages: updatedPages,
                        first_page: view.first_page
                    });
                    
                    // Show the branch condition dialog
                    setEditingBranch({
                        sourceId: sourceId,
                        branchIndex
                    });
                    setShowBranchDialog(true);
                } else {
                    console.error('Branch index out of bounds:', { branchIndex, branches: updatedBranches });
                }
            } else {
                // Update default next page
                console.log('Default connection detected:', { sourceId, targetId });
                
                updatedPages[connection.source] = {
                    ...sourcePage,
                    next_page: {
                        ...sourcePage.next_page,
                        default_next_page: targetId
                    }
                };
                
                // Update view configuration
                onUpdateFlow({
                    pages: updatedPages,
                    first_page: view.first_page
                });
            }
        },
        [view.pages, view.first_page, onUpdateFlow]
    );

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
            setPendingPosition(null);
            console.log('Connection end:', { pendingConnection, event });
            
            // If we have a pending connection with a branch source handle, 
            // we need to ensure the condition is configured
            if (pendingConnection?.sourceHandle?.startsWith('branch-')) {
                const sourceId = pendingConnection.source;
                const sourcePage = sourceId ? view.pages[sourceId] : undefined;
                if (sourcePage && sourceId) {
                    const branchIndex = parseInt(pendingConnection.sourceHandle.split('-')[1]);
                    const branch = sourcePage.next_page.branches[branchIndex];
                    
                    // Show branch condition dialog if a connection was made
                    if (branch && branch.next_page) {
                        console.log('Setting up branch condition dialog for:', { sourceId, branchIndex, branch });
                        setEditingBranch({
                            sourceId: sourceId,
                            branchIndex
                        });
                        setShowBranchDialog(true);
                    }
                }
            }
            
            setPendingConnection(null);
        },
        [pendingConnection, view.pages, setPendingConnection, setPendingPosition]
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

    const nodeTypes = useMemo<NodeTypes>(() => ({
        pageNode: PageNode
    }), []);

    return (
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
        </div>
    );
} 