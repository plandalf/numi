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
    ConnectStartEvent
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Flag, Plus } from 'lucide-react';
import { type Page, type OfferView, type PageType } from '@/types/offer';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import PageTypeDialog from './page-type-dialog';
import { 
    QueryBuilder, 
    type Field, 
    type RuleGroupType,
    type RuleType
} from 'react-querybuilder';
import 'react-querybuilder/dist/query-builder.css';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle
} from '@/components/ui/dialog';

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

function PageNode({ data }: { data: { page: Page; isStart?: boolean } }) {
    const { page, isStart } = data;

    return (
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

                {page.type !== 'ending' && (
                    <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full mt-2"
                        onClick={() => console.log('Add branch')}
                    >
                        <Plus className="w-3 h-3 mr-1" />
                        Add Branch
                    </Button>
                )}
            </div>
        </div>
    );
}

type CustomRuleGroupType = RuleGroupType;
type CustomRuleType = RuleType;

interface BranchDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSave: (condition: CustomRuleGroupType) => void;
}

function BranchDialog({ open, onOpenChange, onSave }: BranchDialogProps) {
    const [query, setQuery] = useState<CustomRuleGroupType>({
        combinator: 'and',
        rules: [],
    });

    const fields: Field[] = [
        { name: 'email', label: 'Email' },
        { name: 'name', label: 'Name' },
        { name: 'age', label: 'Age' },
    ];

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Branch Condition</DialogTitle>
                    <DialogDescription>
                        Define the condition for this branch
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                    <QueryBuilder<CustomRuleGroupType, CustomRuleType>
                        fields={fields}
                        query={query}
                        onQueryChange={(q: CustomRuleGroupType) => setQuery(q)}
                    />
                    <div className="flex justify-end">
                        <Button onClick={() => {
                            onSave(query);
                            onOpenChange(false);
                        }}>
                            Save Condition
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

export default function PageFlowEditor({ view, onUpdateFlow }: PageFlowEditorProps) {
    const [showPageTypeDialog, setShowPageTypeDialog] = useState(false);
    const [showBranchDialog, setShowBranchDialog] = useState(false);
    const [pendingConnection, setPendingConnection] = useState<Connection | null>(null);
    const [pendingPosition, setPendingPosition] = useState<XYPosition | null>(null);

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
                    type: 'smoothstep',
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
                        type: 'smoothstep',
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

        if (pendingConnection) {
            const sourceNode = nodes.find(n => n.id === pendingConnection.source);
            if (sourceNode) {
                const sourcePage = view.pages[sourceNode.id];
                if (pendingConnection.sourceHandle === 'branch') {
                    // Add as a branch
                    sourcePage.next_page.branches = [
                        ...(sourcePage.next_page.branches || []),
                        { next_page: id, condition: {} }
                    ];
                } else {
                    // Set as default next page
                    sourcePage.next_page.default_next_page = id;
                }
            }
        }

        const updatedPages = {
            ...view.pages,
            [id]: newPage
        };

        onUpdateFlow({
            pages: updatedPages,
            first_page: view.first_page
        });

        setNodes(nodes => [
            ...nodes,
            {
                id,
                type: 'pageNode',
                position: pendingPosition || { x: 0, y: 0 },
                data: { page: newPage }
            }
        ]);

        setPendingConnection(null);
        setPendingPosition(null);
    }, [nodes, pendingConnection, pendingPosition, view.pages, onUpdateFlow, setNodes]);

    const onConnect = useCallback(
        (connection: Connection) => {
            const sourceNode = nodes.find(n => n.id === connection.source);
            const targetNode = nodes.find(n => n.id === connection.target);
            
            if (sourceNode && targetNode) {
                const sourcePage = view.pages[sourceNode.id];
                const targetId = targetNode.id;

                if (connection.sourceHandle === 'branch') {
                    setShowBranchDialog(true);
                    setPendingConnection(connection);
                } else {
                    // Update default next page
                    sourcePage.next_page.default_next_page = targetId;
                    onUpdateFlow({
                        pages: {
                            ...view.pages,
                            [sourceNode.id]: sourcePage
                        },
                        first_page: view.first_page
                    });
                    setEdges(eds => addEdge(connection, eds));
                }
            }
        },
        [nodes, view.pages, onUpdateFlow, setEdges]
    );

    const onConnectStart = useCallback(
        (event: React.MouseEvent | React.TouchEvent, params: OnConnectStartParams) => {
            console.log('Connection started:', params.nodeId, params.handleId);
        },
        []
    );

    const onConnectEnd = useCallback(
        (event: MouseEvent | TouchEvent) => {
            const targetIsPane = (event.target as Element).classList.contains('react-flow__pane');

            if (targetIsPane && event instanceof MouseEvent) {
                const bounds = (event.target as Element).getBoundingClientRect();
                const position = {
                    x: event.clientX - bounds.left,
                    y: event.clientY - bounds.top,
                };

                setPendingPosition(position);
                setShowPageTypeDialog(true);
            }
        },
        []
    );

    const handleSaveBranchCondition = useCallback((condition: CustomRuleGroupType) => {
        if (pendingConnection) {
            const sourceNode = nodes.find(n => n.id === pendingConnection.source);
            const targetNode = nodes.find(n => n.id === pendingConnection.target);
            
            if (sourceNode && targetNode) {
                const sourcePage = view.pages[sourceNode.id];
                const targetId = targetNode.id;

                sourcePage.next_page.branches = [
                    ...(sourcePage.next_page.branches || []),
                    { next_page: targetId, condition }
                ];

                onUpdateFlow({
                    pages: {
                        ...view.pages,
                        [sourceNode.id]: sourcePage
                    },
                    first_page: view.first_page
                });

                setEdges(eds => addEdge({
                    ...pendingConnection,
                    label: 'Branch',
                    data: { type: 'branch', condition }
                }, eds));
            }
        }
        setPendingConnection(null);
    }, [nodes, pendingConnection, view.pages, onUpdateFlow, setEdges]);

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
                nodeTypes={nodeTypes}
                fitView
                className="bg-background"
            >
                <Background />
                <Controls />
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

            <BranchDialog
                open={showBranchDialog}
                onOpenChange={setShowBranchDialog}
                onSave={handleSaveBranchCondition}
            />
        </div>
    );
} 