<?php

namespace Database\Seeders;

use App\Models\Automation\App;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class AutomationAppsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $apps = [
            [
                'key' => 'gmail',
                'name' => 'Gmail',
                'description' => 'Send and receive emails through Gmail',
                'icon_url' => '/icons/gmail.svg',
                'color' => '#ea4335',
                'auth_config' => [
                    'type' => 'oauth2',
                    'scopes' => ['https://www.googleapis.com/auth/gmail.send'],
                ],
                'actions' => [
                    [
                        'key' => 'send_email',
                        'name' => 'Send Email',
                        'description' => 'Send an email through Gmail',
                        'fields' => [
                            'to' => ['type' => 'email', 'label' => 'To', 'required' => true],
                            'cc' => ['type' => 'email', 'label' => 'CC', 'required' => false],
                            'bcc' => ['type' => 'email', 'label' => 'BCC', 'required' => false],
                            'subject' => ['type' => 'string', 'label' => 'Subject', 'required' => true],
                            'body' => ['type' => 'textarea', 'label' => 'Body', 'required' => true],
                            'attachments' => ['type' => 'file', 'label' => 'Attachments', 'required' => false],
                        ]
                    ]
                ]
            ],
            [
                'key' => 'slack',
                'name' => 'Slack',
                'description' => 'Send messages and notifications to Slack',
                'icon_url' => '/icons/slack.svg',
                'color' => '#4a154b',
                'auth_config' => [
                    'type' => 'oauth2',
                    'scopes' => ['chat:write'],
                ],
                'actions' => [
                    [
                        'key' => 'send_message',
                        'name' => 'Send Message',
                        'description' => 'Send a message to a Slack channel or user',
                        'fields' => [
                            'channel' => ['type' => 'select', 'label' => 'Channel', 'required' => true],
                            'message' => ['type' => 'textarea', 'label' => 'Message', 'required' => true],
                            'username' => ['type' => 'string', 'label' => 'Username', 'required' => false],
                            'emoji' => ['type' => 'string', 'label' => 'Emoji', 'required' => false],
                        ]
                    ]
                ]
            ],
            [
                'key' => 'google_sheets',
                'name' => 'Google Sheets',
                'description' => 'Create and update Google Sheets',
                'icon_url' => '/icons/google-sheets.svg',
                'color' => '#0f9d58',
                'auth_config' => [
                    'type' => 'oauth2',
                    'scopes' => ['https://www.googleapis.com/auth/spreadsheets'],
                ],
                'actions' => [
                    [
                        'key' => 'append_row',
                        'name' => 'Append Row',
                        'description' => 'Add a new row to a Google Sheet',
                        'fields' => [
                            'spreadsheet_id' => ['type' => 'string', 'label' => 'Spreadsheet ID', 'required' => true],
                            'sheet_name' => ['type' => 'string', 'label' => 'Sheet Name', 'required' => false],
                            'values' => ['type' => 'key_value', 'label' => 'Column Values', 'required' => true],
                        ]
                    ],
                    [
                        'key' => 'update_row',
                        'name' => 'Update Row',
                        'description' => 'Update an existing row in Google Sheets',
                        'fields' => [
                            'spreadsheet_id' => ['type' => 'string', 'label' => 'Spreadsheet ID', 'required' => true],
                            'sheet_name' => ['type' => 'string', 'label' => 'Sheet Name', 'required' => false],
                            'row_number' => ['type' => 'number', 'label' => 'Row Number', 'required' => true],
                            'values' => ['type' => 'key_value', 'label' => 'Column Values', 'required' => true],
                        ]
                    ]
                ]
            ],
            [
                'key' => 'webhook',
                'name' => 'Webhook',
                'description' => 'Send HTTP requests to any API endpoint',
                'icon_url' => '/icons/webhook.svg',
                'color' => '#6366f1',
                'auth_config' => [
                    'type' => 'none',
                ],
                'actions' => [
                    [
                        'key' => 'send_request',
                        'name' => 'Send Request',
                        'description' => 'Send an HTTP request to a webhook URL',
                        'fields' => [
                            'url' => ['type' => 'url', 'label' => 'URL', 'required' => true],
                            'method' => ['type' => 'select', 'label' => 'Method', 'required' => true, 'options' => [
                                'GET' => 'GET',
                                'POST' => 'POST',
                                'PUT' => 'PUT',
                                'DELETE' => 'DELETE',
                                'PATCH' => 'PATCH'
                            ]],
                            'headers' => ['type' => 'key_value', 'label' => 'Headers', 'required' => false],
                            'body' => ['type' => 'json', 'label' => 'Body', 'required' => false],
                        ]
                    ]
                ]
            ],
            [
                'key' => 'delay',
                'name' => 'Delay',
                'description' => 'Add a delay between actions',
                'icon_url' => '/icons/clock.svg',
                'color' => '#f59e0b',
                'auth_config' => [
                    'type' => 'none',
                ],
                'actions' => [
                    [
                        'key' => 'delay',
                        'name' => 'Delay',
                        'description' => 'Wait for a specified amount of time',
                        'fields' => [
                            'duration' => ['type' => 'number', 'label' => 'Duration (seconds)', 'required' => true],
                            'unit' => ['type' => 'select', 'label' => 'Unit', 'required' => true, 'options' => [
                                'seconds' => 'Seconds',
                                'minutes' => 'Minutes',
                                'hours' => 'Hours'
                            ]],
                        ]
                    ]
                ]
            ],
            [
                'key' => 'filter',
                'name' => 'Filter',
                'description' => 'Filter data and create conditional logic',
                'icon_url' => '/icons/filter.svg',
                'color' => '#8b5cf6',
                'auth_config' => [
                    'type' => 'none',
                ],
                'actions' => [
                    [
                        'key' => 'condition',
                        'name' => 'Only Continue If',
                        'description' => 'Continue only if the condition is met',
                        'fields' => [
                            'field' => ['type' => 'string', 'label' => 'Field to Check', 'required' => true],
                            'operator' => ['type' => 'select', 'label' => 'Operator', 'required' => true, 'options' => [
                                'equals' => 'Equals',
                                'not_equals' => 'Does not equal',
                                'contains' => 'Contains',
                                'greater_than' => 'Greater than',
                                'less_than' => 'Less than'
                            ]],
                            'value' => ['type' => 'string', 'label' => 'Value', 'required' => true],
                        ]
                    ]
                ]
            ],
        ];

        foreach ($apps as $appData) {
            App::updateOrCreate(
                ['key' => $appData['key']],
                $appData
            );
        }
    }
}
