import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Loader2,
  AlertCircle,
  CheckCircle,
  Clock,
  Play,
  XCircle,
  ChevronDown,
  Eye,
  Calendar,
  Timer,
  Activity
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
  input_data: any;
  output_data: any;
  raw_response: any;
  processed_output: any;
  error_message: string | null;
  error_code: string | null;
  retry_count: number;
  debug_info: any;
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
  started_at: string | null;
  finished_at: string | null;
  arguments: any;
  output: any;
  event: {
    id: number;
    event_source: string;
    event_data: any;
    created_at: string;
  } | null;
  steps: WorkflowStep[];
  logs: any[];
  exceptions: any[];
  summary: {
    total_steps: number;
    completed_steps: number;
    failed_steps: number;
    total_duration_ms: number;
    avg_step_duration_ms: number;
  };
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
    default:
      return <Activity className="h-4 w-4" />;
  }
}

// Workflow Run Details Modal
function WorkflowRunDetailsModal({ open, onClose, workflowId }: WorkflowRunDetailsModalProps) {
  const [workflow, setWorkflow] = useState<WorkflowRun | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && workflowId) {
      loadWorkflowDetails();
    }
  }, [open, workflowId]);

  const loadWorkflowDetails = async () => {
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
  };

  const handleClose = () => {
    setWorkflow(null);
    setError(null);
    onClose();
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose} variant={"full-height"}>
      <DialogContent className="w-full max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Activity className="h-5 w-5" />
            <span>Workflow Run Details</span>
            {workflow && (
              <Badge className={getStatusColor(workflow.status)}>
                {getStatusIcon(workflow.status)}
                <span className="ml-1">{workflow.status}</span>
              </Badge>
            )}
          </DialogTitle>
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
          <div className="space-y-6 max-w-full">
            {/* Summary */}
            <div>
              <CardContent className="p-4">
                <h3 className="font-medium mb-3">Execution Summary</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Total Steps</p>
                    <p className="font-medium">{workflow.summary.total_steps}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Completed</p>
                    <p className="font-medium text-green-600">{workflow.summary.completed_steps}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Failed</p>
                    <p className="font-medium text-red-600">{workflow.summary.failed_steps}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Total Duration</p>
                    <p className="font-medium">{workflow.summary.total_duration_ms}ms</p>
                  </div>
                </div>
                <div className="mt-3 text-xs text-gray-500">
                  Started: {new Date(workflow.created_at).toLocaleString()} •
                  {workflow.finished_at && ` Finished: ${new Date(workflow.finished_at).toLocaleString()}`}
                </div>
              </CardContent>
            </div>

            <Tabs defaultValue="steps" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="steps">Steps</TabsTrigger>
                <TabsTrigger value="trigger">Trigger Event</TabsTrigger>
                <TabsTrigger value="logs">Logs</TabsTrigger>
                <TabsTrigger value="output">Final Output</TabsTrigger>
              </TabsList>

              {/* Steps Tab */}
              <TabsContent value="steps" className="space-y-4">
                {workflow.steps.map((step, index) => (
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
                        {step.input_data && Object.keys(step.input_data).length > 0 && (
                          <details className="group">
                            <summary className="cursor-pointer text-sm font-medium text-gray-600 hover:text-gray-900 flex items-center space-x-1">
                              <ChevronDown className="h-3 w-3 transition-transform group-open:rotate-180" />
                              <span>Input Data</span>
                            </summary>
                            <div className="mt-2 bg-gray-50 rounded p-3 border">
                              <pre className="text-xs overflow-auto max-h-32">
                                {safeStringify(step.input_data)}
                              </pre>
                            </div>
                          </details>
                        )}

                        {/* Output Data */}
                        {step.output_data && Object.keys(step.output_data).length > 0 && (
                          <details className="group">
                            <summary className="cursor-pointer text-sm font-medium text-gray-600 hover:text-gray-900 flex items-center space-x-1">
                              <ChevronDown className="h-3 w-3 transition-transform group-open:rotate-180" />
                              <span>Output Data</span>
                            </summary>
                            <div className="mt-2 bg-green-50 rounded p-3 border">
                              <pre className="text-xs overflow-auto max-h-32">
                                {safeStringify(step.output_data)}
                              </pre>
                            </div>
                          </details>
                        )}

                        {/* Raw Response */}
                        {step.raw_response && Object.keys(step.raw_response).length > 0 && (
                          <details className="group">
                            <summary className="cursor-pointer text-sm font-medium text-gray-600 hover:text-gray-900 flex items-center space-x-1">
                              <ChevronDown className="h-3 w-3 transition-transform group-open:rotate-180" />
                              <span>Raw Response</span>
                            </summary>
                            <div className="mt-2 bg-blue-50 rounded p-3 border">
                              <pre className="text-xs overflow-auto max-h-32">
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
              <TabsContent value="trigger">
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
                          <div className="bg-gray-50 rounded p-3 border">
                            <pre className="text-xs overflow-auto max-h-48">
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
              <TabsContent value="logs" className="w-full border">
                <Card>
                  <CardContent className="p-4 overflow-scroll">
                    {workflow.logs.length > 0 ? (
                      <div className="space-y-2">
                        {workflow.logs.map((log, index) => (
                          <div key={log.id || index} className="border-l-2 border-gray-200 pl-3">
                            <div className="text-xs text-gray-500">{new Date(log.created_at).toLocaleString()}</div>
                            <div className="text-sm font-medium">{log.class}</div>
                            {log.content && (
                              <div className="mt-1 bg-gray-50 rounded p-2 whitespace-pre-wrap text-wrap">
                                <pre className="text-xs overflow-auto ">{safeStringify(log.content)}</pre>
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
              <TabsContent value="output">
                <Card>
                  <CardContent className="p-4">
                    {workflow.output ? (
                      <div className="bg-gray-50 rounded p-3 border">
                        <pre className="text-xs overflow-auto max-h-64">
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
export function WorkflowRunsModal({ open, onClose, sequenceId }: WorkflowRunsModalProps) {
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<number | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  useEffect(() => {
    if (open && sequenceId) {
      loadWorkflows();
    }
  }, [open, sequenceId]);

  const loadWorkflows = async () => {
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
  };

  const handleViewDetails = (workflowId: number) => {
    setSelectedWorkflowId(workflowId);
    setShowDetailsModal(true);
  };

  const handleCloseDetailsModal = () => {
    setShowDetailsModal(false);
    setSelectedWorkflowId(null);
  };

  const handleClose = () => {
    setWorkflows([]);
    setError(null);
    onClose();
  };

  return (
    <>
      <div className="px-6" open={open} onOpenChange={handleClose}>
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
                            {workflow.failed_steps > 0 && (
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
