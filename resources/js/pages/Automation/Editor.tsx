import React, { useState, useEffect, useRef } from 'react';
import { Head } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { CardContent } from '@/components/ui/card';

import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AdvancedTemplateEditor } from '@/components/ui/advanced-template-editor';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';

import { 
    Save, 
    Play,
    Plus, 
    Settings, 
    CheckCircle, 
    AlertCircle,
    Clock,
    Power,
    Zap,
    X,
    GripVertical,
    XCircle
} from 'lucide-react';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from '@dnd-kit/core';
import {
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import AppAutomationLayout from '@/layouts/app/app-automation-layout';
import axios from '@/lib/axios';

interface ActionField {
    label: string;
    type: string;
    required?: boolean;
    placeholder?: string;
    options?: Record<string, unknown>;
}

interface AppAction {
    key: string;
    name: string;
    description: string;
    fields: Record<string, ActionField>;
}

interface App {
    id: number;
    key: string;
    name: string;
    description: string;
    icon_url?: string;
    color: string;
    auth_config: {
        type: string;
        scopes?: string[];
    };
    actions: AppAction[];
}

interface Connection {
    id: number;
    app_id: number;
    name: string;
    is_active: boolean;
    app: App;
}

interface Node {
    id: number;
    sequence_id: number;
    type: string;
    arguments: Record<string, unknown>;
    position_x?: number;
    position_y?: number;
    app_id?: number;
    connection_id?: number;
    action_key?: string;
    app?: App;
    connection?: Connection;
}

interface Trigger {
    id: number;
    sequence_id: number;
    event_name: string;
    next_node_id?: number;
    position_x?: number;
    position_y?: number;
}

interface Edge {
    id: number;
    from_node_id: number;
    to_node_id: number;
}

interface Sequence {
    id: number;
    name: string;
    description?: string;
    triggers: Trigger[];
    nodes: Node[];
    edges: Edge[];
}

interface EditorProps {
    sequence: Sequence;
    apps: App[];
    connections: Connection[];
}

interface StepItem {
    id: string;
    type: 'trigger' | 'action';
    name: string;
    description: string;
    dbId?: number;
    app?: App;
    connection?: Connection;
    isConfigured: boolean;
    testStatus: 'idle' | 'success' | 'error';
    event_name?: string;
    app_id?: number;
    action_key?: string;
    connection_id?: number;
    arguments?: Record<string, unknown>;
    position_x?: number;
    position_y?: number;
}

// Built-in trigger apps and events
const TRIGGER_APPS = [
    {
        id: 1,
        key: 'plandalf',
        name: 'Plandalf',
        description: 'Plandalf platform events',
        color: '#6366f1',
        events: [
            { key: 'order.created', name: 'Order Created', description: 'Triggers when a new order is created' },
            { key: 'payment.processed', name: 'Payment Processed', description: 'Triggers when a payment is processed' }
        ]
    }
];

function SortableStepCard({ 
    step, 
    index, 
    isFirst, 
    isLast, 
    onEdit, 
    isEditing,
    onAddAfter 
}: {
    step: StepItem;
    index: number;
    isFirst: boolean;
    isLast: boolean;
    onEdit: () => void;
    isEditing: boolean;
    onAddAfter: (afterIndex: number) => void;
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ 
        id: step.id
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div ref={setNodeRef} style={style} className="relative group">
            <StepCard
                step={step}
                index={index}
                isFirst={isFirst}
                isLast={isLast}
                onEdit={onEdit}
                isEditing={isEditing}
                onAddAfter={onAddAfter}
                dragHandleProps={{ ...attributes, ...listeners }}
            />
        </div>
    );
}

function StepCard({ 
    step, 
    index, 
    isFirst, 
    isLast, 
    onEdit, 
    isEditing,
    onAddAfter,
    dragHandleProps
}: {
    step: StepItem;
    index: number;
    isFirst: boolean;
    isLast: boolean;
    onEdit: () => void;
    isEditing: boolean;
    onAddAfter: (afterIndex: number) => void;
    dragHandleProps?: Record<string, unknown>;
}) {
    const getStepIcon = () => {
        if (step.type === 'trigger') {
            return <Zap className="w-4 h-4" />;
        }
        
        return step.app ? (
            <div 
                className="w-4 h-4 rounded flex items-center justify-center text-white text-xs font-bold"
                style={{ backgroundColor: step.app.color }}
            >
                {step.app.name.charAt(0)}
            </div>
        ) : (
            <Settings className="w-4 h-4" />
        );
    };

    const getStepStatus = () => {
        if (step.isConfigured === false) {
            return <AlertCircle className="w-4 h-4 text-orange-500" />;
        }
        if (step.testStatus === 'success') {
            return <CheckCircle className="w-4 h-4 text-green-500" />;
        }
        if (step.testStatus === 'error') {
            return <AlertCircle className="w-4 h-4 text-red-500" />;
        }
        return <Clock className="w-4 h-4 text-gray-400" />;
    };

    const isDraft = step.id.includes('draft');

    return (
        <div className="relative group">
            {/* Connection line to previous step */}
            {!isFirst && (
                <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 w-0.5 h-10 bg-gray-300"></div>
            )}
            
            {/* Drag Handle */}
            {dragHandleProps && (
                <div 
                    {...dragHandleProps}
                    className="absolute -left-6 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab hover:cursor-grab active:cursor-grabbing"
                >
                    <GripVertical className="w-5 h-5 text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded" />
                </div>
            )}
            
            {/* Step Card */}
            <div 
                className={`bg-white rounded-md cursor-pointer hover:shadow-md transition-all ${
                    isEditing ? 'ring-2 ring-blue-500 shadow-md' : ''
                } ${isDraft ? 'border-dashed border-gray-300 bg-gray-50' : ''}`}
                style={{ borderLeftColor: step.app?.color || (step.type === 'trigger' ? '#6366f1' : '#9ca3af') }}
                onClick={onEdit}
            >
                <CardContent className="p-2.5">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                            <div className="flex items-center gap-2">
                                <span className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center text-xs font-semibold">
                                    {index}
                                </span>
                                {getStepIcon()}
                            </div>
                            <div className="min-w-0">
                                <h3 className="font-medium text-sm truncate">{step.name}</h3>
                                <p className="text-xs text-gray-500">
                                    {step.type === 'trigger' 
                                        ? (step.event_name ? `When ${step.event_name}` : step.description)
                                        : step.app 
                                            ? `${step.app.name} • ${step.description}`
                                            : step.description
                                    }
                                </p>
                                <p className="text-xs text-gray-400 font-mono truncate">ID: {step.id}</p>
                            </div>
                        </div>
                        
                        <div className="flex items-center">
                            {getStepStatus()}
                        </div>
                    </div>
                </CardContent>
            </div>

            {/* Connection line to next step */}
            {!isLast && (
                <div className="absolute -bottom-10 left-1/2 transform -translate-x-1/2 w-0.5 h-10 bg-gray-300"></div>
            )}

            {/* Add button between steps */}
            {!isLast && (
                <div className="absolute -bottom-5 left-1/2 transform -translate-x-1/2">
                    <Button
                        size="sm"
                        variant="outline"
                        className="w-8 h-8 p-0 rounded-full bg-white border-2 border-gray-300 hover:border-blue-500 hover:shadow-sm"
                        onClick={(e) => {
                            e.stopPropagation();
                            onAddAfter(index - 1); // Convert display index back to array index
                        }}
                    >
                        <Plus className="w-4 h-4" />
                    </Button>
                </div>
            )}
        </div>
    );
}

function TriggerCard({ 
    step, 
    index, 
    onEdit, 
    isEditing,
    onAddAfter 
}: {
    step: StepItem;
    index: number;
    onEdit: () => void;
    isEditing: boolean;
    onAddAfter: (afterIndex: number) => void;
}) {
    return (
        <StepCard
            step={step}
            index={index}
            isFirst={true}
            isLast={false}
            onEdit={onEdit}
            isEditing={isEditing}
            onAddAfter={onAddAfter}
            // No drag handle props for triggers
        />
    );
}

function StepConfigPanel({ 
    step, 
    apps, 
    connections, 
    sequence,
    onSave,
    onClose,
    onUpdate,
    allSteps
}: {
    step: StepItem | null;
    apps: App[];
    connections: Connection[];
    sequence: Sequence;
    onSave: (stepData: StepItem) => void;
    onClose: () => void;
    onUpdate: (stepData: StepItem) => void;
    allSteps: StepItem[];
}) {
    const [currentStep, setCurrentStep] = useState(1);
    const [selectedApp, setSelectedApp] = useState<App | null>(null);
    const [selectedAction, setSelectedAction] = useState<AppAction | null>(null);
    const [selectedConnection, setSelectedConnection] = useState<Connection | null>(null);
    const [config, setConfig] = useState<Record<string, unknown>>({});
    const [testResults, setTestResults] = useState<{
        success: boolean;
        message: string;
        data?: Record<string, unknown> | null;
        error?: string;
        validation_errors?: Record<string, string[]>;
        execution_time?: number;
        timestamp?: string;
    } | null>(null);

    // For trigger configuration
    const [selectedTriggerApp, setSelectedTriggerApp] = useState<typeof TRIGGER_APPS[0] | null>(null);
    const [selectedEvent, setSelectedEvent] = useState<string>('');

    // Build template context from previous steps
    const templateContext = React.useMemo(() => {
        const context: Record<string, { id: string; name: string; type: string; description?: string; sampleData?: Record<string, unknown> }> = {};
        
        // Get all previous steps (actions that come before this one)
        const currentStepIndex = allSteps.findIndex((s: StepItem) => s.id === step?.id);
        const previousSteps = currentStepIndex > 0 ? allSteps.slice(0, currentStepIndex) : [];
        
        previousSteps.forEach((prevStep: StepItem) => {
            if (prevStep.type === 'action' && prevStep.isConfigured && prevStep.app) {
                const stepId = `action_${prevStep.dbId || prevStep.id.replace('action-', '')}`;
                context[stepId] = {
                    id: stepId,
                    name: prevStep.name,
                    type: 'action',
                    description: `Output from ${prevStep.name}`,
                    sampleData: {
                        // Add common sample data structure
                        success: true,
                        data: {
                            id: 'sample_id',
                            name: 'Sample Name',
                            email: 'sample@example.com',
                            status: 'active',
                            created_at: '2023-01-01T00:00:00Z',
                            metadata: {
                                source: 'api',
                                version: '1.0'
                            }
                        },
                        timestamp: '2023-01-01T00:00:00Z'
                    }
                };
            }
        });
        
        return context;
    }, [step?.id, allSteps]);

    useEffect(() => {
        if (!step) return;
        
        // Reset all state first
        setSelectedApp(null);
        setSelectedAction(null);
        setSelectedConnection(null);
        setConfig({});
        setTestResults(null);
        setCurrentStep(1);
        
        if (step.type === 'trigger') {
            // Handle trigger configuration
            const triggerApp = TRIGGER_APPS.find(app => app.key === 'plandalf');
            setSelectedTriggerApp(triggerApp || null);
            setSelectedEvent(step.event_name || '');
        } else {
            // Handle action configuration
            if (step.app_id) {
                const app = apps.find(a => a.id === step.app_id);
                setSelectedApp(app || null);
                
                if (app && step.action_key) {
                    const action = app.actions.find(a => a.key === step.action_key);
                    setSelectedAction(action || null);
                }
            }
            
            if (step.connection_id) {
                const connection = connections.find(c => c.id === step.connection_id);
                setSelectedConnection(connection || null);
            }

            // Start at Setup step if not configured, otherwise go to Configure
            setCurrentStep(step.isConfigured ? 2 : 1);
        }
        
        // Set config from step arguments (will be empty for new steps)
        setConfig(step.arguments || {});
    }, [step?.id, apps, connections]); // Use step.id instead of step to ensure reset on step change

    // Update step when app/action changes (but don't close panel)
    useEffect(() => {
        if (!step || step.type === 'trigger') return;
        
        if (selectedApp && selectedAction) {
            console.log('DEBUG: Updating step in StepConfigPanel:', {
                stepId: step.id,
                selectedApp: selectedApp.name,
                selectedAction: selectedAction.name,
                config: config
            });
            
            const updatedStep: StepItem = {
                ...step,
                name: selectedAction.name,
                description: selectedAction.description,
                app: selectedApp,
                connection: selectedConnection || undefined,
                app_id: selectedApp.id,
                action_key: selectedAction.key,
                connection_id: selectedConnection?.id,
                arguments: config,
                isConfigured: false, // Keep false so panel stays open
            };
            
            console.log('DEBUG: Updated step data:', updatedStep);
            // Update the step in place without closing the panel
            onUpdate(updatedStep);
        }
    }, [selectedApp, selectedAction, selectedConnection, config]);

    const getStepTitle = () => {
        if (step?.type === 'trigger') return 'Configure Trigger';
        
        switch (currentStep) {
            case 1: return 'Setup Action';
            case 2: return 'Configure Action';
            case 3: return 'Test Action';
            default: return 'Configure Action';
        }
    };

    const canContinue = () => {
        if (step?.type === 'trigger') return !!selectedEvent;
        
        switch (currentStep) {
            case 1: {
                // Must have app and action selected
                if (!selectedApp || !selectedAction) {
                    console.log('DEBUG canContinue: Missing app or action', { selectedApp: !!selectedApp, selectedAction: !!selectedAction });
                    return false;
                }
                
                // If app requires auth (not 'none' type), must have connection
                const requiresAuth = selectedApp.auth_config && 
                                   selectedApp.auth_config.type && 
                                   selectedApp.auth_config.type !== 'none';
                
                console.log('DEBUG canContinue: Auth check', { 
                    requiresAuth, 
                    authConfig: selectedApp.auth_config, 
                    hasConnection: !!selectedConnection 
                });
                
                const result = !requiresAuth || !!selectedConnection;
                console.log('DEBUG canContinue: Final result', { result });
                return result;
            }
            case 2: return true; // Configuration is optional
            case 3: return true; // Test is optional
            default: return false;
        }
    };

    const handleContinue = async () => {
        if (step?.type === 'trigger') {
            await handleSave();
            return;
        }

        // Always save current progress before continuing
        await handleSave();

        if (currentStep < 3) {
            setCurrentStep(prev => prev + 1);
        }
        // On final step, just save - never close the editor
        // Only the X close button can close the action editor
    };

    const handleSave = async () => {
        if (!step) return;
        
        if (step.type === 'trigger') {
            const stepData: StepItem = {
                ...step,
                event_name: selectedEvent,
                arguments: { ...config, event_name: selectedEvent },
                isConfigured: !!selectedEvent,
            };
            onSave(stepData);
        } else {
            const stepData: StepItem = {
                ...step,
                app_id: selectedApp?.id,
                action_key: selectedAction?.key,
                connection_id: selectedConnection?.id,
                arguments: config,
                app: selectedApp || undefined,
                connection: selectedConnection || undefined,
                isConfigured: true,
            };

            // Save to backend if we have a real database ID
            if (stepData.dbId && stepData.type === 'action') {
                try {
                    console.log('Saving step configuration to backend:', {
                        nodeId: stepData.dbId,
                        type: stepData.action_key,
                        arguments: stepData.arguments,
                        app_id: stepData.app_id,
                        connection_id: stepData.connection_id,
                        action_key: stepData.action_key,
                    });

                    await axios.put(`/automation/sequences/${sequence.id}/nodes/${stepData.dbId}`, {
                        type: stepData.action_key || 'draft_action',
                        arguments: stepData.arguments || {},
                        app_id: stepData.app_id,
                        connection_id: stepData.connection_id,
                        action_key: stepData.action_key,
                    });

                    console.log('Successfully saved step configuration to backend');
                } catch (error) {
                    console.error('Failed to save step configuration to backend:', error);
                    // Continue with local save even if backend fails
                }
            }

            onSave(stepData);
        }
    };

    const handleTest = async () => {
        if (!step || !selectedApp || !selectedAction) return;
        
        try {
            console.log('DEBUG: Testing action with config:', {
                stepId: step.id,
                app: selectedApp.name,
                action: selectedAction.key,
                connection: selectedConnection?.name,
                config: config
            });
            
            // Prepare test payload
            const testPayload = {
                app_key: selectedApp.key,
                action_key: selectedAction.key,
                connection_id: selectedConnection?.id,
                arguments: config,
                step_id: step.id,
                sequence_id: sequence.id
            };
            
            console.log('DEBUG: Sending test request:', testPayload);
            
            // Call backend to test the action
            const response = await axios.post('/automations/test-action', testPayload);
            
            const result = response.data;
            
            console.log('DEBUG: Test response:', result);
            
            // Determine if test actually succeeded by checking multiple indicators
            const isTestSuccessful = response.status === 200 && 
                                   result.success && 
                                   result.workflow_status !== 'failed' &&
                                   (!result.exceptions || result.exceptions.length === 0) &&
                                   result.data !== null;

            if (isTestSuccessful) {
                setTestResults({
                    success: true,
                    message: 'Test completed successfully!',
                    data: result.data,
                    execution_time: result.execution_time,
                    timestamp: new Date().toISOString()
                });
                
                // Update step test status
                if (step) {
                    const updatedStep: StepItem = {
                        ...step,
                        testStatus: 'success',
                    };
                    onUpdate(updatedStep);
                }
            } else {
                // Extract error message from exceptions if available
                let errorMessage = result.message || 'Test failed';
                let errorDetails = result.error;
                
                if (result.exceptions && result.exceptions.length > 0) {
                    errorMessage = `Workflow failed: ${result.exceptions[0].message}`;
                    errorDetails = result.exceptions.map((ex: { message: string }) => ex.message).join('; ');
                } else if (result.workflow_status === 'failed') {
                    errorMessage = 'Workflow execution failed';
                } else if (result.data === null) {
                    errorMessage = 'Action returned no data';
                }
                
                setTestResults({
                    success: false,
                    message: errorMessage,
                    error: errorDetails,
                    data: result.data,
                    timestamp: new Date().toISOString()
                });
                
                // Update step test status
                if (step) {
                    const updatedStep: StepItem = {
                        ...step,
                        testStatus: 'error',
                    };
                    onUpdate(updatedStep);
                }
            }
        } catch (error: unknown) {
            console.error('DEBUG: Test error:', error);
            
            // Handle axios errors
            let errorMessage = 'Failed to execute test';
            let errorDetails = 'Unknown error';
            let validationErrors: Record<string, string[]> | undefined;
            
            if (error && typeof error === 'object' && 'response' in error) {
                const axiosError = error as { 
                    response?: { 
                        status?: number;
                        data?: { 
                            message?: string; 
                            error?: string;
                            errors?: Record<string, string[]>;
                        } 
                    }; 
                    message?: string 
                };
                
                // Check if it's a 422 validation error
                if (axiosError.response?.status === 422) {
                    errorMessage = 'Validation failed';
                    errorDetails = axiosError.response?.data?.message || 'Please check the required fields';
                    validationErrors = axiosError.response?.data?.errors;
                } else {
                    // Server responded with other error status
                    errorMessage = axiosError.response?.data?.message || 'Server error';
                    errorDetails = axiosError.response?.data?.error || axiosError.message || 'Unknown error';
                }
            } else if (error && typeof error === 'object' && 'request' in error) {
                const requestError = error as { message?: string };
                // Request was made but no response received
                errorMessage = 'Network error - no response from server';
                errorDetails = requestError.message || 'Unknown error';
            } else if (error && typeof error === 'object' && 'message' in error) {
                // Something else happened
                const genericError = error as { message: string };
                errorMessage = 'Request failed';
                errorDetails = genericError.message;
            }
            
            setTestResults({
                success: false,
                message: errorMessage,
                error: errorDetails,
                validation_errors: validationErrors,
                timestamp: new Date().toISOString()
            });
            
            // Update step test status
            if (step) {
                const updatedStep: StepItem = {
                    ...step,
                    testStatus: 'error',
                };
                onUpdate(updatedStep);
            }
        }
    };

    if (!step) {
        return null;
    }

    return (
        <div className="absolute top-4 right-4 bottom-4 w-[480px] bg-white rounded-lg shadow-xl flex flex-col z-40">
            {/* Header */}
            <div className="p-6 border-b flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-semibold">{getStepTitle()}</h2>
                    <p className="text-xs text-gray-400 font-mono">ID: {step?.id}</p>
                    {step?.type !== 'trigger' && (
                        <p className="text-sm text-gray-500">Step {currentStep} of 3</p>
                    )}
                </div>
                <Button variant="ghost" size="sm" onClick={onClose}>
                    <X className="w-4 h-4" />
                </Button>
            </div>

            {/* Content */}
            <ScrollArea className="flex-1 overflow-y-auto">
                <div className="p-6">
                    {step.type === 'trigger' ? (
                        <div className="space-y-4">
                            <div>
                                <Label>Trigger App</Label>
                                <div className="mt-2">
                                    {TRIGGER_APPS.map((app) => (
                                        <Button
                                            key={app.key}
                                            variant={selectedTriggerApp?.key === app.key ? "default" : "outline"}
                                            className="w-full justify-start"
                                            onClick={() => setSelectedTriggerApp(app)}
                                        >
                                            <div 
                                                className="w-4 h-4 rounded mr-2"
                                                style={{ backgroundColor: app.color }}
                                            />
                                            {app.name}
                                        </Button>
                                    ))}
                                </div>
                            </div>

                            {selectedTriggerApp && (
                                <div>
                                    <Label>Trigger Event</Label>
                                    <Select value={selectedEvent} onValueChange={(value) => {
                                        setSelectedEvent(value);
                                        
                                        // Immediately update the trigger step
                                        if (step && step.type === 'trigger') {
                                            const updatedStep: StepItem = {
                                                ...step,
                                                event_name: value,
                                                arguments: { ...config, event_name: value },
                                                isConfigured: !!value,
                                            };
                                            onUpdate(updatedStep);
                                        }
                                    }}>
                                        <SelectTrigger className="mt-2">
                                            <SelectValue placeholder="Select trigger event" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {selectedTriggerApp.events.map((event) => (
                                                <SelectItem key={event.key} value={event.key}>
                                                    <div>
                                                        <div className="font-medium">{event.name}</div>
                                                        <div className="text-xs text-gray-500">{event.description}</div>
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                        </div>
                    ) : (
                        <Tabs 
                            value={currentStep === 1 ? 'setup' : currentStep === 2 ? 'configure' : 'test'}
                            onValueChange={(value) => {
                                if (value === 'setup') {
                                    setCurrentStep(1);
                                } else if (value === 'configure') {
                                    // Can only go to configure if we have app and action selected
                                    if (selectedApp && selectedAction) {
                                        setCurrentStep(2);
                                    }
                                } else if (value === 'test') {
                                    // Can only go to test if we have app, action, and proper connection
                                    if (selectedApp && selectedAction && (selectedApp.auth_config.type === 'none' || selectedConnection)) {
                                        setCurrentStep(3);
                                    }
                                }
                            }}
                        >
                            <TabsList className="grid w-full grid-cols-3">
                                <TabsTrigger value="setup">Setup</TabsTrigger>
                                <TabsTrigger 
                                    value="configure" 
                                    disabled={!selectedApp || !selectedAction}
                                >
                                    Configure
                                </TabsTrigger>
                                <TabsTrigger 
                                    value="test" 
                                    disabled={!selectedApp || !selectedAction || (selectedApp.auth_config.type !== 'none' && !selectedConnection)}
                                >
                                    Test
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent value="setup" className="space-y-4 mt-4">
                                <div className="space-y-4">
                                    <div>
                                        <Label>Choose App</Label>
                                        <div className="grid grid-cols-1 gap-2 mt-2">
                                            {apps.map((app) => (
                                                <Button
                                                    key={app.id}
                                                    variant={selectedApp?.id === app.id ? "default" : "outline"}
                                                    className="justify-start"
                                                    onClick={() => {
                                                        setSelectedApp(app);
                                                        setSelectedAction(null);
                                                        setSelectedConnection(null);
                                                    }}
                                                >
                                                    <div 
                                                        className="w-4 h-4 rounded mr-2"
                                                        style={{ backgroundColor: app.color }}
                                                    />
                                                    {app.name}
                                                </Button>
                                            ))}
                                        </div>
                                    </div>

                                    {selectedApp && (
                                        <div>
                                            <Label>Choose Action</Label>
                                            <Select value={selectedAction?.key || ''} onValueChange={(value) => {
                                                const action = selectedApp.actions.find(a => a.key === value);
                                                setSelectedAction(action || null);
                                            }}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select action" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {selectedApp.actions.map((action) => (
                                                        <SelectItem key={action.key} value={action.key}>
                                                            {action.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            {selectedAction && (
                                                <p className="text-sm text-gray-500 mt-1">
                                                    {selectedAction.description}
                                                </p>
                                            )}
                                        </div>
                                    )}

                                    {selectedApp && selectedAction && selectedApp.auth_config.type !== 'none' && (
                                        <div>
                                            <Label>Choose Connection</Label>
                                            <Select value={selectedConnection?.id?.toString() || ''} onValueChange={(value) => {
                                                const connection = connections.find(c => c.id === parseInt(value));
                                                setSelectedConnection(connection || null);
                                                
                                                // Immediately update the step with new connection
                                                if (step && selectedApp && selectedAction) {
                                                    const updatedStep: StepItem = {
                                                        ...step,
                                                        connection: connection || undefined,
                                                        connection_id: connection?.id,
                                                        isConfigured: !!selectedApp && !!selectedAction && (selectedApp.auth_config.type === 'none' || !!connection),
                                                    };
                                                    onUpdate(updatedStep);
                                                }
                                            }}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select connection" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {connections
                                                        .filter(c => c.app_id === selectedApp?.id)
                                                        .map((connection) => (
                                                            <SelectItem key={connection.id} value={connection.id.toString()}>
                                                                {connection.name}
                                                            </SelectItem>
                                                        ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    )}
                                </div>
                            </TabsContent>

                            <TabsContent value="configure" className="space-y-4 mt-4">
                                {selectedAction && (
                                    <div className="space-y-4">
                                        <div>
                                            <h3 className="font-medium mb-3">Configure {selectedAction.name}</h3>
                                            <div className="space-y-4">
                                                {Object.entries(selectedAction.fields).map(([fieldName, field]) => (
                                                        <div key={fieldName}>
                                                            <Label className="flex items-center gap-1">
                                                                {field.label}
                                                                {field.required && <span className="text-red-500">*</span>}
                                                            </Label>
                                                            {field.type === 'select' && field.options ? (
                                                                <Select 
                                                                    value={config[fieldName]?.toString() || ''} 
                                                                    onValueChange={(value: string) => {
                                                                        setConfig(prev => ({ ...prev, [fieldName]: value }));
                                                                    }}
                                                                >
                                                                    <SelectTrigger className="mt-1">
                                                                        <SelectValue placeholder={field.placeholder || `Select ${field.label.toLowerCase()}`} />
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        {Object.entries(field.options).map(([optionKey, optionValue]) => (
                                                                            <SelectItem key={optionKey} value={optionKey}>
                                                                                {String(optionValue)}
                                                                            </SelectItem>
                                                                        ))}
                                                                    </SelectContent>
                                                                </Select>
                                                                                                        ) : field.type === 'textarea' ? (
                                                <AdvancedTemplateEditor
                                                    value={config[fieldName]?.toString() || ''}
                                                    onChange={(value: string) => setConfig(prev => ({ ...prev, [fieldName]: value }))}
                                                    placeholder={field.placeholder}
                                                    context={templateContext}
                                                    multiline={true}
                                                    className="mt-1"
                                                />
                                                                                                    ) : (
                                            <AdvancedTemplateEditor
                                                value={config[fieldName]?.toString() || ''}
                                                onChange={(value: string) => setConfig(prev => ({ ...prev, [fieldName]: value }))}
                                                placeholder={field.placeholder}
                                                context={templateContext}
                                                multiline={false}
                                                className="mt-1"
                                            />
                                        )}
                                                        {field.placeholder && (
                                                            <p className="text-xs text-gray-500 mt-1">{field.placeholder}</p>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </TabsContent>

                            <TabsContent value="test" className="space-y-4 mt-4">
                                <div className="space-y-4">
                                    <div>
                                        <h3 className="font-medium mb-3">Test {selectedAction?.name}</h3>
                                        <p className="text-sm text-gray-600 mb-4">
                                            Test your action configuration to make sure it works as expected.
                                        </p>
                                        
                                        <Button 
                                            onClick={handleTest} 
                                            disabled={!selectedApp || !selectedAction || (selectedApp.auth_config.type !== 'none' && !selectedConnection)}
                                            className="w-full"
                                        >
                                            <Play className="w-4 h-4 mr-2" />
                                            Run Test
                                        </Button>
                                    </div>

                                    {testResults && (
                                        <div className="mt-4 p-4 border rounded-lg">
                                            <div className="flex items-center gap-2 mb-3">
                                                {testResults.success ? (
                                                    <CheckCircle className="w-5 h-5 text-green-600" />
                                                ) : (
                                                    <XCircle className="w-5 h-5 text-red-600" />
                                                )}
                                                <h4 className="font-medium">
                                                    {testResults.success ? 'Test Successful' : 'Test Failed'}
                                                </h4>
                                                <span className="text-xs text-gray-500 ml-auto">
                                                    {testResults.timestamp ? new Date(testResults.timestamp).toLocaleTimeString() : ''}
                                                </span>
                                            </div>
                                            
                                            <p className="text-sm mb-3">{testResults.message}</p>
                                            
                                            {testResults.data && (
                                                <div>
                                                    <h5 className="font-medium text-sm mb-2">Response Data:</h5>
                                                    <pre className="text-xs bg-gray-100 p-3 rounded border overflow-auto max-h-32">
                                                        {JSON.stringify(testResults.data, null, 2)}
                                                    </pre>
                                                </div>
                                            )}
                                            
                                            {testResults.execution_time && (
                                                <p className="text-xs text-gray-500 mt-2">
                                                    Execution time: {testResults.execution_time}ms
                                                </p>
                                            )}
                                            
                                            {testResults.validation_errors && (
                                                <div>
                                                    <h5 className="font-medium text-sm mb-2 text-red-700">Validation Errors:</h5>
                                                    <div className="space-y-2">
                                                        {Object.entries(testResults.validation_errors).map(([field, errors]) => (
                                                            <div key={field} className="bg-red-100 p-2 rounded border">
                                                                <div className="font-medium text-xs text-red-800 capitalize mb-1">
                                                                    {field.replace(/_/g, ' ')}:
                                                                </div>
                                                                <ul className="text-xs text-red-700 list-disc list-inside">
                                                                    {errors.map((error, index) => (
                                                                        <li key={index}>{error}</li>
                                                                    ))}
                                                                </ul>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                            
                                            {testResults.error && !testResults.validation_errors && (
                                                <div>
                                                    <h5 className="font-medium text-sm mb-2 text-red-700">Error Details:</h5>
                                                    <pre className="text-xs bg-red-100 p-3 rounded border overflow-auto max-h-32 text-red-800">
                                                        {typeof testResults.error === 'string' 
                                                            ? testResults.error 
                                                            : JSON.stringify(testResults.error, null, 2)
                                                        }
                                                    </pre>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </TabsContent>
                        </Tabs>
                    )}
                </div>
            </ScrollArea>

            {/* Footer */}
            <div className="p-6 border-t flex justify-end">
                <Button 
                    onClick={handleContinue} 
                    disabled={!canContinue()}
                    className="w-full"
                >
                    {step?.type === 'trigger' ? 'Save Trigger' : 
                     currentStep === 3 ? 'Save' : 'Save and Continue'}
                </Button>
            </div>
        </div>
    );
}

function AutomationCanvas({ 
    steps, 
    editingStepId, 
    onEditStep, 
    onAddStep,
    onAddStepAt,
    onMoveStep,
    hasFloatingPanel
}: {
    steps: StepItem[];
    editingStepId: string | null;
    onEditStep: (step: StepItem) => void;
    onAddStep: () => void;
    onAddStepAt: (afterIndex: number) => void;
    onMoveStep: (activeId: string, overId: string) => void;
    hasFloatingPanel: boolean;
}) {
    const canvasRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [canvasOffset, setCanvasOffset] = useState({ x: 0, y: 0 });

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleMouseDown = (e: React.MouseEvent) => {
        if (e.target === canvasRef.current) {
            setIsDragging(true);
            setDragStart({ x: e.clientX - canvasOffset.x, y: e.clientY - canvasOffset.y });
        }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (isDragging) {
            setCanvasOffset({
                x: e.clientX - dragStart.x,
                y: e.clientY - dragStart.y
            });
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            onMoveStep(active.id as string, over.id as string);
        }
    };

    // Separate trigger and actions
    if (steps.length === 0) {
        return (
            <div className="flex-1 bg-gray-50 flex items-center justify-center">
                <p className="text-gray-500">Loading automation...</p>
            </div>
        );
    }
    
    const trigger = steps[0];
    const actions = steps.slice(1);

    return (
        <div 
            ref={canvasRef}
            className={`flex-1 bg-gray-50 overflow-hidden relative cursor-grab active:cursor-grabbing ${hasFloatingPanel ? 'mr-[500px]' : ''}`}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
        >
            <div 
                className="absolute inset-0 flex justify-center py-8"
                style={{ 
                    transform: `translate(${canvasOffset.x}px, ${canvasOffset.y}px)`,
                    minHeight: '100%'
                }}
            >
                <div className="max-w-sm space-y-10">
                    {/* Trigger (not sortable) */}
                    {trigger && (
                        <TriggerCard
                            step={trigger}
                            index={1}
                            isEditing={editingStepId === trigger.id}
                            onEdit={() => onEditStep(trigger)}
                            onAddAfter={onAddStepAt}
                        />
                    )}

                    {/* Actions (sortable) */}
                    {actions.length > 0 && (
                        <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragEnd={handleDragEnd}
                        >
                            <SortableContext
                                items={actions.map(step => step.id)}
                                strategy={verticalListSortingStrategy}
                            >
                                {actions.map((step, index) => (
                                    <SortableStepCard
                                        key={step.id}
                                        step={step}
                                        index={index + 2} // +2 because trigger is 1, and this is 0-based
                                        isFirst={false}
                                        isLast={index === actions.length - 1}
                                        isEditing={editingStepId === step.id}
                                        onEdit={() => onEditStep(step)}
                                        onAddAfter={onAddStepAt}
                                    />
                                ))}
                            </SortableContext>
                        </DndContext>
                    )}

                    {/* Add step button at the end */}
                    <div className="text-center">
                        <Button onClick={onAddStep} variant="outline" className="w-full h-10">
                            <Plus className="w-4 h-4 mr-2" />
                            Add Step
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}

interface SaveData {
    nodes: Array<{
        id?: number;
        frontend_id: string;
        sequence_id: number;
        type: string;
        arguments: Record<string, unknown>;
        app_id?: number;
        connection_id?: number;
        action_key?: string;
    }>;
    edges: Array<{
        id?: number;
        sequence_id: number;
        from_node_id: string;
        to_node_id: string;
    }>;
    triggers: Array<{
        id?: number;
        frontend_id: string;
        sequence_id: number;
        event_name: string;
        next_node_id?: string;
    }>;
    snapshot: {
        version: number;
        steps: Array<{
            id: string;
            type: 'trigger' | 'action';
            name: string;
            description: string;
            dbId?: number;
            isConfigured: boolean;
            testStatus: 'idle' | 'success' | 'error';
            event_name?: string;
            app_id?: number;
            action_key?: string;
            connection_id?: number;
            arguments?: Record<string, unknown>;
        }>;
        metadata: {
            updated_at: string;
            total_steps: number;
            configured_steps: number;
        };
    };
}

function convertStepsToSaveData(steps: StepItem[], sequenceId: number): SaveData {
    const nodes: SaveData['nodes'] = [];
    const edges: SaveData['edges'] = [];
    const triggers: SaveData['triggers'] = [];
    
    steps.forEach((step, index) => {
        if (step.type === 'trigger') {
            triggers.push({
                id: step.dbId,
                frontend_id: step.id,
                sequence_id: sequenceId,
                event_name: step.event_name || '',
                next_node_id: steps[index + 1]?.id, // Next step in linear sequence
            });
        } else {
            // Skip draft items that haven't been configured
            if (step.id.includes('draft') && !step.isConfigured) {
                return;
            }

            nodes.push({
                id: step.dbId,
                frontend_id: step.id,
                sequence_id: sequenceId,
                type: step.action_key || 'unknown',
                arguments: step.arguments || {},
                app_id: step.app_id,
                connection_id: step.connection_id,
                action_key: step.action_key,
            });

            // Create edge from previous step (linear flow)
            const previousStep = steps[index - 1];
            if (previousStep) {
                edges.push({
                    sequence_id: sequenceId,
                    from_node_id: previousStep.id,
                    to_node_id: step.id,
                });
            }
        }
    });

    return {
        nodes,
        edges,
        triggers,
        snapshot: {
            version: 1,
            steps: steps.map(step => ({
                id: step.id,
                type: step.type,
                name: step.name,
                description: step.description,
                dbId: step.dbId,
                isConfigured: step.isConfigured,
                testStatus: step.testStatus,
                event_name: step.event_name,
                app_id: step.app_id,
                action_key: step.action_key,
                connection_id: step.connection_id,
                arguments: step.arguments,
            })),
            metadata: {
                updated_at: new Date().toISOString(),
                total_steps: steps.length,
                configured_steps: steps.filter(s => s.isConfigured).length,
            },
        },
    };
}

interface WorkflowRun {
    id: string;
    status: 'running' | 'completed' | 'failed' | 'cancelled';
    started_at: string;
    completed_at?: string;
    duration?: number;
    input: Record<string, unknown>;
    output?: Record<string, unknown>;
    error?: string;
    is_test: boolean;
    activities: WorkflowActivity[];
}

interface WorkflowActivity {
    id: string;
    name: string;
    status: 'pending' | 'running' | 'completed' | 'failed';
    input: Record<string, unknown>;
    output?: Record<string, unknown>;
    error?: string;
    started_at?: string;
    completed_at?: string;
    duration?: number;
}

function SavePreviewPanel({ steps, editingStep, sequence }: { 
    steps: StepItem[]; 
    editingStep: StepItem | null;
    sequence: Sequence;
}) {
    const [saveData, setSaveData] = useState<SaveData | null>(null);

    useEffect(() => {
        setSaveData(convertStepsToSaveData(steps, sequence.id));
    }, [steps, sequence.id]);

    if (!saveData) {
        return (
            <div className="p-4">
                <p className="text-sm text-gray-500">Loading...</p>
            </div>
        );
    }

    return (
        <div className="p-4">
            {editingStep && (
                <div className="mb-4 p-2 bg-blue-50 rounded">
                    <p className="text-xs font-medium text-blue-700">Currently Editing:</p>
                    <p className="text-sm text-blue-600">{editingStep.name}</p>
                </div>
            )}
            
            <div className="space-y-4">
                {/* Summary */}
                <div className="bg-gray-50 rounded-lg p-3">
                    <h3 className="text-sm font-medium mb-2">Summary</h3>
                    <div className="space-y-1 text-xs text-gray-600">
                        <div>Total Steps: {saveData.snapshot.metadata.total_steps}</div>
                        <div>Configured: {saveData.snapshot.metadata.configured_steps}</div>
                        <div>Triggers: {saveData.triggers.length}</div>
                        <div>Nodes: {saveData.nodes.length}</div>
                        <div>Edges: {saveData.edges.length}</div>
                    </div>
                </div>

                {/* Triggers */}
                {saveData.triggers.length > 0 && (
                    <div className="bg-gray-50 rounded-lg p-3">
                        <h3 className="text-sm font-medium mb-2">Triggers</h3>
                        <div className="space-y-2">
                            {saveData.triggers.map((trigger, index) => (
                                <div key={index} className="text-xs p-2 bg-white rounded border">
                                    <div className="font-mono text-blue-600">ID: {trigger.frontend_id}</div>
                                    <div>Event: {trigger.event_name || 'Not configured'}</div>
                                    <div>Next: {trigger.next_node_id || 'None'}</div>
                                    <div>DB ID: {trigger.id || 'New'}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Nodes */}
                {saveData.nodes.length > 0 && (
                    <div className="bg-gray-50 rounded-lg p-3">
                        <h3 className="text-sm font-medium mb-2">Nodes</h3>
                        <div className="space-y-2">
                            {saveData.nodes.map((node, index) => (
                                <div key={index} className="text-xs p-2 bg-white rounded border">
                                    <div className="font-mono text-green-600">ID: {node.frontend_id}</div>
                                    <div>Type: {node.type}</div>
                                    <div>App ID: {node.app_id || 'None'}</div>
                                    <div>Connection: {node.connection_id || 'None'}</div>
                                    <div>DB ID: {node.id || 'New'}</div>
                                    {node.arguments && Object.keys(node.arguments).length > 0 && (
                                        <details className="mt-1">
                                            <summary className="cursor-pointer">Config</summary>
                                            <pre className="text-xs bg-gray-100 p-1 rounded mt-1 overflow-auto max-h-20">
                                                {JSON.stringify(node.arguments, null, 2)}
                                            </pre>
                                        </details>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Edges */}
                {saveData.edges.length > 0 && (
                    <div className="bg-gray-50 rounded-lg p-3">
                        <h3 className="text-sm font-medium mb-2">Edges ({saveData.edges.length})</h3>
                        <div className="space-y-1">
                            {saveData.edges.map((edge, index) => (
                                <div key={index} className="text-xs p-2 bg-white rounded border">
                                    <div>{edge.from_node_id} → {edge.to_node_id}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Raw JSON for debugging */}
                <details className="bg-gray-50 rounded-lg p-3">
                    <summary className="text-sm font-medium cursor-pointer">Full Save Data</summary>
                    <pre className="text-xs overflow-auto max-h-96 whitespace-pre-wrap mt-2">
                        {JSON.stringify(saveData, null, 2)}
                    </pre>
                </details>
            </div>
        </div>
    );
}

function PreviousRunsPanel({ sequence }: { sequence: Sequence }) {
    const [workflowRuns, setWorkflowRuns] = useState<WorkflowRun[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedRun, setSelectedRun] = useState<WorkflowRun | null>(null);

    useEffect(() => {
        fetchWorkflowRuns();
    }, [sequence.id]);

    const fetchWorkflowRuns = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`/automation/sequences/${sequence.id}/workflow-runs`);
            setWorkflowRuns(response.data.runs || []);
        } catch (error) {
            console.error('Failed to fetch workflow runs:', error);
            setWorkflowRuns([]);
        } finally {
            setLoading(false);
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'completed':
                return <CheckCircle className="w-4 h-4 text-green-500" />;
            case 'failed':
                return <AlertCircle className="w-4 h-4 text-red-500" />;
            case 'running':
                return <Clock className="w-4 h-4 text-blue-500 animate-spin" />;
            case 'cancelled':
                return <X className="w-4 h-4 text-gray-500" />;
            default:
                return <Clock className="w-4 h-4 text-gray-400" />;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed':
                return 'text-green-600 bg-green-50 border-green-200';
            case 'failed':
                return 'text-red-600 bg-red-50 border-red-200';
            case 'running':
                return 'text-blue-600 bg-blue-50 border-blue-200';
            case 'cancelled':
                return 'text-gray-600 bg-gray-50 border-gray-200';
            default:
                return 'text-gray-600 bg-gray-50 border-gray-200';
        }
    };

    const formatDuration = (ms?: number) => {
        if (!ms) return 'N/A';
        if (ms < 1000) return `${ms}ms`;
        return `${(ms / 1000).toFixed(1)}s`;
    };

    const formatTimestamp = (timestamp: string) => {
        return new Date(timestamp).toLocaleString();
    };

    if (loading) {
        return (
            <div className="p-4">
                <div className="animate-pulse space-y-4">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                </div>
            </div>
        );
    }

    if (selectedRun) {
        return (
            <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-medium text-sm">Workflow Run Details</h3>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedRun(null)}
                    >
                        <X className="w-4 h-4" />
                    </Button>
                </div>

                <div className="space-y-4">
                    {/* Run Summary */}
                    <div className={`p-3 rounded-lg border ${getStatusColor(selectedRun.status)}`}>
                        <div className="flex items-center gap-2 mb-2">
                            {getStatusIcon(selectedRun.status)}
                            <span className="font-medium text-sm capitalize">{selectedRun.status}</span>
                            {selectedRun.is_test && (
                                <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">
                                    Test Run
                                </span>
                            )}
                        </div>
                        <div className="text-xs space-y-1">
                            <div>ID: <span className="font-mono">{selectedRun.id}</span></div>
                            <div>Started: {formatTimestamp(selectedRun.started_at)}</div>
                            {selectedRun.completed_at && (
                                <div>Completed: {formatTimestamp(selectedRun.completed_at)}</div>
                            )}
                            <div>Duration: {formatDuration(selectedRun.duration)}</div>
                        </div>
                    </div>

                    {/* Input */}
                    {selectedRun.input && Object.keys(selectedRun.input).length > 0 && (
                        <div className="bg-gray-50 rounded-lg p-3">
                            <h4 className="text-sm font-medium mb-2">Input</h4>
                            <pre className="text-xs bg-white p-2 rounded border overflow-auto max-h-32">
                                {JSON.stringify(selectedRun.input, null, 2)}
                            </pre>
                        </div>
                    )}

                    {/* Activities */}
                    <div className="bg-gray-50 rounded-lg p-3">
                        <h4 className="text-sm font-medium mb-2">Activities ({selectedRun.activities.length})</h4>
                        <div className="space-y-2">
                            {selectedRun.activities.map((activity, index) => (
                                <div key={activity.id} className="bg-white p-2 rounded border">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="w-5 h-5 bg-gray-100 rounded-full flex items-center justify-center text-xs font-semibold">
                                            {index + 1}
                                        </span>
                                        {getStatusIcon(activity.status)}
                                        <span className="text-sm font-medium">{activity.name}</span>
                                    </div>
                                    <div className="text-xs text-gray-600 ml-7 space-y-1">
                                        <div>Status: <span className="capitalize">{activity.status}</span></div>
                                        {activity.started_at && (
                                            <div>Started: {formatTimestamp(activity.started_at)}</div>
                                        )}
                                        {activity.completed_at && (
                                            <div>Completed: {formatTimestamp(activity.completed_at)}</div>
                                        )}
                                        <div>Duration: {formatDuration(activity.duration)}</div>
                                        
                                        {activity.error && (
                                            <div className="text-red-600 bg-red-50 p-2 rounded mt-2">
                                                <div className="font-medium">Error:</div>
                                                <div className="text-xs">{activity.error}</div>
                                            </div>
                                        )}
                                        
                                        {activity.input && Object.keys(activity.input).length > 0 && (
                                            <details className="mt-2">
                                                <summary className="cursor-pointer text-blue-600">Input</summary>
                                                <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-auto max-h-20">
                                                    {JSON.stringify(activity.input, null, 2)}
                                                </pre>
                                            </details>
                                        )}
                                        
                                        {activity.output && Object.keys(activity.output).length > 0 && (
                                            <details className="mt-2">
                                                <summary className="cursor-pointer text-green-600">Output</summary>
                                                <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-auto max-h-20">
                                                    {JSON.stringify(activity.output, null, 2)}
                                                </pre>
                                            </details>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Output */}
                    {selectedRun.output && Object.keys(selectedRun.output).length > 0 && (
                        <div className="bg-gray-50 rounded-lg p-3">
                            <h4 className="text-sm font-medium mb-2">Final Output</h4>
                            <pre className="text-xs bg-white p-2 rounded border overflow-auto max-h-32">
                                {JSON.stringify(selectedRun.output, null, 2)}
                            </pre>
                        </div>
                    )}

                    {/* Error */}
                    {selectedRun.error && (
                        <div className="bg-red-50 rounded-lg p-3 border border-red-200">
                            <h4 className="text-sm font-medium mb-2 text-red-800">Error</h4>
                            <pre className="text-xs text-red-700 whitespace-pre-wrap">
                                {selectedRun.error}
                            </pre>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="p-4">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium text-sm">Previous Runs</h3>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={fetchWorkflowRuns}
                >
                    Refresh
                </Button>
            </div>

            {workflowRuns.length === 0 ? (
                <div className="text-center py-8">
                    <Clock className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">No workflow runs yet</p>
                    <p className="text-xs text-gray-400 mt-1">
                        Runs will appear here after testing or triggering the automation
                    </p>
                </div>
            ) : (
                <div className="space-y-2">
                    {workflowRuns.map((run) => (
                        <div
                            key={run.id}
                            className="bg-white p-3 rounded-lg border hover:shadow-sm cursor-pointer transition-shadow"
                            onClick={() => setSelectedRun(run)}
                        >
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    {getStatusIcon(run.status)}
                                    <span className="text-sm font-medium capitalize">{run.status}</span>
                                    {run.is_test && (
                                        <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">
                                            Test
                                        </span>
                                    )}
                                </div>
                                <span className="text-xs text-gray-500">
                                    {formatDuration(run.duration)}
                                </span>
                            </div>
                            <div className="text-xs text-gray-600 space-y-1">
                                <div className="font-mono">{run.id}</div>
                                <div>{formatTimestamp(run.started_at)}</div>
                                <div>{run.activities.length} activities</div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

function SidebarWithTabs({ steps, editingStep, sequence }: { 
    steps: StepItem[]; 
    editingStep: StepItem | null;
    sequence: Sequence;
}) {
    return (
        <div className="w-80 bg-white border-r overflow-hidden flex flex-col">
            <Tabs defaultValue="debug" className="flex-1 flex flex-col">
                <TabsList className="grid w-full grid-cols-2 m-4 mb-0">
                    <TabsTrigger value="debug">Debug</TabsTrigger>
                    <TabsTrigger value="runs">Previous Runs</TabsTrigger>
                </TabsList>
                
                <TabsContent value="debug" className="flex-1 overflow-y-auto mt-0">
                    <SavePreviewPanel steps={steps} editingStep={editingStep} sequence={sequence} />
                </TabsContent>
                
                <TabsContent value="runs" className="flex-1 overflow-y-auto mt-0">
                    <PreviousRunsPanel sequence={sequence} />
                </TabsContent>
            </Tabs>
        </div>
    );
}

function AutomationEditorFlow({ sequence, apps, connections }: EditorProps) {
    const [steps, setSteps] = useState<StepItem[]>([]);
    const [editingStep, setEditingStep] = useState<StepItem | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isPublished, setIsPublished] = useState(true);

    useEffect(() => {
        console.log('DEBUG: useEffect triggered with sequence:', sequence);
        console.log('DEBUG: sequence.triggers:', sequence.triggers);
        console.log('DEBUG: sequence.triggers.length:', sequence.triggers.length);
        
        // Convert sequence data to step format
        const allSteps: StepItem[] = [];

        // Add trigger as first step
        if (sequence.triggers.length > 0) {
            const trigger = sequence.triggers[0];
            console.log('DEBUG: Found trigger:', trigger);
            console.log('DEBUG: trigger.id:', trigger.id);
            
            const triggerStep = {
                id: `trigger-${trigger.id || 'existing'}`,
                type: 'trigger' as const,
                name: trigger.event_name || 'Set up trigger',
                description: trigger.event_name ? `Triggers when ${trigger.event_name}` : 'Choose when this automation runs',
                dbId: trigger.id,
                isConfigured: !!trigger.event_name,
                testStatus: 'idle' as const,
                event_name: trigger.event_name,
                position_x: trigger.position_x,
                position_y: trigger.position_y,
            };
            
            console.log('DEBUG: Created trigger step:', triggerStep);
            allSteps.push(triggerStep);
        } else {
            console.log('DEBUG: No triggers found, creating new trigger');
            const newTriggerStep = {
                id: 'trigger-new',
                type: 'trigger' as const,
                name: 'Set up trigger',
                description: 'Choose when this automation runs',
                isConfigured: false,
                testStatus: 'idle' as const,
            };
            console.log('DEBUG: Created new trigger step:', newTriggerStep);
            allSteps.push(newTriggerStep);
        }

        // Add nodes as steps
        sequence.nodes.forEach((node, index) => {
            const app = apps.find(a => a.id === node.app_id);
            const action = app?.actions.find(a => a.key === node.action_key);
            
            allSteps.push({
                id: `action-${node.id}`,
                type: 'action',
                name: action?.name || node.type,
                description: action?.description || `Action step ${index + 1}`,
                dbId: node.id,
                app,
                connection: connections.find(c => c.id === node.connection_id),
                isConfigured: !!(node.app_id && node.action_key),
                testStatus: 'idle',
                app_id: node.app_id,
                action_key: node.action_key,
                connection_id: node.connection_id,
                arguments: node.arguments,
                position_x: node.position_x,
                position_y: node.position_y,
            });
        });

        console.log('DEBUG: Final allSteps array:', allSteps);
        console.log('DEBUG: allSteps[0]:', allSteps[0]);
        console.log('DEBUG: allSteps[0]?.id:', allSteps[0]?.id);
        
        setSteps(allSteps);
    }, [sequence, apps, connections]);

    const handleEditStep = (step: StepItem) => {
        setEditingStep(step);
    };

    const handleCloseEdit = () => {
        setEditingStep(null);
    };

    const handleUpdateStep = async (stepData: StepItem) => {
        console.log('DEBUG: handleUpdateStep called with:', {
            stepId: stepData.id,
            stepName: stepData.name,
            appName: stepData.app?.name,
            actionKey: stepData.action_key,
            dbId: stepData.dbId
        });
        
        // Update local state immediately for responsiveness
        setSteps(currentSteps => {
            const updatedSteps = currentSteps.map(step => {
                if (step.id === stepData.id) {
                    console.log('DEBUG: Found matching step, updating:', step.id);
                    return stepData;
                }
                return step;
            });
            console.log('DEBUG: Updated steps array:', updatedSteps);
            return updatedSteps;
        });

        // Save to backend if we have a real database ID
        if (stepData.dbId && stepData.type === 'action') {
            try {
                console.log('Saving step changes to backend:', {
                    nodeId: stepData.dbId,
                    type: stepData.action_key,
                    arguments: stepData.arguments,
                    app_id: stepData.app_id,
                    connection_id: stepData.connection_id,
                    action_key: stepData.action_key,
                });

                await axios.put(`/automation/sequences/${sequence.id}/nodes/${stepData.dbId}`, {
                    type: stepData.action_key || 'draft_action',
                    arguments: stepData.arguments || {},
                    app_id: stepData.app_id,
                    connection_id: stepData.connection_id,
                    action_key: stepData.action_key,
                });

                console.log('Successfully saved step changes to backend');
            } catch (error) {
                console.error('Failed to save step changes to backend:', error);
                // We could show a toast notification here or add a retry mechanism
            }
        }
    };

    const handleSaveStep = (stepData: StepItem) => {
        setSteps(currentSteps => 
            currentSteps.map(step => 
                step.id === stepData.id ? stepData : step
            )
        );
        // setEditingStep(null); // Close the panel
    };

    const handleAddStep = async () => {
        try {
            // Create draft node in backend immediately
            const response = await axios.post(`/automation/sequences/${sequence.id}/nodes`, {
                type: 'action',
            });

            const nodeData = response.data.node;
            
            // Create step item with real database ID
            const draftAction: StepItem = {
                id: `action-${nodeData.id}`, // Use real DB ID
                type: 'action',
                name: 'New Action',
                description: 'Configure this action',
                dbId: nodeData.id, // Real database ID
                isConfigured: false,
                testStatus: 'idle',
            };

            console.log('Created draft action with real ID:', draftAction);
            setSteps(currentSteps => [...currentSteps, draftAction]);
            setEditingStep(draftAction); // Go directly to 3-step config
        } catch (error) {
            console.error('Failed to create draft action:', error);
            // Fallback to old method if backend fails
            const draftAction: StepItem = {
                id: `action-draft-${Date.now()}`,
                type: 'action',
                name: 'New Action',
                description: 'Configure this action',
                isConfigured: false,
                testStatus: 'idle',
            };
            setSteps(currentSteps => [...currentSteps, draftAction]);
            setEditingStep(draftAction);
        }
    };

    const handleAddStepAt = async (afterIndex: number) => {
        try {
            // Create draft node in backend immediately
            const response = await axios.post(`/automation/sequences/${sequence.id}/nodes`, {
                type: 'action',
                position_after: afterIndex,
            });

            const nodeData = response.data.node;
            
            // Create step item with real database ID
            const draftAction: StepItem = {
                id: `action-${nodeData.id}`, // Use real DB ID
                type: 'action',
                name: 'New Action',
                description: 'Configure this action',
                dbId: nodeData.id, // Real database ID
                isConfigured: false,
                testStatus: 'idle',
            };

            setSteps(currentSteps => {
                const newSteps = [...currentSteps];
                newSteps.splice(afterIndex + 1, 0, draftAction); // afterIndex is 0-based, so +1 to insert after
                return newSteps;
            });

            setEditingStep(draftAction); // Go directly to 3-step config
        } catch (error) {
            console.error('Failed to create draft action:', error);
            // Fallback to old method if backend fails
            const draftAction: StepItem = {
                id: `action-draft-${Date.now()}`,
                type: 'action',
                name: 'New Action',
                description: 'Configure this action',
                isConfigured: false,
                testStatus: 'idle',
            };

            setSteps(currentSteps => {
                const newSteps = [...currentSteps];
                newSteps.splice(afterIndex + 1, 0, draftAction);
                return newSteps;
            });

            setEditingStep(draftAction);
        }
    };

    const handleMoveStep = (activeId: string, overId: string) => {
        const actions = steps.slice(1); // Exclude trigger
        const activeIndex = actions.findIndex(step => step.id === activeId);
        const overIndex = actions.findIndex(step => step.id === overId);

        if (activeIndex !== -1 && overIndex !== -1) {
            const newActions = [...actions];
            const [movedStep] = newActions.splice(activeIndex, 1);
            newActions.splice(overIndex, 0, movedStep);
            
            // Rebuild steps with trigger + reordered actions
            setSteps([steps[0], ...newActions]);
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const saveData = convertStepsToSaveData(steps, sequence.id);
            
            console.log('Saving automation sequence:', saveData);
            
            await axios.put(`/automation/sequences/${sequence.id}`, {
                name: sequence.name,
                description: sequence.description,
                snapshot: saveData.snapshot,
                nodes: saveData.nodes,
                edges: saveData.edges,
                triggers: saveData.triggers,
            });
            
            console.log('Save successful!');
        } catch (error) {
            console.error('Failed to save:', error);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="h-[calc(100vh-56px)] bg-gray-50 flex">
            {/* Main Content */}
            <div className="flex-1 flex flex-col">
                {/* Header */}
                <div className="bg-white border-b px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <h1 className="text-lg font-semibold">{sequence.name}</h1>
                            <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${isPublished ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                                <span className="text-sm text-gray-600">{isPublished ? 'Published' : 'Draft'}</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm">
                                <Play className="w-4 h-4 mr-1" />
                                Test
                            </Button>
                            <Button onClick={handleSave} disabled={isSaving} size="sm">
                                <Save className="w-4 h-4 mr-1" />
                                {isSaving ? 'Saving...' : 'Save'}
                            </Button>
                            <Button size="sm" variant={isPublished ? 'outline' : 'default'} onClick={() => setIsPublished(!isPublished)}>
                                <Power className="w-4 h-4 mr-1" />
                                {isPublished ? 'Turn Off' : 'Publish'}
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Canvas and Config Panel */}
                <div className="flex-1 flex relative">
                    {/* Left Sidebar with Tabs */}
                    <SidebarWithTabs 
                        steps={steps} 
                        editingStep={editingStep} 
                        sequence={sequence} 
                    />
                    
                    <AutomationCanvas
                        steps={steps}
                        editingStepId={editingStep?.id || null}
                        onEditStep={handleEditStep}
                        onAddStep={handleAddStep}
                        onAddStepAt={handleAddStepAt}
                        onMoveStep={handleMoveStep}
                        hasFloatingPanel={!!editingStep}
                    />
                    
                    {/* Floating Config Panel */}
                    {editingStep && (
                        <StepConfigPanel
                            step={editingStep}
                            apps={apps}
                            connections={connections}
                            sequence={sequence}
                            onSave={handleSaveStep}
                            onClose={handleCloseEdit}
                            onUpdate={handleUpdateStep}
                            allSteps={steps}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}

export default function AutomationEditor(props: EditorProps) {
    return (
        <AppAutomationLayout sequence={props.sequence}>
            <>
                <Head title={`Edit ${props.sequence.name}`} />
                <AutomationEditorFlow {...props} />
            </>
        </AppAutomationLayout>
    );
} 