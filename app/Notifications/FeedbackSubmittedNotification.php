<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Slack\SlackMessage;
use Illuminate\Notifications\Slack\BlockKit\Blocks\ContextBlock;
use Illuminate\Notifications\Slack\BlockKit\Blocks\SectionBlock;
use App\Models\User;

class FeedbackSubmittedNotification extends Notification
{
    use Queueable;

    public string $feedback;
    public ?User $user;
    public $organization;

    /**
     * Create a new notification instance.
     */
    public function __construct(string $feedback, ?User $user = null, $organization = null)
    {
        $this->feedback = $feedback;
        $this->user = $user;
        $this->organization = $organization;
    }

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['slack'];
    }

    public function toSlack(object $notifiable): SlackMessage
    {
        return (new SlackMessage)
            ->text('New feedback received!')
            ->headerBlock('Feedback Submitted')
            ->contextBlock(function (ContextBlock $block) {
                $block->text('From: ' . ($this->user ? $this->user->email : 'Guest'));
            })
            ->sectionBlock(function (SectionBlock $block) {
                $block->text($this->feedback);
                if ($this->organization) {
                    $block->field("*Organization:*\n" . (is_object($this->organization) && isset($this->organization->name) ? $this->organization->name : (string)$this->organization))->markdown();
                }
            });
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            //
        ];
    }
}
