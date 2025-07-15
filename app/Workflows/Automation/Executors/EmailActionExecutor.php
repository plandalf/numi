<?php

namespace App\Workflows\Automation\Executors;

use App\Contracts\ActionInterface;
use App\Models\WorkflowStep;
use App\Mail\ActivityEmail;
use App\Workflows\Automation\TemplateResolver;
use Illuminate\Support\Facades\Mail;
use Illuminate\Mail\SentMessage;
use Exception;

class EmailActionExecutor implements ActionInterface
{
    public function __construct(
        private array $configuration
    ) {}
    
    public function execute(array $input, WorkflowStep $step): array
    {
        $step->recordStart();
        
        try {
            // Resolve template variables
            $recipients = $this->resolveRecipients($input);
            $subject = TemplateResolver::resolve($this->configuration['subject'] ?? 'No Subject', $input);
            $body = TemplateResolver::resolve($this->configuration['body'] ?? '', $input);
            
            // Format recipients for Mail::to()
            $formattedRecipients = $this->formatRecipients($recipients);
            
            // Create and send email
            $mailable = new ActivityEmail();
            $mailable->subject($subject);
            $mailable->html($body);
            
            /** @var SentMessage $sentMessage */
            $sentMessage = Mail::to($formattedRecipients)->send($mailable);
            
            $output = [
                'message_id' => $sentMessage->getMessageId(),
                'recipient_count' => count($formattedRecipients),
                'recipients' => $formattedRecipients,
                'subject' => $subject,
                'sent_at' => now()->toISOString(),
                'status' => 'sent',
                'provider' => 'laravel_mail',
            ];
            
            $step->recordSuccess($output);
            return $output;
            
        } catch (Exception $e) {
            $step->recordFailure(
                errorMessage: "Email sending failed: " . $e->getMessage(),
                errorCode: WorkflowStep::ERROR_EXTERNAL_SERVICE,
                debugInfo: [
                    'configuration' => $this->configuration,
                    'input_data' => $input,
                ]
            );
            
            throw $e;
        }
    }
    
    public function executeTest(array $input): array
    {
        try {
            // Generate default test data for template variables
            $defaultTestData = $this->generateDefaultTestData();
            
            // Resolve template variables using default data
            $recipients = $this->resolveRecipients($defaultTestData);
            $subject = TemplateResolver::resolve($this->configuration['subject'] ?? 'No Subject', $defaultTestData);
            $body = TemplateResolver::resolve($this->configuration['body'] ?? '', $defaultTestData);
            
            // Format recipients for Mail::to()
            $formattedRecipients = $this->formatRecipients($recipients);
            
            // Validate that we have recipients
            if (empty($formattedRecipients)) {
                throw new Exception("No recipients configured for email action");
            }
            
            // Actually send the email but mark it as a test
            $mailable = new ActivityEmail();
            $mailable->subject("[TEST] " . $subject);
            $mailable->html($this->wrapBodyWithTestNotice($body));
            
            /** @var SentMessage $sentMessage */
            $sentMessage = Mail::to($formattedRecipients)->send($mailable);
            
            return [
                'message_id' => $sentMessage->getMessageId(),
                'recipient_count' => count($formattedRecipients),
                'recipients' => $formattedRecipients,
                'subject' => $subject,
                'body_preview' => substr(strip_tags($body), 0, 100) . '...',
                'sent_at' => now()->toISOString(),
                'status' => 'sent',
                'provider' => 'laravel_mail',
                'test_mode' => true,
                'template_variables_resolved' => $this->extractTemplateVariables($defaultTestData),
            ];
            
        } catch (Exception $e) {
            throw new Exception("Email test failed: " . $e->getMessage());
        }
    }
    
    private function generateDefaultTestData(): array
    {
        // Generate realistic test data for common template variables
        return [
            'trigger' => [
                'member_name' => 'John Doe',
                'member_email' => 'john.doe@example.com',
                'first_name' => 'John',
                'last_name' => 'Doe',
                'product_name' => 'Premium Course',
                'product_type' => 'course',
                'order_id' => 'ORDER-' . strtoupper(substr(uniqid(), -6)),
                'amount' => 9999, // $99.99 in cents
                'currency' => 'USD',
                'payment_method' => 'credit_card',
                'coupon_code' => 'WELCOME10',
                'discount_amount' => 999, // $9.99 in cents
                'created_at' => now()->toISOString(),
                'completed_at' => now()->toISOString(),
                'order_items' => [
                    [
                        'product_id' => 'prod_' . uniqid(),
                        'product_name' => 'Premium Course',
                        'quantity' => 1,
                        'price' => 9999,
                    ]
                ],
            ],
            // Add some step data for testing step variables
            'step_1' => [
                'tag_id' => 'tag_' . uniqid(),
                'tag_name' => 'Premium Customer',
                'created_at' => now()->toISOString(),
                'status' => 'completed',
            ],
            'step_2' => [
                'webhook_response' => 'success',
                'response_id' => 'resp_' . uniqid(),
                'sent_at' => now()->toISOString(),
            ],
        ];
    }
    
    private function resolveRecipients(array $input): array
    {
        $recipients = $this->configuration['recipients'] ?? [];
        
        if (is_string($recipients)) {
            // Handle single email or newline-separated emails
            $recipients = array_filter(
                array_map('trim', explode("\n", $recipients))
            );
        }
        
        // Resolve template variables in each recipient
        return array_map(function ($recipient) use ($input) {
            if (is_string($recipient)) {
                return TemplateResolver::resolve($recipient, $input);
            }
            return $recipient;
        }, $recipients);
    }
    
    private function formatRecipients(array $recipients): array
    {
        return collect($recipients)->map(function ($recipient) {
            if (is_array($recipient) && isset($recipient['name'])) {
                return [$recipient['email'] => $recipient['name']];
            }
            
            return $recipient;
        })->toArray();
    }
    
    private function wrapBodyWithTestNotice(string $body): string
    {
        $testNotice = '<div style="background: #fef3c7; border: 1px solid #f59e0b; padding: 16px; margin-bottom: 16px; border-radius: 4px;">'
                    . '<strong>🧪 TEST EMAIL</strong><br>'
                    . 'This is a test email sent from your automation workflow. '
                    . 'The actual email would be sent without this notice.'
                    . '</div>';
                    
        return $testNotice . $body;
    }
    
    private function extractTemplateVariables(array $input): array
    {
        $variables = [];
        
        // Extract trigger variables
        if (isset($input['trigger'])) {
            foreach ($input['trigger'] as $key => $value) {
                $variables["trigger.{$key}"] = $value;
            }
        }
        
        // Extract step variables
        foreach ($input as $key => $value) {
            if (strpos($key, 'step_') === 0 && is_array($value)) {
                foreach ($value as $subKey => $subValue) {
                    $variables["{$key}.{$subKey}"] = $subValue;
                }
            }
        }
        
        return $variables;
    }
} 