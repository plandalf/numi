<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payment_methods', function (Blueprint $table) {
            $table->id();
            $table->bigInteger('customer_id');
            $table->bigInteger('organization_id');
            $table->bigInteger('integration_id');
            $table->string('external_id', 64);

            $table->json('billing_details')->nullable();
            $table->string('type', 32);
            $table->json('properties')->nullable();
            $table->json('metadata')->nullable();
            $table->boolean('can_redisplay')->default(true)->nullable();

            $table->timestamps();
            $table->softDeletes();
        });

        Schema::table('customers', function (Blueprint $table) {
            $table->foreignId('default_payment_method_id')->nullable()->constrained('payment_methods')->onDelete('set null');
        });

        Schema::table('checkout_sessions', function (Blueprint $table) {
            $table->bigInteger('payments_integration_id')->after('organization_id')->nullable();
            $table->bigInteger('customer_id')->after('payments_integration_id')->nullable();
            $table->bigInteger('payment_method_id')->after('customer_id')->nullable();

            $table->char('currency', 3)->after('status')->nullable();
            $table->string('client_secret')->nullable()->after('metadata');
            $table->string('intent_id')->nullable()->after('client_secret');
            $table->string('intent_type')->nullable()->after('intent_id');
            $table->string('return_url')->nullable()->after('client_secret');

            $table->timestamp('payment_confirmed_at')->nullable()->after('return_url');
            $table->boolean('payment_method_locked')->default(false)->after('payment_confirmed_at');
        });

        Schema::table('orders', function (Blueprint $table) {
            $table->string('intent_id')->nullable()->after('status');
            $table->string('intent_type')->nullable()->after('intent_id');
            $table->string('payment_id')->nullable()->after('intent_type');
            $table->integer('payment_method_id')->nullable()->after('payment_id');
        });
    }

    public function down(): void
    {
        Schema::table('checkout_sessions', function (Blueprint $table) {
            $table->dropColumn([
                'client_secret',
                'payments_integration_id',
                'return_url',
                'payment_confirmed_at',
                'payment_method_locked',
            ]);
        });
        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn([
                'intent_id',
                'intent_type',
                'payment_id',
                'payment_method_id'
            ]);
        });

        Schema::table('customers', function (Blueprint $table) {
            $table->dropForeign(['default_payment_method_id']);
            $table->dropColumn('default_payment_method_id');
        });

        Schema::table('checkout_sessions', function (Blueprint $table) {
            $table->dropColumn(['payment_method_id', 'customer_id']);
        });

        Schema::dropIfExists('payment_methods');
    }
};
