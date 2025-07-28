import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, AlertCircle, Zap, ArrowLeft } from 'lucide-react';
import axios from 'axios';

interface App {
  key: string;
  name: string;
  description?: string;
  icon_url?: string;
  color?: string;
  category?: string;
  triggers_count: number;
  triggers?: Trigger[]; // Added triggers to the App interface
  id: number; // Added id to the App interface
}

interface Trigger {
  key: string;
  label: string;
  description: string;
  app: string;
  requires_auth: boolean;
}

interface AddTriggerModalProps {
  open: boolean;
  onClose: () => void;
  sequenceId: number;
  onTriggerAdded: (trigger: CreatedTrigger) => void;
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



export function AddTriggerModal({ open, onClose, sequenceId, onTriggerAdded }: AddTriggerModalProps) {
  const [step, setStep] = useState<'select-app' | 'select-trigger' | 'configure'>('select-app');
  const [selectedApp, setSelectedApp] = useState<App | null>(null);
  const [selectedTrigger, setSelectedTrigger] = useState<Trigger | null>(null);
  const [apps, setApps] = useState<App[]>([]);
  const [loading, setLoading] = useState(false);
  const [triggerName, setTriggerName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string[]>>({});

  useEffect(() => {
    if (open) {
      loadApps();
    }
  }, [open]);

  const loadApps = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/automation/apps');
      setApps(response.data.data || []);
    } catch (error) {
      console.error('Failed to load apps:', error);
    } finally {
      setLoading(false);
    }
  };



  const handleAppSelect = async (app: App) => {
    setSelectedApp(app);
    setSelectedTrigger(null);
    setTriggerName('');
    setStep('select-trigger');
  };

  const handleTriggerSelect = async (trigger: Trigger) => {
    setSelectedTrigger(trigger);
    setTriggerName(trigger.label);
    setStep('configure');
  };



