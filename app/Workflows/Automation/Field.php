<?php

namespace App\Workflows\Automation;

class Field
{
    protected string $key;
    protected string $label;
    protected string $type = 'string';
    protected bool $required = false;
    protected ?string $help = null;
    protected bool $dynamic = false;
    protected bool $multiple = false;
    protected ?string $dynamicSource = null;
    protected mixed $default = null;
    protected array $options = [];
    protected ?string $description = null;
    protected ?string $resource = null;

    public static function string(string $key, string $label, string $description = ''): self
    {
        $field = new self();
        $field->key = $key;
        $field->label = $label;
        $field->type = 'string';
        $field->description = $description;
        return $field;
    }

    public static function text(string $key, string $label, string $description = ''): self
    {
        $field = new self();
        $field->key = $key;
        $field->label = $label;
        $field->type = 'text';
        $field->description = $description;
        return $field;
    }

    public static function email(string $key, string $label, string $description = ''): self
    {
        $field = new self();
        $field->key = $key;
        $field->label = $label;
        $field->type = 'email';
        $field->description = $description;
        return $field;
    }

    public static function number(string $key, string $label, string $description = ''): self
    {
        $field = new self();
        $field->key = $key;
        $field->label = $label;
        $field->type = 'number';
        $field->description = $description;
        return $field;
    }

    public static function select(string $key, string $label, string $description = '', array $options = []): self
    {
        $field = new self();
        $field->key = $key;
        $field->label = $label;
        $field->type = 'select';
        $field->description = $description;
        $field->options = $options;
        return $field;
    }

    public static function boolean(string $key, string $label, string $description = ''): self
    {
        $field = new self();
        $field->key = $key;
        $field->label = $label;
        $field->type = 'boolean';
        $field->description = $description;
        return $field;
    }

    public static function resource(string $key, string $label, string $resource, string $description = '', ): self
    {
        $field = new self();
        $field->key = $key;
        $field->label = $label;
        $field->type = 'resource';
        $field->description = $description;
        $field->resource = $resource;
        return $field;
    }

    public static function json(string $key, string $label, string $description = ''): self
    {
        $field = new self();
        $field->key = $key;
        $field->label = $label;
        $field->type = 'json';
        $field->description = $description;
        return $field;
    }

    public static function map(string $key, string $label, string $description = ''): self
    {
        $field = new self();
        $field->key = $key;
        $field->label = $label;
        $field->type = 'map';
        $field->description = $description;
        return $field;
    }

    public function dynamic(?string $source): self
    {
        $this->dynamic = true;
        $this->dynamicSource = $source;
        return $this;
    }

    public function required(): self
    {
        $this->required = true;
        return $this;
    }

    public function optional(): self
    {
        $this->required = false;
        return $this;
    }

    public function help(string $text): self
    {
        $this->help = $text;
        return $this;
    }

    public function default(mixed $value): self
    {
        $this->default = $value;
        return $this;
    }

    public function options(array $options): self
    {
        $this->options = $options;
        return $this;
    }

    public function getKey(): string
    {
        return $this->key;
    }

    public function toArray(): array
    {
        $field = [
            'key' => $this->key,
            'label' => $this->label,
            'type' => $this->type,
            'required' => $this->required,
            'description' => $this->description ?? '',
        ];

        if ($this->help) {
            $field['help'] = $this->help;
        }

        if ($this->dynamic) {
            $field['dynamic'] = true;
            if ($this->dynamicSource) {
                $field['dynamicSource'] = $this->dynamicSource;
            }
        }

        if ($this->default !== null) {
            $field['default'] = $this->default;
        }

        if (!empty($this->options)) {
            $field['options'] = $this->options;
        }

        if ($this->type === 'resource' && $this->resource) {
            $field['resource'] = $this->resource;
        }

        return $field;
    }

    public function multiple(): self
    {
        $this->multiple = true;

        return $this;
    }
}
