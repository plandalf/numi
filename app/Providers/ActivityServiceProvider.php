<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Symfony\Component\Finder\Finder;
use ReflectionClass;
use App\Workflows\Automation\Attributes\Activity;
use App\Workflows\Automation\ActivitySchemaRegistry;

class ActivityServiceProvider extends ServiceProvider
{
    public function register()
    {
        $this->app->singleton(ActivitySchemaRegistry::class, function ($app) {
            $registry = new ActivitySchemaRegistry();
            $this->registerActivities($registry);
            return $registry;
        });
    }

    public function boot()
    {
    }
    
    private function registerActivities(ActivitySchemaRegistry $registry): void
    {
        $namespace = 'App\\Workflows\\Automation\\';
        $directory = app_path('Workflows/Automation');
        
        $finder = Finder::create()
            ->files()
            ->name('*Activity.php')
            ->in($directory);
            
        foreach ($finder as $file) {
            $className = $namespace . str_replace(
                ['/', '.php'],
                ['\\', ''],
                $file->getRelativePathname()
            );
  
            if (!class_exists($className)) continue;
            
            $reflection = new ReflectionClass($className);
            
            // Check if this is an activity class
            if (!$reflection->isAbstract()) {
                $activityAttr = $reflection->getAttributes(Activity::class)[0] ?? null;

                if ($activityAttr) {
                    $activityMeta = $activityAttr->newInstance();
                    $registry->register($className, $activityMeta->type);
                } else {
                    // If no activity attribute, try to infer type from class name
                    $type = strtolower(str_replace('Activity', '', class_basename($className)));
                    $registry->register($className, $type);
                }
            }
        }
    }
} 