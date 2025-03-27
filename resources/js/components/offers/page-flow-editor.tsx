import { useCallback, useMemo, useState } from 'react';
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

    const getBranchLabel = (condition: BranchCondition) => {
        if (!condition.field || !condition.operator || !condition.value) {
            return "Set condition...";
        }
        return `${condition.field} ${condition.operator} ${condition.value}`;
    };

    const handleEditBranch = (index: number) => {
        setEditingBranchIndex(index);
        setShowBranchDialog(true);
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
                    >
                        <Plus className="w-4 h-4 text-background pointer-events-none" />
                    </Handle>
                </div>
            )}

            {/* Branch connection handles - align with branch info */}
            {page.type !== 'ending' && page.next_page.branches?.map((branch, index) => !hasBranchConnection(index) && (
                <div
                    key={`branch-${index}`}
                    className="absolute right-0 translate-x-1/2 z-10"
                    style={{ 
                        // Align with branch info: account for header (24px), layout info (24px), provides (if any), 
                        // branches title (24px), and previous branches (28px each)
                        top: `${104 + (index * 28)}px`
                    }}
                >
                    <Handle
                        type="source"
                        position={Position.Right}
                        id={`branch-${index}`}
                        className="!w-6 !h-6 !bg-secondary hover:!bg-secondary/80 !border-2 !border-background rounded-full flex items-center justify-center cursor-grab active:cursor-grabbing"
                        isConnectable={true}
                    >
                        <Plus className="w-4 h-4 text-background pointer-events-none" />
                    </Handle>
                </div>
            ))}

            {/* Target connection handle */}
            <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 z-10">
                <Handle
                    type="target"
                    position={Position.Left}
                    className="!w-6 !h-6 !bg-primary hover:!bg-primary/80 !border-2 !border-background rounded-full flex items-center justify-center cursor-grab active:cursor-grabbing"
                    isConnectable={true}
                >
                    <Plus className="w-4 h-4 text-background pointer-events-none" />
                </Handle>
            </div>

            <div className="bg-card border border-border rounded-lg shadow-sm p-4 w-[250px]">
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

                    {/* Branch List */}
                    {page.next_page.branches && page.next_page.branches.length > 0 && (
                        <div className="mt-4 space-y-2">
                            <h4 className="text-sm font-medium">Branches</h4>
                            <div className="space-y-1">
                                {page.next_page.branches.map((branch, index) => (
                                    <div 
                                        key={index}
                                        className="text-xs p-2 bg-muted rounded-sm flex items-center justify-between"
                                    >
                                        <span className="text-muted-foreground">
                                            {getBranchLabel(branch.condition)}
                                        </span>
                                        <button 
                                            onClick={() => handleEditBranch(index)}
                                            className="text-primary hover:text-primary/80"
                                        >
                                            Edit
                                        </button>
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

export default function PageFlowEditor({ view, onUpdateFlow }: PageFlowEditorProps) {
    const [showPageTypeDialog, setShowPageTypeDialog] = useState(false);
    const [showBranchDialog, setShowBranchDialog] = useState(false);
    const [pendingConnection, setPendingConnection] = useState<Connection | null>(null);
    const [pendingPosition, setPendingPosition] = useState<XYPosition | null>(null);
    const [dragPreviewPosition, setDragPreviewPosition] = useState<XYPosition | null>(null);
    const [dragStartPosition, setDragStartPosition] = useState<XYPosition | null>(null);
    const { fitView } = useReactFlow();

    const initialNodes = useMemo(() => {
        const nodes: Node[] = [];
        let x = 0;
        let y = 0;
        let currentPageId: string | null = view.first_page;
        const processedPages = new Set<string>();

        while (currentPageId && !processedPages.has(currentPageId)) {
            const currentPage: Page = view.pages[currentPageId];
            processedPages.add(currentPageId);

            nodes.push({
                id: currentPageId,
                type: 'pageNode',
                position: { x: x * (NODE_WIDTH + GRID_SPACING * 2), y },
                data: { 
                    page: currentPage,
                    isStart: currentPageId === view.first_page
                }
            });

            x++;
            if (x > 3) {
                x = 0;
                y += NODE_HEIGHT + GRID_SPACING;
            }

            currentPageId = currentPage.next_page.default_next_page;
        }

        return nodes;
    }, [view]);

    const initialEdges = useMemo(() => {
        const edges: Edge[] = [];
        const processedPages = new Set<string>();
        let currentPageId: string | null = view.first_page;

        while (currentPageId && !processedPages.has(currentPageId)) {
            const currentPage: Page = view.pages[currentPageId];
            const nextPageId = currentPage.next_page.default_next_page;
            processedPages.add(currentPageId);

            if (nextPageId) {
                edges.push({
                    id: `${currentPageId}-${nextPageId}`,
                    source: currentPageId,
                    target: nextPageId,
                    type: 'default',
                    animated: true,
                    data: { type: 'default' }
                } as Edge);
            }

            currentPage.next_page.branches?.forEach((branch, index) => {
                if (branch.next_page) {
                    edges.push({
                        id: `${currentPageId}-${branch.next_page}-branch-${index}`,
                        source: currentPageId,
                        target: branch.next_page,
                        type: 'default',
                        animated: true,
                        label: 'Branch',
                        data: { type: 'branch', condition: branch.condition }
                    } as Edge);
                }
            });

            currentPageId = nextPageId;
        }

        return edges;
    }, [view]);

    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
    const { getNode } = useReactFlow();

    const handleCreatePage = useCallback((type: PageType) => {
        if (!pendingPosition) return;

        const id = `page_${Math.random().toString(36).substr(2, 9)}`;
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

        const updatedPages = {
            ...view.pages,
            [id]: newPage
        };

        // If we have a pending connection, update the source page
        if (pendingConnection?.source) {
            const sourcePage = view.pages[pendingConnection.source];
            if (sourcePage) {
                if (pendingConnection.sourceHandle?.startsWith('branch-')) {
                    // Add as a branch
                    sourcePage.next_page.branches = [
                        ...(sourcePage.next_page.branches || []),
                        { next_page: id, condition: { field: '', operator: '', value: '' } }
                    ];
                    
                    // Show branch condition dialog
                    setPendingConnection({
                        ...pendingConnection,
                        target: id
                    });
                    setShowBranchDialog(true);
                } else {
                    // Set as default next page
                    sourcePage.next_page.default_next_page = id;
                    
                    // Add the edge
                    setEdges(eds => addEdge({
                        id: `${pendingConnection.source}-${id}`,
                        source: pendingConnection.source,
                        target: id,
                        // type: 'smoothstep',
                        animated: true,
                        data: { type: 'default' }
                    }, eds));
                }

                updatedPages[pendingConnection.source] = sourcePage;
            }
        }

        onUpdateFlow({
            pages: updatedPages,
            first_page: view.first_page
        });

        // Use the exact pending position for the new node
        setNodes(nodes => {
            const newNodes = [
                ...nodes,
                {
                    id,
                    type: 'pageNode',
                    position: pendingPosition,
                    data: { page: newPage }
                }
            ];
            
            // Schedule a fit view after the nodes are updated
            setTimeout(() => {
                fitView({ padding: 0.2, duration: 200 });
            }, 50);

            return newNodes;
        });

        setPendingConnection(null);
        setPendingPosition(null);
    }, [pendingConnection, pendingPosition, view.pages, onUpdateFlow, setNodes, setEdges, fitView]);

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

    // Function to get the nearest node to snap to
    const getNearestNode = useCallback((position: XYPosition) => {
        let nearestNode = null;
        let minDistance = Infinity;
        
        nodes.forEach(node => {
            const nodeCenter = {
                x: node.position.x + NODE_WIDTH / 2,
                y: node.position.y + NODE_HEIGHT / 2
            };
            
            const dx = position.x - nodeCenter.x;
            const dy = position.y - nodeCenter.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < minDistance) {
                minDistance = distance;
                nearestNode = node;
            }
        });
        
        return nearestNode;
    }, [nodes]);

    // Function to check if we're far enough from the drag start position
    const isFarFromStart = useCallback((position: XYPosition) => {
        if (!dragStartPosition) return false;
        const dx = Math.abs(position.x - dragStartPosition.x);
        const dy = Math.abs(position.y - dragStartPosition.y);
        return Math.sqrt(dx * dx + dy * dy) > 50; // Minimum drag distance of 50px
    }, [dragStartPosition]);

    const handleSaveBranchCondition = useCallback((condition: BranchCondition) => {
        if (pendingConnection) {
            const sourceNode = nodes.find(n => n.id === pendingConnection.source);
            const targetNode = nodes.find(n => n.id === pendingConnection.target);
            
            if (sourceNode && targetNode) {
                const sourcePage = view.pages[sourceNode.id];
                const targetId = targetNode.id;

                // Add the branch with condition
                const updatedPage = {
                    ...sourcePage,
                    next_page: {
                        ...sourcePage.next_page,
                        branches: [
                            ...(sourcePage.next_page.branches || []),
                            { next_page: targetId, condition }
                        ]
                    }
                };

                // Update the view
                onUpdateFlow({
                    pages: {
                        ...view.pages,
                        [sourceNode.id]: updatedPage
                    },
                    first_page: view.first_page
                });

                // Add the edge
                const branchIndex = updatedPage.next_page.branches.length - 1;
                setEdges(eds => addEdge({
                    ...pendingConnection,
                    id: `${sourceNode.id}-${targetId}-branch-${branchIndex}`,
                    // type: 'smoothstep',
                    animated: true,
                    label: `${condition.field} ${condition.operator} ${condition.value}`,
                    data: { type: 'branch', condition }
                }, eds));
            }
        }
        setPendingConnection(null);
    }, [nodes, pendingConnection, view.pages, onUpdateFlow, setEdges]);

    const onConnect = useCallback(
        (connection: Connection) => {
            const sourceNode = nodes.find(n => n.id === connection.source);
            const targetNode = nodes.find(n => n.id === connection.target);
            
            if (sourceNode && targetNode) {
                const sourcePage = view.pages[sourceNode.id];
                const targetId = targetNode.id;

                if (connection.sourceHandle?.startsWith('branch-')) {
                    // Show branch condition dialog
                    setShowBranchDialog(true);
                    setPendingConnection(connection);
                } else {
                    // Update default next page
                    const updatedPage = {
                        ...sourcePage,
                        next_page: {
                            ...sourcePage.next_page,
                            default_next_page: targetId
                        }
                    };

                    onUpdateFlow({
                        pages: {
                            ...view.pages,
                            [sourceNode.id]: updatedPage
                        },
                        first_page: view.first_page
                    });

                    setEdges(eds => addEdge({
                        ...connection,
                        id: `${sourceNode.id}-${targetId}`,
                        type: 'default',
                        animated: true,
                        data: { type: 'default' }
                    }, eds));
                }
            }
        },
        [nodes, view.pages, onUpdateFlow, setEdges]
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
                    if (event.buttons === 1) { // Left mouse button is pressed
                        const bounds = event.currentTarget.getBoundingClientRect();
                        const position = {
                            x: event.clientX - bounds.left,
                            y: event.clientY - bounds.top
                        };

                        // Only show preview or snap if we're far enough from start
                        if (isFarFromStart({ x: event.clientX, y: event.clientY })) {
                            if (isNearNode(position)) {
                                setDragPreviewPosition(null);
                            } else {
                                // Show preview at exact mouse position
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
                            onClick={() => setShowPageTypeDialog(true)}
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