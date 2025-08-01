import React, { useState, useEffect } from 'react';
import { Head, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, AlertCircle, CheckCircle, Globe, Key, ArrowLeft, Trash2 } from 'lucide-react';
import axios from 'axios';

interface Integration {
  id: number;
  name: string;
  type: string;
  current_state: string;
  connection_config: Record<string, string>;
  app: {
    id: number;
    name: string;
    key: string;
  };
}

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
  integration: Integration;
  app: App;
}

export default function EditIntegration({ integration, app }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string[]>>({});
  const [integrationName, setIntegrationName] = useState(integration.name || '');
  const [integrationFields, setIntegrationFields] = useState<Record<string, string>>(
    integration.connection_config || {}
  );
  const [deleteLoading, setDeleteLoading] = useState(false);

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

  const handleSave = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      setValidationErrors({});

      // Validate required fields
      const missingFields = app.auth_requirements.fields
        .filter(field => field.required && !integrationFields[field.key]?.trim())
        .map(field => field.label);

      if (missingFields.length > 0) {
        setError(`Please fill in required fields: ${missingFields.join(', ')}`);
        return;
      }

      // Update integration
      const response = await axios.put(`/automation/integrations/${integration.id}`, {
        name: integrationName,
        connection_config: integrationFields,
      });

      if (response.data.success) {
        // Check auth result
        const authCheck = response.data.auth_check;
        if (authCheck && !authCheck.success) {
          setError(`Authentication failed: ${authCheck.error || 'Unable to verify credentials'}`);
          return;
        }
        
        setSuccess('Integration updated successfully!');
        
        // Refresh the page data after a short delay
        setTimeout(() => {
          router.reload();
        }, 1500);
      }
    } catch (error) {
      console.error('Failed to update integration:', error);
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 422) {
          setValidationErrors(error.response.data.errors || {});
        } else {
          setError(error.response?.data?.message || 'Failed to update integration');
        }
      } else {
        setError('An unexpected error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleTest = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      const response = await axios.post(`/automation/integrations/${integration.id}/test`);

      if (response.data.success) {
        let successMessage = response.data.message || 'Integration test successful!';
        
        // Add user info for successful Kajabi tests
        if (response.data.data && response.data.data.user_info) {
          const userInfo = response.data.data.user_info;
          if (userInfo.email) {
            successMessage += ` Connected as: ${userInfo.email}`;
          }
          if (userInfo.name) {
            successMessage += ` (${userInfo.name})`;
          }
        }
        
        setSuccess(successMessage);
      } else {
        setError(response.data.message || 'Integration test failed');
      }
    } catch (error) {
      console.error('Failed to test integration:', error);
      if (axios.isAxiosError(error)) {
        setError(error.response?.data?.message || 'Integration test failed');
      } else {
        setError('An unexpected error occurred during testing');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this integration? This action cannot be undone.')) {
      return;
    }

    try {
      setDeleteLoading(true);
      
      const response = await axios.delete(`/automation/integrations/${integration.id}`);

      if (response.data.success) {
        // Redirect to integrations list
        router.visit(`/automation/integrations?app_key=${app.key}`);
      }
    } catch (error) {
      console.error('Failed to delete integration:', error);
      if (axios.isAxiosError(error)) {
        setError(error.response?.data?.message || 'Failed to delete integration');
      } else {
        setError('An unexpected error occurred during deletion');
      }
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleBack = () => {
    router.visit(`/automation/integrations?app_key=${app.key}`);
  };

  const getStatusBadge = () => {
    const statusColors = {
      active: 'bg-green-100 text-green-800',
      error: 'bg-red-100 text-red-800',
      created: 'bg-yellow-100 text-yellow-800',
      inactive: 'bg-gray-100 text-gray-800',
    };

    const statusLabels = {
      active: 'Active',
      error: 'Error',
      created: 'Created',
      inactive: 'Inactive',
    };

    const colorClass = statusColors[integration.current_state as keyof typeof statusColors] || statusColors.inactive;
    const label = statusLabels[integration.current_state as keyof typeof statusLabels] || integration.current_state;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClass}`}>
        {label}
      </span>
    );
  };

  return (
    <>
      <Head title={`Edit ${app.name} Integration`} />
      
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-2xl mx-auto">
          <Card className="relative">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
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
                  <div>
                    <CardTitle className="text-xl">Edit {app.name} Integration</CardTitle>
                    <p className="text-sm text-gray-500">{app.description}</p>
                  </div>
                </div>
                {getStatusBadge()}
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Loading Overlay */}
              {loading && (
                <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10 rounded-lg">
                  <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-500 mb-2" />
                    <p className="text-sm text-gray-600">
                      {loading ? 'Updating integration...' : 'Testing integration...'}
                    </p>
                  </div>
                </div>
              )}

              {/* Success Message */}
              {success && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <p className="text-sm text-green-700">{success}</p>
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

              {/* Integration Name */}
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

              {/* Connection Configuration */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  {app.auth_requirements.type === 'oauth_client_credentials' ? (
                    <Globe className="h-5 w-5 text-blue-500" />
                  ) : (
                    <Key className="h-5 w-5 text-green-500" />
                  )}
                  <h3 className="font-medium">
                    {app.auth_requirements.type === 'oauth_client_credentials' 
                      ? 'OAuth Client Credentials' 
                      : 'API Credentials'
                    }
                  </h3>
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

                {app.auth_requirements.type === 'oauth_client_credentials' && (
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
                )}
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <div className="flex space-x-3">
                  <Button
                    onClick={handleSave}
                    disabled={loading || !integrationName.trim() || app.auth_requirements.fields.some(field => field.required && !integrationFields[field.key]?.trim())}
                    className="flex-1"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      'Save Changes'
                    )}
                  </Button>
                  
                  <Button
                    onClick={handleTest}
                    disabled={loading || !integrationName.trim() || app.auth_requirements.fields.some(field => field.required && !integrationFields[field.key]?.trim())}
                    variant="outline"
                  >
                    Test Connection
                  </Button>
                </div>

                <div className="flex justify-between">
                  <Button onClick={handleBack} variant="outline">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Integrations
                  </Button>

                  <Button 
                    onClick={handleDelete}
                    disabled={deleteLoading}
                    variant="outline"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    {deleteLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      <>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Integration
                      </>
                    )}
                  </Button>
                </div>

                {/* Helper text for disabled state */}
                {!loading && (!integrationName.trim() || app.auth_requirements.fields.some(field => field.required && !integrationFields[field.key]?.trim())) && (
                  <p className="text-xs text-gray-500 text-center">
                    Please fill in all required fields to save or test
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
