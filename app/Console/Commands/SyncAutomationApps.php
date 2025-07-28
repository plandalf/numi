<?php

namespace App\Console\Commands;

use App\Models\App;
use App\Modules\Integrations\Contracts\AutomationActions;
use App\Modules\Integrations\Contracts\AutomationAuth;
use App\Modules\Integrations\Contracts\AutomationTriggers;
use App\Workflows\Attributes\IsAutomation;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use ReflectionClass;
use ReflectionAttribute;

class SyncAutomationApps extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'automation:sync-apps {--dry-run : Show what would be synced without making changes}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Sync automation apps from classes to database';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $this->info('🔍 Discovering automation apps...');

        $automationClasses = $this->discoverAutomationClasses();

        if (empty($automationClasses)) {
            $this->warn('No automation classes found with #[Automation] attribute');
            return self::FAILURE;
        }

        $this->info("Found " . count($automationClasses) . " automation classes");

        $dryRun = $this->option('dry-run');

        if ($dryRun) {
            $this->info('🔍 DRY RUN - No changes will be made');
        }

        $stats = [
            'created' => 0,
            'updated' => 0,
            'skipped' => 0,
            'errors' => 0,
        ];

        foreach ($automationClasses as $class => $data) {
            $reflection = $data['reflection'];
            // Extract #[Automation] attribute
            $attributes = $reflection->getAttributes(\App\Workflows\Attributes\IsAutomation::class);
            if (empty($attributes)) {
                $this->warn("⏭️  Skipping {$class}: missing #[Automation] attribute");
                $stats['skipped']++;
                continue;
            }
            $automation = $attributes[0]->newInstance();
            // Merge attribute data into $data
            $data = array_merge($data, [
                'key' => $automation->key,
                'name' => $automation->name,
                'description' => $automation->description,
                'version' => $automation->version,
                'provider_url' => $automation->provider_url,
            ]);
            try {
                [$result, $reason] = $this->syncApp($class, $data, $dryRun);
                $stats[$result]++;
                $status = match($result) {
                    'created' => '✅ Created',
                    'updated' => '🔄 Updated',
                    'skipped' => '⏭️  Skipped',
                    'errors' => '❌ Error',
                };
                $reasonText = $result === 'skipped' ? (" - $reason") : '';
                $this->line("  {$status} {$data['name']} ({$data['key']}){$reasonText}");
            } catch (\Exception $e) {
                $stats['errors']++;
                $this->error("  ❌ Error syncing {$data['name']}: " . $e->getMessage());
            }
        }

        $this->newLine();
        $this->info('📊 Sync Summary:');
        $this->line("  Created: {$stats['created']}");
        $this->line("  Updated: {$stats['updated']}");
        $this->line("  Skipped: {$stats['skipped']}");
        $this->line("  Errors: {$stats['errors']}");

        if ($dryRun) {
            $this->info('💡 Run without --dry-run to apply changes');
        }

        return $stats['errors'] > 0 ? self::FAILURE : self::SUCCESS;
    }

    /**
     * Discover all concrete classes extending AutomationApp in the Apps directory
     */
    private function discoverAutomationClasses(): array
    {
        $classes = [];
        $appsPath = app_path('Apps');
        if (is_dir($appsPath)) {
            $classes = array_merge($classes, $this->scanDirectory($appsPath, 'App\\Apps'));
        }
        return $classes;
    }

    /**
     * Scan a directory for concrete PHP classes extending AutomationApp (recursive)
     */
    private function scanDirectory(string $path, string $namespace): array
    {
        $classes = [];
        $iterator = new \RecursiveIteratorIterator(
            new \RecursiveDirectoryIterator($path, \FilesystemIterator::SKIP_DOTS)
        );
        foreach ($iterator as $file) {
            if ($file->getExtension() !== 'php') {
                continue;
            }
            $relativePath = str_replace([$path . DIRECTORY_SEPARATOR, '.php'], '', $file->getPathname());
            $relativeClass = str_replace(DIRECTORY_SEPARATOR, '\\', $relativePath);
            $fullClassName = $namespace . '\\' . $relativeClass;
            if (!class_exists($fullClassName)) {
                continue;
            }
            $reflection = new \ReflectionClass($fullClassName);
            // Only include non-abstract classes that extend AutomationApp
            if ($reflection->isAbstract()) {
                continue;
            }
            if ($reflection->isSubclassOf(\App\Apps\AutomationApp::class)) {
                $classes[$fullClassName] = [
                    'class' => $fullClassName,
                    'reflection' => $reflection,
                ];
            }
        }
        return $classes;
    }

    /**
     * Check if a class implements automation contracts
     */
    private function implementsAutomationContracts(ReflectionClass $reflection): bool
    {
        $interfaces = $reflection->getInterfaceNames();

        return in_array(AutomationTriggers::class, $interfaces) ||
               in_array(AutomationActions::class, $interfaces) ||
               in_array(AutomationAuth::class, $interfaces);
    }

    /**
     * Sync a single app to the database
     */
    private function syncApp(string $class, array $data, bool $dryRun): array
    {
        $app = App::where('key', $data['key'])->first();

        if (!$app) {
            // Create new app
            if (!$dryRun) {
                App::create([
                    'key' => $data['key'],
                    'name' => $data['name'],
                    'description' => $data['description'],
                    'is_active' => true,
                    'is_built_in' => true,
                    'version' => '1.0.0',
                    'category' => 'automation',
                ]);
            }
            return ['created', null];
        }

        // Check if app needs updating
        $needsUpdate = false;
        $updates = [];
        $reasons = [];

        if ($app->name !== $data['name']) {
            $needsUpdate = true;
            $updates['name'] = $data['name'];
            $reasons[] = 'name changed';
        }

        if ($app->description !== $data['description']) {
            $needsUpdate = true;
            $updates['description'] = $data['description'];
            $reasons[] = 'description changed';
        }

        if ($needsUpdate && !$dryRun) {
            $app->update($updates);
            return ['updated', implode(', ', $reasons)];
        }

        return ['skipped', 'no changes needed'];
    }
}
