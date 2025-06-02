<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Slack\SlackMessage;
use Illuminate\Notifications\Slack\BlockKit\Blocks\ContextBlock;
use Illuminate\Notifications\Slack\BlockKit\Blocks\SectionBlock;
use App\Models\User;

class UserRegisteredNotification extends Notification
{
    use Queueable;

    public ?User $user;
    public $organization;

    /**
     * Create a new notification instance.
     */
    public function __construct(?User $user = null, $organization = null)
    {
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
            ->text('👤 New user registered!')
            ->dividerBlock()
            ->headerBlock('👤 User Registered')
            ->contextBlock(function (ContextBlock $block) {
                $block->text(
                    '*From:* ' . ($this->user ? $this->user->name . ' ('.$this->user->email.')' : 'Guest')
                    . ($this->organization ? "\n*Organization:* " . ($this->organization?->name ?? 'Guest') : '')
                )->markdown();
            })
            ->dividerBlock();
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
