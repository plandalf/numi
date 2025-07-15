import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import axios from 'axios';

interface TriggerConfig {
  name: string;
  description: string;
  webhook_events?: string[];
  output_schema?: Record<string, unknown>;
}

interface TriggerProp {
  type: string;
  label?: string;
  description?: string;
  required?: boolean;
  help?: string;
  placeholder?: string;
  dynamic?: string;
}

interface DiscoveredTrigger {
  key: string;
  noun: string;
  label: string;
  description: string;
  props: Record<string, TriggerProp>;
  class: string;
  app: string;
}

interface ActionConfig {
  name: string;
  description: string;
  input_schema?: Record<string, unknown>;
  output_schema?: Record<string, unknown>;
}

interface App {
  id: number;
  key: string;
  name: string;
  description: string;
  icon_url: string;
  color: string;
  category: string;
  triggers: Record<string, TriggerConfig>;
  actions: Record<string, ActionConfig>;
}

interface Integration {
  id: number;
  uuid: string;
  app_id: number;
  name: string;
  type: string;
  current_state: 'active' | 'inactive' | 'created' | 'error';
  app?: {
    id: number;
    key: string;
    name: string;
    icon_url: string;
    color: string;
  };
}

interface AddTriggerModalProps {
  open: boolean;
  onClose: () => void;
  sequenceId: number;
  onTriggerAdded: (trigger: unknown) => void;
}

