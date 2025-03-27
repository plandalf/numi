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
                        { next_page: null, condition: { field: '', operator: '', value: '' } }
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
                                                            ? "!bg-muted-foreground/50 cursor-not-allowed" 
                                                            : "!bg-secondary hover:!bg-secondary/80 cursor-grab active:cursor-grabbing"
                                                    )}
                                                    isConnectable={!branch.next_page}
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
                        className="!w-3 !h-3 !bg-muted-foreground/50 !border-2 !border-background rounded-full"
                        isConnectable={false}
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
const getBranchLabel = (condition: BranchCondition) => {
    if (!condition.field || !condition.operator || !condition.value) {
        return "Set condition...";
    }
    return `${condition.field} ${condition.operator} ${condition.value}`;
};

export default function PageFlowEditor({ view, onUpdateFlow }: PageFlowEditorProps) {
    const [showPageTypeDialog, setShowPageTypeDialog] = useState(false);
    const [showBranchDialog, setShowBranchDialog] = useState(false);
    const [pendingConnection, setPendingConnection] = useState<Connection | null>(null);
    const [pendingPosition, setPendingPosition] = useState<XYPosition | null>(null);
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
        let x = 0;
        let y = 0;
        
        // Create nodes in the correct order
        getOrderedPages().forEach(([pageId, page]) => {
            nodes.push({
                id: pageId,
                type: 'pageNode',
                position: { x: x * (NODE_WIDTH + GRID_SPACING * 2), y },
                data: { 
                    page,
                    isStart: pageId === view.first_page
                }
            });

            x++;
            if (x > 3) {
                x = 0;
                y += NODE_HEIGHT + GRID_SPACING;
            }
        });

        return nodes;
    }, [view.pages, view.first_page, getOrderedPages]);

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

    // Update React Flow state when view changes
    useEffect(() => {
        setNodes(initialNodes);
        setEdges(initialEdges);
    }, [initialNodes, initialEdges, setNodes, setEdges]);

    const handleCreatePage = useCallback((type: PageType) => {
        if (!pendingPosition) return;

        const id = `page_${Math.random().toString(36).substr(2, 9)}`;
        console.log('Creating new page with ID:', id);
        
        const newPage: Page = {
            id,
            name: 'New Page',
            type,
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
        console.log('New page object:', newPage);

        const updatedPages = {
            ...view.pages,
            [id]: newPage
        };
        console.log('Updated pages object:', updatedPages);

        // If we have a pending connection, update the source page
        if (pendingConnection?.source) {
            console.log('Handling pending connection:', pendingConnection);
            const sourcePage = view.pages[pendingConnection.source];
            if (sourcePage) {
                if (pendingConnection.sourceHandle?.startsWith('branch-')) {
                    // Get branch index
                    const branchIndex = parseInt(pendingConnection.sourceHandle.split('-')[1]);
                    console.log('Updating branch connection:', { branchIndex, sourceId: pendingConnection.source });
                    
                    // Update the branch with the new target
                    const updatedBranches = [...(sourcePage.next_page.branches || [])];
                    updatedBranches[branchIndex] = {
                        ...updatedBranches[branchIndex],
                        next_page: id
                    };

                    updatedPages[pendingConnection.source] = {
                        ...sourcePage,
                        next_page: {
                            ...sourcePage.next_page,
                            branches: updatedBranches
                        }
                    };
                    console.log('Updated source page with new branch:', updatedPages[pendingConnection.source]);

                    // Show branch condition dialog after updating view
                    setPendingConnection({
                        ...pendingConnection,
                        target: id,
                        sourceHandle: `branch-${branchIndex}`
                    });
                    setShowBranchDialog(true);
                } else {
                    // Set as default next page
                    updatedPages[pendingConnection.source] = {
                        ...sourcePage,
                        next_page: {
                            ...sourcePage.next_page,
                            default_next_page: id
                        }
                    };
                    console.log('Updated source page with new default next page:', updatedPages[pendingConnection.source]);
                }
            }
        } else {
            // If this is the first page, set it as the first page
            if (Object.keys(view.pages).length === 0) {
                console.log('Setting as first page since no pages exist');
                onUpdateFlow({
                    pages: updatedPages,
                    first_page: id
                });
            } else {
                console.log('Adding as standalone page');
                onUpdateFlow({
                    pages: updatedPages,
                    first_page: view.first_page
                });
            }
        }

        // Schedule a fit view after the update
        setTimeout(() => {
            fitView({ padding: 0.2, duration: 200 });
        }, 50);

        if (!pendingConnection?.sourceHandle?.startsWith('branch-')) {
            setPendingConnection(null);
        }
        setPendingPosition(null);
        setShowPageTypeDialog(false);
    }, [pendingConnection, pendingPosition, view.pages, view.first_page, onUpdateFlow, fitView]);

    const onConnect = useCallback(
        (connection: Connection) => {
            const sourcePage = view.pages[connection.source || ''];
            const targetId = connection.target;
            
            if (!sourcePage || !targetId) return;

            // Check if target is already connected to this source
            const isAlreadyConnected = Object.values(view.pages).some(page => 
                page.next_page.default_next_page === targetId ||
                page.next_page.branches?.some(branch => branch.next_page === targetId)
            );
            if (isAlreadyConnected) return;

            const updatedPages = { ...view.pages };

            if (connection.sourceHandle?.startsWith('branch-')) {
                const branchIndex = parseInt(connection.sourceHandle.split('-')[1]);
                
                // Update the branch with the new target
                const updatedBranches = [...(sourcePage.next_page.branches || [])];
                updatedBranches[branchIndex] = {
                    ...updatedBranches[branchIndex],
                    next_page: targetId
                };

                updatedPages[connection.source || ''] = {
                    ...sourcePage,
                    next_page: {
                        ...sourcePage.next_page,
                        branches: updatedBranches
                    }
                };
            } else {
                // Update default next page
                updatedPages[connection.source || ''] = {
                    ...sourcePage,
                    next_page: {
                        ...sourcePage.next_page,
                        default_next_page: targetId
                    }
                };
            }

            // Update view configuration first
            onUpdateFlow({
                pages: updatedPages,
                first_page: view.first_page
            });
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
                setDragStartPosition({ x: event.clientX, y: event.clientY });
                setPendingConnection({
                    source: params.nodeId,
                    sourceHandle: params.handleId,
                    target: '',
                    targetHandle: null
                });
            }
        },
        []
    );

    const onConnectEnd: OnConnectEnd = useCallback(
        (event) => {
            if (!(event.target instanceof Element)) return;
            
            const targetIsPane = event.target.classList.contains('react-flow__pane');
            const flowElement = event.target.closest('.react-flow');
            
            if (targetIsPane && event instanceof MouseEvent && flowElement instanceof Element) {
                const bounds = flowElement.getBoundingClientRect();
                const position = {
                    x: event.clientX - bounds.left - NODE_WIDTH / 2,
                    y: event.clientY - bounds.top - NODE_HEIGHT / 2,
                };

                setPendingPosition(position);
                setShowPageTypeDialog(true);
            } else {
                setPendingConnection(null);
            }
            setDragPreviewPosition(null);
            setDragStartPosition(null);
        },
        []
    );

    const nodeTypes = useMemo<NodeTypes>(() => ({
        pageNode: PageNode
    }), []);

    return (
        <div className="w-full h-full">
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onConnectStart={onConnectStart}
                onConnectEnd={onConnectEnd}
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