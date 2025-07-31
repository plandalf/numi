<?php

namespace App\Enums\Theme;

enum FontElement: string
{
    case ROBOTO = 'Roboto';
    case OPEN_SANS = 'Open Sans';
    case LATO = 'Lato';
    case MONTSERRAT = 'Montserrat';
    case POPPINS = 'Poppins';
    case SOURCE_SANS_PRO = 'Source Sans Pro';
    case ROBOTO_MONO = 'Roboto Mono';
    case INTER = 'Inter';
    case OSWALD = 'Oswald';
    case RALEWAY = 'Raleway';
    case ROBOTO_CONDENSED = 'Roboto Condensed';
    case PT_SANS = 'PT Sans';
    case NOTO_SANS = 'Noto Sans';
    case UBUNTU = 'Ubuntu';
    case PLAYFAIR_DISPLAY = 'Playfair Display';
    case CORMORANT_GARAMOND = 'Cormorant Garamond';
    case RUBIK = 'Rubik';

    public function getFontWeights(): array
    {
        return match($this) {
            self::ROBOTO => [
                WeightElement::THIN->value,
                WeightElement::LIGHT->value,
                WeightElement::REGULAR->value,
                WeightElement::MEDIUM->value,
                WeightElement::BOLD->value,
                WeightElement::BLACK->value,
            ],
            self::OPEN_SANS => [
                WeightElement::LIGHT->value,
                WeightElement::REGULAR->value,
                WeightElement::MEDIUM->value,
                WeightElement::SEMI_BOLD->value,
                WeightElement::BOLD->value,
                WeightElement::EXTRA_BOLD->value,
            ],
            self::LATO => [
                WeightElement::THIN->value,
                WeightElement::LIGHT->value,
                WeightElement::REGULAR->value,
                WeightElement::BOLD->value,
                WeightElement::BLACK->value,
            ],
            self::MONTSERRAT => [
                WeightElement::THIN->value,
                WeightElement::EXTRA_LIGHT->value,
                WeightElement::LIGHT->value,
                WeightElement::REGULAR->value,
                WeightElement::MEDIUM->value,
                WeightElement::SEMI_BOLD->value,
                WeightElement::BOLD->value,
                WeightElement::EXTRA_BOLD->value,
                WeightElement::BLACK->value,
            ],
            self::POPPINS => [
                WeightElement::THIN->value,
                WeightElement::EXTRA_LIGHT->value,
                WeightElement::LIGHT->value,
                WeightElement::REGULAR->value,
                WeightElement::MEDIUM->value,
                WeightElement::SEMI_BOLD->value,
                WeightElement::BOLD->value,
                WeightElement::EXTRA_BOLD->value,
            ],
            self::SOURCE_SANS_PRO => [
                WeightElement::EXTRA_LIGHT->value,
                WeightElement::LIGHT->value,
                WeightElement::REGULAR->value,
                WeightElement::SEMI_BOLD->value,
                WeightElement::BOLD->value,
                WeightElement::BLACK->value,
            ],
            self::ROBOTO_MONO => [
                WeightElement::THIN->value,
                WeightElement::LIGHT->value,
                WeightElement::REGULAR->value,
                WeightElement::MEDIUM->value,
                WeightElement::BOLD->value,
            ],
            self::INTER => [
                WeightElement::THIN->value,
                WeightElement::EXTRA_LIGHT->value,
                WeightElement::LIGHT->value,
                WeightElement::REGULAR->value,
                WeightElement::MEDIUM->value,
                WeightElement::SEMI_BOLD->value,
                WeightElement::BOLD->value,
                WeightElement::EXTRA_BOLD->value,
                WeightElement::BLACK->value,
            ],
            self::OSWALD => [
                WeightElement::LIGHT->value,
                WeightElement::REGULAR->value,
                WeightElement::MEDIUM->value,
                WeightElement::SEMI_BOLD->value,
                WeightElement::BOLD->value,
            ],
            self::RALEWAY => [
                WeightElement::THIN->value,
                WeightElement::EXTRA_LIGHT->value,
                WeightElement::LIGHT->value,
                WeightElement::REGULAR->value,
                WeightElement::MEDIUM->value,
                WeightElement::SEMI_BOLD->value,
                WeightElement::BOLD->value,
                WeightElement::EXTRA_BOLD->value,
            ],
            self::ROBOTO_CONDENSED => [
                WeightElement::LIGHT->value,
                WeightElement::REGULAR->value,
                WeightElement::BOLD->value,
            ],
            self::PT_SANS => [
                WeightElement::REGULAR->value,
                WeightElement::BOLD->value,
            ],
            self::NOTO_SANS => [
                WeightElement::THIN->value,
                WeightElement::EXTRA_LIGHT->value,
                WeightElement::LIGHT->value,
                WeightElement::REGULAR->value,
                WeightElement::MEDIUM->value,
                WeightElement::SEMI_BOLD->value,
                WeightElement::BOLD->value,
                WeightElement::EXTRA_BOLD->value,
                WeightElement::BLACK->value,
            ],
            self::UBUNTU => [
                WeightElement::LIGHT->value,
                WeightElement::REGULAR->value,
                WeightElement::MEDIUM->value,
                WeightElement::BOLD->value,
            ],
            self::PLAYFAIR_DISPLAY => [
                WeightElement::REGULAR->value,
                WeightElement::MEDIUM->value,
                WeightElement::SEMI_BOLD->value,
                WeightElement::BOLD->value,
                WeightElement::EXTRA_BOLD->value,
                WeightElement::BLACK->value,
            ],
            self::CORMORANT_GARAMOND => [
                WeightElement::LIGHT->value,
                WeightElement::REGULAR->value,
                WeightElement::MEDIUM->value,
                WeightElement::SEMI_BOLD->value,
                WeightElement::BOLD->value,
            ],
            self::RUBIK => [
                WeightElement::LIGHT->value,
                WeightElement::REGULAR->value,
                WeightElement::MEDIUM->value,
                WeightElement::SEMI_BOLD->value,
                WeightElement::BOLD->value,
            ],
        };
    }


    public function getCssFontFamily(): string
    {
        return "'{$this->value}', sans-serif";
    }

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
