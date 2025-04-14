<?php

namespace App\Http\Controllers\Settings;

use App\Enums\Theme\FontElement;
use App\Enums\Theme\WeightElement;
use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateThemeRequest;
use App\Http\Resources\ThemeResource;
use App\Models\Theme;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ThemeController extends Controller
{
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
    public function store(Request $request)
    {
        $theme = Theme::create([
            'organization_id' => $request->user()->current_organization_id,
        ]);

        return redirect()->route('themes.edit', [
            'theme' => new ThemeResource($theme),
        ]);
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
    public function update(UpdateThemeRequest $request, Theme $theme)
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
