import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import React, { useEffect, useState } from 'react';
import axios from 'axios';

interface App {
  key: string;
  name: string;
  description?: string;
  icon_url?: string;
  color?: string;
  actions?: ActionDefinition[];
  id: number;
}


export function AppSelectorModal({
   type = 'actions',
   onClose,
   onSelect,
  selectedApp,
   open
}: {}) {

  const [apps, setApps] = useState<App[]>([]);

  useEffect(() => {
    if (open) {
      loadApps();
    }
  }, [open]);

  const loadApps = async () => {
    try {
      const response = await axios.get('/automation/apps');
      setApps(response.data.data || []);
    } catch (error) {
      console.error('Failed to load apps:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden">
        <DialogHeader className="px-4 py-2 bg-gray-100">
          <DialogTitle className="text-base">Choose App</DialogTitle>
        </DialogHeader>
        <div className="px-4">
          {apps.map((app) => (
            <div
              key={app.id}
              className={`px-1 cursor-pointer transition-colors ${
                selectedApp?.id === app.id ? 'border-blue-500 bg-blue-50' : 'hover:border-gray-300'
              } hover:bg-gray-100`}
              onClick={() => onSelect(app)}
            >
              <div className="py-2">
                <div className="flex items-start space-x-3">
                  {app.icon_url ? (
                    <img src={app.icon_url} alt={app.name} className="w-8 h-8 rounded-lg" />
                  ) : (
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold mt-1"
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
              </div>
            </div>
          ))}
        </div>
        <div className="flex justify-end px-4 pb-4">
          <Button onClick={onClose} variant="outline">
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// {showAppSelector && (

// )}
