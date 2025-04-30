<?php

namespace App\Workflows\Automation;

use App\Mail\ActivityEmail;
use App\Models\Automation\Node;
use App\Models\ResourceEvent;
use App\Workflows\Automation\Attributes\Activity;
use Illuminate\Mail\SentMessage;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Mail;
use Workflow\Activity as WorkflowActivity;

#[Activity(
    type: 'email',
    name: 'Send an email',
    description: 'Send a basic email to a list of recipients',
)]
class EmailActivity extends WorkflowActivity
{
    public function execute(Node $node, ResourceEvent $event)
    {
        $recipients = TemplateResolver::get($event, Arr::get($node->arguments, 'recipients'));
        $subject = TemplateResolver::get($event, Arr::get($node->arguments, 'subject')) ?? 'No Subject';
        $body = TemplateResolver::get($event, Arr::get($node->arguments, 'body')) ?? '';

        // Format recipients for Mail::to()
        $formattedRecipients = collect($recipients)->map(function ($recipient) {
            if (isset($recipient['name'])) {
                return [$recipient['email'] => $recipient['name']];
            }

            return $recipient['email'];
        })->toArray();

        // note: new mailable
        $mailable = new ActivityEmail;
        $mailable->subject($subject);
        $mailable->html($body);

        /* @var SentMessage $sentMessage */
        $sentMessage = Mail::to($formattedRecipients)
            ->send($mailable);

        return [
            'message_id' => $sentMessage->getMessageId(),
        ];
    }
}
