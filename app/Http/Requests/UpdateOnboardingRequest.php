<?php

namespace App\Http\Requests;

use App\Enums\OnboardingStep;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateOnboardingRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user() && $this->user()->currentOrganization;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $validStepKeys = collect(OnboardingStep::cases())->map(fn($step) => $step->key())->toArray();

        return [
            'steps' => 'sometimes|array',
            'steps.*' => ['required_with:steps', Rule::in($validStepKeys)],
            'completed' => 'sometimes|boolean',
            'step' => ['sometimes', Rule::in($validStepKeys)],
        ];
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'steps.*.in' => 'The selected onboarding step is invalid.',
            'step.in' => 'The selected onboarding step is invalid.',
        ];
    }

    /**
     * Get custom attributes for validator errors.
     */
    public function attributes(): array
    {
        return [
            'steps.*' => 'onboarding step',
            'step' => 'onboarding step',
        ];
    }
}
