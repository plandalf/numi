<?php

namespace App\Services;

use App\Apps\AutomationApp;
use App\Workflows\Automation\AppAction;
use App\Workflows\Automation\AppTrigger;
use App\Workflows\Automation\Resource;
use App\Workflows\Attributes\IsAutomation;
use Illuminate\Support\Facades\File;
use ReflectionClass;

class AppDiscoveryService
{
    /**
     * Discover all automation apps in the Apps directory
     */
    public function discoverApps(): array
    {
        $appsPath = app_path('Apps');
        $apps = [];

        if (!File::exists($appsPath)) {
            return $apps;
        }

        $directories = File::directories($appsPath);

        foreach ($directories as $directory) {
            $appName = basename($directory);
            $appClass = "App\\Apps\\{$appName}\\{$appName}App";

            if (class_exists($appClass) && is_subclass_of($appClass, AutomationApp::class)) {
                $app = new $appClass();
                $automationMetadata = $this->getAutomationMetadata($appClass);

                // Use automation key if available, otherwise fall back to app name
                $automationKey = $automationMetadata['key'] ?? $appName;

                // Look up the app in the database using the automation key
                $dbApp = \App\Models\App::query()
                    ->where('key', $automationKey)
                    ->first();

                // If the app doesn't exist in the database, create it
                if (!$dbApp) {
                    $dbApp = $this->createAppRecord($automationKey, $automationMetadata, $appName);
                }

                $apps[$appName] = [
                    'name' => $appName,
                    'class' => $appClass,
                    'actions' => $this->discoverAppActions($appClass),
                    'triggers' => $this->discoverAppTriggers($appClass),
                    'resources' => $this->discoverAppResources($appClass),
                    'auth_requirements' => $app->authRequirements(),
                    // Include IsAutomation attribute metadata
                    'automation' => $automationMetadata,
                    // Include database app data
                    'db_app' => $dbApp,
                    'id' => $dbApp ? $dbApp->id : null,
                ];
            }
        }

        return $apps;
    }

    /**
     * Extract IsAutomation attribute metadata from an app class
     */
    private function getAutomationMetadata(string $appClass): ?array
    {
        $reflection = new ReflectionClass($appClass);
        $attributes = $reflection->getAttributes(IsAutomation::class);

        if (empty($attributes)) {
            return null;
        }

        $automation = $attributes[0]->newInstance();

        return [
            'key' => $automation->key,
            'name' => $automation->name,
            'description' => $automation->description,
            'version' => $automation->version,
            'provider_url' => $automation->provider_url,
        ];
    }

    /**
     * Get a single app by its automation key with full metadata
     */
    public function getApp(string $key): ?array
    {
        $apps = $this->discoverApps();

        // Find the app by automation key
        foreach ($apps as $appName => $app) {
            $automationKey = $app['automation']['key'] ?? $appName;
            if ($automationKey === $key) {
                // Use automation metadata for consistent naming
                $automationName = $app['automation']['name'] ?? $app['name'];
                $automationDescription = $app['automation']['description'] ?? null;

                return array_merge([
                    'key' => $automationKey,
                    'name' => $automationName,
                    'description' => $automationDescription,
                    'triggers_count' => count($app['triggers'] ?? []),
                    'actions_count' => count($app['actions'] ?? []),
                ], $app);
            }
        }

        return null;
    }

    /**
     * Discover actions for a specific app
     */
    public function discoverAppActions(string $appClass): array
    {
        $app = new $appClass();
        $actionClasses = $app->actions();
        $actions = [];

        // Check if this app requires authentication
        $authRequirements = $app->authRequirements();
        $requiresAuth = $authRequirements['type'] !== 'none' && !empty($authRequirements['fields']);

        foreach ($actionClasses as $actionClass) {
            if (class_exists($actionClass) && is_subclass_of($actionClass, AppAction::class)) {
                try {
                    $actionDefinition = $actionClass::getDefinition();
                    // Add requires_auth based on app's auth requirements
                    $actionDefinition['requires_auth'] = $requiresAuth;
                    // Include action properties for configuration
                    $actionDefinition['props'] = $actionClass::getProps();
                    $actions[] = $actionDefinition;
                } catch (\Exception $e) {
                    // Log error and continue
                    \Log::warning("Failed to get definition for action {$actionClass}: " . $e->getMessage());
                }
            }
        }

        return $actions;
    }

    /**
     * Discover triggers for a specific app
     */
    public function discoverAppTriggers(string $appClass): array
    {
        $app = new $appClass();
        $triggerClasses = $app->triggers();
        $triggers = [];

        // Check if this app requires authentication
        $authRequirements = $app->authRequirements();
        $requiresAuth = $authRequirements['type'] !== 'none' && !empty($authRequirements['fields']);

        foreach ($triggerClasses as $triggerClass) {
            if (class_exists($triggerClass)
                && is_subclass_of($triggerClass, AppTrigger::class)
            ) {
                try {
                    $triggerDefinition = $triggerClass::getDefinition();
                    // Add requires_auth based on app's auth requirements
                    $triggerDefinition['requires_auth'] = $requiresAuth;
                    // Include trigger properties for configuration
                    $triggerDefinition['props'] = $triggerClass::getProps();
                    $triggers[] = $triggerDefinition;
                } catch (\Exception $e) {
                    // Log error and continue
                    \Log::warning("Failed to get definition for trigger {$triggerClass}: " . $e->getMessage());
                }
            }
        }

        return $triggers;
    }

