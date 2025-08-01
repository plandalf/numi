<?php

namespace Database\Factories\Automation;

use App\Models\Automation\Action;
use App\Models\Automation\Sequence;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Automation\Action>
 */
class NodeFactory extends Factory
{
    /**
     * The name of the factory's corresponding model.
     *
     * @var string
     */
    protected $model = Action::class;

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
            'type' => $this->faker->randomElement(['email', 'webhook', 'delay', 'condition', 'app_action']),
            'arguments' => [],
            'position' => [
                'x' => $this->faker->numberBetween(0, 1000),
                'y' => $this->faker->numberBetween(0, 1000)
            ],
            'metadata' => null,
        ];
    }

    /**
     * Indicate that the node is an email action.
     */
    public function email(): static
    {
        return $this->state(fn (array $attributes) => [
            'type' => 'email',
            'arguments' => [
                'recipients' => ['test@example.com'],
                'subject' => 'Test Email',
                'body' => 'This is a test email body.',
            ],
        ]);
    }

    /**
     * Indicate that the node is a webhook action.
     */
    public function webhook(): static
    {
        return $this->state(fn (array $attributes) => [
            'type' => 'webhook',
            'arguments' => [
                'url' => 'https://api.example.com/webhook',
                'method' => 'POST',
                'payload' => '{"test": "data"}',
            ],
        ]);
    }

    /**
     * Indicate that the node is a delay action.
     */
    public function delay(): static
    {
        return $this->state(fn (array $attributes) => [
            'type' => 'delay',
            'arguments' => [
                'duration' => '5 minutes',
            ],
        ]);
    }

    /**
     * Indicate that the node is an app action.
     */
    public function appAction(): static
    {
        return $this->state(fn (array $attributes) => [
            'type' => 'app_action',
            'arguments' => [
                'tag_name' => 'Test Tag',
            ],
            'metadata' => [
                'app_action_key' => 'create_contact_tag',
                'app_name' => 'kajabi',
            ],
        ]);
    }
}
