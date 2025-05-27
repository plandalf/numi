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
            'primary_contrast_color' => $this->primary_contrast_color ?? '#000000',

            'secondary_color' => $this->secondary_color ?? '#000000',
            'secondary_contrast_color' => $this->secondary_contrast_color ?? '#000000',

            'canvas_color' => $this->canvas_color ?? '#000000',
            'primary_surface_color' => $this->primary_surface_color ?? '#000000',
            'secondary_surface_color' => $this->secondary_surface_color ?? '#000000',
            
            'label_text_color' => $this->label_text_color ?? '#000000',
            'body_text_color' => $this->body_text_color ?? '#000000',

            'primary_border_color' => $this->primary_border_color ?? '#000000',
            'secondary_border_color' => $this->secondary_border_color ?? '#000000',

            'warning_color' => $this->warning_color ?? '#000000',
            'success_color' => $this->success_color ?? '#000000',
            'highlight_color' => $this->highlight_color ?? '#000000',

            'main_font' => $this->main_font ?? FontElement::INTER->value,
            'mono_font' => $this->mono_font ?? FontElement::INTER->value,

            'h1_typography' => $this->h1_typography ?? ['32px', FontElement::INTER->value, '600'],
            'h2_typography' => $this->h2_typography ?? ['24px', FontElement::INTER->value, '600'],
            'h3_typography' => $this->h3_typography ?? ['19px', FontElement::INTER->value, '600'],
            'h4_typography' => $this->h4_typography ?? ['16px', FontElement::INTER->value, '600'],
            'h5_typography' => $this->h5_typography ?? ['13px', FontElement::INTER->value, '600'],

            'label_typography' => $this->label_typography ?? ['14px', FontElement::INTER->value, '500'],
            'body_typography' => $this->body_typography ?? ['16px', FontElement::INTER->value, '400'],

            'border_radius' => $this->border_radius ?? '12px',
            'shadow' => $this->shadow ?? '0 0px 0px 0 rgba(0, 0, 0, 0.05)',

            'padding' => $this->padding ?? '5px 10px 5px 10px',
            'spacing' => $this->spacing ?? '5px 10px 5px 10px',
            'margin' => $this->margin ?? '5px 10px 5px 10px',

            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
