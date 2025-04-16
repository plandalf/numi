<?php

namespace App\Models;

use App\Enums\Role;
use Illuminate\Database\Eloquent\Relations\Pivot;

class OrganizationUser extends Pivot
{
    protected $table = 'organization_users';

    protected $fillable = [
        'role',
    ];

    protected $casts = [
        'role' => Role::class,
    ];

    protected $attributes = [
        'role' => Role::MEMBER,
    ];
} 