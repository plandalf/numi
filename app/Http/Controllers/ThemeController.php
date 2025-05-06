<?php

namespace App\Http\Controllers;

use App\Enums\Theme\FontElement;
use App\Enums\Theme\WeightElement;
use App\Http\Controllers\Controller;
use App\Http\Requests\CreateUpdateThemeRequest;
use App\Http\Resources\ThemeResource;
use App\Models\Theme;
use App\Services\ThemeService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ThemeController extends Controller
{
    public function __construct(
        protected ThemeService $themeService
    ) {}

    /**
     * Show the themes page
     */
    public function index(Request $request)
    {
        $themes = Theme::where('organization_id', $request->user()->current_organization_id)->get();

        return Inertia::render('settings/themes', [
            'themes' => ThemeResource::collection($themes),
        ]);
    }

    /**
     * Store a new theme
     */
    public function store(CreateUpdateThemeRequest $request)
    {
        $this->themeService->createTheme([
            'organization_id' => $request->user()->current_organization_id,
            ...$request->validated(),
        ]);

        return redirect()->back()->with('success', 'Theme saved successfully');

    }

    /**
     * Show the theme editor for a specific theme.
     */
    public function edit(Theme $theme)
    {
        return Inertia::render('settings/themes/edit', [
            'theme' => new ThemeResource($theme),
            'fonts' => FontElement::values(),
            'weights' => WeightElement::values(),
        ]);
    }

    /**
     * Update the theme.
     */
    public function update(CreateUpdateThemeRequest $request, Theme $theme)
    {
        // Update the theme with the validated data
        $theme->fill($request->validated());
        $theme->save();

        return redirect()->back()->with('success', 'Theme updated successfully');
    }

    /**
     * Delete a theme
     */
    public function destroy(Theme $theme)
    {
        $theme->delete();

        return redirect()->back()->with('success', 'Theme successfully deleted');
    }
}
