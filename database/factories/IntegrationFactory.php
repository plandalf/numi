<?php

namespace Database\Factories;

use App\Models\Integration;
use App\Models\App;
use App\Models\Organization;
use Illuminate\Database\Eloquent\Factories\Factory;

class IntegrationFactory extends Factory
{
    protected $model = Integration::class;

    public function definition()
    {
        return [
            'app_id' => App::factory(),
            'organization_id' => Organization::factory(),
            'connection_config' => [
                'client_id' => $this->faker->uuid(),
                'client_secret' => $this->faker->uuid(),
                'subdomain' => $this->faker->slug(2),
            ],
            'name' => $this->faker->company . ' Integration',
            'current_state' => 'created',
            'type' => \App\Enums\IntegrationType::KAJABI,
        ];
    }
} 