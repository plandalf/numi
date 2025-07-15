import React, { useState } from 'react';
import { Head, usePage } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Settings, Users, Zap, Play, Trash2, Mail, Clock, Filter, Webhook, Edit as EditIcon, TestTube } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { AddTriggerModal } from '@/components/sequences/AddTriggerModal';
import { AddActionModal } from '@/components/sequences/AddActionModal';
import { TestActionModal } from '@/components/sequences/TestActionModal';
import axios from 'axios';

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
  app_trigger?: {
    name: string;
  };
  integration?: {
    app: {
      name: string;
      icon_url?: string;
    };
  };
}

interface Action {
  id: number;
  name: string;
  type: string;
  arguments?: Record<string, unknown>;
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

interface Integration {
  id: number;
  name: string;
  app: {
    name: string;
    icon_url?: string;
  };
}

export default function Edit() {
  const { sequence, apps, integrations } = usePage<{
    sequence: Sequence;
    apps: App[];
    integrations: Integration[];
  }>().props;

  const [showAddTriggerModal, setShowAddTriggerModal] = useState(false);
  const [showAddActionModal, setShowAddActionModal] = useState(false);
  const [showTestActionModal, setShowTestActionModal] = useState(false);
  const [editingAction, setEditingAction] = useState<Action | null>(null);
  const [testingAction, setTestingAction] = useState<Action | null>(null);
  const [triggers, setTriggers] = useState<Trigger[]>(sequence.triggers || []);
  const [actions, setActions] = useState<Action[]>(sequence.nodes || []);

  const stats = {
    triggers: triggers.length,
    actions: actions.length,
    apps: new Set([
      ...triggers.map(t => t.integration?.app.name).filter(Boolean),
      ...integrations.map(i => i.app.name)
    ]).size,
    integrations: integrations.length
  };

  const handleTriggerAdded = (newTrigger: unknown) => {
    setTriggers(prev => [...prev, newTrigger as Trigger]);
  };

  const handleActionAdded = (newAction: unknown) => {
    setActions(prev => [...prev, newAction as Action]);
  };

  const handleActionUpdated = (updatedAction: Action) => {
    setActions(prev => prev.map(a => a.id === updatedAction.id ? updatedAction : a));
    setEditingAction(null);
  };

  const handleEditAction = (action: Action) => {
    setEditingAction(action);
    setShowAddActionModal(true);
  };

  const handleTestAction = (action: Action) => {
    setTestingAction(action);
    setShowTestActionModal(true);
  };

  const handleCloseActionModal = () => {
    setShowAddActionModal(false);
    setEditingAction(null);
  };

  const handleCloseTestModal = () => {
    setShowTestActionModal(false);
    setTestingAction(null);
  };

  const deleteTrigger = async (triggerId: number) => {
    try {
      await axios.delete(`/sequences/${sequence.id}/triggers/${triggerId}`);
      setTriggers(prev => prev.filter(t => t.id !== triggerId));
    } catch (error) {
      console.error('Failed to delete trigger:', error);
    }
  };

  const deleteAction = async (actionId: number) => {
    try {
      await axios.delete(`/sequences/${sequence.id}/actions/${actionId}`);
      setActions(prev => prev.filter(a => a.id !== actionId));
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
      
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{sequence.name}</h1>
            {sequence.description && (
              <p className="text-gray-600 mt-1">{sequence.description}</p>
            )}
          </div>
          <div className="flex space-x-2">
            <Button variant="outline">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
            <Button className="bg-green-600 hover:bg-green-700">
              <Play className="h-4 w-4 mr-2" />
              Test Workflow
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-4 gap-4">
          <Card>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Triggers</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.triggers}</p>
                </div>
                <Zap className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Actions</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.actions}</p>
                </div>
                <Play className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Apps</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.apps}</p>
                </div>
                <Settings className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Integrations</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.integrations}</p>
                </div>
                <Users className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Triggers */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Triggers</CardTitle>
                  <CardDescription>Events that start this workflow</CardDescription>
                </div>
                <Button onClick={() => setShowAddTriggerModal(true)} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Trigger
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
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
                          {trigger.integration?.app.name} • {trigger.app_trigger?.name}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="secondary" className="text-xs">Active</Badge>
                      <Button
                        onClick={() => deleteTrigger(trigger.id)}
                        size="sm"
                        variant="ghost"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Actions</CardTitle>
                  <CardDescription>What happens when triggers fire</CardDescription>
                </div>
                <Button onClick={() => setShowAddActionModal(true)} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Action
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {actions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Play className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium">No actions yet</p>
                  <p className="text-sm">Add actions to define what happens when triggers fire</p>
                  <Button 
                    onClick={() => setShowAddActionModal(true)} 
                    className="mt-4"
                    variant="outline"
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
                        <div className={`w-8 h-8 rounded flex items-center justify-center ${getActionColor(action.type)}`}>
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
                          onClick={() => handleTestAction(action)}
                          size="sm"
                          variant="ghost"
                          className="text-green-600 hover:text-green-700 hover:bg-green-50"
                          title="Test action"
                        >
                          <TestTube className="h-4 w-4" />
                        </Button>
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
            </CardContent>
          </Card>
        </div>

        {/* Available Apps */}
        {apps.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Available Apps</CardTitle>
              <CardDescription>Discovered apps with their available triggers and actions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {apps.map((app) => (
                  <div key={app.id} className="border rounded-lg p-4">
                    <div className="flex items-center space-x-3 mb-3">
                      {app.icon_url ? (
                        <img 
                          src={app.icon_url} 
                          alt={app.name}
                          className="w-10 h-10 rounded-lg"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
                          {app.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <h4 className="font-medium">{app.name}</h4>
                        <p className="text-sm text-gray-500">{app.description}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      {app.triggers && app.triggers.length > 0 && (
                        <div>
                          <h5 className="text-xs font-medium text-gray-700 uppercase tracking-wide mb-1">
                            Triggers ({app.triggers.length})
                          </h5>
                          <div className="space-y-1">
                            {app.triggers.slice(0, 3).map((trigger) => (
                              <div key={trigger.key} className="text-xs text-gray-600 flex items-center space-x-1">
                                <Zap className="h-3 w-3 text-blue-500" />
                                <span>{trigger.label}</span>
                              </div>
                            ))}
                            {app.triggers.length > 3 && (
                              <div className="text-xs text-gray-500">
                                +{app.triggers.length - 3} more triggers
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                      
                      {app.actions && app.actions.length > 0 && (
                        <div>
                          <h5 className="text-xs font-medium text-gray-700 uppercase tracking-wide mb-1">
                            Actions ({app.actions.length})
                          </h5>
                          <div className="space-y-1">
                            {app.actions.slice(0, 3).map((action) => (
                              <div key={action.key} className="text-xs text-gray-600 flex items-center space-x-1">
                                <Play className="h-3 w-3 text-green-500" />
                                <span>{action.label}</span>
                              </div>
                            ))}
                            {app.actions.length > 3 && (
                              <div className="text-xs text-gray-500">
                                +{app.actions.length - 3} more actions
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Modals */}
      <AddTriggerModal
        open={showAddTriggerModal}
        onClose={() => setShowAddTriggerModal(false)}
        sequenceId={sequence.id}
        onTriggerAdded={handleTriggerAdded}
      />
      
      <AddActionModal
        open={showAddActionModal}
        onClose={handleCloseActionModal}
        sequenceId={sequence.id}
        onActionAdded={handleActionAdded}
        editingAction={editingAction}
        onActionUpdated={handleActionUpdated}
      />

      {testingAction && (
        <TestActionModal
          open={showTestActionModal}
          onClose={handleCloseTestModal}
          action={testingAction}
          sequenceId={sequence.id}
          allActions={actions}
        />
      )}
    </AppLayout>
  );
} 