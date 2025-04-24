<?php

namespace App\Enums;

enum ProductStatus: string
{
    case draft = 'draft';
    case active = 'active';
    case archived = 'archived';
    case deleted = 'deleted';
}
