<?php

namespace App\Models\Store;

use App\Database\Model;
use App\Models\Organization;
use App\Models\Store\Offer;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Enums\Theme\Element;

/**
 * @property int $id
 * @property int $organization_id
 * @property string $name
 * @property string $color_components_primary_color
 * @property string $color_components_secondary_color
 * @property string $color_components_canvas
 * @property string $color_components_primary_surface
 * @property string $color_components_secondary_surface
 * @property string $color_components_primary_border
 * @property string $color_components_secondary_border
 * @property string $color_text_light_text
 * @property string $color_text_dark_text
 * @property string $color_status_danger
 * @property string $color_status_info
 * @property string $color_status_warning
 * @property string $color_status_success
 * @property string $color_status_highlight
 * @property string $typography_main_font
 * @property string $typography_mono_font
 * @property string $typography_h1_size
 * @property string $typography_h1_font
 * @property string $typography_h1_weight
 * @property string $typography_h2_size
 * @property string $typography_h2_font
 * @property string $typography_h2_weight
 * @property string $typography_h3_size
 * @property string $typography_h3_font
 * @property string $typography_h3_weight
 * @property string $typography_h4_size
 * @property string $typography_h4_font
 * @property string $typography_h4_weight
 * @property string $typography_h5_size
 * @property string $typography_h5_font
 * @property string $typography_h5_weight
 * @property string $typography_h6_size
 * @property string $typography_h6_font
 * @property string $typography_h6_weight
 * @property string $typography_label_size
 * @property string $typography_label_font
 * @property string $typography_label_weight
 * @property string $typography_body_size
 * @property string $typography_body_font
 * @property string $typography_body_weight
 * @property string $components_border_radius
 * @property string $components_shadow_sm
 * @property string $components_shadow_md
 * @property string $components_shadow_lg
 * @property \Carbon\Carbon $created_at
 * @property \Carbon\Carbon $updated_at
 * @property \Carbon\Carbon|null $deleted_at
 */
class Theme extends Model
{
    /** @use HasFactory<\Database\Factories\Store\ThemeFactory> */
    use HasFactory,
        SoftDeletes;

    protected $table = 'store_themes';

    protected $fillable = [
        'organization_id',
        'name',
        'color_components_primary_color',
        'color_components_secondary_color',
        'color_components_canvas',
        'color_components_primary_surface',
        'color_components_secondary_surface',
        'color_components_primary_border',
        'color_components_secondary_border',
        'color_text_light_text',
        'color_text_dark_text',
        'color_status_danger',
        'color_status_info',
        'color_status_warning',
        'color_status_success',
        'color_status_highlight',
        'typography_main_font',
        'typography_mono_font',
        'typography_h1_size',
        'typography_h1_font',
        'typography_h1_weight',
        'typography_h2_size',
        'typography_h2_font',
        'typography_h2_weight',
        'typography_h3_size',
        'typography_h3_font',
        'typography_h3_weight',
        'typography_h4_size',
        'typography_h4_font',
        'typography_h4_weight',
        'typography_h5_size',
        'typography_h5_font',
        'typography_h5_weight',
        'typography_h6_size',
        'typography_h6_font',
        'typography_h6_weight',
        'typography_label_size',
        'typography_label_font',
        'typography_label_weight',
        'typography_body_size',
        'typography_body_font',
        'typography_body_weight',
        'components_border_radius',
        'components_shadow_sm',
        'components_shadow_md',
        'components_shadow_lg',
    ];

    /**
     * Get the theme properties as a ThemeProperties instance.
     *
     * @return ThemeProperties
     */
    public function getThemeProperties(): ThemeProperties
    {
        $properties = [];
        
        // Iterate through ThemeProperties::PROPERTY_STRUCTURE to build the properties array
        foreach (ThemeProperties::PROPERTY_STRUCTURE as $fieldStructure) {
            $this->buildThemePropertiesArray($properties, $fieldStructure);
        }
        
        return ThemeProperties::fromArray($properties);
    }
    
    /**
     * Build theme properties array recursively.
     *
     * @param array $properties The properties array to fill
     * @param array $fieldStructure The field structure from PROPERTY_STRUCTURE
     * @return void
     */
    private function buildThemePropertiesArray(array &$properties, array $fieldStructure): void
    {
        $name = $fieldStructure['name'];
        
        if ($fieldStructure['type'] === Element::OBJECT) {
            $properties[$name] = [];
            
            foreach ($fieldStructure['properties'] as $childField) {
                $this->buildThemePropertiesArray($properties[$name], $childField);
            }
        } else {
            $dbKey = $fieldStructure['db_key'];
            $properties[$name] = $this->{$dbKey} ?? $fieldStructure['default'] ?? null;
        }
    }

    /**
     * Set the theme properties from a ThemeProperties instance.
     *
     * @param ThemeProperties $properties
     * @return void
     */
    public function setThemeProperties(ThemeProperties $properties): void
    {
        $array = $properties->toArray();
        
        // Iterate through ThemeProperties::PROPERTY_STRUCTURE to set model attributes
        foreach (ThemeProperties::PROPERTY_STRUCTURE as $fieldStructure) {
            $this->setThemePropertyFields($fieldStructure, $array);
        }
    }
    
    /**
     * Set theme property fields recursively.
     *
     * @param array $fieldStructure The field structure from PROPERTY_STRUCTURE
     * @param array $propertiesArray The properties array from ThemeProperties
     * @return void
     */
    private function setThemePropertyFields(array $fieldStructure, array $propertiesArray): void
    {
        $name = $fieldStructure['name'];
        
        if ($fieldStructure['type'] === Element::OBJECT) {
            $values = $propertiesArray[$name] ?? [];
            
            foreach ($fieldStructure['properties'] as $childField) {
                $this->setThemePropertyFields($childField, $values);
            }
        } else {
            $dbKey = $fieldStructure['db_key'];
            $this->{$dbKey} = $propertiesArray[$name] ?? $fieldStructure['default'] ?? null;
        }
    }

    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }

    public function offer(): HasOne
    {
        return $this->hasOne(Offer::class);
    }
}
