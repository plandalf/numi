import React, { useState, useEffect } from 'react';
import { Head } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, AlertCircle, CheckCircle, Globe, Key } from 'lucide-react';
import axios from 'axios';

interface App {
  key: string;
  name: string;
  description?: string;
  icon_url?: string;
  color?: string;
  auth_requirements: {
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

interface Props {
  app: App;
  integrationName: string;
}

export default function CreateIntegration({ app, integrationName: initialIntegrationName }: Props) {
  const [step, setStep] = useState<'choose' | 'oauth' | 'api-keys' | 'success'>('choose');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string[]>>({});
  const [integrationName, setIntegrationName] = useState(initialIntegrationName || `${app.name} Integration`);
  const [integrationFields, setIntegrationFields] = useState<Record<string, string>>({});

  // Determine initial step based on auth type
  useEffect(() => {
    if (app.auth_requirements.type === 'api_keys') {
      setStep('api-keys');
    } else if (app.auth_requirements.type === 'oauth' || app.auth_requirements.type === 'oauth_client_credentials') {
      setStep('oauth');
    }
    // For 'both' type, keep it on 'choose' step
  }, [app.auth_requirements.type]);

  const updateIntegrationField = (key: string, value: string) => {
    setIntegrationFields(prev => ({ ...prev, [key]: value }));
    // Clear validation error for this field when user starts typing
    if (validationErrors[key]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[key];
        return newErrors;
      });
    }
  };

