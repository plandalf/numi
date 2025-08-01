import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Plus,
  Edit,
  Trash2,
  TestTube,
  CheckCircle,
  AlertCircle,
  User,
  RefreshCw,
  X
} from 'lucide-react';
import axios from 'axios';

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

interface Props {
  integrations: Integration[];
  appKey?: string;
}

export default function IntegrationsIndex({ integrations, appKey }: Props) {
  const [testing, setTesting] = useState<Record<number, boolean>>({});
  const [deleting, setDeleting] = useState<Record<number, boolean>>({});
  const [testResult, setTestResult] = useState<{
    integration: Integration;
    success: boolean;
    message: string;
    data?: any;
    timestamp?: string;
  } | null>(null);

  const getStatusBadge = (status: string) => {
    const variants = {
      active: 'bg-green-100 text-green-800 border-green-200',
      inactive: 'bg-gray-100 text-gray-800 border-gray-200',
      created: 'bg-blue-100 text-blue-800 border-blue-200',
      error: 'bg-red-100 text-red-800 border-red-200'
    };

    return (
      <Badge variant="outline" className={variants[status as keyof typeof variants] || variants.inactive}>
        <div className="flex items-center space-x-1">
          {status === 'active' && <CheckCircle className="h-3 w-3" />}
          {status === 'error' && <AlertCircle className="h-3 w-3" />}
          <span className="capitalize">{status}</span>
        </div>
      </Badge>
    );
  };

  const handleSelect = (integration: Integration) => {
    // Send message to parent window and close
    if (window.opener) {
      window.opener.postMessage({
        type: 'INTEGRATION_SELECTED',
        integration: integration
      }, '*');
      window.close();
    }
  };

  const handleCreateNew = () => {
    const createUrl = appKey
      ? `/automation/integrations/create?app_key=${appKey}`
      : '/automation/integrations/create';

    // Open in same window since we're already in a popup
    window.location.href = createUrl;
  };

  const handleEdit = (integration: Integration) => {
    window.location.href = `/automation/integrations/${integration.id}/edit`;
  };

  const testIntegration = async (integration: Integration) => {
    setTesting(prev => ({ ...prev, [integration.id]: true }));

    try {
      const response = await axios.post(`/automation/integrations/${integration.id}/test`);

      const result = {
        integration,
        success: response.data.success,
        message: response.data.message || 'Test completed',
        data: response.data.data || null,
        timestamp: new Date().toLocaleString()
      };

      setTestResult(result);

    } catch (error: any) {
      console.error('Integration test failed:', error);
      
      const result = {
        integration,
        success: false,
        message: error.response?.data?.message || 'Connection test failed. Please check your configuration.',
        data: null,
        timestamp: new Date().toLocaleString()
      };

      setTestResult(result);
    } finally {
      setTesting(prev => ({ ...prev, [integration.id]: false }));
    }
  };

  const deleteIntegration = async (integration: Integration) => {
    if (!confirm(`Are you sure you want to delete "${integration.name}"? This action cannot be undone.`)) {
      return;
    }

    setDeleting(prev => ({ ...prev, [integration.id]: true }));

    try {
      await axios.delete(`/automation/integrations/${integration.id}`);

      // Refresh the page
      router.reload();

    } catch (error) {
      console.error('Failed to delete integration:', error);
      alert('Failed to delete integration. Please try again.');
    } finally {
      setDeleting(prev => ({ ...prev, [integration.id]: false }));
    }
  };

  const appName = integrations.length > 0 ? integrations[0].app.name : 'App';
  // const filteredIntegrations = appKey
  //   ? integrations.filter(integration => integration.app.key === appKey)
  //   : ;
  const filteredIntegrations = integrations;

  return (
    <>
      <Head title={`${appName} Integrations`} />

      <div className="min-h-screen bg-gray-50 p-4">
        {/* Test Result Modal */}
        {testResult && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setTestResult(null)}
          >
            <div 
              className="bg-white rounded-lg max-w-md w-full p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">
                  Integration Test Result
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setTestResult(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-4">
                {/* Integration Info */}
                <div className="flex items-center space-x-3">
                  {testResult.integration.app.icon_url ? (
                    <img
                      src={testResult.integration.app.icon_url}
                      alt={testResult.integration.app.name}
                      className="w-10 h-10 rounded-lg"
                    />
                  ) : (
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold"
                      style={{ backgroundColor: testResult.integration.app.color || '#3b82f6' }}
                    >
                      {testResult.integration.app.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className="font-medium">{testResult.integration.name}</p>
                    <p className="text-sm text-gray-500">{testResult.integration.app.name}</p>
                  </div>
                </div>

                {/* Test Result */}
                <div className={`p-4 rounded-lg border ${
                  testResult.success 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-red-50 border-red-200'
                }`}>
                  <div className="flex items-center space-x-2 mb-2">
                    {testResult.success ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-red-600" />
                    )}
                    <span className={`font-medium ${
                      testResult.success ? 'text-green-800' : 'text-red-800'
                    }`}>
                      {testResult.success ? 'Test Successful' : 'Test Failed'}
                    </span>
                  </div>
                  
                  <p className={`text-sm ${
                    testResult.success ? 'text-green-700' : 'text-red-700'
                  }`}>
                    {testResult.message}
                  </p>

                  {/* Additional Info for Successful Tests */}
                  {testResult.success && testResult.data && (
                    <div className="mt-3 pt-3 border-t border-green-200">
                      {testResult.data.user_info && (
                        <div className="space-y-1">
                          <p className="text-xs text-green-600 font-medium">Connected Account:</p>
                          {testResult.data.user_info.email && (
                            <p className="text-xs text-green-700">
                              📧 {testResult.data.user_info.email}
                            </p>
                          )}
                          {testResult.data.user_info.name && (
                            <p className="text-xs text-green-700">
                              👤 {testResult.data.user_info.name}
                            </p>
                          )}
                        </div>
                      )}
                      
                      {testResult.data.status && (
                        <p className="text-xs text-green-700 mt-2">
                          Status: {testResult.data.status}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Timestamp */}
                <p className="text-xs text-gray-500 text-center">
                  Tested at {testResult.timestamp}
                </p>

                {/* Close Button */}
                <Button
                  onClick={() => setTestResult(null)}
                  className="w-full"
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        )}

        <div className="w-full max-w-4xl mx-auto">
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {appKey ? `${appName} Integrations` : 'All Integrations'}
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                  {appKey
                    ? `Manage your ${appName} integrations`
                    : 'Manage all your app integrations'
                  }
                </p>
              </div>

              <div className="flex space-x-2">
                <Button
                  onClick={() => router.reload()}
                  variant="outline"
                  title="Refresh integrations"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>

                <Button onClick={handleCreateNew}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create New Integration
                </Button>
              </div>
            </div>
          </div>

          {/* Integration List */}
          <div className="space-y-4">
            {filteredIntegrations.length === 0 ? (
              <Card>
                <CardContent className="p-8">
                  <div className="text-center text-gray-500">
                    <User className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p className="font-medium">No integrations found</p>
                    <p className="text-sm">
                      {appKey
                        ? `Create your first ${appName} integration to get started`
                        : 'Create your first integration to get started'
                      }
                    </p>
                    <Button onClick={handleCreateNew} className="mt-4">
                      <Plus className="h-4 w-4 mr-2" />
                      Create Integration
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {filteredIntegrations.map((integration) => (
                  <Card
                    key={integration.id}
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => handleSelect(integration)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        {/* Integration Info */}
                        <div className="flex items-center space-x-3 flex-1">
                          {integration.app.icon_url ? (
                            <img
                              src={integration.app.icon_url}
                              alt={integration.app.name}
                              className="w-12 h-12 rounded-lg"
                            />
                          ) : (
                            <div
                              className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold"
                              style={{ backgroundColor: integration.app.color || '#3b82f6' }}
                            >
                              {integration.app.name.charAt(0).toUpperCase()}
                            </div>
                          )}

                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <h3 className="font-medium">{integration.name}</h3>
                              {getStatusBadge(integration.current_state)}
                            </div>

                            <p className="text-sm text-gray-600">
                              {integration.app.name} • ID: {integration.id}
                            </p>

                            <p className="text-xs text-gray-500 mt-1">
                              Created {new Date(integration.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center space-x-2 ml-4" onClick={e => e.stopPropagation()}>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => testIntegration(integration)}
                            disabled={testing[integration.id]}
                            title="Test Integration"
                          >
                            {testing[integration.id] ? (
                              <RefreshCw className="h-4 w-4 animate-spin" />
                            ) : (
                              <TestTube className="h-4 w-4" />
                            )}
                          </Button>

                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEdit(integration)}
                            title="Edit Integration"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>

                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => deleteIntegration(integration)}
                            disabled={deleting[integration.id]}
                            className="text-red-600 hover:text-red-700"
                            title="Delete Integration"
                          >
                            {deleting[integration.id] ? (
                              <RefreshCw className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
