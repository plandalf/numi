<?php

namespace App\Workflows\Automation;

use App\Mail\ActivityEmail;
use App\Models\Automation\Node;
use App\Models\ResourceEvent;
use App\Workflows\Automation\Attributes\Activity;
use App\Workflows\Automation\Attributes\ActivityArgument;
use App\Workflows\Automation\TemplateResolver;
use Illuminate\Mail\SentMessage;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;
use Workflow\Activity as WorkflowActivity;

#[Activity(
    type: 'email',
    name: 'Send Email',
    description: 'Send a customizable email to recipients with template support',
)]
#[ActivityArgument(
    name: 'recipients',
    type: 'repeater',
    label: 'Recipients',
    description: 'List of email recipients',
    section: 'email',
    required: true,
    schema: [
        'email' => ['type' => 'email', 'label' => 'Email Address', 'required' => true],
        'name' => ['type' => 'string', 'label' => 'Display Name', 'required' => false],
    ]
)]
#[ActivityArgument(
    name: 'subject',
    type: 'string',
    label: 'Subject',
    description: 'Email subject line (supports templates like {{trigger.customer.name}})',
    section: 'email',
    required: true
)]
#[ActivityArgument(
    name: 'body',
    type: 'textarea',
    label: 'Email Body',
    description: 'Email content in HTML or plain text (supports templates)',
    section: 'email',
    required: true
)]
class EmailActivity extends WorkflowActivity
{
    public function execute(Node $node, ResourceEvent $event)
    {
        // Validate the arguments
        $this->validateArguments($node->arguments);
        
        $recipients = TemplateResolver::get($event, Arr::get($node->arguments, 'recipients'));
        $subject = TemplateResolver::get($event, Arr::get($node->arguments, 'subject')) ?? 'No Subject';
        $body = TemplateResolver::get($event, Arr::get($node->arguments, 'body')) ?? '';

        // Validate processed data
        $this->validateProcessedData($recipients, $subject, $body);

        // Format recipients for Mail::to()
        $formattedRecipients = collect($recipients)->map(function ($recipient) {
            if (isset($recipient['name'])) {
                return [$recipient['email'] => $recipient['name']];
            }

            return $recipient['email'];
        })->toArray();

        // Create mailable with subject and body
        $mailable = new ActivityEmail($subject, $body);

        /* @var SentMessage $sentMessage */
        $sentMessage = Mail::to($formattedRecipients)
            ->send($mailable);

        return [
            'message_id' => $sentMessage->getMessageId(),
            'recipients_count' => count($formattedRecipients),
            'subject' => $subject,
        ];
    }

    /**
     * Validate the raw arguments before processing
     */
    private function validateArguments(array $arguments): void
    {
        $validator = Validator::make($arguments, [
            'recipients' => 'required|array|min:1',
            'recipients.*.email' => 'required|email',
            'recipients.*.name' => 'nullable|string|max:255',
            'subject' => 'required|string|max:998', // RFC 5322 limit
            'body' => 'required|string|max:65535', // Reasonable limit for email body
        ], [
            'recipients.required' => 'At least one recipient is required',
            'recipients.*.email.required' => 'Each recipient must have a valid email address',
            'recipients.*.email.email' => 'Each recipient email must be a valid email address',
            'subject.required' => 'Email subject is required',
            'subject.max' => 'Email subject cannot exceed 998 characters',
            'body.required' => 'Email body is required',
            'body.max' => 'Email body cannot exceed 65,535 characters',
        ]);

        if ($validator->fails()) {
            throw new ValidationException($validator);
        }
    }

    /**
     * Validate the processed data after template resolution
     */
    private function validateProcessedData($recipients, string $subject, string $body): void
    {
        // Ensure recipients is an array after template processing
        if (!is_array($recipients)) {
            throw new ValidationException(
                Validator::make([], [], ['recipients' => 'Recipients must be an array after template processing'])
            );
        }

        // Validate each recipient after template processing
        foreach ($recipients as $index => $recipient) {
            if (!is_array($recipient) || !isset($recipient['email'])) {
                throw new ValidationException(
                    Validator::make([], [], ["recipients.{$index}" => 'Each recipient must have an email field'])
                );
            }

            if (!filter_var($recipient['email'], FILTER_VALIDATE_EMAIL)) {
                throw new ValidationException(
                    Validator::make([], [], ["recipients.{$index}.email" => 'Invalid email address after template processing'])
                );
            }
        }

        // Validate subject and body are not empty after template processing
        if (empty(trim($subject))) {
            throw new ValidationException(
                Validator::make([], [], ['subject' => 'Subject cannot be empty after template processing'])
            );
        }

        if (empty(trim($body))) {
            throw new ValidationException(
                Validator::make([], [], ['body' => 'Body cannot be empty after template processing'])
            );
        }
    }
}
