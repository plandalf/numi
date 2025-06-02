<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Slack\SlackMessage;
use Illuminate\Notifications\Slack\BlockKit\Blocks\ContextBlock;
use Illuminate\Notifications\Slack\BlockKit\Blocks\SectionBlock;
use Illuminate\Notifications\Slack\BlockKit\Blocks\ImageBlock;
use App\Models\User;

class TemplateRequestNotification extends Notification
{
    use Queueable;

    /**
     * Create a new notification instance.
     */
    public function __construct(
         public string $description, 
         public ?User $user = null, 
         public $organization = null, 
         public ?string $imageUrl = null
    ) {
        $this->description = $description;
        $this->user = $user;
        $this->organization = $organization;
        $this->imageUrl = $imageUrl;
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
        $message = (new SlackMessage)
            ->text('🎨 New template request received!')
            ->dividerBlock()
            ->headerBlock('🎨 Template Request')
            ->contextBlock(function (ContextBlock $block) {
                $block->text(
                    '*From:* ' . ($this->user ? $this->user->name . ' ('.$this->user->email.')' : 'Guest')
                    . ($this->organization ? "\n*Organization:* " . ($this->organization?->name ?? 'Guest') : '')
                    . ($this->imageUrl ? "\n*Attached Image:* " . $this->imageUrl : ''))->markdown();
                })
            ->sectionBlock(function (SectionBlock $block) {
                $block->text('"' . $this->description.  '"')->markdown();
            })
            ->dividerBlock();

        return $message;
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
