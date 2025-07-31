import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, AlertCircle, CheckCircle, Settings, TestTube, Play, Webhook, User, ExternalLink, ChevronDown, List } from 'lucide-react';
import axios from 'axios';
import { TriggerConfigField } from './TriggerConfigField';
import { IntegrationSelector } from './IntegrationSelector';

interface App {
  key: string;
  name: string;
  description?: string;
  icon_url?: string;
  color?: string;
  category?: string;
  actions?: ActionDefinition[];
  id: number;
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
  created_at: string;
}

interface CreatedAction {
  id: number;
  name: string;
  type: string;
  app_id?: number;
  action_key?: string;
  configuration: Record<string, unknown>;
  app?: {
    id: number;
    name: string;
    icon_url?: string;
    color?: string;
  };
}

interface SetupStepProps {
  selectedApp: App | null;
  selectedAction: ActionDefinition | null;
  selectedIntegration: Integration | null;
  apps: App[];
  showAppSelector: boolean;
  showActionSelector: boolean;
  setShowAppSelector: (show: boolean) => void;
  setShowActionSelector: (show: boolean) => void;
  setShowIntegrationSelector: (show: boolean) => void;
  handleAppSelect: (app: App) => void;
  handleActionSelect: (action: ActionDefinition) => void;
  openIntegrationManager: () => void;
}

interface ConfigStepProps {
  actionName: string;
  setActionName: (name: string) => void;
  configuration: Record<string, unknown>;
  setConfiguration: React.Dispatch<React.SetStateAction<Record<string, unknown>>>;
  selectedAction: ActionDefinition | null;
  selectedApp: App | null;
  selectedIntegration: Integration | null;
  validationErrors: Record<string, string[]>;
}

interface TestStepProps {
  testResult: {
    error?: string;
    success?: boolean;
    message?: string;
    data?: {
      action_id?: number;
      action_key?: string;
      app_name?: string;
      configuration?: Record<string, unknown>;
      result?: unknown;
      timestamp?: string;
    };
    [key: string]: unknown;
  } | null;
  testLoading: boolean;
  handleTestAction: () => void;
}

