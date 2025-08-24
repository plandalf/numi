import React, { useState } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Settings, Zap, Play, Trash2, Mail, Clock, Filter, Webhook, Edit as EditIcon, TestTube, Activity } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { AddTriggerModal } from '@/components/sequences/AddTriggerModal';
import { EditTriggerModal } from '@/components/sequences/EditTriggerModal';
import { AddActionModal } from '@/components/sequences/AddActionModal';
import { EditActionModal } from '@/components/sequences/EditActionModal';
import { TestActionModal } from '@/components/sequences/TestActionModal';
import { WorkflowRunsModal } from '@/components/sequences/WorkflowRunsModal';
import axios from 'axios';
import { Inertia } from '@inertiajs/inertia';

interface Sequence {
  id: number;
  name: string;
  description?: string;
  is_active: boolean;
  triggers?: Trigger[];
  nodes?: Action[];
}

interface Trigger {
  id: number;
  name: string;
  trigger_key?: string;
  app_id?: number; // Added for new style triggers
  webhook_url?: string; // Added for Plandalf webhook triggers
  app: {
    id: number;
    name: string;
    icon_url?: string;
    color?: string;
  };
  integration?: {
    id: number;
  };
}

interface Action {
  id: number;
  name: string;
  type: string;
  app_id?: number;
  action_key?: string;
  configuration?: Record<string, unknown>;
  arguments?: Record<string, unknown>;
  app?: {
    id: number;
    name: string;
    icon_url?: string;
    color?: string;
  };
}

interface App {
  id: number;
  name: string;
  icon_url?: string;
  category: string;
  description?: string;
  triggers?: Array<{
    key: string;
    label: string;
  }>;
  actions?: Array<{
    key: string;
    label: string;
  }>;
}

interface CreatedTrigger {
  id: number;
  name: string;
  app_id: number;
  trigger_key: string;
  configuration: Record<string, unknown>;
  webhook_url?: string;
  app?: {
    name: string;
    icon_url?: string;
    color?: string;
  };
}

interface CreatedAction {
  id: number;
  name: string;
  type: string;
  app_id?: number;
  action_key?: string;
  configuration: Record<string, unknown>;
  app?: {
    name: string;
    icon_url?: string;
    color?: string;
  };
}

