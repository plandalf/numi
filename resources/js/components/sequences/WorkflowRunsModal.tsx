import React, { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Loader2,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  ChevronDown,
  Eye,
  Timer,
  Activity,
  RotateCcw,
  Pause,
  Plus,
  AlertTriangle
} from 'lucide-react';
import axios from 'axios';

interface WorkflowStep {
  id: number;
  node_id: number;
  node_name: string;
  node_type: string;
  status: string;
  started_at: string;
  completed_at: string | null;
  duration_ms: number | null;
  input_data: unknown;
  output_data: unknown;
  raw_response: unknown;
  processed_output: unknown;
  error_message: string | null;
  error_code: string | null;
  retry_count: number;
  debug_info: unknown;
  node: {
    id: number;
    name: string;
    type: string;
    action_key: string;
    app: {
      id: number;
      name: string;
      icon_url?: string;
      color?: string;
    } | null;
  } | null;
}

interface WorkflowRun {
  id: number;
  status: string;
  created_at: string;
  started_at?: string | null;
  finished_at?: string | null;
  arguments?: unknown;
  output?: unknown;
  event?: {
    id: number;
    event_source: string;
    event_data: unknown;
    created_at: string;
  } | null;
  steps?: WorkflowStep[];
  logs?: Array<{
    id: string;
    created_at: string;
    class: string;
    content: unknown;
  }>;
  exceptions?: unknown[];
  summary?: {
    total_steps: number;
    completed_steps: number;
    failed_steps: number;
    total_duration_ms: number;
    avg_step_duration_ms: number;
  };
  // Fields from the list API
  total_steps?: number;
  completed_steps?: number;
  failed_steps?: number;
}

interface WorkflowRunDetailsModalProps {
  open: boolean;
  onClose: () => void;
  workflowId: number | null;
}

interface WorkflowRunsModalProps {
  open: boolean;
  onClose: () => void;
  sequenceId: number;
}

// Helper function to safely stringify data
function safeStringify(data: unknown): string {
  try {
    const result = JSON.stringify(data, null, 2);
    return result !== undefined ? result : 'null';
  } catch {
    return 'Unable to display data';
  }
}

// Helper function to check if data should be displayed
function shouldShowData(data: unknown): boolean {
  return data != null && 
         typeof data === 'object' && 
         Object.keys(data as Record<string, unknown>).length > 0;
}

