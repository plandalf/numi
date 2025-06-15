import React, { useState } from 'react';
import { AdvancedTemplateEditor } from './advanced-template-editor';
import { Card, CardContent, CardHeader, CardTitle } from './card';
import { Button } from './button';
import { Badge } from './badge';

// Demo component to showcase the advanced template editor
export function TemplateEditorDemo() {
  const [singleLineValue, setSingleLineValue] = useState('Hello {{action_1.data.name}}, your order {{action_2.data.id}} is ready!');
  const [multiLineValue, setMultiLineValue] = useState('Dear {{action_1.data.customer.firstName}},\n\nThank you for your order! Here are the details:\n\nOrder ID: {{action_2.data.orderId}}\nAmount: ${{action_2.data.amount}}\nStatus: {{action_2.data.status}}\n\nWe\'ll send you an update when your order ships.\n\nBest regards,\nThe Team\n\nP.S. Your customer ID is {{action_1.data.customer.id}} for reference.');

  const [invalidValue, setInvalidValue] = useState('Hello {{invalid_action.name}}, your {{missing_data}} is {{action_1.nonexistent.field}}!');

  // Mock context with sample data
  const mockContext = {
    action_1: {
      id: 'action_1',
      name: 'Get Customer Data',
      type: 'action',
      description: 'Fetches customer information from database',
      sampleData: {
        success: true,
        data: {
          customer: {
            id: 'cust_123',
            firstName: 'John',
            lastName: 'Doe',
            email: 'john.doe@example.com',
            phone: '+1-555-0123',
            address: {
              street: '123 Main St',
              city: 'Anytown',
              state: 'CA',
              zip: '12345'
            },
            preferences: {
              newsletter: true,
              sms: false
            }
          },
          metadata: {
            source: 'api',
            version: '1.0',
            timestamp: '2023-01-01T00:00:00Z'
          }
        }
      }
    },
    action_2: {
      id: 'action_2',
      name: 'Create Order',
      type: 'action',
      description: 'Creates a new order in the system',
      sampleData: {
        success: true,
        data: {
          orderId: 'ord_456',
          amount: 99.99,
          currency: 'USD',
          status: 'pending',
          items: [
            {
              id: 'item_1',
              name: 'Premium Widget',
              quantity: 2,
              price: 49.99
            }
          ],
          shipping: {
            method: 'standard',
            cost: 0,
            estimatedDays: 5
          },
          createdAt: '2023-01-01T12:00:00Z'
        }
      }
    },
    action_3: {
      id: 'action_3',
      name: 'Send Email',
      type: 'action',
      description: 'Sends email notification',
      sampleData: {
        success: true,
        data: {
          messageId: 'msg_789',
          recipient: 'john.doe@example.com',
          subject: 'Order Confirmation',
          sentAt: '2023-01-01T12:05:00Z',
          deliveryStatus: 'delivered'
        }
      }
    }
  };

  const resetToDefaults = () => {
    setSingleLineValue('Hello {{action_1.data.customer.firstName}}, your order {{action_2.data.orderId}} is ready!');
    setMultiLineValue('Dear {{action_1.data.customer.firstName}},\n\nThank you for your order! Here are the details:\n\nOrder ID: {{action_2.data.orderId}}\nAmount: ${{action_2.data.amount}}\nStatus: {{action_2.data.status}}\n\nWe\'ll send you an update when your order ships.\n\nBest regards,\nThe Team\n\nP.S. Your customer ID is {{action_1.data.customer.id}} for reference.');
    setInvalidValue('Hello {{invalid_action.name}}, your {{missing_data}} is {{action_1.nonexistent.field}}!');
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold">Advanced Template Editor Demo</h1>
        <p className="text-lg text-gray-600">
          Experience intelligent template editing with validation, syntax highlighting, and autocomplete
        </p>
        <div className="flex justify-center gap-2">
          <Badge variant="secondary">✅ Real-time Validation</Badge>
          <Badge variant="secondary">🎨 Syntax Highlighting</Badge>
          <Badge variant="secondary">🔍 Smart Autocomplete</Badge>
          <Badge variant="secondary">⌨️ Keyboard Navigation</Badge>
        </div>
        <Button onClick={resetToDefaults} variant="outline">
          Reset to Defaults
        </Button>
      </div>

      {/* Single Line Editor - Valid Variables */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="w-3 h-3 bg-green-500 rounded-full"></span>
            Single Line Template (Valid Variables)
          </CardTitle>
          <p className="text-sm text-gray-600">
            This template uses valid variables that exist in the context. Notice the green highlighting.
          </p>
        </CardHeader>
        <CardContent>
          <AdvancedTemplateEditor
            value={singleLineValue}
            onChange={setSingleLineValue}
            placeholder="Enter your template with {{variable}} syntax..."
            context={mockContext}
            multiline={false}
          />
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-sm mb-2">Preview Output:</h4>
            <p className="text-sm font-mono">
              {singleLineValue
                .replace(/\{\{action_1\.data\.customer\.firstName\}\}/g, 'John')
                .replace(/\{\{action_2\.data\.orderId\}\}/g, 'ord_456')
                .replace(/\{\{action_2\.data\.id\}\}/g, 'ord_456')
                .replace(/\{\{action_1\.data\.name\}\}/g, 'John Doe')
              }
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Multi Line Editor - Valid Variables */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="w-3 h-3 bg-green-500 rounded-full"></span>
            Multi-line Template (Valid Variables)
          </CardTitle>
          <p className="text-sm text-gray-600">
                         A more complex template with multiple valid variables. Try typing <code>{'{{action_'}</code> to see autocomplete.
          </p>
        </CardHeader>
        <CardContent>
          <AdvancedTemplateEditor
            value={multiLineValue}
            onChange={setMultiLineValue}
            placeholder="Enter your multi-line template..."
            context={mockContext}
            multiline={true}
          />
        </CardContent>
      </Card>

      {/* Invalid Variables Demo */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="w-3 h-3 bg-red-500 rounded-full"></span>
            Template with Invalid Variables
          </CardTitle>
          <p className="text-sm text-gray-600">
            This template contains invalid variables. Notice the red highlighting and validation errors below.
          </p>
        </CardHeader>
        <CardContent>
          <AdvancedTemplateEditor
            value={invalidValue}
            onChange={setInvalidValue}
            placeholder="Try entering invalid variables like {{nonexistent.field}}..."
            context={mockContext}
            multiline={false}
          />
        </CardContent>
      </Card>

      {/* Available Variables Reference */}
      <Card>
        <CardHeader>
          <CardTitle>Available Variables Reference</CardTitle>
          <p className="text-sm text-gray-600">
            These are the variables available in this demo context. Use the "Insert Variable" button or type them manually.
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(mockContext).map(([actionId, actionData]) => (
              <div key={actionId} className="border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm">⚡</span>
                  <code className="text-sm font-mono font-semibold text-green-600">{actionId}</code>
                </div>
                <p className="text-xs text-gray-600 mb-3">{actionData.description}</p>
                <div className="space-y-1">
                  <p className="text-xs font-medium text-gray-700">Sample properties:</p>
                  <div className="text-xs font-mono text-gray-600 space-y-1">
                    <div>• {actionId}.data.success</div>
                    {actionId === 'action_1' && (
                      <>
                        <div>• {actionId}.data.customer.firstName</div>
                        <div>• {actionId}.data.customer.email</div>
                        <div>• {actionId}.data.customer.address.city</div>
                      </>
                    )}
                    {actionId === 'action_2' && (
                      <>
                        <div>• {actionId}.data.orderId</div>
                        <div>• {actionId}.data.amount</div>
                        <div>• {actionId}.data.status</div>
                      </>
                    )}
                    {actionId === 'action_3' && (
                      <>
                        <div>• {actionId}.data.messageId</div>
                        <div>• {actionId}.data.recipient</div>
                        <div>• {actionId}.data.deliveryStatus</div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Usage Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>How to Use</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-2">✨ Features</h4>
              <ul className="text-sm space-y-1 text-gray-600">
                <li>• <strong>Green highlighting:</strong> Valid template variables</li>
                <li>• <strong>Red highlighting:</strong> Invalid variables with errors</li>
                                 <li>• <strong>Smart autocomplete:</strong> Type <code>{'{{'}{'}'}</code> to see suggestions</li>
                <li>• <strong>Insert Variable button:</strong> Browse all available variables</li>
                <li>• <strong>Real-time validation:</strong> Instant feedback on errors</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">⌨️ Keyboard Shortcuts</h4>
              <ul className="text-sm space-y-1 text-gray-600">
                <li>• <kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">Ctrl/Cmd + Space</kbd> - Trigger autocomplete</li>
                <li>• <kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">↑ ↓</kbd> - Navigate suggestions</li>
                <li>• <kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">Enter</kbd> - Select suggestion</li>
                <li>• <kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">Tab</kbd> - Accept suggestion</li>
                <li>• <kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">Esc</kbd> - Close suggestions</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default TemplateEditorDemo; 