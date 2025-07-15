import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle, AlertCircle, Mail, Webhook, Clock, Play, Copy, Info } from 'lucide-react';
import axios from 'axios';

interface Action {
  id: number;
  name: string;
  type: string;
  arguments?: Record<string, unknown>;
}

interface TestActionModalProps {
  open: boolean;
  onClose: () => void;
  action: Action;
  sequenceId: number;
  allActions?: Action[];
}

interface TestResult {
  success: boolean;
  message: string;
  data?: Record<string, unknown>;
  error?: string;
}

export function TestActionModal({ open, onClose, action, sequenceId, allActions = [] }: TestActionModalProps) {
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);

  const getActionIcon = (type: string) => {
    switch (type) {
      case 'email':
        return Mail;
      case 'webhook':
        return Webhook;
      case 'delay':
        return Clock;
      default:
        return Play;
    }
  };

  const getActionColor = (type: string) => {
    switch (type) {
      case 'email':
        return '#dc2626';
      case 'webhook':
        return '#7c3aed';
      case 'delay':
        return '#059669';
      default:
        return '#6b7280';
    }
  };

  const getPreviousActions = () => {
    // Get actions that come before the current action
    const currentIndex = allActions.findIndex(a => a.id === action.id);
    return currentIndex > 0 ? allActions.slice(0, currentIndex) : [];
  };

  const getStepVariables = () => {
    const previousActions = getPreviousActions();
    const stepVariables: Array<{
      action: Action;
      variables: Array<{ code: string; description: string; sampleValue: string }>;
    }> = [];

    previousActions.forEach((prevAction) => {
      const variables: Array<{ code: string; description: string; sampleValue: string }> = [];
      
      switch (prevAction.type) {
        case 'email':
          variables.push(
            { code: `{{${prevAction.id}__sent_at}}`, description: 'When the email was sent', sampleValue: '2024-01-15T10:30:00Z' },
            { code: `{{${prevAction.id}__recipient}}`, description: 'Email recipient address', sampleValue: 'user@example.com' },
            { code: `{{${prevAction.id}__subject}}`, description: 'Email subject line', sampleValue: 'Welcome to our course!' },
            { code: `{{${prevAction.id}__message_id}}`, description: 'Email service message ID', sampleValue: 'msg_12345' },
            { code: `{{${prevAction.id}__status}}`, description: 'Email delivery status', sampleValue: 'sent' }
          );
          break;
        case 'webhook':
          variables.push(
            { code: `{{${prevAction.id}__response_status}}`, description: 'HTTP response status code', sampleValue: '200' },
            { code: `{{${prevAction.id}__response_body}}`, description: 'Response body from webhook', sampleValue: '{"success": true, "id": "abc123"}' },
            { code: `{{${prevAction.id}__response_id}}`, description: 'Response ID from webhook', sampleValue: 'abc123' },
            { code: `{{${prevAction.id}__sent_at}}`, description: 'When the webhook was sent', sampleValue: '2024-01-15T10:30:00Z' },
            { code: `{{${prevAction.id}__url}}`, description: 'Webhook URL that was called', sampleValue: 'https://api.example.com/webhook' }
          );
          break;
        case 'delay':
          variables.push(
            { code: `{{${prevAction.id}__started_at}}`, description: 'When the delay started', sampleValue: '2024-01-15T10:30:00Z' },
            { code: `{{${prevAction.id}__completed_at}}`, description: 'When the delay completed', sampleValue: '2024-01-15T10:35:00Z' },
            { code: `{{${prevAction.id}__duration}}`, description: 'Duration of the delay', sampleValue: '5 minutes' },
            { code: `{{${prevAction.id}__duration_seconds}}`, description: 'Duration in seconds', sampleValue: '300' }
          );
          break;
      }

      if (variables.length > 0) {
        stepVariables.push({ action: prevAction, variables });
      }
    });

    return stepVariables;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      // Could show a toast notification here
    });
  };

  const getTestDescription = () => {
    switch (action.type) {
      case 'email':
        return 'This will send a real test email using the configured recipients, subject, and body. Template variables will be filled with sample data.';
      case 'webhook':
        return 'This will send a real HTTP request to the configured webhook URL with sample data.';
      case 'delay':
        return 'This will validate the delay configuration and show timing information.';
      default:
        return 'This will test the action using its current configuration.';
    }
  };

  const testAction = async () => {
    setTesting(true);
    setTestResult(null);

    try {
      const response = await axios.post(`/sequences/${sequenceId}/actions/${action.id}/test`);

      setTestResult({
        success: true,
        message: response.data.message || 'Test completed successfully',
        data: response.data.data || {}
      });
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string; error?: string } }; message?: string };
      setTestResult({
        success: false,
        message: axiosError.response?.data?.message || 'Test failed',
        error: axiosError.response?.data?.error || axiosError.message || 'Unknown error occurred'
      });
    } finally {
      setTesting(false);
    }
  };

  const handleClose = () => {
    setTestResult(null);
    onClose();
  };
  const ActionIcon = getActionIcon(action.type);
  const actionColor = getActionColor(action.type);
  const stepVariables = getStepVariables();

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <div 
              className="w-6 h-6 rounded flex items-center justify-center text-white"
              style={{ backgroundColor: actionColor }}
            >
              <ActionIcon className="h-3 w-3" />
            </div>
            <span>Test Action: {action.name}</span>
          </DialogTitle>
          <DialogDescription>
            Test this action with sample data to verify it works correctly
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="configure" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="configure">Test Configuration</TabsTrigger>
            <TabsTrigger value="variables">Template Variables</TabsTrigger>
            <TabsTrigger value="results">Test Results</TabsTrigger>
          </TabsList>
          
          <TabsContent value="configure" className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Action Configuration</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-blue-700">Type:</span>
                  <span className="font-mono text-blue-800 capitalize">{action.type}</span>
                </div>
                {action.arguments && Object.entries(action.arguments).slice(0, 3).map(([key, value]) => (
                  <div key={key} className="flex justify-between">
                    <span className="text-blue-700 capitalize">{key.replace(/_/g, ' ')}:</span>
                    <span className="font-mono text-blue-800 truncate max-w-xs">
                      {typeof value === 'string' ? value : JSON.stringify(value)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
              <div className="flex items-start space-x-2">
                <Info className="h-5 w-5 text-amber-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-amber-900">Test Action</h4>
                  <p className="text-sm text-amber-700 mt-1">
                    {getTestDescription()}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex space-x-2">
              <Button onClick={handleClose} variant="outline" className="flex-1">
                Cancel
              </Button>
              <Button
                onClick={testAction}
                disabled={testing}
                className="flex-1"
              >
                {testing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Testing...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Run Test
                  </>
                )}
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="variables" className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-start space-x-2">
                <Info className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-blue-900">Template Variables</h4>
                  <p className="text-sm text-blue-700 mt-1">
                    Use these variables to make your actions dynamic. They will be replaced with actual values when the workflow runs.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              {/* Trigger Variables */}
              <div>
                <h5 className="font-medium text-sm mb-3">Trigger Variables</h5>
                <div className="space-y-2">
                  {[
                    { code: '{{trigger.member_email}}', description: 'Customer email address', sample: 'john@example.com' },
                    { code: '{{trigger.member_name}}', description: 'Customer full name', sample: 'John Doe' },
                    { code: '{{trigger.product_name}}', description: 'Product name from order', sample: 'Premium Course' },
                    { code: '{{trigger.order_id}}', description: 'Unique order identifier', sample: 'ORDER-123' },
                    { code: '{{trigger.amount}}', description: 'Order amount in cents', sample: '9999' }
                  ].map((variable) => (
                    <div key={variable.code} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <code className="text-blue-600 font-mono text-sm">{variable.code}</code>
                          <Button
                            onClick={() => copyToClipboard(variable.code)}
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0"
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                        <p className="text-xs text-gray-600 mt-1">{variable.description}</p>
                        <p className="text-xs text-gray-500 mt-1">Sample: {variable.sample}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Step Variables from Previous Actions */}
              {stepVariables.length > 0 && (
                <div>
                  <h5 className="font-medium text-sm mb-3">Previous Action Outputs</h5>
                  <div className="space-y-4">
                    {stepVariables.map(({ action: prevAction, variables }) => {
                      const PrevActionIcon = getActionIcon(prevAction.type);
                      return (
                        <div key={prevAction.id} className="border rounded-lg p-4">
                          <div className="flex items-center space-x-2 mb-3">
                            <div 
                              className="w-5 h-5 rounded flex items-center justify-center text-white"
                              style={{ backgroundColor: getActionColor(prevAction.type) }}
                            >
                              <PrevActionIcon className="h-3 w-3" />
                            </div>
                            <h6 className="font-medium text-sm">{prevAction.name}</h6>
                            <span className="text-xs text-gray-500 capitalize">({prevAction.type})</span>
                          </div>
                          <div className="space-y-2">
                            {variables.map((variable) => (
                              <div key={variable.code} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                <div className="flex-1">
                                  <div className="flex items-center space-x-2">
                                    <code className="text-purple-600 font-mono text-sm">{variable.code}</code>
                                    <Button
                                      onClick={() => copyToClipboard(variable.code)}
                                      size="sm"
                                      variant="ghost"
                                      className="h-6 w-6 p-0"
                                    >
                                      <Copy className="h-3 w-3" />
                                    </Button>
                                  </div>
                                  <p className="text-xs text-gray-600 mt-1">{variable.description}</p>
                                  <p className="text-xs text-gray-500 mt-1">Sample: {variable.sampleValue}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {stepVariables.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <AlertCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No previous actions found</p>
                  <p className="text-sm">Add actions before this one to use their outputs as variables.</p>
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="results" className="space-y-4">
            {testResult ? (
              <div className="space-y-4">
                <Alert className={testResult.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
                  <div className="flex items-center">
                    {testResult.success ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-red-600" />
                    )}
                    <div className="ml-2">
                      <h4 className={`font-medium ${testResult.success ? 'text-green-800' : 'text-red-800'}`}>
                        {testResult.success ? 'Test Passed' : 'Test Failed'}
                      </h4>
                      <AlertDescription className={testResult.success ? 'text-green-700' : 'text-red-700'}>
                        {testResult.message}
                      </AlertDescription>
                    </div>
                  </div>
                </Alert>

                {testResult.data && Object.keys(testResult.data).length > 0 && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium mb-2">Test Results</h4>
                    <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                      {JSON.stringify(testResult.data, null, 2)}
                    </pre>
                  </div>
                )}

                {testResult.error && (
                  <div className="bg-red-50 p-4 rounded-lg">
                    <h4 className="font-medium text-red-800 mb-2">Error Details</h4>
                    <p className="text-sm text-red-700">{testResult.error}</p>
                  </div>
                )}

                <div className="flex space-x-2">
                  <Button 
                    onClick={() => setTestResult(null)} 
                    variant="outline" 
                    className="flex-1"
                  >
                    Run Another Test
                  </Button>
                  <Button onClick={handleClose} className="flex-1">
                    Close
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <AlertCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No test results yet.</p>
                <p className="text-sm">Configure and run a test to see results here.</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
} 