import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Webhook } from 'lucide-react';
import axios from 'axios';





interface AddActionModalProps {
  open: boolean;
  onClose: () => void;
  sequenceId: number;
  onActionAdded: (action: unknown) => void;
  editingAction?: Action | null;
  onActionUpdated?: (action: Action) => void;
}

interface Action {
  id: number;
  name: string;
  type: string;
  arguments?: Record<string, unknown>;
}

interface DiscoveredAction {
  key: string;
  noun: string;
  label: string;
  description: string;
  type: string;
  app: string;
  props: Record<string, {
    key: string;
    label: string;
    type: string;
    required: boolean;
    help?: string;
    dynamic?: string;
    default?: unknown;
    options?: unknown[];
  }>;
  class: string;
}

// No hardcoded actions - only discovered actions are used

export function AddActionModal({
  open,
  onClose,
  sequenceId,
  onActionAdded,
  editingAction = null,
  onActionUpdated
}: AddActionModalProps) {
  const [step, setStep] = useState<'select-type' | 'configure'>('select-type');
  const [selectedDiscoveredAction, setSelectedDiscoveredAction] = useState<DiscoveredAction | null>(null);
  const [actionName, setActionName] = useState('');
  const [configuration, setConfiguration] = useState<Record<string, string>>({});
  const [creating, setCreating] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{success: boolean; message: string; data?: unknown} | null>(null);
  const [discoveredActions, setDiscoveredActions] = useState<DiscoveredAction[]>([]);
  const [loadingActions, setLoadingActions] = useState(false);
  const [resourceOptions, setResourceOptions] = useState<Record<string, Array<{value: string; label: string}>>>({});
  const [loadingResources, setLoadingResources] = useState<Record<string, boolean>>({});

  // Fetch discovered actions when modal opens
  useEffect(() => {
    if (open && discoveredActions.length === 0) {
      fetchDiscoveredActions();
    }
  }, [open]);

  // Initialize form when editing action or modal opens
  useEffect(() => {
    if (editingAction) {
      setActionName(editingAction.name);
      setStep('configure');

      // Pre-populate configuration from action arguments
      const args = editingAction.arguments || {};
      const config: Record<string, string> = {};

      Object.entries(args).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            config[key] = value.join('\n');
          } else {
            config[key] = String(value);
          }
        }
      });

      setConfiguration(config);

      // Find the corresponding discovered action
      if (discoveredActions.length > 0) {
        const foundAction = discoveredActions.find(action =>
          action.key === editingAction.type ||
          action.app === editingAction.type
        );
        if (foundAction) {
          setSelectedDiscoveredAction(foundAction);
        }
      }
    } else {
      // Reset form for new action
      setStep('select-type');
      setSelectedDiscoveredAction(null);
      setActionName('');
      setConfiguration({});
    }
  }, [editingAction, open, discoveredActions]);

  const fetchDiscoveredActions = async () => {
    try {
      setLoadingActions(true);
      const response = await axios.get('/discovered/actions');
      setDiscoveredActions(response.data || []);
    } catch (error) {
      console.error('Failed to fetch discovered actions:', error);
    } finally {
      setLoadingActions(false);
    }
  };

  const loadResourceOptions = async (resourceKey: string, search?: string) => {
    setLoadingResources(prev => ({ ...prev, [resourceKey]: true }));

    try {
      const response = await axios.post('/discovered/resources/search', {
        app: selectedDiscoveredAction?.app,
        resource: resourceKey,
        integration_id: 1, // This should come from the selected integration
        search,
      });

      setResourceOptions(prev => ({
        ...prev,
        [resourceKey]: response.data || []
      }));
    } catch (error) {
      console.error('Failed to load resource options:', error);
    } finally {
      setLoadingResources(prev => ({ ...prev, [resourceKey]: false }));
    }
  };

  const handleDiscoveredActionSelect = (action: DiscoveredAction) => {
    setSelectedDiscoveredAction(action);
    setActionName(action.label);
    setConfiguration({});
    setResourceOptions({});
    setLoadingResources({});
    setStep('configure');
  };

  const handleConfigurationChange = (key: string, value: string) => {
    setConfiguration(prev => ({ ...prev, [key]: value }));
    // Clear test result when configuration changes
    setTestResult(null);
  };

  const testAction = async () => {
    if (!selectedDiscoveredAction) return;

    try {
      setTesting(true);
      setTestResult(null);

      const testData = {
        name: actionName,
        type: 'app_action',
        app_action_key: selectedDiscoveredAction.key,
        app_name: selectedDiscoveredAction.app,
        configuration: configuration
      };

      const response = await axios.post(`/sequences/${sequenceId}/actions/test`, testData);

      setTestResult({
        success: response.data.success,
        message: response.data.message,
        data: response.data.data
      });
    } catch (error: unknown) {
      console.error('Action test failed:', error);
      const errorMessage = (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
                          (error as Error)?.message || 'Test failed';
      setTestResult({
        success: false,
        message: errorMessage
      });
    } finally {
      setTesting(false);
    }
  };

  const saveAction = async () => {
    if (!selectedDiscoveredAction) return;

    try {
      setCreating(true);

      const processedConfig = { ...configuration };
      const actionData = {
        name: actionName,
        type: 'app_action',
        app_action_key: selectedDiscoveredAction.key,
        app_name: selectedDiscoveredAction.app,
        configuration: processedConfig
      };

      if (editingAction) {
        // Update existing action
        const response = await axios.put(`/sequences/${sequenceId}/actions/${editingAction.id}`, actionData);
        onActionUpdated?.(response.data.action);
      } else {
        // Create new action
        const response = await axios.post(`/sequences/${sequenceId}/actions`, actionData);
        onActionAdded(response.data.action);
      }

      handleClose();
    } catch (error) {
      console.error('Failed to save action:', error);
    } finally {
      setCreating(false);
    }
  };

  const handleClose = () => {
    setStep('select-type');
    setSelectedDiscoveredAction(null);
    setActionName('');
    setConfiguration({});
    setResourceOptions({});
    setLoadingResources({});
    setTestResult(null);
    onClose();
  };

  const isFormValid = () => {
    if (!selectedDiscoveredAction) return false;

    return Object.entries(selectedDiscoveredAction.props)
      .filter(([, field]) => field.required)
      .every(([key]) => configuration[key]?.trim());
  };

  const isEditing = !!editingAction;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Action' : 'Add Action'}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Modify the configuration for this action'
              : 'Choose an action to execute when this workflow runs'
            }
          </DialogDescription>
        </DialogHeader>

        {step === 'select-type' && !isEditing && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">App Actions</h3>
              {loadingActions && <Loader2 className="h-4 w-4 animate-spin" />}
            </div>

            {discoveredActions.length === 0 && !loadingActions ? (
              <div className="text-center py-8 text-gray-500">
                <p>No app actions available</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Group actions by app */}
                {Object.entries(
                  discoveredActions.reduce((acc, action) => {
                    if (!acc[action.app]) {
                      acc[action.app] = [];
                    }
                    acc[action.app].push(action);
                    return acc;
                  }, {} as Record<string, DiscoveredAction[]>)
                ).map(([appName, actions]) => (
                  <div key={appName} className="space-y-3">
                    <h4 className="text-sm font-medium text-gray-700 uppercase tracking-wide">
                      {appName} Actions
                    </h4>
                    <div className="grid grid-cols-1 gap-3">
                      {actions.map((action) => (
                        <Card
                          key={action.key}
                          className="cursor-pointer hover:border-primary transition-colors"
                          onClick={() => handleDiscoveredActionSelect(action)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center text-white">
                                <Webhook className="h-5 w-5" />
                              </div>
                              <div className="flex-1">
                                <h4 className="font-medium">{action.label}</h4>
                                <p className="text-sm text-gray-500">{action.description}</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {(step === 'configure' || isEditing) && selectedDiscoveredAction && (
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
                <Webhook className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-lg font-medium">
                  {isEditing ? 'Edit' : 'Configure'} {selectedDiscoveredAction.label}
                </h3>
                <p className="text-sm text-gray-500">{selectedDiscoveredAction.description}</p>
                <p className="text-xs text-gray-400">App: {selectedDiscoveredAction.app}</p>
              </div>
            </div>

            <Tabs defaultValue="configuration" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="configuration">Configuration</TabsTrigger>
                <TabsTrigger value="variables">Template Variables</TabsTrigger>
              </TabsList>

              <TabsContent value="configuration" className="space-y-4">
                <div>
                  <Label htmlFor="action-name">Action Name</Label>
                  <Input
                    id="action-name"
                    value={actionName}
                    onChange={(e) => setActionName(e.target.value)}
                    placeholder="Give this action a descriptive name"
                  />
                </div>

                {selectedDiscoveredAction?.props && Object.entries(selectedDiscoveredAction.props).map(([key, field]) => (
                  <div key={key}>
                    <Label htmlFor={key}>
                      {field.label}
                      {field.required && <span className="text-red-500 ml-1">*</span>}
                    </Label>

                    {field.type === 'string' && field.dynamic ? (
                      <div className="space-y-2">
                        <Input
                          id={key}
                          value={configuration[key] || ''}
                          onChange={(e) => handleConfigurationChange(key, e.target.value)}
                          placeholder={`Search ${field.label.toLowerCase()}...`}
                          onFocus={() => {
                            if (field.dynamic) {
                              const [resourceKey] = field.dynamic.split('.');
                              loadResourceOptions(resourceKey);
                            }
                          }}
                        />
                        {loadingResources[field.dynamic?.split('.')[0] || ''] && (
                          <div className="flex items-center space-x-2 text-sm text-gray-500">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span>Loading options...</span>
                          </div>
                        )}
                        {resourceOptions[field.dynamic?.split('.')[0] || ''] && (
                          <div className="max-h-40 overflow-y-auto border rounded-md p-2 space-y-1">
                            {resourceOptions[field.dynamic?.split('.')[0] || ''].map((option) => (
                              <div
                                key={option.value}
                                className="p-2 hover:bg-gray-100 rounded cursor-pointer text-sm"
                                onClick={() => handleConfigurationChange(key, option.value)}
                              >
                                {option.label}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : field.type === 'text' ? (
                      <Textarea
                        id={key}
                        value={configuration[key] || ''}
                        onChange={(e) => handleConfigurationChange(key, e.target.value)}
                        placeholder={`Enter ${field.label.toLowerCase()}`}
                        rows={3}
                        className="mt-1"
                      />
                    ) : field.type === 'select' ? (
                      <select
                        id={key}
                        value={configuration[key] || ''}
                        onChange={(e) => handleConfigurationChange(key, e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                      >
                        <option value="">Select {field.label}</option>
                        {field.options?.map((option: unknown) => {
                          const opt = option as { value: string; label: string };
                          return (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          );
                        })}
                      </select>
                    ) : (
                      <Input
                        id={key}
                        type={field.type === 'email' ? 'email' : 'text'}
                        value={configuration[key] || ''}
                        onChange={(e) => handleConfigurationChange(key, e.target.value)}
                        placeholder={`Enter ${field.label.toLowerCase()}`}
                        className="mt-1"
                      />
                    )}

                    {field.help && (
                      <p className="text-xs text-gray-500 mt-1">{field.help}</p>
                    )}
                  </div>
                ))}
              </TabsContent>

              <TabsContent value="variables" className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-start space-x-2">
                                            <Webhook className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-blue-900">Template Variables</h4>
                      <p className="text-sm text-blue-700 mt-1">
                        Use these variables to make your actions dynamic. They will be replaced with actual values when the workflow runs.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <h5 className="font-medium text-sm">Trigger Variables</h5>
                    <div className="space-y-1 mt-2">
                      <div className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
                        <code className="text-blue-600">{'{{trigger.member_email}}'}</code>
                        <span className="text-gray-600">Customer email address</span>
                      </div>
                      <div className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
                        <code className="text-blue-600">{'{{trigger.member_name}}'}</code>
                        <span className="text-gray-600">Customer full name</span>
                      </div>
                      <div className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
                        <code className="text-blue-600">{'{{trigger.product_name}}'}</code>
                        <span className="text-gray-600">Product name from order</span>
                      </div>
                      <div className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
                        <code className="text-blue-600">{'{{trigger.order_id}}'}</code>
                        <span className="text-gray-600">Unique order identifier</span>
                      </div>
                      <div className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
                        <code className="text-blue-600">{'{{trigger.amount}}'}</code>
                        <span className="text-gray-600">Order amount in cents</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h5 className="font-medium text-sm">Step Variables</h5>
                    <div className="space-y-1 mt-2">
                      <div className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
                        <code className="text-blue-600">{'{{step_1.field_name}}'}</code>
                        <span className="text-gray-600">Output from previous steps</span>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            {/* Test Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Test Action</h4>
                <Button
                  onClick={testAction}
                  disabled={testing || !isFormValid()}
                  variant="outline"
                  size="sm"
                >
                  {testing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Testing...
                    </>
                  ) : (
                    'Test Action'
                  )}
                </Button>
              </div>

              {testResult && (
                <div className={`p-4 rounded-lg border ${
                  testResult.success
                    ? 'bg-green-50 border-green-200'
                    : 'bg-red-50 border-red-200'
                }`}>
                  <div className="flex items-start space-x-2">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                      testResult.success ? 'bg-green-500' : 'bg-red-500'
                    }`}>
                      <span className="text-white text-xs font-bold">
                        {testResult.success ? '✓' : '✗'}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className={`font-medium ${
                        testResult.success ? 'text-green-800' : 'text-red-800'
                      }`}>
                        {testResult.success ? 'Test Successful!' : 'Test Failed'}
                      </p>
                      <p className={`text-sm ${
                        testResult.success ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {testResult.message}
                      </p>
                      {testResult.data && (
                        <div className="mt-2 p-2 bg-gray-100 rounded text-xs">
                          <pre className="whitespace-pre-wrap">
                            {String(JSON.stringify(testResult.data as Record<string, unknown>, null, 2))}
                          </pre>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex space-x-2">
              {!isEditing && (
                <Button onClick={() => setStep('select-type')} variant="outline" className="flex-1">
                  Back
                </Button>
              )}
              <Button
                onClick={saveAction}
                disabled={creating || !isFormValid()}
                className={isEditing ? "w-full" : "flex-1"}
              >
                {creating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {isEditing ? 'Updating...' : 'Creating...'}
                  </>
                ) : (
                  isEditing ? 'Update Action' : 'Create Action'
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
