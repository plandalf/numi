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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string[]>>({});

  // Setup tab state
  const [selectedApp, setSelectedApp] = useState<App | null>(null);
  const [selectedAction, setSelectedAction] = useState<ActionDefinition | null>(null);
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);

  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [showAppSelector, setShowAppSelector] = useState(false);

  // Config tab state
  const [actionName, setActionName] = useState('');
  const [configuration, setConfiguration] = useState<Record<string, unknown>>({});


  useEffect(() => {
    if (open) {
      // loadApps();
      loadIntegrations();
      if (editingAction) {
        setActionName(editingAction.name);
        setConfiguration(editingAction.configuration || {});
      } else {
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
      console.log(payload);

      const response = await axios.post(`/automation/actions`, payload);
      onActionAdded(response.data);

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


  const handleClose = () => {
    setError(null);
    setValidationErrors({});
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
              <div
                  className="border-2 border-dashed border-gray-300 hover:border-gray-400 transition-colors cursor-pointer"
                  onClick={() => setShowAppSelector(true)}>
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

          <Combobox
              name="user"
              placeholder={"Choose an action"}
              items={selectedApp?.actions.map(a => ({ value: a.key, label: a.label })) || []}
              displayValue={(action) => action?.name}
              defaultValue={null}
              onSelect={(action) => {
                console.log("CHANGE", { action })
                  const actionDef = selectedApp?.actions.find(a => a.key === action);
                  if (actionDef) {
                  handleActionSelect(actionDef);
                  }
              }}
          >
            {(user) => (
                <ComboboxOption value={user}>
                  <ComboboxLabel>{user.name}</ComboboxLabel>
                </ComboboxOption>
            )}
          </Combobox>
        </div>

        {/* Progress Message */}
        <div className="">
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

        {/* Save Button */}
        <div className="flex justify-end p-4 border-t">
          <Button onClick={handleSave} disabled={loading || !selectedApp || !selectedAction}>
            {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
            ) : (
                'Create Action'
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