export function AddTriggerModal({ open, onClose, sequenceId, onTriggerAdded }: AddTriggerModalProps) {
  const [step, setStep] = useState<'select-app' | 'select-integration' | 'select-trigger' | 'configure'>('select-app');
  const [selectedApp, setSelectedApp] = useState<App | null>(null);
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);
  const [selectedTrigger, setSelectedTrigger] = useState('');
  const [selectedDiscoveredTrigger, setSelectedDiscoveredTrigger] = useState<DiscoveredTrigger | null>(null);
  const [triggerName, setTriggerName] = useState('');
  const [integrationName, setIntegrationName] = useState('');
  const [credentials, setCredentials] = useState<Record<string, string>>({});
  const [credentialErrors, setCredentialErrors] = useState<Record<string, string>>({});
  const [showCreateIntegration, setShowCreateIntegration] = useState(false);
  const [connectionTested, setConnectionTested] = useState(false);
  const [testResult, setTestResult] = useState<{success: boolean; message: string} | null>(null);
  const [editingIntegration, setEditingIntegration] = useState<Integration | null>(null);
  const [creating, setCreating] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [discoveredTriggers, setDiscoveredTriggers] = useState<DiscoveredTrigger[]>([]);
  const [triggerConfiguration, setTriggerConfiguration] = useState<Record<string, unknown>>({});
  const [resourceOptions, setResourceOptions] = useState<Record<string, Array<{value: string; label: string}>>>({});
  const [loadingResources, setLoadingResources] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (open) {
      loadIntegrations();
      loadDiscoveredTriggers();
    }
  }, [open]);

  const loadIntegrations = async () => {
    try {
      const response = await axios.get('/automation-integrations');
      setIntegrations(response.data.integrations || []);
    } catch (error) {
      console.error('Failed to load integrations:', error);
    }
  };

  const loadDiscoveredTriggers = async () => {
    try {
      const response = await axios.get('/discovered/triggers');
      setDiscoveredTriggers(response.data || []);
    } catch (error) {
      console.error('Failed to load discovered triggers:', error);
    }
  };

  const getAppIdByKey = async (appKey: string): Promise<number | null> => {
    try {
      const response = await axios.get('/apps');
      const app = response.data.apps.find((a: { key: string; id: number }) => a.key === appKey);
      return app ? app.id : null;
    } catch (error) {
      console.error('Failed to get app ID:', error);
      return null;
    }
  };

  const loadResourceOptions = async (resourceKey: string, search?: string) => {
    if (!selectedIntegration) return;

    setLoadingResources(prev => ({ ...prev, [resourceKey]: true }));

    try {
      const response = await axios.post('/discovered/resources/search', {
        app: selectedApp?.key,
        resource: resourceKey,
        integration_id: selectedIntegration.id,
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

  const handleAppSelect = (app: { key: string; name: string; color: string }) => {
    setSelectedApp({
      id: 0,
      key: app.key,
      name: app.name,
      description: '',
      icon_url: '',
      color: app.color,
      category: 'automation',
      triggers: {},
      actions: {}
    });
    setIntegrationName(`${app.name} Integration`);
    setCredentials({});
    setCredentialErrors({});
    setConnectionTested(false);
    setTestResult(null);
    setEditingIntegration(null);
    setStep('select-integration');
  };

  const handleCreateIntegration = () => {
    setShowCreateIntegration(true);
    setConnectionTested(false);
    setTestResult(null);
    setCredentialErrors({});
  };

  const validateKajabiSubdomain = (subdomain: string): { valid: boolean; error?: string } => {
    if (!subdomain || subdomain.trim() === '') {
      return { valid: false, error: 'Subdomain is required' };
    }

    // Remove any .kajabi.com suffix if user included it
    const cleanSubdomain = subdomain.replace(/\.kajabi\.com$/, '');

    // Check if it's just a number (common mistake)
    if (/^\d+$/.test(cleanSubdomain)) {
      return {
        valid: false,
        error: 'Subdomain cannot be just a number. Use your actual Kajabi site name (e.g., "mycompany" for mycompany.kajabi.com)'
      };
    }

    // Check for invalid characters
    if (!/^[a-zA-Z0-9-]+$/.test(cleanSubdomain)) {
      return {
        valid: false,
        error: 'Subdomain can only contain letters, numbers, and hyphens'
      };
    }

    // Check minimum length
    if (cleanSubdomain.length < 3) {
      return {
        valid: false,
        error: 'Subdomain must be at least 3 characters long'
      };
    }

    return { valid: true };
  };

  const getHelpfulErrorMessage = (message: string): string => {
    if (message.includes('Could not resolve host')) {
      if (message.includes('.kajabi.com')) {
        const match = message.match(/(\w+)\.kajabi\.com/);
        const attemptedSubdomain = match ? match[1] : 'unknown';
        return `❌ Invalid subdomain "${attemptedSubdomain}". Please check your Kajabi site URL and enter the correct subdomain.`;
      }
    }

    if (message.includes('Unauthorized') || message.includes('401')) {
      return '❌ Invalid API credentials. Please check your Client ID and Client Secret in your Kajabi settings.';
    }

    if (message.includes('403') || message.includes('Forbidden')) {
      return '❌ API access forbidden. Make sure your API credentials have the required permissions.';
    }

    if (message.includes('timeout') || message.includes('timed out')) {
      return '❌ Connection timeout. Please check your internet connection and try again.';
    }

    // If it's a DNS resolution error, provide specific guidance
    if (message.includes('Could not resolve host')) {
      return '❌ Cannot find your Kajabi site. Please verify your subdomain is correct.';
    }

    return message;
  };

  const getResolutionSteps = (message: string): string[] => {
    const steps = [];

    if (message.includes('Could not resolve host') || message.includes('Invalid subdomain')) {
      steps.push('1. Go to your Kajabi site in a web browser');
      steps.push('2. Look at the URL - it should be something like "mycompany.kajabi.com"');
      steps.push('3. Enter just the subdomain part: "mycompany" (without .kajabi.com)');
      steps.push('4. Common examples: "mybusiness", "myschool", "coaching123"');
    }

    if (message.includes('Unauthorized') || message.includes('401')) {
      steps.push('1. Log into your Kajabi account');
      steps.push('2. Go to Settings → Integrations');
      steps.push('3. Find the API section and copy your Client ID and Client Secret');
      steps.push('4. Make sure the API is enabled for your account');
    }

    if (message.includes('403') || message.includes('Forbidden')) {
      steps.push('1. Check if your Kajabi plan includes API access');
      steps.push('2. Verify your API credentials have the required permissions');
      steps.push('3. Try regenerating your API credentials in Kajabi settings');
    }

    return steps;
  };

  const createIntegration = async () => {
    if (!selectedApp) return;

    try {
      setCreating(true);

      // Get the actual app ID from the database
      const appId = await getAppIdByKey(selectedApp.key);
      if (!appId) {
        throw new Error(`App ${selectedApp.key} not found in database`);
      }

      const response = await axios.post('/automation-integrations', {
        app_id: appId,
        name: integrationName,
        credentials,
      });

      const newIntegration = response.data.integration;
      const testResult = response.data.test_result;

      setIntegrations(prev => [...prev, newIntegration]);
      setSelectedIntegration(newIntegration);
      setTestResult({
        ...testResult,
        message: getHelpfulErrorMessage(testResult.message)
      });

      if (testResult.success) {
        setConnectionTested(true);
        setShowCreateIntegration(false);
        setTimeout(() => {
          setStep('select-trigger');
        }, 2000);
      } else {
        // Keep the form open so user can edit credentials
        setEditingIntegration(newIntegration);
      }
    } catch (error: unknown) {
      console.error('Failed to create integration:', error);
      const errorMessage = ((error as {response?: {data?: {message?: string}}})?.response?.data?.message || (error as Error)?.message);
      setTestResult({
        success: false,
        message: getHelpfulErrorMessage('Failed to create integration: ' + errorMessage)
      });
    } finally {
      setCreating(false);
    }
  };

  const testConnection = async (integration: Integration) => {
    try {
      setTestingConnection(true);
      setTestResult(null);
      const response = await axios.get(`/automation-integrations/${integration.uuid}/test`);

      setTestResult({
        ...response.data,
        message: getHelpfulErrorMessage(response.data.message)
      });

      if (response.data.success) {
        setConnectionTested(true);
        setSelectedIntegration({ ...integration, current_state: 'active' });
        setEditingIntegration(null);
        setTimeout(() => {
          setStep('select-trigger');
        }, 2000);
      } else {
        // Show error and allow editing
        setEditingIntegration(integration);
      }
    } catch (error: unknown) {
      console.error('Connection test failed:', error);
      const errorMessage = ((error as {response?: {data?: {message?: string}}})?.response?.data?.message || (error as Error)?.message);
      setTestResult({
        success: false,
        message: getHelpfulErrorMessage('Connection test failed: ' + errorMessage)
      });
      setEditingIntegration(integration);
    } finally {
      setTestingConnection(false);
    }
  };

  const updateIntegrationCredentials = async () => {
    if (!editingIntegration) return;

    try {
      setCreating(true);
      const response = await axios.put(`/automation-integrations/${editingIntegration.uuid}`, {
        name: integrationName,
        credentials,
      });

      const updatedIntegration = response.data.integration;
      setIntegrations(prev => prev.map(i => i.id === updatedIntegration.id ? updatedIntegration : i));
      setSelectedIntegration(updatedIntegration);

      // Test the connection again
      await testConnection(updatedIntegration);
    } catch (error: unknown) {
      console.error('Failed to update integration:', error);
      const errorMessage = ((error as {response?: {data?: {message?: string}}})?.response?.data?.message || (error as Error)?.message);
      setTestResult({
        success: false,
        message: getHelpfulErrorMessage('Failed to update integration: ' + errorMessage)
      });
    } finally {
      setCreating(false);
    }
  };

  const handleTriggerSelect = (triggerKey: string, discoveredTrigger?: DiscoveredTrigger) => {
    setSelectedTrigger(triggerKey);
    setSelectedDiscoveredTrigger(discoveredTrigger || null);

    if (discoveredTrigger) {
      setTriggerName(discoveredTrigger.label);
    } else {
      const trigger = selectedApp?.triggers[triggerKey];
      if (trigger) {
        setTriggerName(trigger.name);
      }
    }

    setStep('configure');
  };

  const createTrigger = async () => {
    if (!selectedApp || !selectedIntegration || !selectedTrigger) return;

    try {
      setCreating(true);

      // Get the actual app ID from the database
      const appId = await getAppIdByKey(selectedApp.key);
      if (!appId) {
        throw new Error(`App ${selectedApp.key} not found in database`);
      }

      const response = await axios.post(`/sequences/${sequenceId}/triggers`, {
        name: triggerName,
        app_id: appId,
        integration_id: selectedIntegration.id,
        trigger_key: selectedTrigger,
        configuration: selectedDiscoveredTrigger ? triggerConfiguration : {},
        conditions: {},
        app_name: selectedDiscoveredTrigger ? selectedApp.key : undefined,
      });

      onTriggerAdded(response.data.trigger);
      handleClose();
    } catch (error) {
      console.error('Failed to create trigger:', error);
    } finally {
      setCreating(false);
    }
  };

  const handleClose = () => {
    setStep('select-app');
    setSelectedApp(null);
    setSelectedIntegration(null);
    setSelectedTrigger('');
    setSelectedDiscoveredTrigger(null);
    setTriggerName('');
    setTriggerConfiguration({});
    setResourceOptions({});
    setLoadingResources({});
    setShowCreateIntegration(false);
    setConnectionTested(false);
    setCredentials({});
    setCredentialErrors({});
    setEditingIntegration(null);
    setTestResult(null);
    onClose();
  };

  interface CredentialConfig {
    type: string;
    label: string;
    description: string;
    required: boolean;
    sensitive?: boolean;
  }

  const renderCredentialsForm = () => {
    if (!selectedApp) return null;

    const authConfig = selectedApp.key === 'kajabi' ? {
      credentials_schema: {
        client_id: {
          type: 'string',
          label: 'Client ID',
          description: 'Your Kajabi application client ID',
          required: true,
          sensitive: false,
        },
        client_secret: {
          type: 'password',
          label: 'Client Secret',
          description: 'Your Kajabi application client secret',
          required: true,
          sensitive: true,
        },
        subdomain: {
          type: 'string',
          label: 'Subdomain',
          description: 'Your Kajabi site subdomain (e.g., "mysite" for mysite.kajabi.com)',
          required: true,
        },
      }
    } : null;

    if (!authConfig?.credentials_schema) {
      return <p className="text-sm text-gray-500">No credentials required for this app.</p>;
    }

    return (
      <div className="space-y-4">
        {Object.entries(authConfig.credentials_schema).map(([key, config]: [string, CredentialConfig]) => (
          <div key={key}>
            <Label htmlFor={key}>{config.label}</Label>
            <Input
              id={key}
              type={config.sensitive ? 'password' : 'text'}
              value={credentials[key] || ''}
              onChange={(e) => {
                let value = e.target.value;

                // Auto-clean subdomain if user enters .kajabi.com
                if (key === 'subdomain' && selectedApp?.key === 'kajabi') {
                  value = value.replace(/\.kajabi\.com$/, '');
                }

                setCredentials(prev => ({ ...prev, [key]: value }));

                // Validate Kajabi subdomain in real-time
                if (key === 'subdomain' && selectedApp?.key === 'kajabi') {
                  const validation = validateKajabiSubdomain(value);
                  if (!validation.valid && value.trim() !== '') {
                    setCredentialErrors(prev => ({ ...prev, [key]: validation.error || '' }));
                  } else {
                    setCredentialErrors(prev => {
                      const newErrors = { ...prev };
                      delete newErrors[key];
                      return newErrors;
                    });
                  }
                }
              }}
              placeholder={
                key === 'subdomain' ? 'mysite (without .kajabi.com)' :
                key === 'client_id' ? 'Your Kajabi Client ID' :
                key === 'client_secret' ? 'Your Kajabi Client Secret' :
                config.description
              }
              className={`mt-1 ${credentialErrors[key] ? 'border-red-300 focus:border-red-500' : ''}`}
            />
            {/* Show validation error first */}
            {credentialErrors[key] && (
              <p className="text-xs text-red-600 mt-1 font-medium">
                {credentialErrors[key]}
              </p>
            )}

            {config.description && !credentialErrors[key] && (
              <p className="text-xs text-gray-500 mt-1">{config.description}</p>
            )}
            {key === 'subdomain' && !credentialErrors[key] && (
              <p className="text-xs text-blue-600 mt-1">
                💡 Just enter the subdomain part, e.g. "mysite" for mysite.kajabi.com
              </p>
            )}
            {(key === 'client_id' || key === 'client_secret') && !credentialErrors[key] && (
              <p className="text-xs text-blue-600 mt-1">
                💡 Found in your Kajabi account under Settings → Integrations → API
              </p>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Trigger</DialogTitle>
          <DialogDescription>
            Choose an app and event to trigger this workflow
          </DialogDescription>
        </DialogHeader>

        {step === 'select-app' && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Select an App</h3>
            {discoveredTriggers.length === 0 ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(
                  discoveredTriggers.reduce((acc, trigger) => {
                    if (!acc[trigger.app]) {
                      acc[trigger.app] = [];
                    }
                    acc[trigger.app].push(trigger);
                    return acc;
                  }, {} as Record<string, DiscoveredTrigger[]>)
                ).map(([appName, triggers]) => (
                  <Card
                    key={appName}
                    className="cursor-pointer hover:border-primary transition-colors"
                    onClick={() => handleAppSelect({ key: appName, name: appName, color: '#3b82f6' })}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-3">
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold"
                          style={{ backgroundColor: '#3b82f6' }}
                        >
                          {appName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h4 className="font-medium">{appName}</h4>
                          <p className="text-sm text-gray-500">{triggers.length} triggers available</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="mt-2">
                        automation
                      </Badge>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {step === 'select-integration' && selectedApp && (
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm"
                style={{ backgroundColor: selectedApp.color }}
              >
                {selectedApp.name.charAt(0)}
              </div>
              <h3 className="text-lg font-medium">{selectedApp.name} Integration</h3>
            </div>

            <Tabs defaultValue="existing" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="existing">Use Existing</TabsTrigger>
                <TabsTrigger value="new">Create New</TabsTrigger>
              </TabsList>

              <TabsContent value="existing" className="space-y-4">
                {integrations.filter(i => i.app?.key === selectedApp.key).length > 0 ? (
                  integrations
                    .filter(i => i.app?.key === selectedApp.key)
                    .map((integration) => (
                      <Card
                        key={integration.id}
                        className="cursor-pointer hover:border-primary transition-colors"
                        onClick={() => {
                          setSelectedIntegration(integration);
                          setStep('select-trigger');
                        }}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <h4 className="font-medium">{integration.name}</h4>
                              <p className="text-sm text-gray-500 capitalize">{integration.type}</p>
                              <p className="text-xs text-gray-400 capitalize">
                                Status: {integration.current_state || 'unknown'}
                              </p>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Badge variant={integration.current_state === 'active' ? 'default' : 'secondary'}>
                                {integration.current_state === 'active' ? 'Active' : 'Inactive'}
                              </Badge>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedIntegration(integration);
                                  setEditingIntegration(integration);
                                  setIntegrationName(integration.name);
                                  // Load existing credentials for editing
                                  setCredentials({});
                                  setTestResult(null);
                                  testConnection(integration);
                                }}
                                disabled={testingConnection}
                              >
                                {testingConnection && selectedIntegration?.id === integration.id ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  'Test'
                                )}
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                ) : (
                  <p className="text-gray-500 text-center py-4">
                    No existing integrations found for {selectedApp.name}
                  </p>
                )}
              </TabsContent>

              <TabsContent value="new" className="space-y-4">
                {!showCreateIntegration ? (
                  <Button onClick={handleCreateIntegration} className="w-full">
                    Create New {selectedApp.name} Integration
                  </Button>
                ) : (
                  <Card>
                    <CardHeader>
                      <CardTitle>Setup {selectedApp.name} Integration</CardTitle>
                      <CardDescription>
                        Connect your {selectedApp.name} account to enable automation
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label htmlFor="integration-name">Integration Name</Label>
                        <Input
                          id="integration-name"
                          value={integrationName}
                          onChange={(e) => setIntegrationName(e.target.value)}
                          placeholder={`${selectedApp.name} Integration`}
                        />
                      </div>

                      {renderCredentialsForm()}

                      {/* Test Result Display */}
                      {testResult && (
                        <div className={`p-4 rounded-lg border ${testResult.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                          <div className="flex items-center space-x-2">
                            {testResult.success ? (
                              <CheckCircle className="h-5 w-5 text-green-600" />
                            ) : (
                              <AlertCircle className="h-5 w-5 text-red-600" />
                            )}
                            <div className="flex-1">
                              <p className={`text-sm font-medium ${testResult.success ? 'text-green-800' : 'text-red-800'}`}>
                                {testResult.success ? 'Connection Successful!' : 'Connection Failed'}
                              </p>
                              <p className={`text-xs ${testResult.success ? 'text-green-600' : 'text-red-600'}`}>
                                {testResult.message}
                              </p>
                              {editingIntegration && (
                                <p className="text-xs text-gray-600 mt-1">
                                  Testing: {editingIntegration.name}
                                </p>
                              )}

                              {/* Show resolution steps for failures */}
                              {!testResult.success && (
                                <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded">
                                  <p className="text-xs font-medium text-blue-800 mb-2">How to fix this:</p>
                                  <div className="space-y-1">
                                    {getResolutionSteps(testResult.message).map((step, index) => (
                                      <p key={index} className="text-xs text-blue-700">{step}</p>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {connectionTested ? (
                        <div className="flex items-center space-x-2 text-green-600">
                          <CheckCircle className="h-4 w-4" />
                          <span className="text-sm">Ready to continue!</span>
                        </div>
                      ) : (
                        <div className="flex space-x-2">
                          {editingIntegration ? (
                            <>
                                                             <Button
                                 onClick={updateIntegrationCredentials}
                                 disabled={creating || !integrationName || Object.keys(credentialErrors).length > 0}
                                 className="flex-1"
                               >
                                {creating ? (
                                  <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Updating...
                                  </>
                                ) : (
                                  'Update & Test Again'
                                )}
                              </Button>
                              <Button
                                onClick={() => testConnection(editingIntegration)}
                                disabled={testingConnection}
                                variant="outline"
                              >
                                {testingConnection ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  'Test Again'
                                )}
                              </Button>
                            </>
                          ) : (
                            <Button
                              onClick={createIntegration}
                              disabled={creating || !integrationName || Object.keys(credentialErrors).length > 0}
                              className="flex-1"
                            >
                              {creating ? (
                                <>
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  Creating...
                                </>
                              ) : (
                                'Create & Test Connection'
                              )}
                            </Button>
                          )}
                        </div>
                      )}

                      {testingConnection && (
                        <div className="flex items-center space-x-2 text-blue-600">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span className="text-sm">Testing connection...</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          </div>
        )}

        {step === 'select-trigger' && selectedApp && selectedIntegration && (
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm"
                style={{ backgroundColor: selectedApp.color }}
              >
                {selectedApp.name.charAt(0)}
              </div>
              <div>
                <h3 className="text-lg font-medium">Select Trigger Event</h3>
                <p className="text-sm text-gray-500">Using: {selectedIntegration.name}</p>
              </div>
            </div>

            <Tabs defaultValue="builtin" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="builtin">Built-in Triggers</TabsTrigger>
                <TabsTrigger value="discovered">App Triggers</TabsTrigger>
              </TabsList>

              <TabsContent value="builtin" className="space-y-2">
                {Object.entries(selectedApp.triggers || {}).map(([key, trigger]: [string, TriggerConfig]) => (
                  <Card
                    key={key}
                    className="cursor-pointer hover:border-primary transition-colors"
                    onClick={() => handleTriggerSelect(key)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">{trigger.name}</h4>
                          <p className="text-sm text-gray-500">{trigger.description}</p>
                        </div>
                        <Badge variant="outline">{key}</Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>

              <TabsContent value="discovered" className="space-y-2">
                {discoveredTriggers
                  .filter(trigger => trigger.app === selectedApp.key)
                  .map((trigger) => (
                    <Card
                      key={trigger.key}
                      className="cursor-pointer hover:border-primary transition-colors"
                      onClick={() => handleTriggerSelect(trigger.key, trigger)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium">{trigger.label}</h4>
                            <p className="text-sm text-gray-500">{trigger.description}</p>
                          </div>
                          <Badge variant="outline">{trigger.key}</Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </TabsContent>
            </Tabs>
          </div>
        )}

        {step === 'configure' && selectedApp && selectedIntegration && selectedTrigger && (
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm"
                style={{ backgroundColor: selectedApp.color }}
              >
                {selectedApp.name.charAt(0)}
              </div>
              <div>
                <h3 className="text-lg font-medium">Configure Trigger</h3>
                <p className="text-sm text-gray-500">
                  {selectedDiscoveredTrigger ? selectedDiscoveredTrigger.label : selectedApp.triggers[selectedTrigger]?.name} from {selectedIntegration.name}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="trigger-name">Trigger Name</Label>
                <Input
                  id="trigger-name"
                  value={triggerName}
                  onChange={(e) => setTriggerName(e.target.value)}
                  placeholder="Give this trigger a descriptive name"
                />
              </div>

              {/* Dynamic configuration fields for discovered triggers */}
              {selectedDiscoveredTrigger && Object.keys(selectedDiscoveredTrigger.props).length > 0 && (
                <div className="space-y-4">
                  <h4 className="font-medium">Configuration</h4>
                  {Object.entries(selectedDiscoveredTrigger.props).map(([key, prop]) => (
                    <div key={key}>
                      <Label htmlFor={key}>{prop.label || key}</Label>
                      {prop.type === 'string' && prop.dynamic ? (
                        <div className="space-y-2">
                          <Input
                            id={key}
                            value={triggerConfiguration[key] as string || ''}
                            onChange={(e) => setTriggerConfiguration(prev => ({ ...prev, [key]: e.target.value }))}
                            placeholder={`Search ${prop.label || key}...`}
                                                       onFocus={() => {
                             if (prop.dynamic) {
                               const [resourceKey] = prop.dynamic.split('.');
                               loadResourceOptions(resourceKey);
                             }
                           }}
                          />
                          {loadingResources[prop.dynamic.split('.')[0]] && (
                            <div className="flex items-center space-x-2 text-sm text-gray-500">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              <span>Loading options...</span>
                            </div>
                          )}
                          {resourceOptions[prop.dynamic.split('.')[0]] && (
                            <div className="max-h-40 overflow-y-auto border rounded-md p-2 space-y-1">
                              {resourceOptions[prop.dynamic.split('.')[0]].map((option) => (
                                <div
                                  key={option.value}
                                  className="p-2 hover:bg-gray-100 rounded cursor-pointer text-sm"
                                  onClick={() => setTriggerConfiguration(prev => ({ ...prev, [key]: option.value }))}
                                >
                                  {option.label}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ) : (
                        <Input
                          id={key}
                          value={triggerConfiguration[key] as string || ''}
                          onChange={(e) => setTriggerConfiguration(prev => ({ ...prev, [key]: e.target.value }))}
                          placeholder={prop.placeholder || `Enter ${prop.label || key}`}
                        />
                      )}
                      {prop.help && (
                        <p className="text-xs text-gray-500 mt-1">{prop.help}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div className="flex space-x-2">
                <Button onClick={() => setStep('select-trigger')} variant="outline" className="flex-1">
                  Back
                </Button>
                <Button
                  onClick={createTrigger}
                  disabled={creating || !triggerName}
                  className="flex-1"
                >
                  {creating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Trigger'
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