// Setup Step Component
function SetupStep({
  selectedApp,
  selectedAction,
  selectedIntegration,
  apps,
  showAppSelector,
  showActionSelector,
  setShowAppSelector,
  setShowActionSelector,
  setShowIntegrationSelector,
  handleAppSelect,
  handleActionSelect,
  openIntegrationManager,
}: SetupStepProps) {
  const openIntegrationEdit = (integration?: Integration) => {
    if (!integration) {
      openIntegrationManager();
      return;
    }

    const editUrl = `/automation/integrations/${integration.id}/edit`;
    window.open(editUrl, 'integration_edit', 'width=600,height=700,scrollbars=yes,resizable=yes');
  };

  return (
    <TabsContent value="setup" className="absolute inset-0 data-[state=inactive]:hidden">
      <div className="h-full overflow-y-auto px-6 py-4">
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium mb-4">Setup Action</h3>
          </div>

                {/* App Selection */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">App *</Label>
                  {selectedApp ? (
                    <Card className="border border-blue-300 bg-blue-50">
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            {selectedApp.icon_url ? (
                              <img src={selectedApp.icon_url} alt={selectedApp.name} className="w-8 h-8 rounded" />
                            ) : (
                              <div
                                className="w-8 h-8 rounded flex items-center justify-center text-white font-bold text-sm"
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
                      </CardContent>
                    </Card>
                  ) : (
                    <Card className="border-2 border-dashed border-gray-300 hover:border-gray-400 transition-colors cursor-pointer" onClick={() => setShowAppSelector(true)}>
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center">
                            <Webhook className="h-4 w-4 text-gray-400" />
                          </div>
                          <div>
                            <p className="font-medium text-sm text-gray-700">Choose an app</p>
                            <p className="text-xs text-gray-500">Select the app that will execute this action</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>

                {/* Action Selection */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Action *</Label>
                  {selectedAction ? (
                    <Card className="border border-blue-300 bg-blue-50">
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium text-sm">{selectedAction.label}</h4>
                            <p className="text-xs text-gray-500">{selectedAction.description}</p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowActionSelector(true)}
                            disabled={!selectedApp}
                          >
                            Change
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    <Card className={`border-2 border-dashed transition-colors ${
                      selectedApp
                        ? 'border-gray-300 hover:border-gray-400 cursor-pointer'
                        : 'border-gray-200 cursor-not-allowed'
                    }`} onClick={() => selectedApp && setShowActionSelector(true)}>
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center">
                            <Play className="h-4 w-4 text-gray-400" />
                          </div>
                          <div>
                            <p className={`font-medium text-sm ${!selectedApp ? 'text-gray-400' : 'text-gray-700'}`}>
                              Choose an action
                            </p>
                            <p className="text-xs text-gray-500">
                              {selectedApp ? 'Select the action to execute' : 'Select an app first'}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>

                {/* Integration Selection - ENHANCED */}
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
                            <div className="flex space-x-2">
                              <Button onClick={() => openIntegrationManager()} variant="outline" size="sm">
                                <List className="h-3 w-3 mr-1" />
                                Change
                              </Button>
                              <Button onClick={() => openIntegrationEdit(selectedIntegration)} variant="outline" size="sm">
                                <ExternalLink className="h-3 w-3 mr-1" />
                                Edit
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ) : (
                      <Card className="border-2 border-dashed border-gray-300 bg-gray-50 cursor-pointer hover:border-gray-400 transition-colors" onClick={() => setShowIntegrationSelector(true)}>
                        <CardContent className="p-3">
                          <div className="flex items-center justify-center space-x-2 text-gray-600">
                            <User className="h-4 w-4" />
                            <span className="text-sm">Select {selectedApp?.name} integration</span>
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
        </div>
      </div>

      {/* App Selector Modal */}
      {showAppSelector && (
        <Dialog open={showAppSelector} onOpenChange={setShowAppSelector}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Choose App</DialogTitle>
              <DialogDescription>
                Select the app that will execute this action.
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {apps.map((app) => (
                <Card
                  key={app.id}
                  className={`cursor-pointer transition-colors ${
                    selectedApp?.id === app.id ? 'border-blue-500 bg-blue-50' : 'hover:border-gray-300'
                  }`}
                  onClick={() => handleAppSelect(app)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-center space-x-3">
                      {app.icon_url ? (
                        <img src={app.icon_url} alt={app.name} className="w-8 h-8 rounded-lg" />
                      ) : (
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold"
                          style={{ backgroundColor: app.color || '#3b82f6' }}
                        >
                          {app.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">{app.name}</h4>
                        <p className="text-xs text-gray-500">{app.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="flex justify-end pt-4">
              <Button onClick={() => setShowAppSelector(false)} variant="outline">
                Cancel
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Action Selector Modal */}
      {showActionSelector && (
        <Dialog open={showActionSelector} onOpenChange={setShowActionSelector}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Choose Action</DialogTitle>
              <DialogDescription>
                Select the action to execute.
              </DialogDescription>
            </DialogHeader>
            {selectedApp ? (
              <div className="space-y-2">
                {selectedApp.actions?.map((actionDef) => (
                  <Card
                    key={actionDef.key}
                    className={`cursor-pointer transition-colors ${
                      selectedAction?.key === actionDef.key ? 'border-blue-500 bg-blue-50' : 'hover:border-gray-300'
                    }`}
                    onClick={() => handleActionSelect(actionDef)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-sm">{actionDef.label}</h4>
                          <p className="text-xs text-gray-500">{actionDef.description}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Please select an app first.</p>
              </div>
            )}
            <div className="flex justify-end pt-4">
              <Button onClick={() => setShowActionSelector(false)} variant="outline">
                Cancel
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
              </TabsContent>
  );
}

// Config Step Component
function ConfigStep({
  actionName,
  setActionName,
  configuration,
  setConfiguration,
  selectedAction,
  selectedApp,
  selectedIntegration,
  validationErrors,
}: ConfigStepProps) {
  return (
    <TabsContent value="config" className="absolute inset-0 data-[state=inactive]:hidden">
      <div className="h-full overflow-y-auto px-6 py-4">
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium mb-4">Configure Action</h3>
          </div>

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
        </div>
      </div>
    </TabsContent>
  );
}

// Helper function to safely stringify unknown data
function safeStringify(data: unknown): string {
  try {
    const result = JSON.stringify(data, null, 2);
    return result !== undefined ? result : 'null';
  } catch {
    return 'Unable to display data';
  }
}

// Test Step Component
function TestStep({ testResult, testLoading, handleTestAction }: TestStepProps) {
  return (
    <TabsContent value="test" className="absolute inset-0 data-[state=inactive]:hidden">
      <div className="h-full overflow-y-auto px-6 py-4">
        <div className="space-y-6">
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
                    <div className="space-y-4">
                      <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <p className="text-sm text-green-700">Test completed successfully!</p>
                        </div>
                        {testResult.data?.timestamp && (
                          <p className="text-xs text-green-600 mt-1">
                            Executed at {new Date(testResult.data.timestamp).toLocaleString()}
                          </p>
                        )}
                      </div>

                      {/* Action Output */}
                      {testResult.data?.result !== undefined && (
                        <div className="space-y-3">
                          <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            <h5 className="font-medium text-sm">Action Output</h5>
                          </div>
                          <div className="bg-gray-50 rounded-lg p-3 border">
                            <pre className="text-xs overflow-auto max-h-48 whitespace-pre-wrap">
                              {testResult.data.result !== undefined ? safeStringify(testResult.data.result) : 'No result data'}
                            </pre>
                          </div>

                          {/* Available Fields Info */}
                          <div className="text-xs text-gray-500 bg-blue-50 p-2 rounded border border-blue-200">
                            <p className="font-medium text-blue-700 mb-1">💡 JSON Schema Generated:</p>
                            <p>This data structure has been analyzed and a JSON Schema was automatically generated. The field mappings are now available for use in subsequent actions and can be referenced using dot notation (e.g., <code className="bg-blue-100 px-1 rounded">headers.Content-Type</code>).</p>
                          </div>
                        </div>
                      )}

                      {/* Test Configuration Used */}
                      {testResult.data?.configuration && Object.keys(testResult.data.configuration).length > 0 && (
                        <details className="group">
                          <summary className="cursor-pointer text-sm font-medium text-gray-600 hover:text-gray-900 flex items-center space-x-1">
                            <ChevronDown className="h-3 w-3 transition-transform group-open:rotate-180" />
                            <span>Configuration Used</span>
                          </summary>
                          <div className="mt-2 bg-gray-50 rounded p-3 border">
                            <pre className="text-xs overflow-auto max-h-32">
                              {JSON.stringify(testResult.data.configuration, null, 2)}
                            </pre>
                          </div>
                        </details>
                      )}

                      {/* Full Response Details */}
                      <details className="group">
                        <summary className="cursor-pointer text-sm font-medium text-gray-600 hover:text-gray-900 flex items-center space-x-1">
                          <ChevronDown className="h-3 w-3 transition-transform group-open:rotate-180" />
                          <span>Full Response</span>
                        </summary>
                        <div className="mt-2 bg-gray-50 rounded p-3 border">
                          <pre className="text-xs overflow-auto max-h-40">
                            {JSON.stringify(testResult, null, 2)}
                          </pre>
                        </div>
                      </details>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </TabsContent>
  );
}

interface EditActionModalProps {
  open: boolean;
  onClose: () => void;
  action: CreatedAction;
  onActionUpdated: (action: CreatedAction) => void;
}

export function EditActionModal({ open, onClose, action, onActionUpdated }: EditActionModalProps) {
  const [activeTab, setActiveTab] = useState('setup');
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string[]>>({});

  // Step completion tracking
  const [setupComplete, setSetupComplete] = useState(false);
  const [configComplete, setConfigComplete] = useState(false);
  const [testComplete, setTestComplete] = useState(false);

  // Setup tab state
  const [selectedApp, setSelectedApp] = useState<App | null>(null);
  const [selectedAction, setSelectedAction] = useState<ActionDefinition | null>(null);
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);
  const [apps, setApps] = useState<App[]>([]);
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [showIntegrationSelector, setShowIntegrationSelector] = useState(false);
  const [showAppSelector, setShowAppSelector] = useState(false);
  const [showActionSelector, setShowActionSelector] = useState(false);

  // Config tab state
  const [actionName, setActionName] = useState('');
  const [configuration, setConfiguration] = useState<Record<string, unknown>>({});

  // Test tab state
  const [testResult, setTestResult] = useState<{ error?: string; [key: string]: unknown } | null>(null);
  const [testLoading, setTestLoading] = useState(false);

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

  useEffect(() => {
    if (open) {
      setInitializing(true);
      loadApps();
      loadIntegrations();
      if (action) {
        setActionName(action.name);
        setConfiguration(action.configuration || {});

        // Initialize selected app and action from existing action data
        if (action.app_id && action.app_id > 0) {
          const findAndSetApp = async () => {
            try {
              const response = await axios.get('/automation/apps');
              const availableApps = response.data.data || [];

              // Find app by ID
              const matchingApp = availableApps.find((app: App) =>
                app.id === action.app_id
              );

              if (matchingApp) {
                setSelectedApp(matchingApp);

                // Find the action definition by action_key
                const actionDefinition = matchingApp.actions?.find((a: ActionDefinition) =>
                  a.key === action.action_key
                );

                if (actionDefinition) {
                  setSelectedAction(actionDefinition);
                }
              }
              setInitializing(false);
            } catch (error) {
              console.error('Failed to initialize app and action:', error);
              setInitializing(false);
            }
          };

          findAndSetApp();
        } else {
          setInitializing(false);
        }
      } else {
        setInitializing(false);
      }
    } else {
      // Reset state when modal closes
      setSelectedApp(null);
      setSelectedAction(null);
      setSelectedIntegration(null);
      setActionName('');
      setConfiguration({});
      setInitializing(true);
    }
  }, [open, action]);

  // Separate effect to set integration once integrations are loaded
  useEffect(() => {
    if (action && integrations.length > 0 && selectedApp) {
      let matchingIntegration = null;

      // Try to find integration by app name first (most reliable since we have it from action.app.name)
      if (action.app?.name) {
        matchingIntegration = integrations.find((integration: Integration) =>
          integration?.app?.name === action.app?.name
        );
      }

      // If not found and we have app_id, try to find by app_id
      if (!matchingIntegration && action.app_id) {
        matchingIntegration = integrations.find((integration: Integration) =>
          integration?.app?.id === action.app_id
        );
      }

      if (matchingIntegration) {
        setSelectedIntegration(matchingIntegration);
      }
    }
  }, [action, integrations, selectedApp]);

  // Check step completion
  useEffect(() => {
    // Setup step is complete when we have app, action, and integration (if required)
    const setupValid = selectedApp && selectedAction &&
      (!selectedAction.requires_auth || selectedIntegration);
    setSetupComplete(!!setupValid);

    // Config step is complete when we have a name and required fields
    const configValid = actionName.trim().length > 0;
    setConfigComplete(configValid);
  }, [selectedApp, selectedAction, selectedIntegration, actionName]);

  // Reset test completion when configuration changes
  useEffect(() => {
    setTestComplete(false);
    setTestResult(null);
  }, [selectedApp, selectedAction, selectedIntegration, configuration]);

  const loadApps = async () => {
    try {
      const response = await axios.get('/automation/apps');
      setApps(response.data.data || []);
    } catch (error) {
      console.error('Failed to load apps:', error);
    }
  };

  const loadIntegrations = async () => {
    try {
      const response = await axios.get('/automation/integrations');
      setIntegrations(response.data.data || []);
    } catch (error) {
      console.error('Failed to load integrations:', error);
    }
  };

  const openIntegrationManager = () => {
    if (!selectedApp) return;

    const managerUrl = `/automation/integrations?app_key=${selectedApp.key}`;
    window.open(managerUrl, 'integration_manager', 'width=800,height=700,scrollbars=yes,resizable=yes');
  };

  const handleAppSelect = (app: App) => {
    setSelectedApp(app);
    setSelectedAction(null);
    setSelectedIntegration(null); // Clear integration when changing apps
    setConfiguration({}); // Clear configuration when changing apps
    setShowAppSelector(false);
  };

  const handleActionSelect = (actionDef: ActionDefinition) => {
    setSelectedAction(actionDef);
    setShowActionSelector(false);
    // Clear configuration when changing actions since different actions have different config requirements
    setConfiguration({});
  };

  const handleSave = async () => {
    if (!action || !selectedApp || !selectedAction) return;

    try {
      setLoading(true);
      setError(null);
      setValidationErrors({});

      const payload = {
        name: actionName,
        app_id: selectedApp.id,
        action_key: selectedAction.key,
        configuration: configuration,
      };

      const response = await axios.put(`/automation/actions/${action.id}`, payload);

      // Don't call onActionUpdated here - only on final finish
      // onActionUpdated(response.data.data);

      // Progress to next step instead of closing
      if (activeTab === 'setup' && setupComplete) {
        setActiveTab('config');
      } else if (activeTab === 'config' && configComplete) {
        setActiveTab('test');
      }

      return response.data; // Return the updated action for handleFinish
    } catch (error) {
      console.error('Failed to update action:', error);

      if (axios.isAxiosError(error) && error.response?.status === 422) {
        setValidationErrors(error.response.data.errors || {});
      } else if (axios.isAxiosError(error)) {
        setError(error.response?.data?.message || 'Failed to update action. Please try again.');
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
      throw error; // Re-throw for handleFinish
    } finally {
      setLoading(false);
    }
  };

  const handleTestAction = async () => {
    if (!selectedApp || !selectedAction || !action) return;

    try {
      setTestLoading(true);
      setTestResult(null);

      const payload = {
        configuration: configuration,
      };

      const response = await axios.post(`/automation/actions/${action.id}/tests`, payload);
      setTestResult(response.data);

      // Mark test as complete if successful
      if (response.data && !response.data.error) {
        setTestComplete(true);
      }
    } catch (error: unknown) {
      console.error('Failed to test action:', error);

      let errorMessage = 'Test failed';
      let errorDetails = null;

      if (axios.isAxiosError(error)) {
        // Extract error message from response
        if (error.response?.data?.message) {
          errorMessage = error.response.data.message;
        } else if (error.response?.data?.error) {
          errorMessage = error.response.data.error;
        }

        // Include error details if available
        if (error.response?.data?.error_details) {
          errorDetails = error.response.data.error_details;
        }
      }

      setTestResult({
        error: errorMessage,
        success: false,
        error_details: errorDetails,
        status: axios.isAxiosError(error) ? error.response?.status : undefined
      });
      setTestComplete(false);
    } finally {
      setTestLoading(false);
    }
  };

  const handleNextStep = () => {
    if (activeTab === 'setup' && setupComplete) {
      setActiveTab('config');
    } else if (activeTab === 'config' && configComplete) {
      setActiveTab('test');
    }
  };

  const handlePreviousStep = () => {
    if (activeTab === 'test') {
      setActiveTab('config');
    } else if (activeTab === 'config') {
      setActiveTab('setup');
    }
  };

  const handleFinish = async () => {
    try {
      // Save one final time before closing
      const updatedAction = await handleSave();
      // Only call onActionUpdated when actually finishing
      onActionUpdated(updatedAction);
      onClose();
    } catch (error) {
      // Error already handled in handleSave
      console.error('Failed to finish:', error);
    }
  };

  const handleClose = () => {
    setActiveTab('setup');
    setError(null);
    setValidationErrors({});
    setTestResult(null);
    onClose();
  };

  if (!action) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent variant="wizard" className="overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <DialogTitle>Edit Action</DialogTitle>
                    <DialogDescription>
            Configure and test your action settings
                    </DialogDescription>
                  </DialogHeader>

        {/* Show loading state while initializing */}
        {initializing ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2 text-sm text-gray-600">Loading action data...</span>
          </div>
        ) : (
          <>
            {/* Error Display */}
            {error && (
              <div className="px-6 mb-4">
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="h-4 w-4 text-red-500" />
                    <p className="text-sm text-red-700">{error}</p>
                              </div>
                            </div>
                          </div>
            )}

            <div className="flex-1 flex flex-col min-h-0">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
                <TabsList className="grid w-full grid-cols-3 mx-6">
                  <TabsTrigger value="setup" disabled={false}>
                    1. Setup
                  </TabsTrigger>
                  <TabsTrigger value="config" disabled={!setupComplete}>
                    2. Config
                  </TabsTrigger>
                  <TabsTrigger value="test" disabled={!configComplete}>
                    3. Test
                  </TabsTrigger>
                </TabsList>

                <div className="flex-1 relative min-h-0">
                  <SetupStep
                    selectedApp={selectedApp}
                    selectedAction={selectedAction}
                    selectedIntegration={selectedIntegration}
                    apps={apps}
                    showAppSelector={showAppSelector}
                    showActionSelector={showActionSelector}
                    setShowAppSelector={setShowAppSelector}
                    setShowActionSelector={setShowActionSelector}
                    setShowIntegrationSelector={setShowIntegrationSelector}
                    handleAppSelect={handleAppSelect}
                    handleActionSelect={handleActionSelect}
                    openIntegrationManager={openIntegrationManager}
                  />

                  <ConfigStep
                    actionName={actionName}
                    setActionName={setActionName}
                    configuration={configuration}
                    setConfiguration={setConfiguration}
                    selectedAction={selectedAction}
                    selectedApp={selectedApp}
                    selectedIntegration={selectedIntegration}
                    validationErrors={validationErrors}
                  />

                  <TestStep
                    testResult={testResult}
                    testLoading={testLoading}
                    handleTestAction={handleTestAction}
                  />
                </div>
              </Tabs>
            </div>

            {/* Wizard Navigation */}
            <div className="px-6 py-4 border-t bg-gray-50 flex justify-between">
              <div>
                {activeTab !== 'setup' && (
                  <Button onClick={handlePreviousStep} variant="outline">
                    Previous
                    </Button>
                )}
                  </div>

              <div className="flex space-x-2">
                {activeTab === 'setup' && (
                  <Button
                    onClick={handleNextStep}
                    disabled={!setupComplete || loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      'Next'
                    )}
                  </Button>
                )}

                {activeTab === 'config' && (
                  <Button
                    onClick={handleSave}
                    disabled={!configComplete || loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      'Save & Continue'
                    )}
                    </Button>
                )}

                {activeTab === 'test' && (
                  <>
                    {!testComplete && (
                      <div className="text-sm text-orange-600 flex items-center mr-4">
                        <AlertCircle className="h-4 w-4 mr-1" />
                        Test required to finish
                  </div>
                    )}
                    {testComplete && (
                      <Button onClick={handleFinish}>
                        Finish
                      </Button>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Integration Selector Modal */}
            {showIntegrationSelector && (
              <IntegrationSelector
                open={showIntegrationSelector}
                onClose={() => setShowIntegrationSelector(false)}
                selectedApp={selectedApp}
                selectedIntegration={selectedIntegration}
                onIntegrationSelected={setSelectedIntegration}
                integrations={integrations}
                onIntegrationsUpdated={loadIntegrations}
              />
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
