<?php

namespace Database\Factories;

use App\Models\ReusableBlock;
use App\Models\Organization;
use Illuminate\Database\Eloquent\Factories\Factory;

class ReusableBlockFactory extends Factory
{
    protected $model = ReusableBlock::class;

    public function definition(): array
    {
        return [
            'organization_id' => Organization::factory(),
            'name' => $this->faker->words(3, true),
            'block_type' => $this->faker->randomElement(['text', 'button', 'image', 'heading']),
            'configuration' => [
                'content' => [
                    'value' => $this->faker->sentence(),
                ],
                'style' => [
                    'fontSize' => '16px',
                    'color' => '#000000',
                ],
                'appearance' => [
                    'padding' => '16px',
                ],
            ],
        ];
    }
} 