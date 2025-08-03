<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Available Currencies
    |--------------------------------------------------------------------------
    |
    | The currencies that this application supports for pricing and payments.
    | These should match your payment processor's supported currencies.
    |
    */
    'available' => [
        'USD' => 'US Dollar',
        'EUR' => 'Euro',
        'GBP' => 'British Pound',
        'CAD' => 'Canadian Dollar',
        'AUD' => 'Australian Dollar',
    ],

    /*
    |--------------------------------------------------------------------------
    | Country to Currency Mapping
    |--------------------------------------------------------------------------
    |
    | Maps ISO 3166-1 alpha-2 country codes to their primary currency.
    | Only currencies listed in 'available' above will be used.
    | Countries with unsupported currencies will fall back to organization default.
    |
    */
    'country_mapping' => [
        // North America
        'US' => 'USD', // United States
        'CA' => 'CAD', // Canada
        
        // Central America & Caribbean (fallback to USD)
        'MX' => 'USD', // Mexico
        'GT' => 'USD', // Guatemala
        'BZ' => 'USD', // Belize
        'SV' => 'USD', // El Salvador
        'HN' => 'USD', // Honduras
        'NI' => 'USD', // Nicaragua
        'CR' => 'USD', // Costa Rica
        'PA' => 'USD', // Panama
        'CU' => 'USD', // Cuba
        'JM' => 'USD', // Jamaica
        'HT' => 'USD', // Haiti
        'DO' => 'USD', // Dominican Republic
        'PR' => 'USD', // Puerto Rico
        'TT' => 'USD', // Trinidad and Tobago
        'BB' => 'USD', // Barbados
        'BS' => 'USD', // Bahamas
        
        // South America (fallback to USD)
        'BR' => 'USD', // Brazil
        'AR' => 'USD', // Argentina
        'CL' => 'USD', // Chile
        'CO' => 'USD', // Colombia
        'PE' => 'USD', // Peru
        'VE' => 'USD', // Venezuela
        'EC' => 'USD', // Ecuador
        'BO' => 'USD', // Bolivia
        'PY' => 'USD', // Paraguay
        'UY' => 'USD', // Uruguay
        'GY' => 'USD', // Guyana
        'SR' => 'USD', // Suriname
        'GF' => 'EUR', // French Guiana
        
        // Europe - Eurozone
        'AT' => 'EUR', // Austria
        'BE' => 'EUR', // Belgium
        'CY' => 'EUR', // Cyprus
        'EE' => 'EUR', // Estonia
        'FI' => 'EUR', // Finland
        'FR' => 'EUR', // France
        'DE' => 'EUR', // Germany
        'GR' => 'EUR', // Greece
        'IE' => 'EUR', // Ireland
        'IT' => 'EUR', // Italy
        'LV' => 'EUR', // Latvia
        'LT' => 'EUR', // Lithuania
        'LU' => 'EUR', // Luxembourg
        'MT' => 'EUR', // Malta
        'NL' => 'EUR', // Netherlands
        'PT' => 'EUR', // Portugal
        'SK' => 'EUR', // Slovakia
        'SI' => 'EUR', // Slovenia
        'ES' => 'EUR', // Spain
        'AD' => 'EUR', // Andorra
        'MC' => 'EUR', // Monaco
        'SM' => 'EUR', // San Marino
        'VA' => 'EUR', // Vatican City
        'ME' => 'EUR', // Montenegro
        'XK' => 'EUR', // Kosovo
        
        // Europe - Non-Eurozone
        'GB' => 'GBP', // United Kingdom
        'CH' => 'EUR', // Switzerland (fallback to EUR)
        'NO' => 'EUR', // Norway (fallback to EUR)
        'SE' => 'EUR', // Sweden (fallback to EUR)
        'DK' => 'EUR', // Denmark (fallback to EUR)
        'IS' => 'EUR', // Iceland (fallback to EUR)
        'PL' => 'EUR', // Poland (fallback to EUR)
        'CZ' => 'EUR', // Czech Republic (fallback to EUR)
        'HU' => 'EUR', // Hungary (fallback to EUR)
        'RO' => 'EUR', // Romania (fallback to EUR)
        'BG' => 'EUR', // Bulgaria (fallback to EUR)
        'HR' => 'EUR', // Croatia
        'RS' => 'EUR', // Serbia (fallback to EUR)
        'BA' => 'EUR', // Bosnia and Herzegovina (fallback to EUR)
        'MK' => 'EUR', // North Macedonia (fallback to EUR)
        'AL' => 'EUR', // Albania (fallback to EUR)
        'MD' => 'EUR', // Moldova (fallback to EUR)
        'UA' => 'EUR', // Ukraine (fallback to EUR)
        'BY' => 'EUR', // Belarus (fallback to EUR)
        'RU' => 'EUR', // Russia (fallback to EUR)
        
        // Asia Pacific
        'AU' => 'AUD', // Australia
        'NZ' => 'AUD', // New Zealand (fallback to AUD)
        'FJ' => 'AUD', // Fiji (fallback to AUD)
        'PG' => 'AUD', // Papua New Guinea (fallback to AUD)
        'SB' => 'AUD', // Solomon Islands (fallback to AUD)
        'VU' => 'AUD', // Vanuatu (fallback to AUD)
        'NC' => 'AUD', // New Caledonia (fallback to AUD)
        'PF' => 'AUD', // French Polynesia (fallback to AUD)
        
        // Asia (fallback to USD)
        'JP' => 'USD', // Japan
        'CN' => 'USD', // China
        'KR' => 'USD', // South Korea
        'IN' => 'USD', // India
        'ID' => 'USD', // Indonesia
        'TH' => 'USD', // Thailand
        'VN' => 'USD', // Vietnam
        'MY' => 'USD', // Malaysia
        'SG' => 'USD', // Singapore
        'PH' => 'USD', // Philippines
        'TW' => 'USD', // Taiwan
        'HK' => 'USD', // Hong Kong
        'MO' => 'USD', // Macau
        'KH' => 'USD', // Cambodia
        'LA' => 'USD', // Laos
        'MM' => 'USD', // Myanmar
        'BD' => 'USD', // Bangladesh
        'LK' => 'USD', // Sri Lanka
        'NP' => 'USD', // Nepal
        'BT' => 'USD', // Bhutan
        'MV' => 'USD', // Maldives
        'PK' => 'USD', // Pakistan
        'AF' => 'USD', // Afghanistan
        'IR' => 'USD', // Iran
        'IQ' => 'USD', // Iraq
        'SA' => 'USD', // Saudi Arabia
        'AE' => 'USD', // United Arab Emirates
        'QA' => 'USD', // Qatar
        'KW' => 'USD', // Kuwait
        'BH' => 'USD', // Bahrain
        'OM' => 'USD', // Oman
        'YE' => 'USD', // Yemen
        'JO' => 'USD', // Jordan
        'LB' => 'USD', // Lebanon
        'SY' => 'USD', // Syria
        'IL' => 'USD', // Israel
        'PS' => 'USD', // Palestine
        'TR' => 'EUR', // Turkey (fallback to EUR)
        'GE' => 'EUR', // Georgia (fallback to EUR)
        'AM' => 'EUR', // Armenia (fallback to EUR)
        'AZ' => 'EUR', // Azerbaijan (fallback to EUR)
        'KZ' => 'USD', // Kazakhstan (fallback to USD)
        'KG' => 'USD', // Kyrgyzstan (fallback to USD)
        'TJ' => 'USD', // Tajikistan (fallback to USD)
        'TM' => 'USD', // Turkmenistan (fallback to USD)
        'UZ' => 'USD', // Uzbekistan (fallback to USD)
        'MN' => 'USD', // Mongolia (fallback to USD)
        
        // Africa (fallback to USD/EUR based on region)
        'ZA' => 'USD', // South Africa
        'NG' => 'USD', // Nigeria
        'EG' => 'USD', // Egypt
        'KE' => 'USD', // Kenya
        'GH' => 'USD', // Ghana
        'ET' => 'USD', // Ethiopia
        'TZ' => 'USD', // Tanzania
        'UG' => 'USD', // Uganda
        'DZ' => 'EUR', // Algeria
        'MA' => 'EUR', // Morocco
        'TN' => 'EUR', // Tunisia
        'LY' => 'EUR', // Libya
        'SD' => 'USD', // Sudan
        'SS' => 'USD', // South Sudan
        'CM' => 'EUR', // Cameroon
        'CI' => 'EUR', // Côte d'Ivoire
        'BF' => 'EUR', // Burkina Faso
        'ML' => 'EUR', // Mali
        'NE' => 'EUR', // Niger
        'TD' => 'EUR', // Chad
        'SN' => 'EUR', // Senegal
        'GN' => 'EUR', // Guinea
        'SL' => 'USD', // Sierra Leone
        'LR' => 'USD', // Liberia
        'GW' => 'EUR', // Guinea-Bissau
        'GM' => 'USD', // Gambia
        'MR' => 'EUR', // Mauritania
        'CV' => 'EUR', // Cape Verde
        'ST' => 'EUR', // São Tomé and Príncipe
        'GQ' => 'EUR', // Equatorial Guinea
        'GA' => 'EUR', // Gabon
        'CG' => 'EUR', // Republic of the Congo
        'CD' => 'USD', // Democratic Republic of the Congo
        'CF' => 'EUR', // Central African Republic
        'AO' => 'USD', // Angola
        'ZM' => 'USD', // Zambia
        'ZW' => 'USD', // Zimbabwe
        'BW' => 'USD', // Botswana
        'NA' => 'USD', // Namibia
        'SZ' => 'USD', // Eswatini
        'LS' => 'USD', // Lesotho
        'MW' => 'USD', // Malawi
        'MZ' => 'USD', // Mozambique
        'MG' => 'USD', // Madagascar
        'MU' => 'USD', // Mauritius
        'SC' => 'EUR', // Seychelles
        'KM' => 'EUR', // Comoros
        'YT' => 'EUR', // Mayotte
        'RE' => 'EUR', // Réunion
        'RW' => 'USD', // Rwanda
        'BI' => 'USD', // Burundi
        'DJ' => 'USD', // Djibouti
        'SO' => 'USD', // Somalia
        'ER' => 'USD', // Eritrea
        
        // Other territories and dependencies
        'GL' => 'EUR', // Greenland (Denmark)
        'FO' => 'EUR', // Faroe Islands (Denmark)
        'IM' => 'GBP', // Isle of Man
        'JE' => 'GBP', // Jersey
        'GG' => 'GBP', // Guernsey
        'GI' => 'GBP', // Gibraltar
        'FK' => 'GBP', // Falkland Islands
        'SH' => 'GBP', // Saint Helena
        'GS' => 'GBP', // South Georgia
        'IO' => 'USD', // British Indian Ocean Territory
        'VG' => 'USD', // British Virgin Islands
        'AI' => 'USD', // Anguilla
        'MS' => 'USD', // Montserrat
        'KY' => 'USD', // Cayman Islands
        'TC' => 'USD', // Turks and Caicos
        'BM' => 'USD', // Bermuda
        'VI' => 'USD', // US Virgin Islands
        'GU' => 'USD', // Guam
        'AS' => 'USD', // American Samoa
        'MP' => 'USD', // Northern Mariana Islands
        'UM' => 'USD', // US Minor Outlying Islands
        'WS' => 'AUD', // Samoa (fallback to AUD)
        'TO' => 'AUD', // Tonga (fallback to AUD)
        'TV' => 'AUD', // Tuvalu (fallback to AUD)
        'KI' => 'AUD', // Kiribati (fallback to AUD)
        'NR' => 'AUD', // Nauru (fallback to AUD)
        'MH' => 'USD', // Marshall Islands
        'PW' => 'USD', // Palau
        'FM' => 'USD', // Federated States of Micronesia
        'CK' => 'AUD', // Cook Islands (fallback to AUD)
        'NU' => 'AUD', // Niue (fallback to AUD)
        'TK' => 'AUD', // Tokelau (fallback to AUD)
        'WF' => 'EUR', // Wallis and Futuna
        'BL' => 'EUR', // Saint Barthélemy
        'MF' => 'EUR', // Saint Martin
        'PM' => 'EUR', // Saint Pierre and Miquelon
        'AX' => 'EUR', // Åland Islands
        'SJ' => 'EUR', // Svalbard and Jan Mayen
        'BV' => 'EUR', // Bouvet Island
        'HM' => 'AUD', // Heard Island and McDonald Islands
        'AQ' => 'USD', // Antarctica
        'TF' => 'EUR', // French Southern Territories
        'CC' => 'AUD', // Cocos Islands
        'CX' => 'AUD', // Christmas Island
        'NF' => 'AUD', // Norfolk Island
    ],

    /*
    |--------------------------------------------------------------------------
    | Default Currency
    |--------------------------------------------------------------------------
    |
    | The default currency to use when no regional mapping is available
    | or when regional currency detection is disabled.
    |
    */
    'default' => 'USD',
];