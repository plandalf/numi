<?php

namespace App\Services;

use App\Apps\AutomationApp;
use App\Workflows\Automation\AppAction;
use App\Workflows\Automation\AppTrigger;
use App\Workflows\Automation\Resource;
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
                            $apps[$appName] = [
                'name' => $appName,
                'class' => $appClass,
                'actions' => $this->discoverAppActions($appClass),
                'triggers' => $this->discoverAppTriggers($appClass),
                'resources' => $this->discoverAppResources($appClass),
            ];
            }
        }

        return $apps;
    }

    /**
     * Discover actions for a specific app
     */
    public function discoverAppActions(string $appClass): array
    {
        $app = new $appClass();
        $actionClasses = $app->actions();
        $actions = [];

        foreach ($actionClasses as $actionClass) {
            if (class_exists($actionClass) && is_subclass_of($actionClass, AppAction::class)) {
                try {
                    $actions[] = $actionClass::getDefinition();
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

        foreach ($triggerClasses as $triggerClass) {
            if (class_exists($triggerClass)
                && is_subclass_of($triggerClass, AppTrigger::class)
            ) {
                try {
                    $triggers[] = $triggerClass::getDefinition();
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
            foreach ($app['actions'] as $action) {
                $action['app'] = $appName;
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
            foreach ($app['triggers'] as $trigger) {
                $trigger['app'] = $appName;
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
            foreach ($app['resources'] as $resource) {
                $resource['app'] = $appName;
                $allResources[] = $resource;
            }
        }

        return $allResources;
    }
}
