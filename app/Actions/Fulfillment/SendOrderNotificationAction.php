<?php

namespace App\Actions\Fulfillment;

use App\Mail\OrderNotificationEmail;
use App\Models\Order\Order;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class SendOrderNotificationAction
{
    /**
     * Send order notification email to admin.
     */
    public function execute(Order $order): void
    {
        $organization = $order->organization;
        
        // Check if order has already been notified
        if ($order->fulfillment_notified) {
            return;
        }
        
        // Get notification email from organization or fallback to admin emails
        $notificationEmails = $this->getNotificationEmails($organization);
        
        if (empty($notificationEmails)) {
            Log::warning('No notification emails configured for order', [
                'order_id' => $order->id,
                'organization_id' => $organization->id,
            ]);
            return;
        }
        
        try {
            foreach ($notificationEmails as $email) {
                Mail::to($email)->send(new OrderNotificationEmail($order));
            }
            
            // Mark as notified
            $order->fulfillment_notified = true;
            $order->fulfillment_notified_at = now();
            $order->save();
            
            Log::info('Order notification emails sent', [
                'order_id' => $order->id,
                'organization_id' => $organization->id,
                'emails' => $notificationEmails,
            ]);
            
        } catch (\Exception $e) {
            Log::error('Failed to send order notification emails', [
                'order_id' => $order->id,
                'organization_id' => $organization->id,
                'error' => $e->getMessage(),
            ]);
            
            throw $e;
        }
    }
    
    /**
     * Get notification emails for the organization.
     */
    private function getNotificationEmails($organization): array
    {
        $emails = [];
        
        // Primary notification email from organization settings
        if ($organization->fulfillment_notification_email) {
            $emails[] = $organization->fulfillment_notification_email;
        }
        
        // Fallback to organization admin users
        if (empty($emails)) {
            $adminUsers = $organization->users()
                ->wherePivot('role', 'admin')
                ->get();
            
            foreach ($adminUsers as $user) {
                $emails[] = $user->email;
            }
        }
        
        // Final fallback to all organization users
        if (empty($emails)) {
            $allUsers = $organization->users()->get();
            
            foreach ($allUsers as $user) {
                $emails[] = $user->email;
            }
        }
        
        return array_unique($emails);
    }
} 