  const handleOAuthFlow = async () => {
    try {
      setLoading(true);
      setError(null);
      setValidationErrors({});

      // Validate required fields for OAuth client credentials
      const missingFields = app.auth_requirements.fields
        .filter(field => field.required && !integrationFields[field.key]?.trim())
        .map(field => field.label);

      if (missingFields.length > 0) {
        setError(`Please fill in required fields: ${missingFields.join(', ')}`);
        return;
      }

      // Create integration with OAuth client credentials
      const response = await axios.post('/automation/integrations', {
        app_key: app.key,
        name: integrationName,
        type: app.auth_requirements.type === 'oauth_client_credentials' ? 'oauth_client_credentials' : 'oauth',
        connection_config: integrationFields,
      });

      if (response.data.success) {
        // Check auth result
        const authCheck = response.data.auth_check;
        if (authCheck && !authCheck.success) {
          setError(`Authentication failed: ${authCheck.error || 'Unable to verify credentials'}`);
          return;
        }
        
        setStep('success');
        // Notify parent window that integration was created and close after delay
        setTimeout(() => {
          if (window.opener) {
            window.opener.postMessage({ 
              type: 'INTEGRATION_CREATED', 
              integration: response.data.data 
            }, '*');
            window.close();
          }
        }, 2000);
      }
    } catch (error) {
      console.error('Failed to create OAuth integration:', error);
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 422) {
          setValidationErrors(error.response.data.errors || {});
        } else {
          setError(error.response?.data?.message || 'Failed to create OAuth integration');
        }
      } else {
        setError('An unexpected error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleApiKeySetup = async () => {
    try {
      setLoading(true);
      setError(null);
      setValidationErrors({});

      const payload = {
        app_key: app.key,
        name: integrationName,
        type: 'api_keys',
        connection_config: integrationFields,
      };

      const response = await axios.post('/automation/integrations', payload);

      if (response.data.success) {
        // Check auth result
        const authCheck = response.data.auth_check;
        if (authCheck && !authCheck.success) {
          setError(`Authentication failed: ${authCheck.error || 'Unable to verify credentials'}`);
          return;
        }
        
        setStep('success');
        // Notify parent window that integration was created and close after delay
        setTimeout(() => {
          if (window.opener) {
            window.opener.postMessage({ 
              type: 'INTEGRATION_CREATED', 
              integration: response.data.data 
            }, '*');
            window.close();
          }
        }, 2000);
      }
    } catch (error) {
      console.error('Failed to create integration:', error);
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 422) {
          setValidationErrors(error.response.data.errors || {});
        } else {
          setError(error.response?.data?.message || 'Failed to create integration');
        }
      } else {
        setError('An unexpected error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (step === 'choose') {
      // Go back to integrations list
      window.location.href = `/automation/integrations?app_key=${app.key}`;
    } else {
      // Go back to choose step
      setStep('choose');
    }
  };

  const isOAuthClientCredentialsAvailable = app.auth_requirements.type === 'oauth' || app.auth_requirements.type === 'oauth_client_credentials' || app.auth_requirements.type === 'both';
  const isApiKeysAvailable = app.auth_requirements.type === 'api_keys' || app.auth_requirements.type === 'both';

  return (
    <>
      <Head title={`Create ${app.name} Integration`} />
      
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Card className="relative">
            <CardHeader className="text-center">
              <div className="flex items-center justify-center space-x-3 mb-2">
                {app.icon_url ? (
                  <img src={app.icon_url} alt={app.name} className="w-12 h-12 rounded-lg" />
                ) : (
                  <div
                    className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold text-lg"
                    style={{ backgroundColor: app.color || '#3b82f6' }}
                  >
                    {app.name.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <CardTitle>Create {app.name} Integration</CardTitle>
              <p className="text-sm text-gray-500">{app.description}</p>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Loading Overlay */}
              {loading && (
                <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10 rounded-lg">
                  <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-500 mb-2" />
                    <p className="text-sm text-gray-600">Creating integration...</p>
                  </div>
                </div>
              )}

              {/* Error Display */}
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="h-4 w-4 text-red-500" />
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
              )}

              {/* Step 1: Choose auth method */}
              {step === 'choose' && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="integration-name">Integration Name</Label>
                    <Input
                      id="integration-name"
                      value={integrationName}
                      onChange={(e) => setIntegrationName(e.target.value)}
                      placeholder="Give this integration a name"
                      className={validationErrors.name ? 'border-red-300' : ''}
                    />
                    {validationErrors.name && (
                      <p className="text-xs text-red-500 mt-1">{validationErrors.name[0]}</p>
                    )}
                  </div>

                  <div className="space-y-3">
                    {isOAuthClientCredentialsAvailable && (
                      <Button
                        onClick={() => setStep('oauth')}
                        className="w-full justify-start"
                        variant="outline"
                      >
                        <Globe className="h-4 w-4 mr-3" />
                        <div className="text-left">
                          <div className="font-medium">OAuth Client Credentials</div>
                          <div className="text-xs text-gray-500">Server-to-server authentication</div>
                        </div>
                      </Button>
                    )}

                    {isApiKeysAvailable && (
                      <Button
                        onClick={() => setStep('api-keys')}
                        className="w-full justify-start"
                        variant="outline"
                      >
                        <Key className="h-4 w-4 mr-3" />
                        <div className="text-left">
                          <div className="font-medium">API Keys</div>
                          <div className="text-xs text-gray-500">Manual setup</div>
                        </div>
                      </Button>
                    )}
                  </div>

                  <div className="flex justify-end pt-4">
                    <Button onClick={handleBack} variant="outline">
                      Back to Integrations
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 2: OAuth Client Credentials Grant */}
              {step === 'oauth' && (
                <div className="space-y-4">
                  <div className="text-center">
                    <Globe className="h-12 w-12 mx-auto text-blue-500 mb-3" />
                    <h3 className="font-medium">OAuth Client Credentials Grant</h3>
                    <p className="text-sm text-gray-500">Enter your {app.name} client credentials for server-to-server authentication</p>
                  </div>

                  <div>
                    <Label htmlFor="integration-name-oauth">Integration Name</Label>
                    <Input
                      id="integration-name-oauth"
                      value={integrationName}
                      onChange={(e) => setIntegrationName(e.target.value)}
                      placeholder="Give this integration a name"
                      className={validationErrors.name ? 'border-red-300' : ''}
                    />
                    {validationErrors.name && (
                      <p className="text-xs text-red-500 mt-1">{validationErrors.name[0]}</p>
                    )}
                  </div>

                  <div className="space-y-3">
                    {app.auth_requirements.fields.map((field) => (
                      <div key={field.key}>
                        <Label htmlFor={`field-${field.key}`}>
                          {field.label} {field.required && '*'}
                        </Label>
                        <Input
                          id={`field-${field.key}`}
                          type={field.type}
                          value={integrationFields[field.key] || ''}
                          onChange={(e) => updateIntegrationField(field.key, e.target.value)}
                          placeholder={field.placeholder}
                          className={validationErrors[field.key] ? 'border-red-300' : ''}
                        />
                        {validationErrors[field.key] && (
                          <p className="text-xs text-red-500 mt-1">{validationErrors[field.key][0]}</p>
                        )}
                        {field.help && (
                          <p className="text-xs text-gray-500 mt-1">{field.help}</p>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="flex items-start space-x-2">
                      <Key className="h-4 w-4 text-blue-500 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-sm text-blue-900">Client Credentials Grant</h4>
                        <p className="text-xs text-blue-700 mt-1">
                          This integration uses OAuth 2.0 Client Credentials Grant for server-to-server authentication. 
                          Your client credentials will be used to obtain access tokens for API requests to {app.name}.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex space-x-2">
                      <Button onClick={handleBack} variant="outline" className="flex-1">
                        Back
                      </Button>
                      <Button 
                        onClick={handleOAuthFlow} 
                        disabled={loading || !integrationName.trim() || app.auth_requirements.fields.some(field => field.required && !integrationFields[field.key]?.trim())} 
                        className="flex-1"
                      >
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
                    
                    {/* Helper text for disabled state */}
                    {!loading && (!integrationName.trim() || app.auth_requirements.fields.some(field => field.required && !integrationFields[field.key]?.trim())) && (
                      <p className="text-xs text-gray-500 text-center">
                        Please fill in all required fields to continue
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Step 3: API Keys */}
              {step === 'api-keys' && (
                <div className="space-y-4">
                  <div className="text-center">
                    <Key className="h-12 w-12 mx-auto text-green-500 mb-3" />
                    <h3 className="font-medium">API Credentials</h3>
                    <p className="text-sm text-gray-500">Enter your {app.name} API credentials</p>
                  </div>

                  <div>
                    <Label htmlFor="integration-name-api">Integration Name</Label>
                    <Input
                      id="integration-name-api"
                      value={integrationName}
                      onChange={(e) => setIntegrationName(e.target.value)}
                      placeholder="Give this integration a name"
                      className={validationErrors.name ? 'border-red-300' : ''}
                    />
                    {validationErrors.name && (
                      <p className="text-xs text-red-500 mt-1">{validationErrors.name[0]}</p>
                    )}
                  </div>

                  <div className="space-y-3">
                    {app.auth_requirements.fields.map((field) => (
                      <div key={field.key}>
                        <Label htmlFor={`field-${field.key}`}>
                          {field.label} {field.required && '*'}
                        </Label>
                        <Input
                          id={`field-${field.key}`}
                          type={field.type}
                          value={integrationFields[field.key] || ''}
                          onChange={(e) => updateIntegrationField(field.key, e.target.value)}
                          placeholder={field.placeholder}
                          className={validationErrors[field.key] ? 'border-red-300' : ''}
                        />
                        {validationErrors[field.key] && (
                          <p className="text-xs text-red-500 mt-1">{validationErrors[field.key][0]}</p>
                        )}
                        {field.help && (
                          <p className="text-xs text-gray-500 mt-1">{field.help}</p>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="space-y-2">
                    <div className="flex space-x-2">
                      <Button onClick={handleBack} variant="outline" className="flex-1">
                        Back
                      </Button>
                      <Button 
                        onClick={handleApiKeySetup} 
                        disabled={loading || !integrationName.trim() || app.auth_requirements.fields.some(field => field.required && !integrationFields[field.key]?.trim())} 
                        className="flex-1"
                      >
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
                    
                    {/* Helper text for disabled state */}
                    {!loading && (!integrationName.trim() || app.auth_requirements.fields.some(field => field.required && !integrationFields[field.key]?.trim())) && (
                      <p className="text-xs text-gray-500 text-center">
                        Please fill in all required fields to continue
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Step 4: Success */}
              {step === 'success' && (
                <div className="text-center space-y-4">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-medium">Integration Created!</h3>
                    <p className="text-sm text-gray-500">
                      Your {app.name} integration is ready to use
                    </p>
                  </div>
                  <p className="text-xs text-gray-400">This window will close automatically...</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
} 