import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Loader2, 
  Plus, 
  Edit, 
  Trash2, 
  TestTube, 
  CheckCircle, 
  AlertCircle, 
  User,
  RefreshCw
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

interface App {
  key: string;
  name: string;
  description?: string;
  icon_url?: string;
  color?: string;
  id: number;
}

interface IntegrationSelectorProps {
  open: boolean;
  onClose: () => void;
  selectedApp: App | null;
  selectedIntegration: Integration | null;
  onIntegrationSelected: (integration: Integration | null) => void;
  integrations: Integration[];
  onIntegrationsUpdated: () => void;
}

interface IntegrationCardProps {
  integration: Integration;
  selected: boolean;
  onSelect: () => void;
  onTest: () => Promise<void>;
  onEdit: () => void;
  onDelete: () => Promise<void>;
  app: App | null;
}

function IntegrationCard({ 
  integration, 
  selected, 
  onSelect, 
  onTest, 
  onEdit, 
  onDelete, 
  app 
}: IntegrationCardProps) {
  const [testing, setTesting] = useState(false);
  const [deleting, setDeleting] = useState(false);

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

  return (
    <Card 
      className={`cursor-pointer transition-all ${
        selected 
          ? 'border-blue-500 bg-blue-50 shadow-sm' 
          : 'hover:border-gray-300 hover:shadow-sm'
      }`}
      onClick={onSelect}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          {/* Integration Info */}
          <div className="flex items-center space-x-3 flex-1">
            {app?.icon_url ? (
              <img src={app.icon_url} alt={app.name} className="w-10 h-10 rounded-lg" />
            ) : (
              <div 
                className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold"
                style={{ backgroundColor: app?.color || '#3b82f6' }}
              >
                {app?.name.charAt(0).toUpperCase()}
              </div>
            )}
            
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <h4 className="font-medium">{integration.name}</h4>
                {selected && (
                  <Badge variant="secondary" className="text-xs">Selected</Badge>
                )}
              </div>
              
              <div className="flex items-center space-x-2 mt-1">
                {getStatusBadge(integration.current_state)}
                <span className="text-xs text-gray-500">ID: {integration.id}</span>
              </div>
              
              <p className="text-xs text-gray-500 mt-1">
                Created {new Date(integration.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-1 ml-4" onClick={e => e.stopPropagation()}>
            <Button
              size="sm"
              variant="ghost"
              onClick={async () => {
                setTesting(true);
                try {
                  await onTest();
                } finally {
                  setTesting(false);
                }
              }}
              disabled={testing}
              title="Test Integration"
            >
              {testing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <TestTube className="h-4 w-4" />
              )}
            </Button>

            <Button
              size="sm"
              variant="ghost"
              onClick={onEdit}
              title="Edit Integration"
            >
              <Edit className="h-4 w-4" />
            </Button>

            <Button
              size="sm"
              variant="ghost"
              onClick={async () => {
                setDeleting(true);
                try {
                  await onDelete();
                } finally {
                  setDeleting(false);
                }
              }}
              disabled={deleting}
              className="text-red-600 hover:text-red-700"
              title="Delete Integration"
            >
              {deleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function IntegrationSelector({
  open,
  onClose,
  selectedApp,
  selectedIntegration,
  onIntegrationSelected,
  integrations,
  onIntegrationsUpdated
}: IntegrationSelectorProps) {
  // Listen for integration changes from popup
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'INTEGRATION_CREATED' || event.data.type === 'INTEGRATION_UPDATED') {
        onIntegrationsUpdated();
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onIntegrationsUpdated]);

  // Early return if no app is selected (after hooks)
  if (!selectedApp) {
    return null;
  }

  // Filter integrations for the selected app
  const appIntegrations = integrations.filter(integration => 
    integration?.app?.key === selectedApp.key
  );

  const openIntegrationSetup = (integration?: Integration) => {
    if (!selectedApp) return;
    
    const integrationName = integration 
      ? integration.name 
      : `${selectedApp.name} Integration`;
    
    let setupUrl = `/automation/integrations/setup?app_key=${selectedApp.key}&integration_name=${encodeURIComponent(integrationName)}`;
    
    // Add edit mode if editing existing integration
    if (integration) {
      setupUrl += `&edit_integration_id=${integration.id}`;
    }
    
    window.open(setupUrl, 'integration_setup', 'width=600,height=700,scrollbars=yes,resizable=yes');
  };

  const testIntegration = async (integration: Integration) => {
    try {
      const response = await axios.post(`/automation/integrations/${integration.id}/test`);
      
      if (response.data.success) {
        alert('Integration test successful!');
      } else {
        alert('Integration test failed: ' + response.data.message);
      }
    } catch (error) {
      console.error('Integration test failed:', error);
      alert('Integration test failed. Please check your configuration.');
    }
  };

  const deleteIntegration = async (integration: Integration) => {
    if (!confirm(`Are you sure you want to delete "${integration.name}"? This action cannot be undone.`)) {
      return;
    }
    
    try {
      await axios.delete(`/automation/integrations/${integration.id}`);
      
      // If this was the selected integration, clear selection
      if (selectedIntegration?.id === integration.id) {
        onIntegrationSelected(null);
      }
      
      // Refresh integrations list
      onIntegrationsUpdated();
      
    } catch (error) {
      console.error('Failed to delete integration:', error);
      alert('Failed to delete integration. Please try again.');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Select {selectedApp.name} Integration</DialogTitle>
          <DialogDescription>
            Choose an existing integration or create a new one for {selectedApp.name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Current Selection */}
          {selectedIntegration && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center space-x-3">
                <User className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="font-medium text-blue-900">Currently Selected</p>
                  <p className="text-sm text-blue-700">{selectedIntegration.name}</p>
                </div>
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="flex items-center space-x-2">
            <Button 
              onClick={() => openIntegrationSetup()} 
              className="flex-1"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create New {selectedApp.name} Integration
            </Button>
            <Button 
              onClick={onIntegrationsUpdated} 
              variant="outline"
              title="Refresh integrations"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>

          {/* Integration List */}
          <div className="space-y-2 max-h-96 overflow-y-auto">
            <h4 className="font-medium text-sm text-gray-700 sticky top-0 bg-white py-2">
              Available Integrations ({appIntegrations.length})
            </h4>
            
            {appIntegrations.length === 0 ? (
              <Card>
                <CardContent className="p-8">
                  <div className="text-center text-gray-500">
                    <User className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p className="font-medium">No integrations found</p>
                    <p className="text-sm">Create your first {selectedApp.name} integration to get started</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {appIntegrations.map((integration) => (
                  <IntegrationCard 
                    key={integration.id}
                    integration={integration}
                    selected={selectedIntegration?.id === integration.id}
                    onSelect={() => onIntegrationSelected(integration)}
                    onTest={() => testIntegration(integration)}
                    onEdit={() => openIntegrationSetup(integration)}
                    onDelete={() => deleteIntegration(integration)}
                    app={selectedApp}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex justify-between pt-4 border-t">
          <Button 
            variant="outline" 
            onClick={() => onIntegrationSelected(null)}
            disabled={!selectedIntegration}
          >
            Clear Selection
          </Button>
          
          <div className="space-x-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={onClose}>
              Done
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 