import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, AlertCircle, Settings, TestTube, Play, Webhook, User, ExternalLink, ChevronDown } from 'lucide-react';
import axios from 'axios';
import { TriggerConfigField } from './TriggerConfigField';
import { AppSelectorModal } from '@/components/sequences/AppSelectorModal';
import { cx } from 'class-variance-authority';
import { Popover, PopoverAnchor, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Combobox } from '@/components/combobox';

interface AddActionModalProps {
  open: boolean;
  onClose: () => void;
  sequenceId: number;
  onActionAdded: (action: CreatedAction) => void;
  editingAction?: CreatedAction | null;
  onActionUpdated?: (action: CreatedAction) => void;
}

interface CreatedAction {
  id: number;
  name: string;
  type: string;
  configuration: Record<string, unknown>;
  app?: {
    name: string;
    icon_url?: string;
    color?: string;
  };
}


interface ActionDefinition {
  key: string;
  label: string;
  description: string;
  type: string;
  requires_auth?: boolean;
  props?: Record<string, {
    key: string;
    label: string;
    type: string;
    required: boolean;
    description?: string;
    help?: string;
    dynamic?: boolean;
    dynamicSource?: string;
    default?: unknown;
    options?: Array<{ value: string; label: string; }>;
  }>;
}

interface Integration {
  id: number;
  uuid: string;
  name: string;
  app: {
    id: number;
    key: string;
    name: string;
    icon_url?: string;
    color?: string;
  };
  current_state: 'active' | 'inactive' | 'created' | 'error';
}

