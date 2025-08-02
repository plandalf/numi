<?php

namespace App\Apps\Plandalf\Actions;

use App\Mail\ActivityEmail;
use App\Workflows\Attributes\IsAction;
use App\Workflows\Automation\AppAction;
use App\Workflows\Automation\Bundle;
use App\Workflows\Automation\Field;
use Illuminate\Mail\SentMessage;
use Illuminate\Support\Facades\Mail;

#[IsAction(
    key: 'send_email',
    noun: 'Email',
    label: 'Send Email',
    description: 'Send personalized emails to recipients using dynamic content from your workflow triggers and previous actions.',
    type: 'action'
)]
class SendEmailAction extends AppAction
{
    public static function props(): array
    {
        return [
            Field::string('to', 'Recipient Email')
                ->required()
                ->placeholder('recipient@example.com')
                ->help('The email address of the recipient. You can use dynamic data from previous steps.'),
            
            Field::string('subject', 'Email Subject')
                ->required()
                ->placeholder('Your email subject here')
                ->help('The subject line of the email. Supports dynamic content from previous workflow steps.'),
            
            Field::text('body', 'Email Body')
                ->required()
                ->placeholder('Write your email content here...')
                ->help('The HTML or plain text content of the email. You can include dynamic data using field mappings.'),
            
            Field::string('from', 'Sender Email')
                ->required()
                ->placeholder('sender@yourdomain.com')
                ->help('The email address that will appear as the sender. Must be a verified sending domain.'),
        ];
    }

    public function __invoke(Bundle $bundle): array
    {
        // Extract input values from the bundle
        $to = $bundle->input['to'];
        $subject = $bundle->input['subject'];
        $body = $bundle->input['body'];
        $from = $bundle->input['from'];

        // Validate required fields
        if (empty($to) || empty($subject) || empty($body) || empty($from)) {
            throw new \InvalidArgumentException('All email fields (to, subject, body, from) are required.');
        }

        // Format recipients - handle both string and array formats
        $recipients = is_array($to) ? $to : [$to];
        $formattedRecipients = collect($recipients)->map(function ($recipient) {
            // If recipient is already a properly formatted array with name/email
            if (is_array($recipient) && isset($recipient['email'])) {
                return isset($recipient['name']) 
                    ? [$recipient['email'] => $recipient['name']]
                    : $recipient['email'];
            }
            
            // If recipient is just an email string
            return $recipient;
        })->flatten()->toArray();

        try {
            // Create and configure the mailable
            $mailable = new ActivityEmail();
            $mailable->subject($subject);
            $mailable->html($body);
            
            // Set sender if provided
            if ($from) {
                $mailable->from($from);
            }

            // Send the email
            $sentMessage = Mail::to($formattedRecipients)->send($mailable);

            return [
                'success' => true,
                'message_id' => $sentMessage->getMessageId(),
                'to' => $formattedRecipients,
                'subject' => $subject,
                'from' => $from,
                'status' => 'sent',
                'sent_at' => now()->toISOString(),
            ];

        } catch (\Exception $e) {
            // Return error information for debugging
            return [
                'success' => false,
                'error' => $e->getMessage(),
                'to' => $formattedRecipients,
                'subject' => $subject,
                'from' => $from,
                'status' => 'failed',
                'failed_at' => now()->toISOString(),
            ];
        }
    }
}
