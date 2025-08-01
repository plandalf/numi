<?php

namespace Database\Factories\Automation;

use App\Models\Automation\Trigger;
use App\Models\Automation\Sequence;
use App\Models\Integration;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Automation\Trigger>
 */
class TriggerFactory extends Factory
{
    /**
     * The name of the factory's corresponding model.
     *
     * @var string
     */
    protected $model = Trigger::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'sequence_id' => Sequence::factory(),
            'name' => $this->faker->sentence(3),
            'integration_id' => Integration::factory(),
            'trigger_key' => $this->faker->randomElement(['new_purchase', 'contact_created', 'webhook']),
            'configuration' => [],
            'conditions' => [],
            'is_active' => $this->faker->boolean(80), // 80% chance of being active
            'trigger_type' => 'integration',
            'webhook_auth_config' => null,
        ];
    }

    /**
     * Indicate that the trigger is a webhook trigger.
     */
    public function webhook(): static
    {
        return $this->state(fn (array $attributes) => [
            'trigger_type' => 'webhook',
            'integration_id' => null,
            'trigger_key' => 'webhook',
            'webhook_auth_config' => [
                'type' => 'none'
            ],
        ]);
    }

    /**
     * Indicate that the trigger is active.
     */
    public function active(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_active' => true,
        ]);
    }

    /**
     * Indicate that the trigger is inactive.
     */
    public function inactive(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_active' => false,
        ]);
    }
} 