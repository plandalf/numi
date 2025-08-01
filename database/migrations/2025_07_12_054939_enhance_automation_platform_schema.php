<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    // every reference to hasTable or hasColumn should be considered an error. !!!!!!!!!!!!
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // ====================================
        // 1. CREATE APPS TABLE FIRST
        // ====================================
        if (!Schema::hasTable('automation_apps')) {
            Schema::create('automation_apps', function (Blueprint $table) {
                $table->id();
                $table->string('key', 100)->unique();
                $table->string('name');
                $table->text('description')->nullable();
                $table->string('icon_url', 500)->nullable();
                $table->string('color', 7)->nullable();
                $table->string('category', 100)->nullable();
                $table->string('version', 20)->default('1.0.0');
                $table->boolean('is_active')->default(true);
                $table->boolean('is_built_in')->default(false);
                $table->string('documentation_url', 500)->nullable();
                $table->timestamps();

                $table->index('key');
                $table->index('category');
                $table->index('is_active');
                $table->index('is_built_in');
                $table->index('version');
            });
        }

        Schema::table('integrations', function (Blueprint $table) {
//            $table->uuid()->after('id');
            $table->string('lookup_key', 64)->nullable()->change();
            $table->foreignId('app_id')->nullable()->after('organization_id')->constrained('automation_apps')->onDelete('set null');
            $table->json('connection_config')->nullable();
            $table->timestamp('last_sync_at', 6)->nullable();
            $table->json('sync_errors')->nullable();

            $table->index(['organization_id', 'app_id']);
            $table->index('last_sync_at');
        });

        Schema::table('workflows', function (Blueprint $table) {
            $table->bigInteger('sequence_id')->nullable()->after('id');
            $table->bigInteger('event_id');
        });

        Schema::rename('workflows', 'workflow_runs');
        Schema::dropIfExists('workflow_executions');
        Schema::drop('automation_edges');
        Schema::rename('automation_nodes', 'automation_actions');

        // ====================================
        // 2. CREATE NEW AUTOMATION TABLES
        // ====================================

        // Workflow steps table - Individual step execution tracking
        Schema::create('workflow_steps', function (Blueprint $table) {
            $table->id();
            $table->foreignId('run_id')->constrained('workflow_runs')->onDelete('cascade');
            $table->foreignId('action_id')->constrained('automation_actions')->onDelete('cascade');
            $table->string('step_name')->nullable();
            $table->json('input_data')->nullable();
            $table->json('output_data')->nullable();
            $table->json('raw_response')->nullable();
            $table->json('processed_output')->nullable();
            $table->string('status', 50)->default('pending');
            $table->timestamp('started_at', 6)->nullable();
            $table->timestamp('completed_at', 6)->nullable();
            $table->integer('duration_ms')->nullable();
            $table->integer('retry_count')->default(0);
            $table->integer('max_retries')->default(3);
            $table->text('error_message')->nullable();
            $table->string('error_code', 100)->nullable();
            $table->json('debug_info')->nullable();

            $table->timestamps(6);

            $table->index(['run_id', 'action_id']);
            $table->index('status');
            $table->index('error_code');
        });

        // Trigger events table - All trigger initiation data
        Schema::create('automation_events', function (Blueprint $table) {
            $table->id();
            $table->foreignId('trigger_id')->constrained('automation_triggers')->onDelete('cascade');
            $table->foreignId('integration_id')->nullable()->constrained('integrations')->onDelete('set null');
            $table->string('event_source', 50);
            $table->json('event_data');
            $table->json('event_raw')->nullable();

            $table->json('metadata')->nullable();
            $table->timestamp('processed_at', 6)->nullable();
            $table->string('status', 50)->default('received');
            $table->text('error_message')->nullable();
            $table->timestamps(6);

            $table->index('trigger_id');
            $table->index('integration_id');
            $table->index('event_source');
            $table->index('status');
            $table->index('created_at');
        });


        // ====================================
        // 4. ENHANCE EXISTING AUTOMATION TABLES
        // ====================================

        // Enhance automation_sequences table
        Schema::table('automation_sequences', function (Blueprint $table) {
            $table->text('description')->nullable()->after('name');
            $table->boolean('is_active')->default(true)->after('description');
            $table->boolean('is_template')->default(false)->after('is_active');
            $table->json('metadata')->nullable()->after('is_template');
            $table->json('settings')->nullable()->after('metadata');
            $table->foreignId('created_by')->nullable()->after('settings')->constrained('users')->onDelete('set null');
            $table->timestamp('last_run_at', 6)->nullable()->after('created_by');
            $table->integer('run_count')->default(0)->after('last_run_at');
            $table->json('node_schema')->nullable()->after('settings');

            $table->index('is_active');
            $table->index('is_template');
            $table->index('created_by');
        });


        // Enhance automation_nodes table (nodes ARE the actions)
        Schema::table('automation_actions', function (Blueprint $table) {
            $table->foreignId('app_id')->nullable()->after('sequence_id')->constrained('automation_apps')->onDelete('set null');
            $table->foreignId('integration_id')->nullable()->after('app_id')->constrained('integrations')->onDelete('set null');
            $table->string('name')->nullable()->after('sequence_id');
            $table->text('description')->nullable()->after('name');
            $table->string('action_key')->nullable()->after('integration_id'); // References action in app config
            $table->json('configuration')->nullable()->after('action_key');
            $table->json('test_result')->nullable()->after('configuration');
            $table->json('metadata')->nullable();
            $table->index('type');
            $table->index('integration_id');
            $table->index('action_key');
        });

        // Enhance automation_triggers table
        Schema::table('automation_triggers', function (Blueprint $table) {
            $table->dropColumn('event_name'); // ? filter?
            $table->string('target_type')->nullable()->change();
            $table->bigInteger('target_id')->nullable()->change();

            $table->foreignId('integration_id')->nullable()->after('sequence_id')->constrained('integrations')->onDelete('set null');
            $table->foreignId('app_id')->nullable()->after('integration_id')->constrained('automation_apps')->onDelete('set null');
            $table->string('name')->nullable()->after('sequence_id');
            $table->string('trigger_key')->nullable()->after('integration_id');
            $table->json('configuration')->nullable()->after('trigger_key');
            $table->json('conditions')->nullable()->after('configuration');
            $table->boolean('is_active')->default(true)->after('conditions');
            $table->timestamp('last_triggered_at', 6)->nullable()->after('is_active');
            $table->integer('trigger_count')->default(0)->after('last_triggered_at');
            $table->string('trigger_type', 50)->default('integration')->after('name');
            $table->json('metadata')->nullable()->after('trigger_count');
            $table->json('test_result')->nullable()->after('configuration');

            $table->index('is_active');
            $table->index(['sequence_id', 'trigger_key']);
            $table->index('integration_id');
            $table->index('trigger_key');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Drop new tables in reverse order (due to foreign key constraints)
        Schema::dropIfExists('trigger_events');
        Schema::dropIfExists('workflow_step_tests');
        Schema::dropIfExists('workflow_tests');
        Schema::dropIfExists('data_mappings');
        Schema::dropIfExists('workflow_templates');
        Schema::dropIfExists('workflow_steps');
        Schema::dropIfExists('workflow_executions');
        Schema::dropIfExists('apps');

        // Reverse changes to existing tables
        Schema::table('automation_edges', function (Blueprint $table) {
            $table->dropIndex(['automation_edges_from_node_id_index']);
            $table->dropIndex(['automation_edges_to_node_id_index']);
            $table->dropIndex(['automation_edges_sequence_id_index']);

            $table->dropColumn(['conditions', 'metadata']);
        });

        Schema::table('automation_triggers', function (Blueprint $table) {
            $table->dropIndex(['automation_triggers_is_active_index']);
            $table->dropIndex(['automation_triggers_sequence_id_trigger_key_index']);
            $table->dropIndex(['automation_triggers_integration_id_index']);
            $table->dropIndex(['automation_triggers_trigger_key_index']);
            $table->dropIndex(['automation_triggers_webhook_url_index']);

            $table->dropColumn([
                'name', 'integration_id', 'trigger_key', 'configuration',
                'conditions', 'webhook_url', 'is_active', 'last_triggered_at', 'trigger_count'
            ]);
        });

        Schema::table('automation_nodes', function (Blueprint $table) {
            $table->dropIndex(['automation_nodes_type_index']);
            $table->dropIndex(['automation_nodes_integration_id_index']);
            $table->dropIndex(['automation_nodes_action_key_index']);
            $table->dropIndex(['automation_nodes_parent_node_id_index']);

            $table->dropColumn([
                'name', 'description', 'integration_id', 'action_key', 'configuration',
                'position', 'metadata', 'retry_config', 'timeout_seconds', 'loop_actions',
                'parallel_actions', 'parent_node_id'
            ]);
        });

        Schema::table('automation_sequences', function (Blueprint $table) {
            $table->dropIndex(['automation_sequences_is_active_index']);
            $table->dropIndex(['automation_sequences_is_template_index']);
            $table->dropIndex(['automation_sequences_created_by_index']);

            $table->dropColumn([
                'description', 'is_active', 'is_template', 'metadata', 'settings',
                'created_by', 'last_run_at', 'run_count'
            ]);
        });

        Schema::table('integrations', function (Blueprint $table) {
            $table->dropIndex(['integrations_organization_id_app_id_index']);
            $table->dropIndex(['integrations_webhook_url_index']);
            $table->dropIndex(['integrations_last_sync_at_index']);

            $table->dropColumn([
                'app_id', 'webhook_url', 'webhook_secret', 'connection_config',
                'last_sync_at', 'sync_errors'
            ]);
        });

        Schema::table('integrations', function (Blueprint $table) {
            $table->string('lookup_key', 64)->nullable(false)->change();
            $table->dropColumn('uuid');
        });
    }
};