export default function Edit() {
  const { sequence, apps } = usePage<{
    sequence: Sequence;
    apps: App[];
  }>().props;

  const [showAddTriggerModal, setShowAddTriggerModal] = useState(false);
  const [showEditTriggerModal, setShowEditTriggerModal] = useState(false);
  const [showAddActionModal, setShowAddActionModal] = useState(false);
  // const [showEditActionModal, setShowEditActionModal] = useState(false);
  // const [showTestActionModal, setShowTestActionModal] = useState(false);
  const [showWorkflowRunsModal, setShowWorkflowRunsModal] = useState(false);

  const [editingAction, setEditingAction] = useState<Action | null>(null);

  const [editingTrigger, setEditingTrigger] = useState<CreatedTrigger | null>(null);

  const triggers = sequence.triggers || [];
  const actions = sequence.actions || [];

  // Get existing trigger constraints for new trigger restrictions
  const getExistingTriggerConstraints = () => {
    if (triggers.length === 0) return null;

    const firstTrigger = triggers[0];

    // Extract app info from the first trigger
    let appId: number | undefined;
    let triggerKey: string | undefined;
    let appName: string | undefined;

    if (firstTrigger?.app) {
      // Old style trigger with integration data
      appId = firstTrigger.app.id;
      appName = firstTrigger.app.name;
      triggerKey = firstTrigger.trigger_key;
    } else if (firstTrigger.app_id) {
      // New style trigger with direct app_id
      appId = firstTrigger.app_id;
      triggerKey = firstTrigger.trigger_key;

      // Find app name from the apps list
      const app = apps.find(a => a.id === appId);
      appName = app?.name;
    }

    return appId && triggerKey ? {
      appId,
      triggerKey,
      appName: appName || 'Unknown App'
    } : null;
  };

  const existingTriggerConstraints = getExistingTriggerConstraints();

  function reload() {
    router.reload({
      preserveState: true,
      preserveScroll: true,
      only: ['sequence'],
    });
  }

  const handleTriggerAdded = (newTrigger: CreatedTrigger) => {
    reload();
    setShowAddTriggerModal(false);
    setEditingTrigger(newTrigger);
    setShowEditTriggerModal(true);
  };

  const handleTriggerUpdated = (updatedTrigger: CreatedTrigger) => {
    reload();
    setShowEditTriggerModal(false);
    setEditingTrigger(null);
  };

  const handleEditTriggerModalClose = () => {
    setShowEditTriggerModal(false);
    setEditingTrigger(null);
  };

  const handleEditTrigger = (trigger: Trigger) => {
    setEditingTrigger(trigger);
    setShowEditTriggerModal(true);
  };

  const handleActionAdded = (newAction: Action) => {
    setEditingAction(newAction);
  };

  const handleEditAction = (action: Action) => {
    setEditingAction(action);
  };

  const handleEditActionModalClose = () => {
    setEditingAction(null);
  };

  const handleActionUpdatedFromEdit = (updatedAction: CreatedAction) => {
    reload();
    setEditingAction(null);
  };

  const handleCloseActionModal = () => {
    setShowAddActionModal(false);
  };

  const deleteTrigger = async (triggerId: number) => {
    try {
      await axios.delete(`/automation/triggers/${triggerId}`);
      reload();
    } catch (error) {
      console.error('Failed to delete trigger:', error);
    }
  };

  const deleteAction = async (actionId: number) => {
    try {
      await axios.delete(`/automation/actions/${actionId}`);
      reload();
    } catch (error) {
      console.error('Failed to delete action:', error);
    }
  };

  const getActionIcon = (type: string) => {
    switch (type) {
      case 'email':
        return Mail;
      case 'webhook':
        return Webhook;
      case 'delay':
        return Clock;
      case 'condition':
        return Filter;
      default:
        return Settings;
    }
  };

  const getActionColor = (type: string) => {
    switch (type) {
      case 'email':
        return 'bg-red-100 text-red-700';
      case 'webhook':
        return 'bg-purple-100 text-purple-700';
      case 'delay':
        return 'bg-green-100 text-green-700';
      case 'condition':
        return 'bg-blue-100 text-blue-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <AppLayout>
      <Head title={`Edit ${sequence.name}`} />

      {/* <pre>{JSON.stringify(editingAction, null, 2)}</pre> */}

      <div className="p-6 space-y-4">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{sequence.name}</h1>
          </div>

          <div className="flex space-x-2">
            {/* <Button
              onClick={() => setShowWorkflowRunsModal(true)}
              variant="outline"
            >
              <Activity className="h-4 w-4 mr-2" />
              View Runs
            </Button> */}
            {/* <Button className="bg-green-600 hover:bg-green-700">
              <Play className="h-4 w-4 mr-2" />
              Test Workflow
            </Button> */}
          </div>
        </div>


        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Triggers */}
          <div className="space-y-2">
            <div>
              <div>
                <div className="flex justify-between items-center">
                  <CardTitle>Triggers</CardTitle>
                  <Button onClick={() => setShowAddTriggerModal(true)} size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    {existingTriggerConstraints
                      ? `Add ${existingTriggerConstraints.appName} Trigger`
                      : 'Add Trigger'
                    }
                  </Button>
                </div>

              </div>
            </div>
            <div className="space-y-3">
              {triggers.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Zap className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium">No triggers yet</p>
                  <p className="text-sm">Add your first trigger to get started</p>
                  <Button
                    onClick={() => setShowAddTriggerModal(true)}
                    className="mt-4"
                    variant="outline"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Trigger
                  </Button>
                </div>
              ) : (
                triggers.map((trigger) => (
                  <div key={trigger.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      {trigger.integration?.app.icon_url ? (
                        <img
                          src={trigger.integration.app.icon_url}
                          alt={trigger.integration.app.name}
                          className="w-8 h-8 rounded"
                        />
                      ) : (
                        <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
                          <Zap className="h-4 w-4 text-white" />
                        </div>
                      )}
                      <div>
                        <h4 className="font-medium text-sm">{trigger.name}</h4>
                        <p className="text-xs text-gray-500">
                          {trigger.integration?.app.name} • {trigger.trigger_key}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="secondary" className="text-xs">Active</Badge>
                      <Button
                        onClick={() => handleEditTrigger(trigger)}
                        size="sm"
                        variant="ghost"
                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        title="Edit trigger"
                      >
                        <EditIcon className="h-4 w-4" />
                      </Button>
                      <Button
                        onClick={() => deleteTrigger(trigger.id)}
                        size="sm"
                        variant="ghost"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        title="Delete trigger"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div>
              {existingTriggerConstraints && (
                <span className="block text-xs text-orange-600 mt-1">
                        Note: All triggers must use {existingTriggerConstraints.appName} • {existingTriggerConstraints.triggerKey}
                      </span>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-2">
            <div>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Actions</CardTitle>
                </div>
                <Button onClick={() => setShowAddActionModal(true)} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Action
                </Button>
              </div>
            </div>
            <div className="space-y-3">
              {actions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Play className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium">No actions yet</p>
                  <p className="text-sm">Add actions to define what happens when triggers fire</p>
                  <Button
                    onClick={() => setShowAddActionModal(true)}
                    className="mt-4"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Action
                  </Button>
                </div>
              ) : (
                actions.map((action) => {
                  const ActionIcon = getActionIcon(action.type);
                  return (
                    <div key={action.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div
                          className={`w-8 h-8 rounded flex items-center justify-center ${getActionColor(action.type)}`}>
                          <ActionIcon className="h-4 w-4" />
                        </div>
                        <div>
                          <h4 className="font-medium text-sm">{action.name}</h4>
                          <p className="text-xs text-gray-500 capitalize">{action.type} action</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="secondary" className="text-xs">Active</Badge>

                        <Button
                          onClick={() => handleEditAction(action)}
                          size="sm"
                          variant="ghost"
                          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          title="Edit action"
                        >
                          <EditIcon className="h-4 w-4" />
                        </Button>
                        <Button
                          onClick={() => deleteAction(action.id)}
                          size="sm"
                          variant="ghost"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          title="Delete action"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

      </div>

      {/* Modals */}
      <AddTriggerModal
        open={showAddTriggerModal}
        onClose={() => setShowAddTriggerModal(false)}
        sequenceId={sequence.id}
        onTriggerAdded={handleTriggerAdded}
        existingTriggerConstraints={existingTriggerConstraints}
      />

      {editingTrigger && (
        <EditTriggerModal
          open={showEditTriggerModal}
          onClose={handleEditTriggerModalClose}
          trigger={editingTrigger}
          onTriggerUpdated={handleTriggerUpdated}
        />
      )}

      <AddActionModal
        open={showAddActionModal}
        onClose={handleCloseActionModal}
        sequenceId={sequence.id}
        onActionAdded={handleActionAdded}
      />
      {/* make this the select event with filter on actions modal */}


      {editingAction && (
        <EditActionModal
          open={editingAction !== null}
          onClose={handleEditActionModalClose}
          action={editingAction}
          onActionUpdated={handleActionUpdatedFromEdit}
          sequenceData={{
            triggers: triggers,
            actions: actions
          }}
        />
      )}

      <WorkflowRunsModal
        open={true}
        onClose={() => {
          //
        }}
        sequenceId={sequence.id}
      />
    </AppLayout>
  );
}