    /**
     * Discover resources for a specific app
     */
    public function discoverAppResources(string $appClass): array
    {
        $app = new $appClass();
        $resourceClasses = $app->resources();
        $resources = [];

        foreach ($resourceClasses as $resourceClass) {
            if (class_exists($resourceClass) && is_subclass_of($resourceClass, Resource::class)) {
                try {
                    $resources[] = $resourceClass::getDefinition();
                } catch (\Exception $e) {
                    // Log error and continue
                    \Log::warning("Failed to get definition for resource {$resourceClass}: " . $e->getMessage());
                }
            }
        }

        return $resources;
    }

    /**
     * Get all available actions across all apps
     */
    public function getAllActions(): array
    {
        $apps = $this->discoverApps();
        $allActions = [];

        foreach ($apps as $appName => $app) {
            $automationKey = $app['automation']['key'] ?? $appName;

            foreach ($app['actions'] as $action) {
                $action['app'] = $automationKey;
                $action['app_metadata'] = $app['automation'];
                $allActions[] = $action;
            }
        }

        return $allActions;
    }

    /**
     * Get all available triggers across all apps
     */
    public function getAllTriggers(): array
    {
        $apps = $this->discoverApps();
        $allTriggers = [];

        foreach ($apps as $appName => $app) {
            $automationKey = $app['automation']['key'] ?? $appName;

            foreach ($app['triggers'] as $trigger) {
                $trigger['app'] = $automationKey;
                $trigger['app_metadata'] = $app['automation'];
                $allTriggers[] = $trigger;
            }
        }

        return $allTriggers;
    }

    /**
     * Get all available resources across all apps
     */
    public function getAllResources(): array
    {
        $apps = $this->discoverApps();
        $allResources = [];

        foreach ($apps as $appName => $app) {
            $automationKey = $app['automation']['key'] ?? $appName;

            foreach ($app['resources'] as $resource) {
                $resource['app'] = $automationKey;
                $resource['app_metadata'] = $app['automation'];
                $allResources[] = $resource;
            }
        }

        return $allResources;
    }

    /**
     * Get all apps, with optional filters (q, category, provider, has_triggers).
     */
    public function getApps(array $filters = []): array
    {
        $apps = $this->discoverApps();
        $result = collect($apps)->map(function ($app, $appName) {
            // Use automation metadata if available, otherwise fall back to app name
            $automationKey = $app['automation']['key'] ?? $appName;
            $automationName = $app['automation']['name'] ?? $app['name'];
            $automationDescription = $app['automation']['description'] ?? null;

            return array_merge([
                'key' => $automationKey,
                'name' => $automationName,
                'description' => $automationDescription,
                'triggers_count' => count($app['triggers'] ?? []),
                'actions_count' => count($app['actions'] ?? []),
            ], $app);
        });

        // Filter: search query
        if (!empty($filters['q'])) {
            $q = strtolower($filters['q']);
            $result = $result->filter(function ($app) use ($q) {
                return str_contains(strtolower($app['name']), $q) ||
                    (isset($app['description']) && str_contains(strtolower($app['description']), $q));
            });
        }

        // Filter: category
        if (!empty($filters['category'])) {
            $result = $result->filter(function ($app) use ($filters) {
                return isset($app['category']) && $app['category'] === $filters['category'];
            });
        }

        // Filter: provider
        if (!empty($filters['provider'])) {
            $result = $result->filter(function ($app) use ($filters) {
                return isset($app['provider']) && $app['provider'] === $filters['provider'];
            });
        }

        // Filter: has_triggers
        if (isset($filters['has_triggers'])) {
            $hasTriggers = filter_var($filters['has_triggers'], FILTER_VALIDATE_BOOLEAN);
            $result = $result->filter(function ($app) use ($hasTriggers) {
                return $hasTriggers ? ($app['triggers_count'] > 0) : true;
            });
        }

        // Optionally paginate here if needed
        return $result->values()->all();
    }

    /**
     * Create a new App database record for a discovered app
     */
    private function createAppRecord(string $automationKey, ?array $automationMetadata, string $appName): \App\Models\App
    {
        return \App\Models\App::create([
            'key' => $automationKey,
            'name' => $automationMetadata['name'] ?? $appName,
            'description' => $automationMetadata['description'] ?? null,
            'version' => $automationMetadata['version'] ?? '1.0.0',
            'documentation_url' => $automationMetadata['provider_url'] ?? null,
            'is_active' => true,
            'is_built_in' => true, // Apps discovered in the codebase are considered built-in
            'category' => 'automation', // Default category, can be customized per app
            'color' => null, // Can be set later or customized per app
            'icon_url' => null, // Can be set later or customized per app
        ]);
    }
}
