<?php

namespace App\Http\Resources;

use App\Enums\Theme\FontElement;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ThemeResource extends JsonResource
{
    public static $wrap = false;

    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'primary_color' => $this->primary_color ?? '#000000',
            'secondary_color' => $this->secondary_color ?? '#000000',
            'canvas_color' => $this->canvas_color ?? '#000000',
            'primary_surface_color' => $this->primary_surface_color ?? '#000000',
            'secondary_surface_color' => $this->secondary_surface_color ?? '#000000',
            'primary_border_color' => $this->primary_border_color ?? '#000000',
            'secondary_border_color' => $this->secondary_border_color ?? '#000000',
            'light_text_color' => $this->light_text_color ?? '#000000',
            'dark_text_color' => $this->dark_text_color ?? '#000000',
            'danger_color' => $this->danger_color ?? '#000000',
            'info_color' => $this->info_color ?? '#000000',
            'warning_color' => $this->warning_color ?? '#000000',
            'success_color' => $this->success_color ?? '#000000',
            'highlight_color' => $this->highlight_color ?? '#000000',
            'main_font' => $this->main_font ?? FontElement::INSTRUMENT_SANS->value,
            'mono_font' => $this->mono_font ?? FontElement::INSTRUMENT_SANS->value,
            'h1_typography' => $this->h1_typography ?? ['32px', FontElement::INSTRUMENT_SANS->value, '600'],
            'h2_typography' => $this->h2_typography ?? ['24px', FontElement::INSTRUMENT_SANS->value, '600'],
            'h3_typography' => $this->h3_typography ?? ['19px', FontElement::INSTRUMENT_SANS->value, '600'],
            'h4_typography' => $this->h4_typography ?? ['16px', FontElement::INSTRUMENT_SANS->value, '600'],
            'h5_typography' => $this->h5_typography ?? ['13px', FontElement::INSTRUMENT_SANS->value, '600'],
            'h6_typography' => $this->h6_typography ?? ['10px', FontElement::INSTRUMENT_SANS->value, '600'],
            'label_typography' => $this->label_typography ?? ['14px', FontElement::INSTRUMENT_SANS->value, '500'],
            'body_typography' => $this->body_typography ?? ['16px', FontElement::INSTRUMENT_SANS->value, '400'],
            'border_radius' => $this->border_radius ?? '12px',
            'shadow_sm' => $this->shadow_sm ?? '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
            'shadow_md' => $this->shadow_md ?? '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            'shadow_lg' => $this->shadow_lg ?? '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
