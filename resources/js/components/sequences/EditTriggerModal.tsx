import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, AlertCircle, CheckCircle, Settings, TestTube, Play, User, ExternalLink, Key, Globe, Zap, ChevronDown, List } from 'lucide-react';
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
  triggers_count: number;
  triggers?: TriggerEvent[];
  id: number;
  auth_requirements?: {
    type: string;
    fields: Array<{
      key: string;
      label: string;
      type: string;
      required: boolean;
      placeholder?: string;
      help?: string;
    }>;
  };
}

interface TriggerEvent {
  key: string;
  label: string;
  description: string;
  app: string;
  requires_auth: boolean;
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

interface CreatedTrigger {
  id: number;
  name: string;
  app_id: number;
  trigger_key: string;
  configuration: Record<string, unknown>;
  app?: {
    name: string;
    icon_url?: string;
    color?: string;
  };
}

interface TestStepProps {
  testResult: {
    error?: string;
    success?: boolean;
    message?: string;
    error_details?: unknown;
    status?: number;
    data?: {
      trigger_id?: number;
      trigger_name?: string;
      latest_event?: {
        id: number;
        source: string;
        created_at: string;
        status: string;
      };
      result?: unknown;
      timestamp?: string;
      is_example?: boolean;
      example_note?: string;
    };
    [key: string]: unknown;
  } | null;
  testLoading: boolean;
  handleTestTrigger: () => void;
}

interface EditTriggerModalProps {
  open: boolean;
  onClose: () => void;
  trigger: CreatedTrigger;
  onTriggerUpdated: (trigger: CreatedTrigger) => void;
}

interface IntegrationSetupModalProps {
  open: boolean;
  onClose: () => void;
  app: App | null;
  onIntegrationCreated: () => void;
}

function IntegrationSetupModal({ open, onClose, app, onIntegrationCreated }: IntegrationSetupModalProps) {
  const [step, setStep] = useState<'intro' | 'oauth' | 'api-keys' | 'testing'>('intro');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [integrationName, setIntegrationName] = useState('');
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [subdomain, setSubdomain] = useState('');

  useEffect(() => {
    if (app) {
      setIntegrationName(`${app.name} Integration`);
      setSubdomain('');
    }
  }, [app]);

  const handleOAuthFlow = () => {
    if (!app) return;

    // Open OAuth flow in new window
    const oauthUrl = `/automation/integrations/setup/oauth?app=${app.key}&integration_name=${encodeURIComponent(integrationName)}`;
    const oauthWindow = window.open(oauthUrl, 'oauth_flow', 'width=600,height=700,scrollbars=yes,resizable=yes');

    // Listen for OAuth completion
    const checkOAuthComplete = setInterval(() => {
      if (oauthWindow?.closed) {
        clearInterval(checkOAuthComplete);
        // Check if integration was created successfully
        checkIntegrationStatus();
      }
    }, 1000);
  };

  const handleApiKeySetup = async () => {
    if (!app || !integrationName || !clientId || !clientSecret) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await axios.post('/automation/integrations', {
        app_key: app.key,
        name: integrationName,
        type: 'api',
        connection_config: {
          client_id: clientId,
          client_secret: clientSecret,
          subdomain: subdomain,
        },
      });

      if (response.data.success) {
        setStep('testing');
        onIntegrationCreated();
      }
    } catch (error) {
      console.error('Failed to create integration:', error);
      if (axios.isAxiosError(error)) {
        setError(error.response?.data?.message || 'Failed to create integration');
      } else {
        setError('An unexpected error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  const checkIntegrationStatus = async () => {
    try {
      const response = await axios.get('/automation/integrations');
      const appIntegrations = response.data.data?.filter((integration: Integration) =>
        integration.app.key === app?.key
      ) || [];

      const hasActiveIntegration = appIntegrations.some((integration: Integration) =>
        integration.current_state === 'active'
      );

      if (hasActiveIntegration) {
        onIntegrationCreated();
        onClose();
      }
    } catch (error) {
      console.error('Failed to check integration status:', error);
    }
  };

  const handleClose = () => {
    setStep('intro');
    setError(null);
    setIntegrationName('');
    setClientId('');
    setClientSecret('');
    setSubdomain('');
    onClose();
  };

    if (!app) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Setup {app.name} Integration</DialogTitle>
          <DialogDescription>
            Connect your {app.name} account to use triggers and actions
          </DialogDescription>
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

        {/* Step 1: Intro */}
        {step === 'intro' && (
          <div className="space-y-6 p-6">
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center space-x-4">
                {app.icon_url ? (
                  <img src={app.icon_url} alt={app.name} className="w-16 h-16 rounded-lg" />
                ) : (
                  <div
                    className="w-16 h-16 rounded-lg flex items-center justify-center text-white font-bold text-xl"
                    style={{ backgroundColor: app.color || '#3b82f6' }}
                  >
                    {app.name.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div>
                <h3 className="text-lg font-medium">Connect to {app.name}</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Choose how you'd like to connect your {app.name} account
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* OAuth Option */}
              <Card className="cursor-pointer hover:border-blue-300 transition-colors" onClick={() => setStep('oauth')}>
                <CardContent className="p-4">
                  <div className="text-center space-y-3">
                    <Globe className="h-8 w-8 mx-auto text-blue-500" />
                    <div>
                      <h4 className="font-medium">OAuth (Recommended)</h4>
                      <p className="text-xs text-gray-500 mt-1">
                        Quick and secure connection using {app.name}'s OAuth
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* API Keys Option */}
              <Card className="cursor-pointer hover:border-blue-300 transition-colors" onClick={() => setStep('api-keys')}>
                <CardContent className="p-4">
                  <div className="text-center space-y-3">
                    <Key className="h-8 w-8 mx-auto text-green-500" />
                    <div>
                      <h4 className="font-medium">API Keys</h4>
                      <p className="text-xs text-gray-500 mt-1">
                        Manual setup using API credentials
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="flex justify-end pt-4">
              <Button onClick={handleClose} variant="outline">
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: OAuth Flow */}
        {step === 'oauth' && (
          <div className="space-y-6 p-6">
            <div className="text-center space-y-4">
              <Globe className="h-12 w-12 mx-auto text-blue-500" />
              <div>
                <h3 className="text-lg font-medium">OAuth Connection</h3>
                <p className="text-sm text-gray-500 mt-1">
                  We'll redirect you to {app.name} to authorize the connection
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="integration-name">Integration Name</Label>
                <Input
                  id="integration-name"
                  value={integrationName}
                  onChange={(e) => setIntegrationName(e.target.value)}
                  placeholder="Give this integration a name"
                />
                <p className="text-xs text-gray-500 mt-1">
                  This helps you identify this connection later
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <ExternalLink className="h-5 w-5 text-blue-500 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-sm text-blue-900">What happens next?</h4>
                    <ul className="text-xs text-blue-700 mt-2 space-y-1">
                      <li>• A new window will open with {app.name}'s authorization page</li>
                      <li>• You'll be asked to log in and grant permissions</li>
                      <li>• Once authorized, you'll be redirected back here</li>
                      <li>• The integration will be automatically created</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <Button onClick={() => setStep('intro')} variant="outline">
                Back
              </Button>
              <Button onClick={handleOAuthFlow} disabled={!integrationName.trim()}>
                Start OAuth Flow
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: API Keys Setup */}
        {step === 'api-keys' && (
          <div className="space-y-6 p-6">
            <div className="text-center space-y-4">
              <Key className="h-12 w-12 mx-auto text-green-500" />
              <div>
                <h3 className="text-lg font-medium">API Key Setup</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Enter your {app.name} API credentials
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="integration-name-api">Integration Name</Label>
                <Input
                  id="integration-name-api"
                  value={integrationName}
                  onChange={(e) => setIntegrationName(e.target.value)}
                  placeholder="Give this integration a name"
                />
              </div>

              <div>
                <Label htmlFor="client-id">Client ID *</Label>
                <Input
                  id="client-id"
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  placeholder="Enter your Client ID"
                />
              </div>

              <div>
                <Label htmlFor="client-secret">Client Secret *</Label>
                <Input
                  id="client-secret"
                  type="password"
                  value={clientSecret}
                  onChange={(e) => setClientSecret(e.target.value)}
                  placeholder="Enter your Client Secret"
                />
              </div>

              {app.key === 'kajabi' && (
                <div>
                  <Label htmlFor="subdomain">Subdomain</Label>
                  <Input
                    id="subdomain"
                    value={subdomain}
                    onChange={(e) => setSubdomain(e.target.value)}
                    placeholder="your-site.kajabi.com"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Your Kajabi site subdomain (optional)
                  </p>
                </div>
              )}

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="h-5 w-5 text-yellow-500 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-sm text-yellow-900">Security Note</h4>
                    <p className="text-xs text-yellow-700 mt-1">
                      Your API credentials are encrypted and stored securely. Never share these credentials with anyone.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <Button onClick={() => setStep('intro')} variant="outline">
                Back
              </Button>
              <Button onClick={handleApiKeySetup} disabled={loading || !integrationName.trim() || !clientId.trim() || !clientSecret.trim()}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Integration'
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Step 4: Testing */}
        {step === 'testing' && (
          <div className="space-y-6">
            <div className="text-center space-y-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-medium">Integration Created!</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Your {app.name} integration has been successfully created
                </p>
              </div>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                <div>
                  <h4 className="font-medium text-sm text-green-900">Ready to use</h4>
                  <p className="text-xs text-green-700 mt-1">
                    You can now use {app.name} triggers and actions in your workflows
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <Button onClick={handleClose}>
                Continue
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
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

// Helper function to check if test result has example error
function hasExampleError(testResult: unknown): boolean {
  return Boolean(testResult &&
    typeof testResult === 'object' &&
    testResult !== null &&
    'data' in testResult &&
    testResult.data &&
    typeof testResult.data === 'object' &&
    testResult.data !== null &&
    'result' in testResult.data &&
    testResult.data.result &&
    typeof testResult.data.result === 'object' &&
    testResult.data.result !== null &&
    'error' in testResult.data.result);
}

// Helper function to get example error message
function getExampleErrorMessage(testResult: unknown): string {
  if (hasExampleError(testResult)) {
    const typedResult = testResult as { data: { result: Record<string, unknown> } };
    return String(typedResult.data.result.error);
  }
  return '';
}

// Enhanced Test Step Component
function TestStep({ testResult, testLoading, handleTestTrigger }: TestStepProps) {
  return (
    <TabsContent value="test" className="absolute inset-0 data-[state=inactive]:hidden">
      <div className="h-full overflow-y-auto px-6 py-4">
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium mb-4">Test Trigger</h3>
          </div>

          <div className="space-y-4">
            <Card>
              <CardContent className="p-4">
                <div className="text-center space-y-4">
                  <TestTube className="h-12 w-12 mx-auto text-blue-500" />
                  <div>
                    <h4 className="font-medium">Test Your Trigger</h4>
                    <p className="text-sm text-gray-500 mt-1">
                      Find and analyze the most recent trigger event to verify your trigger is working correctly
                    </p>
                  </div>
                  <Button
                    onClick={handleTestTrigger}
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
                  {testResult.error || hasExampleError(testResult) ? (
                    <div className="space-y-3">
                      <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <AlertCircle className="h-4 w-4 text-red-500" />
                          <div className="flex-1">
                            <p className="text-sm text-red-700 font-medium">
                              {hasExampleError(testResult) ? 'Example Data Generation Failed' : 'Test Failed'}
                            </p>
                            <p className="text-xs text-red-600 mt-1">
                              {hasExampleError(testResult) ? getExampleErrorMessage(testResult) : testResult.error}
                            </p>
                            {hasExampleError(testResult) && (
                              <p className="text-xs text-amber-600 mt-1">
                                💡 This error occurred while generating example data. Fix the trigger configuration or create some real trigger events.
                              </p>
                            )}
                            {typeof testResult.status === 'number' && (
                              <p className="text-xs text-red-500 mt-1">Status: {String(testResult.status)}</p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Error Details */}
                      {testResult.error_details && typeof testResult.error_details === 'object' && testResult.error_details !== null ? (
                        <details className="group">
                          <summary className="cursor-pointer text-sm font-medium text-red-600 hover:text-red-700 flex items-center space-x-1">
                            <ChevronDown className="h-3 w-3 transition-transform group-open:rotate-180" />
                            <span>Error Details</span>
                          </summary>
                          <div className="mt-2 bg-red-50 rounded p-3 border border-red-200">
                            <pre className="text-xs overflow-auto max-h-32 text-red-700">
                              {JSON.stringify(testResult.error_details, null, 2) || 'No error details available'}
                            </pre>
                          </div>
                        </details>
                      ) : null}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <p className="text-sm text-green-700">
                            {testResult.data?.is_example
                              ? 'Test completed with example data!'
                              : 'Test completed successfully!'
                            }
                          </p>
                        </div>
                        {testResult.data?.timestamp && (
                          <p className="text-xs text-green-600 mt-1">
                            Executed at {new Date(testResult.data.timestamp).toLocaleString()}
                          </p>
                        )}
                        {testResult.data?.is_example && (
                          <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs">
                            <p className="text-blue-700 font-medium">📋 Using Example Data</p>
                            <p className="text-blue-600">
                              No real trigger events found, so we're showing example data for testing.
                              This gives you an idea of what data will be available when the trigger actually fires.
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Latest Event Info */}
                      {testResult.data?.latest_event && typeof testResult.data.latest_event === 'object' && (
                        <div className="space-y-3">
                          <div className="flex items-center space-x-2">
                            <div className={`w-2 h-2 rounded-full ${
                              testResult.data.is_example ? 'bg-blue-500' : 'bg-purple-500'
                            }`}></div>
                            <h5 className="font-medium text-sm">
                              {testResult.data.is_example ? 'Example Trigger Event' : 'Latest Trigger Event'}
                            </h5>
                          </div>
                          <div className={`rounded-lg p-3 border ${
                            testResult.data.is_example
                              ? 'bg-blue-50 border-blue-200'
                              : 'bg-purple-50 border-purple-200'
                          }`}>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              {testResult.data.latest_event.id && (
                                <div><strong>Event ID:</strong> {testResult.data.latest_event.id}</div>
                              )}
                              <div><strong>Source:</strong> {testResult.data.latest_event.source}</div>
                              <div><strong>Status:</strong> {testResult.data.latest_event.status}</div>
                              <div><strong>Created:</strong> {new Date(testResult.data.latest_event.created_at).toLocaleString()}</div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Trigger Output */}
                      {testResult.data?.result !== undefined && (
                        <div className="space-y-3">
                          <div className="flex items-center space-x-2">
                            <div className={`w-2 h-2 rounded-full ${
                              testResult.data.is_example ? 'bg-blue-500' : 'bg-blue-500'
                            }`}></div>
                            <h5 className="font-medium text-sm">
                              {testResult.data.is_example ? 'Example Event Data' : 'Trigger Event Data'}
                            </h5>
                          </div>
                          <div className="bg-gray-50 rounded-lg p-3 border">
                            <pre className="text-xs overflow-auto max-h-48 whitespace-pre-wrap">
                              {testResult.data.result !== undefined ? safeStringify(testResult.data.result) : 'No event data'}
                            </pre>
                          </div>

                          {/* Example Data Note */}
                          {testResult.data.is_example &&
                            testResult.data.result &&
                            typeof testResult.data.result === 'object' &&
                            testResult.data.result !== null &&
                            'example_note' in testResult.data.result && (
                             <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded border border-blue-200">
                               <p className="font-medium text-blue-700 mb-1">ℹ️ About This Data:</p>
                               <p>{String((testResult.data.result as Record<string, unknown>).example_note)}</p>
                             </div>
                           )}

                          {/* Available Fields Info */}
                          <div className="text-xs text-gray-500 bg-blue-50 p-2 rounded border border-blue-200">
                            <p className="font-medium text-blue-700 mb-1">💡 JSON Schema Generated:</p>
                            <p>This trigger event data structure has been analyzed and a JSON Schema was automatically generated. The field mappings are now available for use in subsequent actions and can be referenced using dot notation (e.g., <code className="bg-blue-100 px-1 rounded">customer.email</code>).</p>
                          </div>
                        </div>
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

export function EditTriggerModal({ open, onClose, trigger, onTriggerUpdated }: EditTriggerModalProps) {
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
  const [selectedTriggerEvent, setSelectedTriggerEvent] = useState<TriggerEvent | null>(null);
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);
  const [apps, setApps] = useState<App[]>([]);
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [showIntegrationSetup, setShowIntegrationSetup] = useState(false);
  const [showIntegrationSelector, setShowIntegrationSelector] = useState(false);
  const [showAppSelector, setShowAppSelector] = useState(false);
  const [showTriggerSelector, setShowTriggerSelector] = useState(false);
  const [showAccountSelector, setShowAccountSelector] = useState(false);

  // Config tab state
  const [triggerName, setTriggerName] = useState('');
  const [configuration, setConfiguration] = useState<Record<string, unknown>>({});

  // Test tab state
  const [testResult, setTestResult] = useState<{ error?: string; [key: string]: unknown } | null>(null);
  const [testLoading, setTestLoading] = useState(false);


  // Listen for integration messages from popup window
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'INTEGRATION_CREATED') {
        // Refresh integrations list
        loadIntegrations();
      } else if (event.data.type === 'INTEGRATION_SELECTED') {
        // Set the selected integration
        setSelectedIntegration(event.data.integration);
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
      if (trigger) {
        setTriggerName(trigger.name);
        setConfiguration(trigger.configuration || {});

        // Initialize selected app, trigger event, and integration from existing trigger data
        if (trigger.app_id && trigger.app_id > 0) {
          // Find the app that matches the trigger's app_id
          const findAndSetApp = async () => {
            try {
              const response = await axios.get('/automation/apps');
              const availableApps = response.data.data || [];

              // Find app by ID
              const matchingApp = availableApps.find((app: App) =>
                app.id === trigger.app_id
              );

              if (matchingApp) {
                setSelectedApp(matchingApp);

                // Update the trigger object with app info if it was missing
                if (!trigger.app) {
                  trigger.app = {
                    name: matchingApp.name,
                    icon_url: matchingApp.icon_url,
                    color: matchingApp.color,
                  };
                }

                // Find the trigger event by trigger_key
                const triggerEvent = matchingApp.triggers?.find((t: TriggerEvent) =>
                  t.key === trigger.trigger_key
                );

                if (triggerEvent) {
                  setSelectedTriggerEvent(triggerEvent);

                  // If this trigger requires auth, check for existing integrations
                  if (triggerEvent.requires_auth) {
                    // This will be handled by the separate integration effect
                  }
                }
              }
              setInitializing(false);
            } catch (error) {
              console.error('Failed to initialize app and trigger event:', error);
              setInitializing(false);
            }
          };

          findAndSetApp();
        } else {
          setInitializing(false);
        }

        // If there's integration data, find and set the integration
        // This will be set once integrations are loaded
      } else {
        setInitializing(false);
      }
    } else {
      // Reset state when modal closes
      setSelectedApp(null);
      setSelectedTriggerEvent(null);
      setSelectedIntegration(null);
      setTriggerName('');
      setConfiguration({});
      setInitializing(true);
    }
  }, [open, trigger]);

  // Separate effect to set integration once integrations are loaded
  useEffect(() => {
    if (trigger && integrations.length > 0) {
      let matchingIntegration = null;

      // Try to find integration by app name first (most reliable since we have it from trigger.app.name)
      if (trigger.app?.name) {
        matchingIntegration = integrations.find((integration: Integration) =>
          integration?.app?.name === trigger.app?.name
        );
      }

      // If not found and we have app_id, try to find by app_id
      if (!matchingIntegration && trigger.app_id) {
        matchingIntegration = integrations.find((integration: Integration) =>
          integration?.app?.id === trigger.app_id
        );
      }

      if (matchingIntegration) {
        setSelectedIntegration(matchingIntegration);
      }
    }
  }, [trigger, integrations]);

  // Check step completion
  useEffect(() => {
    // Setup step is complete when we have app, trigger event, and integration (if required)
    const setupValid = selectedApp && selectedTriggerEvent &&
      (!selectedTriggerEvent.requires_auth || selectedIntegration);
    setSetupComplete(!!setupValid);

    // Config step is complete when we have a name
    const configValid = triggerName.trim().length > 0;
    setConfigComplete(configValid);
  }, [selectedApp, selectedTriggerEvent, selectedIntegration, triggerName]);

  // Reset test completion when configuration changes
  useEffect(() => {
    setTestComplete(false);
    setTestResult(null);
  }, [selectedApp, selectedTriggerEvent, selectedIntegration, configuration]);

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

  const handleAppSelect = (app: App) => {
    setSelectedApp(app);
    setSelectedTriggerEvent(null);
    setSelectedIntegration(null);
    setShowAppSelector(false);
  };

  const handleTriggerEventSelect = (triggerEvent: TriggerEvent) => {
    setSelectedTriggerEvent(triggerEvent);

    // Check if this trigger requires auth
    if (triggerEvent.requires_auth) {
      const appIntegrations = integrations.filter(integration =>
        integration.app.key === selectedApp?.key
      );
      const hasActiveIntegration = appIntegrations.some(integration =>
        integration.current_state === 'active'
      );

      if (!hasActiveIntegration) {
        setShowIntegrationSetup(true);
      }
    }
    setShowTriggerSelector(false);
  };

  const handleIntegrationSelect = (integration: Integration) => {
    setSelectedIntegration(integration);
    setShowIntegrationSetup(false);
    setShowAccountSelector(false);
  };

  const handleIntegrationCreated = () => {
    setShowIntegrationSetup(false);
    loadIntegrations(); // Refresh integrations list
  };



  const handleSave = async () => {
    if (!trigger) return;

    try {
      setLoading(true);
      setError(null);
      setValidationErrors({});

      const payload = {
        name: triggerName,
        app_id: selectedApp?.id,
        trigger_key: selectedTriggerEvent?.key,
        configuration: configuration,
      };

      const response = await axios.put(`/automation/triggers/${trigger.id}`, payload);

      // Don't call onTriggerUpdated here - only on final finish
      // onTriggerUpdated(response.data.data);

      // Progress to next step instead of closing
      if (activeTab === 'setup' && setupComplete) {
        setActiveTab('config');
      } else if (activeTab === 'config' && configComplete) {
        setActiveTab('test');
      }

      return response.data.data; // Return the updated trigger for handleFinish
    } catch (error) {
      console.error('Failed to update trigger:', error);

      if (axios.isAxiosError(error) && error.response?.status === 422) {
        setValidationErrors(error.response.data.errors || {});
      } else if (axios.isAxiosError(error)) {
        setError(error.response?.data?.message || 'Failed to update trigger. Please try again.');
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleTestTrigger = async () => {
    if (!trigger) return;

    try {
      setTestLoading(true);
      setTestResult(null);

      const response = await axios.post(`/automation/triggers/${trigger.id}/tests`);
      setTestResult(response.data);

      // Mark test as complete if successful
      // Check for errors in both the main response and nested in example result data
      const hasMainError = response.data.error;
      const hasExampleErrorResult = hasExampleError(response.data);

      if (response.data && !hasMainError && !hasExampleErrorResult) {
        setTestComplete(true);
      }
    } catch (error: unknown) {
      console.error('Failed to test trigger:', error);

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
      const updatedTrigger = await handleSave();
      // Only call onTriggerUpdated when actually finishing
      onTriggerUpdated(updatedTrigger);
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

  if (!trigger) return null;

  const openIntegrationManager = () => {
    if (!selectedApp) return;

    const managerUrl = `/automation/integrations?app_key=${selectedApp.key}`;
    window.open(managerUrl, 'integration_manager', 'width=800,height=700,scrollbars=yes,resizable=yes');
  };

  const openIntegrationEdit = (integration?: Integration) => {
    if (!integration) {
      openIntegrationManager();
      return;
    }

    const editUrl = `/automation/integrations/${integration.id}/edit`;
    window.open(editUrl, 'integration_edit', 'width=600,height=700,scrollbars=yes,resizable=yes');
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent variant="wizard" className="overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <DialogTitle>Edit Trigger</DialogTitle>
          <DialogDescription>
            Configure and test your trigger settings
          </DialogDescription>
        </DialogHeader>

        {/* Show loading state while initializing */}
        {initializing ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2 text-sm text-gray-600">Loading trigger data...</span>
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

                  {/* Setup Tab */}
                  <TabsContent value="setup" className="absolute inset-0 data-[state=inactive]:hidden">
                    <div className="h-full overflow-y-auto px-6 py-4">
                      <div className="space-y-6">

                        {/* App Selection */}
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">App *</Label>
                          {selectedApp ? (
                            <div className="border border-blue-300 bg-blue-50">
                              <div className="p-3">
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
                              </div>
                            </div>
                          ) : (
                            <div className="border-2 border-dashed border-gray-300 hover:border-gray-400 transition-colors cursor-pointer" onClick={() => setShowAppSelector(true)}>
                              <div className="p-4">
                                <div className="flex items-center space-x-3">
                                  <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center">
                                    <Zap className="h-4 w-4 text-gray-400" />
                                  </div>
                                  <div>
                                    <p className="font-medium text-sm text-gray-700">Choose an app</p>
                                    <p className="text-xs text-gray-500">Select the app that will trigger this automation</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Trigger Event Selection */}
                        <div className="space-y-2">
                  <Label className="text-sm font-medium">Trigger event *</Label>
                  {selectedTriggerEvent ? (
                    <div className="border border-blue-300 bg-blue-50">
                      <div className="p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium text-sm">{selectedTriggerEvent.label}</h4>
                            <p className="text-xs text-gray-500">{selectedTriggerEvent.description}</p>
                            <div className="flex items-center space-x-2 mt-1">
                              {selectedTriggerEvent.requires_auth && (
                                <Badge variant="outline" className="text-xs">
                                  Requires Auth
                                </Badge>
                              )}
                              <Badge variant="secondary" className="text-xs">
                                {selectedTriggerEvent.key}
                              </Badge>
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowTriggerSelector(true)}
                            disabled={!selectedApp}
                          >
                            Change
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className={`border-2 border-dashed transition-colors ${
                      selectedApp
                        ? 'border-gray-300 hover:border-gray-400 cursor-pointer'
                        : 'border-gray-200 cursor-not-allowed'
                    }`} onClick={() => selectedApp && setShowTriggerSelector(true)}>
                      <div className="p-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center">
                            <Play className="h-4 w-4 text-gray-400" />
                          </div>
                          <div>
                            <p className={`font-medium text-sm ${!selectedApp ? 'text-gray-400' : 'text-gray-700'}`}>
                              Choose an event
                            </p>
                            <p className="text-xs text-gray-500">
                              {selectedApp ? 'Select the event that will trigger this automation' : 'Select an app first'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Account/Integration Selection - ENHANCED */}
                {selectedTriggerEvent && selectedTriggerEvent.requires_auth && (
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
                      <Card className="border-2 border-dashed border-gray-300 bg-gray-50 cursor-pointer hover:border-gray-400 transition-colors" onClick={() => openIntegrationManager()}>
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
                  {selectedApp && !selectedTriggerEvent && (
                    <div className="text-center p-3 bg-gray-50 rounded text-sm text-gray-600">
                      To continue, choose an event
                    </div>
                  )}
                  {selectedApp && selectedTriggerEvent && selectedTriggerEvent.requires_auth && !selectedIntegration && (
                    <div className="text-center p-3 bg-orange-50 rounded text-sm text-orange-600">
                      To continue, setup your {selectedApp.name} integration above
                    </div>
                  )}
                  {selectedApp && selectedTriggerEvent && (!selectedTriggerEvent.requires_auth || selectedIntegration) && (
                    <div className="text-center p-3 bg-green-50 rounded text-sm text-green-600">
                      ✓ Setup complete! You can now configure and test your trigger.
                    </div>
                  )}
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  {/* Config Tab */}
                  <TabsContent value="config" className="absolute inset-0 data-[state=inactive]:hidden">
                    <div className="h-full overflow-y-auto px-6 py-4">
                      <div className="space-y-6">
                        <h3 className="text-lg font-medium">Configure Trigger</h3>

                        {/* Trigger Name */}
                        <div className="space-y-2">
                          <Label htmlFor="trigger-name">Trigger Name</Label>
                          <Input
                            id="trigger-name"
                            value={triggerName}
                            onChange={(e) => setTriggerName(e.target.value)}
                            placeholder="Give this trigger a descriptive name"
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

                          {selectedTriggerEvent?.props && Object.keys(selectedTriggerEvent.props).length > 0 ? (
                            <Card>
                              <CardContent className="p-4 space-y-4">
                                {Object.values(selectedTriggerEvent.props).map((field) => (
                                  <TriggerConfigField
                                    key={field.key}
                                    field={field}
                                    value={configuration[field.key]}
                                    onChange={(value) => setConfiguration(prev => ({ ...prev, [field.key]: value }))}
                                    appKey={selectedApp?.key || ''}
                                    integrationId={selectedIntegration?.id}
                                    error={validationErrors[field.key]?.[0]}
                                    requiresAuth={selectedTriggerEvent?.requires_auth || false}
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
                                  <p className="text-sm">This trigger doesn't need any additional configuration</p>
                                </div>
                              </CardContent>
                            </Card>
                          )}

                          {/* Configuration Preview */}
                          {Object.keys(configuration).length > 0 && (
                            <div className="space-y-2">
                              <div className="flex items-center space-x-2">
                                <Settings className="h-4 w-4 text-gray-500" />
                                <h4 className="font-medium">Configuration Preview</h4>
                              </div>
                              <Card>
                                <CardContent className="p-4">
                                  <pre className="text-xs bg-gray-50 p-3 rounded overflow-auto max-h-64 whitespace-pre-wrap">
                                    {JSON.stringify(configuration, null, 2)}
                                  </pre>
                                </CardContent>
                              </Card>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  {/* Test Tab */}
                  <TestStep
                    testResult={testResult}
                    testLoading={testLoading}
                    handleTestTrigger={handleTestTrigger}
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

            {/* App Selector Modal */}
            {showAppSelector && (
              <Dialog open={showAppSelector} onOpenChange={setShowAppSelector}>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Choose App</DialogTitle>
                    <DialogDescription>
                      Select the app that will trigger this automation.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {apps.map((app) => (
                      <div
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
                      </div>
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

            {/* Trigger Event Selector Modal */}
            {showTriggerSelector && (
              <Dialog open={showTriggerSelector} onOpenChange={setShowTriggerSelector}>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Choose Trigger Event</DialogTitle>
                    <DialogDescription>
                      Select the event that will trigger this automation.
                    </DialogDescription>
                  </DialogHeader>
                  {selectedApp ? (
                    <div className="space-y-2">
                      {selectedApp.triggers?.map((triggerEvent) => (
                        <Card
                          key={triggerEvent.key}
                          className={`cursor-pointer transition-colors ${
                            selectedTriggerEvent?.key === triggerEvent.key ? 'border-blue-500 bg-blue-50' : 'hover:border-gray-300'
                          }`}
                          onClick={() => handleTriggerEventSelect(triggerEvent)}
                        >
                          <CardContent className="p-3">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <h4 className="font-medium text-sm">{triggerEvent.label}</h4>
                                <p className="text-xs text-gray-500">{triggerEvent.description}</p>
                                <div className="flex items-center space-x-2 mt-2">
                                  {triggerEvent.requires_auth && (
                                    <Badge variant="outline" className="text-xs">
                                      Requires Auth
                                    </Badge>
                                  )}
                                  <Badge variant="secondary" className="text-xs">
                                    {triggerEvent.key}
                                  </Badge>
                                </div>
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
                    <Button onClick={() => setShowTriggerSelector(false)} variant="outline">
                      Cancel
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}

            {/* Account Selector Modal */}
            {showAccountSelector && (
              <Dialog open={showAccountSelector} onOpenChange={setShowAccountSelector}>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Choose Account</DialogTitle>
                    <DialogDescription>
                      Select or create an account for {selectedApp?.name}.
                    </DialogDescription>
                  </DialogHeader>
                  {selectedApp ? (
                    <div className="space-y-2">
                      {integrations
                        .filter(integration => integration.app.key === selectedApp.key)
                        .map((integration) => (
                          <Card
                            key={integration.id}
                            className={`cursor-pointer transition-colors ${
                              selectedIntegration?.id === integration.id ? 'border-blue-500 bg-blue-50' : 'hover:border-gray-300'
                            }`}
                            onClick={() => handleIntegrationSelect(integration)}
                          >
                            <CardContent className="p-3">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                  <User className="h-4 w-4 text-gray-500" />
                                  <div>
                                    <h4 className="font-medium text-sm">{integration.name}</h4>
                                    <p className="text-xs text-gray-500">{integration.app.name}</p>
                                    <Badge
                                      variant={integration.current_state === 'active' ? 'default' : 'secondary'}
                                      className="text-xs mt-1"
                                    >
                                      {integration.current_state}
                                    </Badge>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      <Button
                        onClick={() => setShowAccountSelector(false)}
                        variant="outline"
                        className="w-full"
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={() => setShowIntegrationSetup(true)}
                        variant="outline"
                        className="w-full"
                      >
                        + Create New Integration
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600">Please select an app first.</p>
                    </div>
                  )}
                </DialogContent>
              </Dialog>
            )}

            {/* Integration Setup Modal */}
            {showIntegrationSetup && (
              <IntegrationSetupModal
                open={showIntegrationSetup}
                onClose={() => setShowIntegrationSetup(false)}
                app={selectedApp}
                onIntegrationCreated={handleIntegrationCreated}
              />
            )}

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