// Get status color
function getStatusColor(status: string): string {
  switch (status.toLowerCase()) {
    case 'completed':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'failed':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'running':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'pending':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'waiting':
      return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'created':
      return 'bg-indigo-100 text-indigo-800 border-indigo-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
}

// Get status icon
function getStatusIcon(status: string) {
  switch (status.toLowerCase()) {
    case 'completed':
      return <CheckCircle className="h-4 w-4" />;
    case 'failed':
      return <XCircle className="h-4 w-4" />;
    case 'running':
      return <Clock className="h-4 w-4" />;
    case 'pending':
      return <Timer className="h-4 w-4" />;
    case 'waiting':
      return <Pause className="h-4 w-4" />;
    case 'created':
      return <Plus className="h-4 w-4" />;
    default:
      return <Activity className="h-4 w-4" />;
  }
}

// Workflow Run Details Modal
function WorkflowRunDetailsModal({ open, onClose, workflowId }: WorkflowRunDetailsModalProps) {
  const [workflow, setWorkflow] = useState<WorkflowRun | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rerunning, setRerunning] = useState(false);
  const [forceRerunning, setForceRerunning] = useState(false);

  const loadWorkflowDetails = useCallback(async () => {
    if (!workflowId) return;

    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(`/automation/workflows/${workflowId}`);
      setWorkflow(response.data.data);
    } catch (error) {
      console.error('Failed to load workflow details:', error);
      setError('Failed to load workflow details');
    } finally {
      setLoading(false);
    }
  }, [workflowId]);

  useEffect(() => {
    if (open && workflowId) {
      loadWorkflowDetails();
    }
  }, [open, workflowId, loadWorkflowDetails]);

  const handleRerun = async () => {
    if (!workflowId) return;

    try {
      setRerunning(true);
      const response = await axios.post(`/automation/workflows/${workflowId}/rerun`);
      
      if (response.data.success) {
        // Show success message and refresh workflow details
        alert('Workflow rerun started successfully!');
        // Refresh the workflow details to show the updated status
        loadWorkflowDetails();
      } else {
        setError(response.data.message || 'Failed to rerun workflow');
      }
    } catch (error: unknown) {
      console.error('Failed to rerun workflow:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to rerun workflow';
      setError(errorMessage);
    } finally {
      setRerunning(false);
    }
  };

  const handleForceRerun = async () => {
    if (!workflowId) return;

    // Show confirmation dialog for force rerun
    const confirmed = window.confirm(
      'Force rerun will immediately fail the current workflow, clear its progress, and restart it from the beginning. This should only be used for stuck workflows. Are you sure?'
    );
    
    if (!confirmed) return;

    try {
      setForceRerunning(true);
      const response = await axios.post(`/automation/workflows/${workflowId}/force-rerun`);
      
      if (response.data.success) {
        // Show success message and refresh workflow details
        alert('Workflow force rerun started successfully! The workflow has been reset and restarted.');
        // Refresh the workflow details to show the updated status
        loadWorkflowDetails();
      } else {
        setError(response.data.message || 'Failed to force rerun workflow');
      }
    } catch (error) {
      console.error('Failed to force rerun workflow:', error);
      if (axios.isAxiosError(error)) {
        setError(error.response?.data?.message || 'Failed to force rerun workflow');
      } else {
        setError('An unexpected error occurred');
      }
    } finally {
      setForceRerunning(false);
    }
  };

  const handleClose = () => {
    setWorkflow(null);
    setError(null);
    setRerunning(false);
    setForceRerunning(false);
    onClose();
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent variant="full-height" className="max-w-[95vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Activity className="h-5 w-5" />
              <span className="text-lg leading-none font-semibold">Workflow Run Details</span>
              {workflow && (
                <Badge className={getStatusColor(workflow.status)}>
                  {getStatusIcon(workflow.status)}
                  <span className="ml-1">{workflow.status}</span>
                </Badge>
              )}
            </div>
            {workflow && (
              <div className="flex space-x-2">
                {/* Regular Rerun Button - for failed/waiting workflows */}
                {['failed', 'waiting'].includes(workflow.status) && (
                  <Button
                    onClick={handleRerun}
                    disabled={rerunning || forceRerunning}
                    variant="outline"
                    size="sm"
                  >
                    {rerunning ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <RotateCcw className="h-4 w-4 mr-2" />
                    )}
                    {rerunning ? 'Rerunning...' : 'Rerun Workflow'}
                  </Button>
                )}
                
                {/* Force Rerun Button - for pending/running workflows */}
                {['pending', 'running'].includes(workflow.status) && (
                  <Button
                    onClick={handleForceRerun}
                    disabled={rerunning || forceRerunning}
                    variant="outline"
                    size="sm"
                    className="border-orange-300 text-orange-700 hover:bg-orange-50"
                  >
                    {forceRerunning ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 mr-2" />
                    )}
                    {forceRerunning ? 'Force Rerunning...' : 'Force Rerun'}
                  </Button>
                )}
              </div>
            )}
          </div>
          <DialogDescription>
            View detailed execution information, step outputs, and logs
          </DialogDescription>
        </DialogHeader>

        {loading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2 text-sm text-gray-600">Loading workflow details...</span>
          </div>
        )}

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-4 w-4 text-red-500" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        )}

        {workflow && (
          <div className="space-y-6 max-w-full overflow-hidden">
            {/* Summary */}
            <div>
              <CardContent className="p-4">
                <h3 className="font-medium mb-4">Execution Summary</h3>
                
                {/* Timing Information */}
                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                    <div>
                      <p className="text-gray-500 text-xs">Started</p>
                      <p className="font-medium">{new Date(workflow.created_at).toLocaleString()}</p>
                    </div>
                    {workflow.finished_at && (
                      <div>
                        <p className="text-gray-500 text-xs">Finished</p>
                        <p className="font-medium">{new Date(workflow.finished_at).toLocaleString()}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-gray-500 text-xs">Total Duration</p>
                      <p className="font-medium">
                        {workflow.summary?.total_duration_ms 
                          ? `${(workflow.summary.total_duration_ms / 1000).toFixed(2)}s`
                          : workflow.finished_at 
                            ? `${((new Date(workflow.finished_at).getTime() - new Date(workflow.created_at).getTime()) / 1000).toFixed(2)}s`
                            : 'Running...'
                        }
                      </p>
                    </div>
                  </div>
                </div>

                {/* Step Statistics */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <p className="text-blue-600 font-medium text-lg">{workflow.summary?.total_steps || 0}</p>
                    <p className="text-blue-700 text-xs">Total Steps</p>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <p className="text-green-600 font-medium text-lg">{workflow.summary?.completed_steps || 0}</p>
                    <p className="text-green-700 text-xs">Completed</p>
                  </div>
                  <div className="text-center p-3 bg-red-50 rounded-lg">
                    <p className="text-red-600 font-medium text-lg">{workflow.summary?.failed_steps || 0}</p>
                    <p className="text-red-700 text-xs">Failed</p>
                  </div>
                  <div className="text-center p-3 bg-yellow-50 rounded-lg">
                    <p className="text-yellow-600 font-medium text-lg">
                      {workflow.summary?.avg_step_duration_ms 
                        ? `${(workflow.summary.avg_step_duration_ms / 1000).toFixed(2)}s`
                        : '0s'
                      }
                    </p>
                    <p className="text-yellow-700 text-xs">Avg Step Duration</p>
                  </div>
                </div>

                {/* Status and Progress */}
                {(workflow.summary?.total_steps || 0) > 0 && (
                  <div className="mt-4">
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                      <span>Progress</span>
                      <span>
                        {workflow.summary?.completed_steps || 0} / {workflow.summary?.total_steps || 0} steps
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-300 ${
                          workflow.status === 'failed' ? 'bg-red-500' :
                          workflow.status === 'completed' ? 'bg-green-500' : 'bg-blue-500'
                        }`}
                        style={{ 
                          width: `${((workflow.summary?.completed_steps || 0) / (workflow.summary?.total_steps || 1)) * 100}%` 
                        }}
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </div>

            <Tabs defaultValue="steps" className="w-full overflow-hidden">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="steps">Steps</TabsTrigger>
                <TabsTrigger value="trigger">Trigger Event</TabsTrigger>
                <TabsTrigger value="logs">Logs</TabsTrigger>
                <TabsTrigger value="output">Final Output</TabsTrigger>
              </TabsList>

              {/* Steps Tab */}
              <TabsContent value="steps" className="space-y-4 overflow-hidden">
                {workflow.steps?.map((step, index) => (
                  <Card key={step.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 text-sm font-medium">
                            {index + 1}
                          </div>
                          <div>
                            <h4 className="font-medium">{step.node_name}</h4>
                            <p className="text-sm text-gray-500">
                              {step.node?.app?.name} • {step.node?.action_key || step.node_type}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge className={getStatusColor(step.status)}>
                            {getStatusIcon(step.status)}
                            <span className="ml-1">{step.status}</span>
                          </Badge>
                          {step.duration_ms && (
                            <span className="text-xs text-gray-500">{step.duration_ms}ms</span>
                          )}
                        </div>
                      </div>

                      {step.error_message && (
                        <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                          <strong>Error:</strong> {step.error_message}
                          {step.error_code && <span className="ml-2 text-xs">({step.error_code})</span>}
                        </div>
                      )}

                      <div className="space-y-3">
                        {/* Input Data */}
                        {shouldShowData(step.input_data) && (
                          <details className="group">
                            <summary className="cursor-pointer text-sm font-medium text-gray-600 hover:text-gray-900 flex items-center space-x-1">
                              <ChevronDown className="h-3 w-3 transition-transform group-open:rotate-180" />
                              <span>Input Data</span>
                            </summary>
                            <div className="mt-2 bg-gray-50 rounded p-3 border overflow-hidden">
                              <pre className="text-xs overflow-auto max-h-32 whitespace-pre-wrap break-words">
                                {safeStringify(step.input_data)}
                              </pre>
                            </div>
                          </details>
                        )}

                        {/* Output Data */}
                        {shouldShowData(step.output_data) && (
                          <details className="group">
                            <summary className="cursor-pointer text-sm font-medium text-gray-600 hover:text-gray-900 flex items-center space-x-1">
                              <ChevronDown className="h-3 w-3 transition-transform group-open:rotate-180" />
                              <span>Output Data</span>
                            </summary>
                            <div className="mt-2 bg-green-50 rounded p-3 border overflow-hidden">
                              <pre className="text-xs overflow-auto max-h-32 whitespace-pre-wrap break-words">
                                {safeStringify(step.output_data)}
                              </pre>
                            </div>
                          </details>
                        )}

                        {/* Raw Response */}
                        {shouldShowData(step.raw_response) && (
                          <details className="group">
                            <summary className="cursor-pointer text-sm font-medium text-gray-600 hover:text-gray-900 flex items-center space-x-1">
                              <ChevronDown className="h-3 w-3 transition-transform group-open:rotate-180" />
                              <span>Raw Response</span>
                            </summary>
                            <div className="mt-2 bg-blue-50 rounded p-3 border overflow-hidden">
                              <pre className="text-xs overflow-auto max-h-32 whitespace-pre-wrap break-words">
                                {safeStringify(step.raw_response)}
                              </pre>
                            </div>
                          </details>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>

              {/* Trigger Event Tab */}
              <TabsContent value="trigger" className="overflow-hidden">
                <Card>
                  <CardContent className="p-4">
                    {workflow.event ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-gray-500">Event Source</p>
                            <p className="font-medium">{workflow.event.event_source}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Event Time</p>
                            <p className="font-medium">{new Date(workflow.event.created_at).toLocaleString()}</p>
                          </div>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-2">Event Data</p>
                          <div className="bg-gray-50 rounded p-3 border overflow-hidden">
                            <pre className="text-xs overflow-auto max-h-48 whitespace-pre-wrap break-words">
                              {safeStringify(workflow.event.event_data)}
                            </pre>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-gray-500">No trigger event data available</p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Logs Tab */}
              <TabsContent value="logs" className="overflow-hidden">
                <Card>
                  <CardContent className="p-4 overflow-hidden">
                    {workflow.logs && workflow.logs.length > 0 ? (
                      <div className="space-y-2">
                        {workflow.logs.map((log, index) => (
                          <div key={log.id || index} className="border-l-2 border-gray-200 pl-3">
                            <div className="text-xs text-gray-500">{new Date(log.created_at).toLocaleString()}</div>
                            <div className="text-sm font-medium">{log.class}</div>
                            {log.content != null && (
                              <div className="mt-1 bg-gray-50 rounded p-2 overflow-hidden">
                                <pre className="text-xs overflow-auto whitespace-pre-wrap break-words max-w-full">{safeStringify(log.content)}</pre>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500">No logs available</p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Final Output Tab */}
              <TabsContent value="output" className="overflow-hidden">
                <Card>
                  <CardContent className="p-4">
                    {workflow.output ? (
                      <div className="bg-gray-50 rounded p-3 border overflow-hidden">
                        <pre className="text-xs overflow-auto max-h-64 whitespace-pre-wrap break-words">
                          {safeStringify(workflow.output)}
                        </pre>
                      </div>
                    ) : (
                      <p className="text-gray-500">No final output available</p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// Main Workflow Runs Modal
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function WorkflowRunsModal({ open, onClose, sequenceId }: WorkflowRunsModalProps) {
  const [workflows, setWorkflows] = useState<WorkflowRun[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<number | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const loadWorkflows = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get('/automation/workflows', {
        params: { sequence_id: sequenceId, limit: 50 }
      });
      setWorkflows(response.data.data);
    } catch (error) {
      console.error('Failed to load workflows:', error);
      setError('Failed to load workflow runs');
    } finally {
      setLoading(false);
    }
  }, [sequenceId]);

  useEffect(() => {
    if (open && sequenceId) {
      loadWorkflows();
    }
  }, [open, sequenceId, loadWorkflows]);

  const handleViewDetails = (workflowId: number) => {
    setSelectedWorkflowId(workflowId);
    setShowDetailsModal(true);
  };

  const handleCloseDetailsModal = () => {
    setShowDetailsModal(false);
    setSelectedWorkflowId(null);
  };



  return (
    <>
      <div className="px-6">
        <div className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="mb-4">
            <div className="flex items-center space-x-2">
              <Activity className="h-5 w-5" />
              <span>Workflow Runs</span>
            </div>
            <div>
              View all workflow executions and their detailed step outputs
            </div>
          </div>

          {loading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="ml-2 text-sm text-gray-600">Loading workflow runs...</span>
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-4 w-4 text-red-500" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          )}

          {!loading && !error && (
            <div className="divide-y border-y mb-12">
              {workflows.length === 0 ? (
                <div className="text-center py-2 text-gray-500">
                  <Activity className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium">No workflow runs yet</p>
                  <p className="text-sm">Workflow runs will appear here once triggers fire</p>
                </div>
              ) : (
                workflows.map((workflow) => (
                  <div key={workflow.id} className="border-x">
                    <CardContent className="p-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Badge className={getStatusColor(workflow.status)}>
                            {getStatusIcon(workflow.status)}
                            <span className="ml-1">{workflow.status}</span>
                          </Badge>
                          <div>
                            <p className="font-medium">Run #{workflow.id}</p>
                            <p className="text-sm text-gray-500">
                              {new Date(workflow.created_at).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="text-right text-sm">
                            <p className="text-gray-500">
                              {workflow.completed_steps}/{workflow.total_steps} steps
                            </p>
                            {(workflow.failed_steps || 0) > 0 && (
                              <p className="text-red-600">{workflow.failed_steps} failed</p>
                            )}
                          </div>
                          <Button
                            onClick={() => handleViewDetails(workflow.id)}
                            variant="outline"
                            size="sm"
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View Details
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      <WorkflowRunDetailsModal
        open={showDetailsModal}
        onClose={handleCloseDetailsModal}
        workflowId={selectedWorkflowId}
      />
    </>
  );
}