export function AddActionModal({
  open,
  onClose,
  sequenceId,
  onActionAdded,
  editingAction = null,
  onActionUpdated
}: AddActionModalProps) {
  const [activeTab, setActiveTab] = useState('setup');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string[]>>({});

  // Setup tab state
  const [selectedApp, setSelectedApp] = useState<App | null>(null);
  const [selectedAction, setSelectedAction] = useState<ActionDefinition | null>(null);
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);

  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [showAppSelector, setShowAppSelector] = useState(false);
  const [showActionSelector, setShowActionSelector] = useState(false);

  // Config tab state
  const [actionName, setActionName] = useState('');
  const [configuration, setConfiguration] = useState<Record<string, unknown>>({});

  // Test tab state
  const [testResult, setTestResult] = useState<{ error?: string; [key: string]: unknown } | null>(null);
  const [testLoading, setTestLoading] = useState(false);

  useEffect(() => {
    if (open) {
      // loadApps();
      loadIntegrations();
      if (editingAction) {
        setActionName(editingAction.name);
        setConfiguration(editingAction.configuration || {});
        setActiveTab('config');
      } else {
        setActiveTab('setup');
        setSelectedApp(null);
        setSelectedAction(null);
        setSelectedIntegration(null);
        setActionName('');
        setConfiguration({});
      }
    }
  }, [open, editingAction]);


  const loadIntegrations = async () => {
    try {
      const response = await axios.get('/automation/integrations');
      setIntegrations(response.data.data || []);
    } catch (error) {
      console.error('Failed to load integrations:', error);
    }
  };

  const handleAppSelect = (app: App) => {
    setSelectedApp(app);
    setSelectedAction(null);
    setSelectedIntegration(null);
    setShowAppSelector(false);

    // note: should SAVE now.
  };

  const handleActionSelect = (action: ActionDefinition) => {
    setSelectedAction(action);
    setActionName(action.label);
    setShowActionSelector(false);

    // Check if this action requires auth
    if (action.requires_auth) {
      const appIntegrations = integrations.filter(integration =>
        integration.app.key === selectedApp?.key
      );
      const hasActiveIntegration = appIntegrations.some(integration =>
        integration.current_state === 'active'
      );

      if (hasActiveIntegration) {
        const activeIntegration = appIntegrations.find(integration =>
          integration.current_state === 'active'
        );
        if (activeIntegration) {
          setSelectedIntegration(activeIntegration);
        }
      }
    }
  };

  const openIntegrationSetup = () => {
    if (!selectedApp) return;

    const integrationName = `${selectedApp.name} Integration`;
    const setupUrl = `/automation/integrations/setup?app_key=${selectedApp.key}&integration_name=${encodeURIComponent(integrationName)}`;

    window.open(setupUrl, 'integration_setup', 'width=600,height=700,scrollbars=yes,resizable=yes');
  };

  // Listen for integration creation from popup window
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'INTEGRATION_CREATED') {
        // Refresh integrations list
        loadIntegrations();
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleSave = async () => {
    if (!selectedApp || !selectedAction) return;

    try {
      setLoading(true);
      setError(null);
      setValidationErrors({});

      const payload = {
        sequence_id: sequenceId,
        name: actionName,
        type: 'app_action',
        app_action_key: selectedAction.key,
        app_name: selectedApp.name,
        configuration: configuration,
      };

      if (editingAction) {
        const response = await axios.put(`/automation/actions/${editingAction.id}`, payload);
        onActionUpdated?.(response.data.data);
      } else {
        const response = await axios.post(`/automation/actions`, payload);
        onActionAdded(response.data.data);
      }

      handleClose();
    } catch (error) {
      console.error('Failed to save action:', error);

      if (axios.isAxiosError(error) && error.response?.status === 422) {
        setValidationErrors(error.response.data.errors || {});
      } else if (axios.isAxiosError(error)) {
        setError(error.response?.data?.message || 'Failed to save action. Please try again.');
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleTestAction = async () => {
    if (!selectedApp || !selectedAction) return;

    try {
      setTestLoading(true);
      setTestResult(null);

      const payload = {
        sequence_id: sequenceId,
        app_action_key: selectedAction.key,
        app_name: selectedApp.name,
        configuration: configuration,
      };

      const response = await axios.post(`/automation/actions/test`, payload);
      setTestResult(response.data);
    } catch (error) {
      console.error('Failed to test action:', error);
      setTestResult({ error: 'Test failed' });
    } finally {
      setTestLoading(false);
    }
  };

  const handleClose = () => {
    setActiveTab('setup');
    setError(null);
    setValidationErrors({});
    setTestResult(null);
    onClose();
  };

  const isEditing = !!editingAction;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0">

        <DialogHeader className="bg-gray-100 clear-both py-2 px-4">
          <DialogTitle className="text-base">{isEditing ? 'Edit Action' : 'Add Action'}</DialogTitle>
        </DialogHeader>

        {/* Error Display */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg mb-4">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-4 w-4 text-red-500" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full ">
          <div className="px-4">
            <TabsList className="grid w-full grid-cols-3 ">
              <TabsTrigger value="setup">Setup</TabsTrigger>
              <TabsTrigger value="config" disabled>Config</TabsTrigger>
              <TabsTrigger value="test" disabled>Test</TabsTrigger>
            </TabsList>
          </div>

          {/* Setup Tab */}
          <TabsContent value="setup" className="space-y-4">
            {/* App Selection */}
            <div className="space-y-2 px-4">
              <Label className="text-sm font-medium mb-1 block">App <span className="text-orange-700">*</span></Label>
              {selectedApp ? (
                <div className="border border-blue-300 bg-blue-50">
                  <div className="px-3 py-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3 fle">
                        {selectedApp.icon_url ? (
                          <img src={selectedApp.icon_url} alt={selectedApp.name} className="w-8 h-8 rounded" />
                        ) : (
                          <div
                            className="flex-shrink-0 w-8 h-8 rounded flex items-center justify-center text-white font-bold text-sm"
                            style={{ backgroundColor: selectedApp.color || '#3b82f6' }}
                          >
                            {selectedApp.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <h4 className="font-medium text-sm">{selectedApp.name}</h4>
                          <p className="text-xs text-gray-500">{selectedApp.description}</p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowAppSelector(true)}
                      >
                        Change
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="border-2 border-dashed border-gray-300 hover:border-gray-400 transition-colors cursor-pointer" onClick={() => setShowAppSelector(true)}>
                  <div className="p-2">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center">
                        <Webhook className="h-4 w-4 text-gray-400" />
                      </div>
                      <div>
                        <p className="font-medium text-sm text-gray-700">Choose an app</p>
                        <p className="text-xs text-gray-500">Select the app that will execute this action</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Action Selection */}
            <div className={cx(
              'space-y-2 px-4',
              !selectedApp && 'opacity-50 pointer-events-none cursor-not-allowed'
            )}>
              <Label className="text-sm font-medium">Action *</Label>
              {/*{selectedAction ? (*/}
              {/*  <div className="border border-blue-300 bg-blue-50">*/}
              {/*    <CardContent className="p-3">*/}
              {/*      <div className="flex items-center justify-between">*/}
              {/*        <div className="flex-1">*/}
              {/*          <h4 className="font-medium text-sm">{selectedAction.label}</h4>*/}
              {/*          <p className="text-xs text-gray-500">{selectedAction.description}</p>*/}
              {/*        </div>*/}
              {/*        <Button*/}
              {/*          variant="outline"*/}
              {/*          size="sm"*/}
              {/*          onClick={() => setShowActionSelector(true)}*/}
              {/*          disabled={!selectedApp}*/}
              {/*        >*/}
              {/*          Change*/}
              {/*        </Button>*/}
              {/*      </div>*/}
              {/*    </CardContent>*/}
              {/*  </div>*/}
              {/*) : (*/}
              {/*  <div*/}
              {/*    className={`border-2 border-dashed transition-colors border-gray-300 hover:border-gray-400 cursor-pointer'`}*/}
              {/*    onClick={() => selectedApp && setShowActionSelector(true)}*/}
              {/*  >*/}
              {/*    <div className="p-2">*/}
              {/*      <div className="flex items-center space-x-3">*/}
              {/*        <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center">*/}
              {/*          <Play className="h-4 w-4 text-gray-400" />*/}
              {/*        </div>*/}
              {/*        <div>*/}
              {/*          <p className={`font-medium text-sm ${!selectedApp ? 'text-gray-400' : 'text-gray-700'}`}>*/}
              {/*            Choose an action*/}
              {/*          </p>*/}
              {/*          <p className="text-xs text-gray-500">*/}
              {/*            {selectedApp ? 'Select the action to execute' : 'Select an app first'}*/}
              {/*          </p>*/}
              {/*        </div>*/}
              {/*      </div>*/}
              {/*    </div>*/}
              {/*  </div>*/}
              {/*)}*/}

              <div className="">
                <Combobox
                  name="user"
                  placeholder={"Choose an action"}
                  items={[]}
                  displayValue={(user) => user?.name}
                  defaultValue={null}>
                  {(user) => (
                    <ComboboxOption value={user}>
                      <ComboboxLabel>{user.name}</ComboboxLabel>
                    </ComboboxOption>
                  )}
                </Combobox>
              </div>
            </div>

            {/* Integration Selection - SIMPLIFIED */}
            {selectedAction && selectedAction.requires_auth && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Account *</Label>
                {selectedIntegration ? (
                  <Card className="border border-blue-300 bg-blue-50">
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <User className="h-8 w-8 p-1.5 bg-blue-100 text-blue-600 rounded" />
                          <div>
                            <p className="text-sm font-medium text-blue-900">{selectedIntegration.name}</p>
                            <p className="text-xs text-blue-700">
                              {selectedIntegration.app.name} • {selectedIntegration.current_state}
                            </p>
                          </div>
                        </div>
                        <Button onClick={openIntegrationSetup} variant="outline" size="sm">
                          <ExternalLink className="h-3 w-3 mr-1" />
                          Edit
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="border-2 border-dashed border-gray-300 bg-gray-50 cursor-pointer hover:border-gray-400 transition-colors" onClick={openIntegrationSetup}>
                    <CardContent className="p-3">
                      <div className="flex items-center justify-center space-x-2 text-gray-600">
                        <User className="h-4 w-4" />
                        <span className="text-sm">Setup {selectedApp?.name} integration</span>
                        <ChevronDown className="h-3 w-3" />
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* Progress Message */}
            <div className="space-y-3">
              {!selectedApp && (
                <div className="text-center p-3 bg-gray-50 rounded text-sm text-gray-600">
                  To continue, choose an app
                </div>
              )}
              {selectedApp && !selectedAction && (
                <div className="text-center p-3 bg-gray-50 rounded text-sm text-gray-600">
                  To continue, choose an action
                </div>
              )}
              {selectedApp && selectedAction && selectedAction.requires_auth && !selectedIntegration && (
                <div className="text-center p-3 bg-orange-50 rounded text-sm text-orange-600">
                  To continue, setup your {selectedApp.name} integration above
                </div>
              )}
              {selectedApp && selectedAction && (!selectedAction.requires_auth || selectedIntegration) && (
                <div className="text-center p-3 bg-green-50 rounded text-sm text-green-600">
                  ✓ Setup complete! You can now configure and test your action.
                </div>
              )}
            </div>
          </TabsContent>

          {/* Config Tab */}
          <TabsContent value="config" className="space-y-6">
            <h3 className="text-lg font-medium">Configure Action</h3>

            {/* Action Name */}
            <div className="space-y-2">
              <Label htmlFor="action-name">Action Name</Label>
              <Input
                id="action-name"
                value={actionName}
                onChange={(e) => setActionName(e.target.value)}
                placeholder="Give this action a descriptive name"
                className={validationErrors.name ? 'border-red-300' : ''}
              />
              {validationErrors.name && (
                <p className="text-xs text-red-500">{validationErrors.name[0]}</p>
              )}
            </div>

            {/* Configuration Options */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Settings className="h-4 w-4 text-gray-500" />
                <h4 className="font-medium">Configuration Options</h4>
              </div>

              {selectedAction?.props && Object.keys(selectedAction.props).length > 0 ? (
                <Card>
                  <CardContent className="p-4 space-y-4">
                    {Object.values(selectedAction.props).map((field) => (
                                              <TriggerConfigField
                          key={field.key}
                          field={field}
                          value={configuration[field.key]}
                          onChange={(value) => setConfiguration(prev => ({ ...prev, [field.key]: value }))}
                          appKey={selectedApp?.key || ''}
                          integrationId={selectedIntegration?.id}
                          error={validationErrors[field.key]?.[0]}
                          requiresAuth={selectedAction?.requires_auth || false}
                        />
                    ))}
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="p-4">
                    <div className="text-center py-8 text-gray-500">
                      <Settings className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p className="text-lg font-medium">No configuration required</p>
                      <p className="text-sm">This action doesn't need any additional configuration</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Test Tab */}
          <TabsContent value="test" className="space-y-6">
            <h3 className="text-lg font-medium">Test Action</h3>

            <div className="space-y-4">
              <Card>
                <CardContent className="p-4">
                  <div className="text-center space-y-4">
                    <TestTube className="h-12 w-12 mx-auto text-blue-500" />
                    <div>
                      <h4 className="font-medium">Test Your Action</h4>
                      <p className="text-sm text-gray-500 mt-1">
                        Run a test to verify your action is working correctly
                      </p>
                    </div>
                    <Button
                      onClick={handleTestAction}
                      disabled={testLoading}
                      className="w-full"
                    >
                      {testLoading ? (
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
                </CardContent>
              </Card>

              {/* Test Results */}
              {testResult && (
                <Card>
                  <CardContent className="p-4">
                    <h4 className="font-medium mb-3">Test Results</h4>
                    {testResult.error ? (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <AlertCircle className="h-4 w-4 text-red-500" />
                          <p className="text-sm text-red-700">Test failed: {testResult.error}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <div className="h-4 w-4 text-green-500">✓</div>
                          <p className="text-sm text-green-700">Test completed successfully!</p>
                        </div>
                        <pre className="mt-2 text-xs bg-white p-2 rounded border overflow-auto">
                          {JSON.stringify(testResult, null, 2)}
                        </pre>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Save Button */}
        <div className="flex justify-end pt-4 border-t">
          <Button onClick={handleSave} disabled={loading || !selectedApp || !selectedAction}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {isEditing ? 'Updating...' : 'Creating...'}
              </>
            ) : (
              isEditing ? 'Update Action' : 'Create Action'
            )}
          </Button>
        </div>

        <AppSelectorModal
          type="actions"
          open={showAppSelector}
          onClose={() => setShowAppSelector(false)}
          onSelect={handleAppSelect}
          selectedApp={selectedApp}
          selectedAction={selectedAction}
        />
      </DialogContent>
    </Dialog>
  );
}
