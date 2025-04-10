<?php

namespace App\Models\Store;

use App\Enums\Theme\Color\ColorComponentType;
use App\Enums\Theme\Color\ColorPropertyType;
use App\Enums\Theme\Color\ColorStatusType;
use App\Enums\Theme\Color\ColorTextType;
use App\Enums\Theme\Component\ComponentPropertyType;
use App\Enums\Theme\ElementType;
use App\Enums\Theme\FontElementType;
use App\Enums\Theme\ThemeFieldType;
use App\Enums\Theme\Typography\TypographyPropertyType;
use App\Enums\Theme\Typography\TypographyElementType;
use App\Enums\Theme\WeightElementType;

class ThemeProperties
{
    /**
     * The properties array that holds all theme properties.
     *
     * @var array<string, mixed>
     */
    public array $properties;
    
    /**
     * Property structure definition for theme properties.
     * 
     * Structure format:
     * [
     *     [
     *         'name' => 'property_name',  // The name of the property (from enum)
     *         'type' => ElementType::XXX, // The type of the property (OBJECT, COLOR, etc.)
     *         'default' => 'default_value', // Default value for non-object types
     *         'properties' => [ // Only for OBJECT type
     *             [
     *                 'name' => 'nested_property',
     *                 'type' => ElementType::XXX,
     *                 'default' => 'default_value',
     *                 // Can have nested properties for OBJECT types
     *             ],
     *         ],
     *     ],
     * ]
     * 
     * Example:
     * [
     *     [
     *         'name' => 'color',
     *         'type' => ElementType::OBJECT,
     *         'properties' => [
     *             [
     *                 'name' => 'primary',
     *                 'type' => ElementType::COLOR,
     *                 'default' => '#000000',
     *             ],
     *         ],
     *     ],
     * ]
     */
    const PROPERTY_STRUCTURE = [
        // Color structure
        [
            'name' => ThemeFieldType::COLOR->value,
            'type' => ElementType::OBJECT,
            'properties' => [
                [
                    'name' => ColorPropertyType::COMPONENTS->value,
                    'type' => ElementType::OBJECT,
                    'properties' => [
                        [
                            'name' => ColorComponentType::PRIMARY_COLOR->value,
                            'type' => ElementType::COLOR,
                            'default' => '#000000',
                        ],
                        [
                            'name' => ColorComponentType::SECONDARY_COLOR->value,
                            'type' => ElementType::COLOR,
                            'default' => '#000000',
                        ],  
                        [
                            'name' => ColorComponentType::CANVAS->value,
                            'type' => ElementType::COLOR,
                            'default' => '#000000',
                        ],
                        [
                            'name' => ColorComponentType::PRIMARY_SURFACE->value,
                            'type' => ElementType::COLOR,
                            'default' => '#000000',
                        ],
                        [
                            'name' => ColorComponentType::SECONDARY_SURFACE->value,
                            'type' => ElementType::COLOR,
                            'default' => '#000000',
                        ],
                        [
                            'name' => ColorComponentType::PRIMARY_BORDER->value,
                            'type' => ElementType::COLOR,
                            'default' => '#000000',
                        ],
                        [
                            'name' => ColorComponentType::SECONDARY_BORDER->value,
                            'type' => ElementType::COLOR,
                            'default' => '#000000',
                        ],
                    ],
                ],
                [
                    'name' => ColorPropertyType::TEXT->value,
                    'type' => ElementType::OBJECT,
                    'properties' => [
                        [
                            'name' => ColorTextType::LIGHT_TEXT->value,
                            'type' => ElementType::COLOR,
                            'default' => '#ffffff',
                        ],
                        [
                            'name' => ColorTextType::DARK_TEXT->value,
                            'type' => ElementType::COLOR,
                            'default' => '#000000',
                        ],  
                    ],
                ],
                [
                    'name' => ColorPropertyType::STATUS->value,
                    'type' => ElementType::OBJECT,
                    'properties' => [
                        [
                            'name' => ColorStatusType::DANGER->value,
                            'type' => ElementType::COLOR,
                            'default' => '#ffffff',
                        ],
                        [
                            'name' => ColorStatusType::INFO->value,
                            'type' => ElementType::COLOR,
                            'default' => '#ffffff',
                        ],
                        [
                            'name' => ColorStatusType::WARNING->value,
                            'type' => ElementType::COLOR,
                            'default' => '#ffffff',
                        ],
                        [
                            'name' => ColorStatusType::SUCCESS->value,
                            'type' => ElementType::COLOR,
                            'default' => '#ffffff',
                        ],
                        [
                            'name' => ColorStatusType::HIGHLIGHT->value,
                            'type' => ElementType::COLOR,
                            'default' => '#ffffff',
                        ],
                    ],
                ],
            ]
        ],


        // Typography structure
        [
            'name' => ThemeFieldType::TYPOGRAPHY->value,
            'type' => ElementType::OBJECT,
            'properties' => [
                [
                    'name' => TypographyPropertyType::MAIN_FONT->value,
                    'type' => ElementType::FONT,
                    'default' => FontElementType::INTER->value,
                ],
                [
                    'name' => TypographyPropertyType::MONO_FONT->value,
                    'type' => ElementType::FONT,
                    'default' => FontElementType::ROBOTO_MONO->value,
                ],
                [
                    'name' => TypographyPropertyType::H1->value,
                    'type' => ElementType::OBJECT,
                    'properties' => [
                        [
                            'name' => TypographyElementType::SIZE->value,
                            'type' => ElementType::SIZE,
                            'default' => '2.5rem',
                        ],
                        [
                            'name' => TypographyElementType::FONT->value,
                            'type' => ElementType::FONT,
                            'default' => FontElementType::INTER->value,
                        ],
                        [
                            'name' => TypographyElementType::WEIGHT->value,
                            'type' => ElementType::WEIGHT,
                            'default' => WeightElementType::SEMI_BOLD->value,
                        ],
                    ]
                ],
                [
                    'name' => TypographyPropertyType::H2->value,
                    'type' => ElementType::OBJECT,
                    'properties' => [
                        [
                            'name' => TypographyElementType::SIZE->value,
                            'type' => ElementType::SIZE,
                            'default' => '2rem',
                        ],
                        [
                            'name' => TypographyElementType::FONT->value,
                            'type' => ElementType::FONT,
                            'default' => FontElementType::INTER->value,
                        ],
                        [
                            'name' => TypographyElementType::WEIGHT->value,
                            'type' => ElementType::WEIGHT,
                            'default' => WeightElementType::SEMI_BOLD->value,
                        ],
                    ]
                ],
                [
                    'name' => TypographyPropertyType::H3->value,
                    'type' => ElementType::OBJECT,
                    'properties' => [
                        [
                            'name' => TypographyElementType::SIZE->value,
                            'type' => ElementType::SIZE,
                            'default' => '1.75rem',
                        ],
                        [
                            'name' => TypographyElementType::FONT->value,
                            'type' => ElementType::FONT,
                            'default' => FontElementType::INTER->value,
                        ],
                        [
                            'name' => TypographyElementType::WEIGHT->value,
                            'type' => ElementType::WEIGHT,
                            'default' => WeightElementType::SEMI_BOLD->value,
                        ],
                    ]
                ],
                [
                    'name' => TypographyPropertyType::H4->value,
                    'type' => ElementType::OBJECT,
                    'properties' => [
                        [
                            'name' => TypographyElementType::SIZE->value,
                            'type' => ElementType::SIZE,
                            'default' => '1.5rem',
                        ],
                        [
                            'name' => TypographyElementType::FONT->value,
                            'type' => ElementType::FONT,
                            'default' => FontElementType::INTER->value,
                        ],
                        [
                            'name' => TypographyElementType::WEIGHT->value,
                            'type' => ElementType::WEIGHT,
                            'default' => WeightElementType::SEMI_BOLD->value,
                        ],
                    ]
                ],
                [
                    'name' => TypographyPropertyType::H5->value,
                    'type' => ElementType::OBJECT,
                    'properties' => [
                        [
                            'name' => TypographyElementType::SIZE->value,
                            'type' => ElementType::SIZE,
                            'default' => '1.25rem',
                        ],
                        [
                            'name' => TypographyElementType::FONT->value,
                            'type' => ElementType::FONT,
                            'default' => FontElementType::INTER->value,
                        ],
                        [
                            'name' => TypographyElementType::WEIGHT->value,
                            'type' => ElementType::WEIGHT,
                            'default' => WeightElementType::SEMI_BOLD->value,
                        ],
                    ]
                ],
                [
                    'name' => TypographyPropertyType::H6->value,
                    'type' => ElementType::OBJECT,
                    'properties' => [
                        [
                            'name' => TypographyElementType::SIZE->value,
                            'type' => ElementType::SIZE,
                            'default' => '1rem',
                        ],
                        [
                            'name' => TypographyElementType::FONT->value,
                            'type' => ElementType::FONT,
                            'default' => FontElementType::INTER->value,
                        ],
                        [
                            'name' => TypographyElementType::WEIGHT->value,
                            'type' => ElementType::WEIGHT,
                            'default' => WeightElementType::SEMI_BOLD->value,
                        ],
                    ]
                ],
                [
                    'name' => TypographyPropertyType::LABEL->value,
                    'type' => ElementType::OBJECT,
                    'properties' => [
                        [
                            'name' => TypographyElementType::SIZE->value,
                            'type' => ElementType::SIZE,
                            'default' => '0.875rem',
                        ],
                        [
                            'name' => TypographyElementType::FONT->value,
                            'type' => ElementType::FONT,
                            'default' => FontElementType::INTER->value,
                        ],
                        [
                            'name' => TypographyElementType::WEIGHT->value,
                            'type' => ElementType::WEIGHT,
                            'default' => WeightElementType::MEDIUM->value,
                        ],
                    ]
                ],
                [
                    'name' => TypographyPropertyType::BODY->value,
                    'type' => ElementType::OBJECT,
                    'properties' => [
                        [
                            'name' => TypographyElementType::SIZE->value,
                            'type' => ElementType::SIZE,
                            'default' => '1rem',
                        ],
                        [
                            'name' => TypographyElementType::FONT->value,
                            'type' => ElementType::FONT,
                            'default' => FontElementType::INTER->value,
                        ],
                        [
                            'name' => TypographyElementType::WEIGHT->value,
                            'type' => ElementType::WEIGHT,
                            'default' => WeightElementType::REGULAR->value,
                        ],
                    ]
                ]
            ],
        ],
        
        // Component structure
        [
            'name' => ThemeFieldType::COMPONENTS->value,
            'type' => ElementType::OBJECT,
            'properties' => [
                [
                    'name' => ComponentPropertyType::BORDER_RADIUS->value,
                    'type' => ElementType::SIZE,
                    'default' => '0.375rem',
                ],
                [
                    'name' => ComponentPropertyType::SHADOW_SM->value,
                    'type' => ElementType::SHADOW,
                    'default' => '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                ],
                [
                    'name' => ComponentPropertyType::SHADOW_MD->value,
                    'type' => ElementType::SHADOW,
                    'default' => '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                ],
                [
                    'name' => ComponentPropertyType::SHADOW_LG->value,
                    'type' => ElementType::SHADOW,
                    'default' => '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                ]
            ]
        ],
    ];

    /**
     * Create a new ThemeProperties instance.
     *
     * @param array<string, mixed> $properties
     * @return static
     */
    public static function fromArray(array $externalProperties): self
    {
        $instance = new self();
        $instance->properties = self::processProperties(self::PROPERTY_STRUCTURE, $externalProperties);
        return $instance;
    }

    /**
     * Process properties recursively based on the structure.
     *
     * @param array $structure The property structure to follow
     * @param array $externalProperties The external properties to process
     * @return array The processed properties
     */
    private static function processProperties(array $structure, array $externalProperties): array
    {
        $result = [];
        
        foreach ($structure as $field) {
            $name = $field['name'];
            
            if ($field['type'] === ElementType::OBJECT) {
                // For object types, recursively process nested properties
                $nestedProperties = $externalProperties[$name] ?? [];
                $result[$name] = self::processProperties($field['properties'], $nestedProperties);
            } else {
                // For non-object types, use the value from external properties or default
                $result[$name] = $externalProperties[$name] ?? $field['default'] ?? null;
            }
        }
        
        return $result;
    }

    /**
     * Convert the ThemeProperties instance to an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        return $this->properties;
    }
} 