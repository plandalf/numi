<?php

namespace App\Models\Store;

use App\Enums\Theme\Color\ColorComponent;
use App\Enums\Theme\Color\ColorProperty;
use App\Enums\Theme\Color\ColorStatus;
use App\Enums\Theme\Color\ColorText;
use App\Enums\Theme\Component\ComponentProperty;
use App\Enums\Theme\Element;
use App\Enums\Theme\FontElement;
use App\Enums\Theme\ThemeProperty;
use App\Enums\Theme\Typography\TypographyProperty;
use App\Enums\Theme\Typography\TypographyElement;
use App\Enums\Theme\WeightElement;

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
     *         'type' => Element::XXX, // The type of the property (OBJECT, COLOR, etc.)
     *         'default' => 'default_value', // Default value for non-object types
     *         'db_key' => 'database_column_name', // The database column name for this property
     *         'properties' => [ // Only for OBJECT type
     *             [
     *                 'name' => 'nested_property',
     *                 'type' => Element::XXX,
     *                 'default' => 'default_value',
     *                 'db_key' => 'database_column_name', // The database column name for this property
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
     *         'type' => Element::OBJECT,
     *         'properties' => [
     *             [
     *                 'name' => 'primary',
     *                 'type' => Element::COLOR,
     *                 'default' => '#000000',
     *             ],
     *         ],
     *     ],
     * ]
     */
    const PROPERTY_STRUCTURE = [
        // Color structure
        [
            'name' => ThemeProperty::COLOR->value,
            'type' => Element::OBJECT,
            'properties' => [
                [
                    'name' => ColorProperty::COMPONENTS->value,
                    'type' => Element::OBJECT,
                    'properties' => [
                        [
                            'name' => ColorComponent::PRIMARY_COLOR->value,
                            'type' => Element::COLOR,
                            'default' => '#000000',
                            'db_key' => 'color_components_primary_color',
                        ],
                        [
                            'name' => ColorComponent::SECONDARY_COLOR->value,
                            'type' => Element::COLOR,
                            'default' => '#000000',
                            'db_key' => 'color_components_secondary_color',
                        ],  
                        [
                            'name' => ColorComponent::CANVAS->value,
                            'type' => Element::COLOR,
                            'default' => '#000000',
                            'db_key' => 'color_components_canvas',
                        ],
                        [
                            'name' => ColorComponent::PRIMARY_SURFACE->value,
                            'type' => Element::COLOR,
                            'default' => '#000000',
                            'db_key' => 'color_components_primary_surface',
                        ],
                        [
                            'name' => ColorComponent::SECONDARY_SURFACE->value,
                            'type' => Element::COLOR,
                            'default' => '#000000',
                            'db_key' => 'color_components_secondary_surface',
                        ],
                        [
                            'name' => ColorComponent::PRIMARY_BORDER->value,
                            'type' => Element::COLOR,
                            'default' => '#000000',
                            'db_key' => 'color_components_primary_border',
                        ],
                        [
                            'name' => ColorComponent::SECONDARY_BORDER->value,
                            'type' => Element::COLOR,
                            'default' => '#000000',
                            'db_key' => 'color_components_secondary_border',
                        ],
                    ],
                ],
                [
                    'name' => ColorProperty::TEXT->value,
                    'type' => Element::OBJECT,
                    'properties' => [
                        [
                            'name' => ColorText::LIGHT_TEXT->value,
                            'type' => Element::COLOR,
                            'default' => '#ffffff',
                            'db_key' => 'color_text_light_text',
                        ],
                        [
                            'name' => ColorText::DARK_TEXT->value,
                            'type' => Element::COLOR,
                            'default' => '#000000',
                            'db_key' => 'color_text_dark_text',
                        ],  
                    ],
                ],
                [
                    'name' => ColorProperty::STATUS->value,
                    'type' => Element::OBJECT,
                    'properties' => [
                        [
                            'name' => ColorStatus::DANGER->value,
                            'type' => Element::COLOR,
                            'default' => '#ffffff',
                            'db_key' => 'color_status_danger',
                        ],
                        [
                            'name' => ColorStatus::INFO->value,
                            'type' => Element::COLOR,
                            'default' => '#ffffff',
                            'db_key' => 'color_status_info',
                        ],
                        [
                            'name' => ColorStatus::WARNING->value,
                            'type' => Element::COLOR,
                            'default' => '#ffffff',
                            'db_key' => 'color_status_warning',
                        ],
                        [
                            'name' => ColorStatus::SUCCESS->value,
                            'type' => Element::COLOR,
                            'default' => '#ffffff',
                            'db_key' => 'color_status_success',
                        ],
                        [
                            'name' => ColorStatus::HIGHLIGHT->value,
                            'type' => Element::COLOR,
                            'default' => '#ffffff',
                            'db_key' => 'color_status_highlight',
                        ],
                    ],
                ],
            ]
        ],


        // Typography structure
        [
            'name' => ThemeProperty::TYPOGRAPHY->value,
            'type' => Element::OBJECT,
            'properties' => [
                [
                    'name' => TypographyProperty::MAIN_FONT->value,
                    'type' => Element::FONT,
                    'default' => FontElement::INTER->value,
                    'db_key' => 'typography_main_font',
                ],
                [
                    'name' => TypographyProperty::MONO_FONT->value,
                    'type' => Element::FONT,
                    'default' => FontElement::ROBOTO_MONO->value,
                    'db_key' => 'typography_mono_font',
                ],
                [
                    'name' => TypographyProperty::H1->value,
                    'type' => Element::OBJECT,
                    'properties' => [
                        [
                            'name' => TypographyElement::SIZE->value,
                            'type' => Element::SIZE,
                            'default' => '2.5rem',
                            'db_key' => 'typography_h1_size',
                        ],
                        [
                            'name' => TypographyElement::FONT->value,
                            'type' => Element::FONT,
                            'default' => FontElement::INTER->value,
                            'db_key' => 'typography_h1_font',
                        ],
                        [
                            'name' => TypographyElement::WEIGHT->value,
                            'type' => Element::WEIGHT,
                            'default' => WeightElement::SEMI_BOLD->value,
                            'db_key' => 'typography_h1_weight',
                        ],
                    ]
                ],
                [
                    'name' => TypographyProperty::H2->value,
                    'type' => Element::OBJECT,
                    'properties' => [
                        [
                            'name' => TypographyElement::SIZE->value,
                            'type' => Element::SIZE,
                            'default' => '2rem',
                            'db_key' => 'typography_h2_size',
                        ],
                        [
                            'name' => TypographyElement::FONT->value,
                            'type' => Element::FONT,
                            'default' => FontElement::INTER->value,
                            'db_key' => 'typography_h2_font',
                        ],
                        [
                            'name' => TypographyElement::WEIGHT->value,
                            'type' => Element::WEIGHT,
                            'default' => WeightElement::SEMI_BOLD->value,
                            'db_key' => 'typography_h2_weight',
                        ],
                    ]
                ],
                [
                    'name' => TypographyProperty::H3->value,
                    'type' => Element::OBJECT,
                    'properties' => [
                        [
                            'name' => TypographyElement::SIZE->value,
                            'type' => Element::SIZE,
                            'default' => '1.75rem',
                            'db_key' => 'typography_h3_size',
                        ],
                        [
                            'name' => TypographyElement::FONT->value,
                            'type' => Element::FONT,
                            'default' => FontElement::INTER->value,
                            'db_key' => 'typography_h3_font',
                        ],
                        [
                            'name' => TypographyElement::WEIGHT->value,
                            'type' => Element::WEIGHT,
                            'default' => WeightElement::SEMI_BOLD->value,
                            'db_key' => 'typography_h3_weight',
                        ],
                    ]
                ],
                [
                    'name' => TypographyProperty::H4->value,
                    'type' => Element::OBJECT,
                    'properties' => [
                        [
                            'name' => TypographyElement::SIZE->value,
                            'type' => Element::SIZE,
                            'default' => '1.5rem',
                            'db_key' => 'typography_h4_size',
                        ],
                        [
                            'name' => TypographyElement::FONT->value,
                            'type' => Element::FONT,
                            'default' => FontElement::INTER->value,
                            'db_key' => 'typography_h4_font',
                        ],
                        [
                            'name' => TypographyElement::WEIGHT->value,
                            'type' => Element::WEIGHT,
                            'default' => WeightElement::SEMI_BOLD->value,
                            'db_key' => 'typography_h4_weight',
                        ],
                    ]
                ],
                [
                    'name' => TypographyProperty::H5->value,
                    'type' => Element::OBJECT,
                    'properties' => [
                        [
                            'name' => TypographyElement::SIZE->value,
                            'type' => Element::SIZE,
                            'default' => '1.25rem',
                            'db_key' => 'typography_h5_size',
                        ],
                        [
                            'name' => TypographyElement::FONT->value,
                            'type' => Element::FONT,
                            'default' => FontElement::INTER->value,
                            'db_key' => 'typography_h5_font',
                        ],
                        [
                            'name' => TypographyElement::WEIGHT->value,
                            'type' => Element::WEIGHT,
                            'default' => WeightElement::SEMI_BOLD->value,
                            'db_key' => 'typography_h5_weight',
                        ],
                    ]
                ],
                [
                    'name' => TypographyProperty::H6->value,
                    'type' => Element::OBJECT,
                    'properties' => [
                        [
                            'name' => TypographyElement::SIZE->value,
                            'type' => Element::SIZE,
                            'default' => '1rem',
                            'db_key' => 'typography_h6_size',
                        ],
                        [
                            'name' => TypographyElement::FONT->value,
                            'type' => Element::FONT,
                            'default' => FontElement::INTER->value,
                            'db_key' => 'typography_h6_font',
                        ],
                        [
                            'name' => TypographyElement::WEIGHT->value,
                            'type' => Element::WEIGHT,
                            'default' => WeightElement::SEMI_BOLD->value,
                            'db_key' => 'typography_h6_weight',
                        ],
                    ]
                ],
                [
                    'name' => TypographyProperty::LABEL->value,
                    'type' => Element::OBJECT,
                    'properties' => [
                        [
                            'name' => TypographyElement::SIZE->value,
                            'type' => Element::SIZE,
                            'default' => '0.875rem',
                            'db_key' => 'typography_label_size',
                        ],
                        [
                            'name' => TypographyElement::FONT->value,
                            'type' => Element::FONT,
                            'default' => FontElement::INTER->value,
                            'db_key' => 'typography_label_font',
                        ],
                        [
                            'name' => TypographyElement::WEIGHT->value,
                            'type' => Element::WEIGHT,
                            'default' => WeightElement::MEDIUM->value,
                            'db_key' => 'typography_label_weight',
                        ],
                    ]
                ],
                [
                    'name' => TypographyProperty::BODY->value,
                    'type' => Element::OBJECT,
                    'properties' => [
                        [
                            'name' => TypographyElement::SIZE->value,
                            'type' => Element::SIZE,
                            'default' => '1rem',
                            'db_key' => 'typography_body_size',
                        ],
                        [
                            'name' => TypographyElement::FONT->value,
                            'type' => Element::FONT,
                            'default' => FontElement::INTER->value,
                            'db_key' => 'typography_body_font',
                        ],
                        [
                            'name' => TypographyElement::WEIGHT->value,
                            'type' => Element::WEIGHT,
                            'default' => WeightElement::REGULAR->value,
                            'db_key' => 'typography_body_weight',
                        ],
                    ]
                ]
            ],
        ],
        
        // Component structure
        [
            'name' => ThemeProperty::COMPONENTS->value,
            'type' => Element::OBJECT,
            'properties' => [
                [
                    'name' => ComponentProperty::BORDER_RADIUS->value,
                    'type' => Element::SIZE,
                    'default' => '0.375rem',
                    'db_key' => 'components_border_radius',
                ],
                [
                    'name' => ComponentProperty::SHADOW_SM->value,
                    'type' => Element::SHADOW,
                    'default' => '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                    'db_key' => 'components_shadow_sm',
                ],
                [
                    'name' => ComponentProperty::SHADOW_MD->value,
                    'type' => Element::SHADOW,
                    'default' => '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                    'db_key' => 'components_shadow_md',
                ],
                [
                    'name' => ComponentProperty::SHADOW_LG->value,
                    'type' => Element::SHADOW,
                    'default' => '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                    'db_key' => 'components_shadow_lg',
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
            
            if ($field['type'] === Element::OBJECT) {
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