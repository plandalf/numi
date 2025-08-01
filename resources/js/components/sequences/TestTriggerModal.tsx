import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle, AlertCircle, Zap, Webhook, Info } from 'lucide-react';
import axios from 'axios';

interface Trigger {
  id: number;
  name: string;
  type: string;
  trigger_type: string;
  trigger_uuid: string;
  integration?: {
    id: number;
    type: string;
    name: string;
  };
}

interface TestTriggerModalProps {
  open: boolean;
  onClose: () => void;
  trigger: Trigger;
  sequenceId: number;
}

interface TestResult {
  success: boolean;
  message: string;
  data?: Record<string, unknown>;
  source?: Record<string, unknown>;
  error?: string;
}

export function TestTriggerModal({ open, onClose, trigger, sequenceId }: TestTriggerModalProps) {
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);

  const getTriggerIcon = (type: string) => {
    switch (type) {
      case 'webhook':
        return Webhook;
      default:
        return Zap;
    }
  };

  const getTriggerColor = (type: string) => {
    switch (type) {
      case 'webhook':
        return '#7c3aed';
      default:
        return '#059669';
    }
  };

  const getTestDescription = () => {
    if (trigger.trigger_type === 'webhook') {
      return 'This will generate sample webhook data to show what the trigger would receive.';
    }
    
    return `This will fetch real data from your ${trigger.integration?.name || 'integration'} to test the trigger.`;
  };

  const testTrigger = async () => {
    setTesting(true);
    setTestResult(null);

    try {
      const response = await axios.post(`/sequences/${sequenceId}/triggers/${trigger.id}/test`);

      setTestResult({
        success: true,
        message: response.data.message || 'Test completed successfully',
        data: response.data.data || {},
        source: response.data.source || null
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

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      // Could show a toast notification here
    });
  };

  const TriggerIcon = getTriggerIcon(trigger.trigger_type);
  const triggerColor = getTriggerColor(trigger.trigger_type);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <div 
              className="w-6 h-6 rounded flex items-center justify-center text-white"
              style={{ backgroundColor: triggerColor }}
            >
              <TriggerIcon className="h-3 w-3" />
            </div>
            <span>Test Trigger: {trigger.name}</span>
          </DialogTitle>
          <DialogDescription>
            Test this trigger to see what data it would receive
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="configure" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="configure">Test Configuration</TabsTrigger>
            <TabsTrigger value="results">Test Results</TabsTrigger>
          </TabsList>
          
          <TabsContent value="configure" className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Trigger Configuration</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-blue-700">Type:</span>
                  <span className="font-mono text-blue-800 capitalize">{trigger.trigger_type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-700">Trigger ID:</span>
                  <span className="font-mono text-blue-800">{trigger.trigger_uuid}</span>
                </div>
                {trigger.integration && (
                  <div className="flex justify-between">
                    <span className="text-blue-700">Integration:</span>
                    <span className="font-mono text-blue-800">{trigger.integration.name}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
              <div className="flex items-start space-x-2">
                <Info className="h-5 w-5 text-amber-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-amber-900">Test Trigger</h4>
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
                onClick={testTrigger}
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
                    <Zap className="h-4 w-4 mr-2" />
                    Test Trigger
                  </>
                )}
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="results" className="space-y-4">
            {testResult ? (
              <div className="space-y-4">
                {testResult.success ? (
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      {testResult.message}
                    </AlertDescription>
                  </Alert>
                ) : (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      {testResult.message}
                      {testResult.error && (
                        <div className="mt-2 text-sm">
                          <strong>Error:</strong> {testResult.error}
                        </div>
                      )}
                    </AlertDescription>
                  </Alert>
                )}

                {testResult.success && testResult.data && (
                  <div className="space-y-4">
                    {testResult.source && (
                      <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                        <h4 className="font-medium text-green-900 mb-2">Data Source</h4>
                        <div className="space-y-2 text-sm">
                          {Object.entries(testResult.source).map(([key, value]) => (
                            <div key={key} className="flex justify-between">
                              <span className="text-green-700 capitalize">{key.replace(/_/g, ' ')}:</span>
                              <span className="font-mono text-green-800">{String(value)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium">Trigger Data</h4>
                        <Button
                          onClick={() => copyToClipboard(JSON.stringify(testResult.data, null, 2))}
                          size="sm"
                          variant="outline"
                        >
                          Copy JSON
                        </Button>
                      </div>
                      <pre className="text-xs bg-white p-3 rounded border overflow-x-auto">
                        {JSON.stringify(testResult.data, null, 2)}
                      </pre>
                    </div>

                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h4 className="font-medium text-blue-900 mb-2">Available Variables</h4>
                      <p className="text-sm text-blue-700 mb-3">
                        You can use these variables in your actions:
                      </p>
                      <div className="space-y-2">
                        {testResult.data && typeof testResult.data === 'object' && 
                         Object.entries(testResult.data).map(([key, value]) => (
                          <div key={key} className="flex items-center justify-between p-2 bg-white rounded border">
                            <div className="flex-1">
                                                             <code className="text-blue-600 font-mono text-sm">{`{{trigger.${key}}}`}</code>
                              <p className="text-xs text-gray-600 mt-1">
                                Sample: {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                              </p>
                            </div>
                            <Button
                              onClick={() => copyToClipboard(`{{trigger.${key}}}`)}
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0"
                            >
                              Copy
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Zap className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No test results yet</p>
                <p className="text-sm">Run a test to see the trigger data</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
} 