  const createTrigger = async () => {
    if (!selectedApp || !selectedTrigger) {
      console.error('Missing required data:', { selectedApp, selectedTrigger });
      setError('Missing required data. Please try again.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setValidationErrors({});
      
      const payload = {
        sequence_id: sequenceId,
        app_id: selectedApp.id,
        trigger_id: selectedTrigger.key,
        name: triggerName,
        configuration: {},
      };
      
      console.log('Creating trigger with payload:', payload);
      
      const response = await axios.post(`/automation/triggers`, payload);

      // Pass the created trigger to parent and close modal
      onTriggerAdded(response.data.data);
      handleClose();
    } catch (error) {
      console.error('Failed to create trigger:', error);
      
      if (axios.isAxiosError(error) && error.response?.status === 422) {
        setValidationErrors(error.response.data.errors || {});
      } else if (axios.isAxiosError(error)) {
        setError(error.response?.data?.message || 'Failed to create trigger. Please try again.');
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStep('select-app');
    setSelectedApp(null);
    setSelectedTrigger(null);
    setTriggerName('');
    setApps([]);
    setError(null);
    setValidationErrors({});
    onClose();
  };

  const goBack = () => {
    if (step === 'select-trigger') {
      setStep('select-app');
      setSelectedApp(null);
    } else if (step === 'configure') {
      setStep('select-trigger');
      setSelectedTrigger(null);
      setTriggerName('');
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent variant="full-height" className="flex flex-col">
        <DialogHeader>
          <DialogTitle>Add Trigger</DialogTitle>
          <DialogDescription>
            Choose an app and event to trigger this workflow
          </DialogDescription>
        </DialogHeader>

        {/* Scrollable content area */}
        <div className="flex-1 overflow-y-auto">
          {/* Step indicator */}
          <div className="flex items-center space-x-2 mb-4">
          {step !== 'select-app' && (
            <Button variant="ghost" size="sm" onClick={goBack}>
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
          )}
          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                step === 'select-app' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                1
              </div>
              <span className={`text-sm ${step === 'select-app' ? 'text-blue-600 font-medium' : 'text-gray-500'}`}>
                Select App
              </span>
              <div className="flex-1 h-px bg-gray-200" />
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                step === 'select-trigger' ? 'bg-blue-600 text-white' : 
                step === 'configure' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                2
              </div>
              <span className={`text-sm ${step === 'select-trigger' ? 'text-blue-600 font-medium' : 
                step === 'configure' ? 'text-green-600 font-medium' : 'text-gray-500'}`}>
                Select Trigger
              </span>
              <div className="flex-1 h-px bg-gray-200" />
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                step === 'configure' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                3
              </div>
              <span className={`text-sm ${step === 'configure' ? 'text-blue-600 font-medium' : 'text-gray-500'}`}>
                Configure
              </span>
            </div>
          </div>
        </div>

        {/* Step 1: Select App */}
        {step === 'select-app' && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Select an App</h3>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : apps.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Zap className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No apps with triggers available</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {apps.map((app) => (
                  <Card
                    key={app.key}
                    className="cursor-pointer hover:border-primary transition-colors"
                    onClick={() => handleAppSelect(app)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-3">
                        {app.icon_url ? (
                          <img
                            src={app.icon_url}
                            alt={app.name}
                            className="w-10 h-10 rounded-lg"
                          />
                        ) : (
                          <div
                            className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold"
                            style={{ backgroundColor: app.color || '#3b82f6' }}
                          >
                            {app.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="flex-1">
                          <h4 className="font-medium">{app.name}</h4>
                          <p className="text-sm text-gray-500">{app.description}</p>
                          <div className="flex items-center space-x-2 mt-2">
                            <Badge variant="outline" className="text-xs">
                              {app.triggers_count} triggers
                            </Badge>
                            {app.category && (
                              <Badge variant="secondary" className="text-xs">
                                {app.category}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 2: Select Trigger */}
        {step === 'select-trigger' && selectedApp && (
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              {selectedApp.icon_url ? (
                <img
                  src={selectedApp.icon_url}
                  alt={selectedApp.name}
                  className="w-8 h-8 rounded-lg"
                />
              ) : (
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm"
                  style={{ backgroundColor: selectedApp.color || '#3b82f6' }}
                >
                  {selectedApp.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <h3 className="text-lg font-medium">Select Trigger Event</h3>
                <p className="text-sm text-gray-500">{selectedApp.name}</p>
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : !selectedApp.triggers || selectedApp.triggers.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Zap className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No triggers available for {selectedApp.name}</p>
              </div>
            ) : (
              <div className="space-y-2">
                {selectedApp.triggers.map((trigger: Trigger) => (
                  <Card
                    key={trigger.key}
                    className="cursor-pointer hover:border-primary transition-colors"
                    onClick={() => handleTriggerSelect(trigger)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium">{trigger.label}</h4>
                          <p className="text-sm text-gray-500">{trigger.description}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          {trigger.requires_auth && (
                            <Badge variant="outline" className="text-xs">
                              Requires Auth
                            </Badge>
                          )}
                          <Badge variant="secondary" className="text-xs">
                            {trigger.key}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}



        {/* Step 3: Configure Trigger */}
        {step === 'configure' && selectedApp && selectedTrigger && (
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              {selectedApp.icon_url ? (
                <img
                  src={selectedApp.icon_url}
                  alt={selectedApp.name}
                  className="w-8 h-8 rounded-lg"
                />
              ) : (
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm"
                  style={{ backgroundColor: selectedApp.color || '#3b82f6' }}
                >
                  {selectedApp.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <h3 className="text-lg font-medium">Configure Trigger</h3>
                <p className="text-sm text-gray-500">
                  {selectedTrigger.label} from {selectedApp.name}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Error Display */}
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="h-4 w-4 text-red-500" />
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
              )}

              <div>
                <Label htmlFor="trigger-name">Trigger Name</Label>
                <Input
                  id="trigger-name"
                  value={triggerName}
                  onChange={(e) => setTriggerName(e.target.value)}
                  placeholder="Give this trigger a descriptive name"
                  className={validationErrors.name ? 'border-red-300' : ''}
                />
                {validationErrors.name && (
                  <p className="text-xs text-red-500 mt-1">{validationErrors.name[0]}</p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  This name will be used to identify the trigger in your sequence
                </p>
              </div>

              <div className="flex space-x-2">
                <Button onClick={goBack} variant="outline" className="flex-1">
                  Back
                </Button>
                <Button
                  onClick={createTrigger}
                  disabled={loading || !triggerName.trim()}
                  className="flex-1"
                >
                  {loading ? (
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
        </div>
      </DialogContent>
    </Dialog>
  );
}
