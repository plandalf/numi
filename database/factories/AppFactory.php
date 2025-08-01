<?php

namespace Database\Factories;

use App\Models\App;
use Illuminate\Database\Eloquent\Factories\Factory;

class AppFactory extends Factory
{
    protected $model = App::class;

    public function definition()
    {
        return [
            'name' => $this->faker->company . ' App',
            'key' => $this->faker->unique()->slug,
            'description' => $this->faker->sentence,
            'is_active' => true,
            'is_built_in' => false,
        ];
    }
} 