<?php

namespace App\Apps\Plandalf\Actions;

use App\Mail\ActivityEmail;
use App\Workflows\Attributes\Action;
use App\Workflows\Automation\AppAction;
use App\Workflows\Automation\Bundle;
use App\Workflows\Automation\Field;
use Illuminate\Mail\SentMessage;
use Illuminate\Support\Facades\Mail;

#[Action(
    key: 'send_email',
    noun: 'Email',
    label: 'Send Email',
    description: 'Sends an email to a specified recipient.',
    type: 'action'
)]
class SendEmailAction extends AppAction
{
    public static function props(): array
    {
        return [
            Field::string('to', 'Recipient Email')
                ->required()
                ->help('The email address of the recipient.'),
            Field::string('subject', 'Email Subject')
                ->required()
                ->help('The subject of the email.'),
            Field::text('body', 'Email Body')
                ->required()
                ->help('The content of the email.'),
            Field::string('from', 'Sender Email')
                ->required()
                ->help('The email address of the sender.'),
        ];
    }

    public function __invoke(Bundle $bundle): array
    {
        // Here you would implement the logic to send the email.
        // For demonstration purposes, we'll just return the input data.
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

        return [
            'to' => $bundle->input['to'],
            'subject' => $bundle->input['subject'],
            'body' => $bundle->input['body'],
            'from' => $bundle->input['from'],
            'status' => 'sent',
            'sent_at' => now()->toISOString(),
        ];
    }
}
