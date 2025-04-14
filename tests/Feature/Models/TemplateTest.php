<?php

namespace Tests\Feature\Models;

use App\Models\Organization;
use App\Models\Template;
use App\Models\Theme;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TemplateTest extends TestCase
{
    use RefreshDatabase;

    /** @test */
    public function it_can_create_a_template()
    {
        $template = Template::factory()->create();

        $this->assertDatabaseHas('templates', [
            'id' => $template->id,
            'name' => $template->name,
            'description' => $template->description,
            'category' => $template->category,
            'theme_id' => $template->theme_id,
            'organization_id' => $template->organization_id,
        ]);
    }

    /** @test */
    public function it_can_update_template_description()
    {
        $template = Template::factory()->create();
        $newDescription = 'Updated template description for testing';

        $template->description = $newDescription;
        $template->save();

        $this->assertEquals($newDescription, $template->fresh()->description);
    }

    /** @test */
    public function it_casts_view_as_json()
    {
        $template = Template::factory()->create();
        
        $this->assertIsArray($template->view);
        $this->assertArrayHasKey('id', $template->view);
        $this->assertArrayHasKey('pages', $template->view);
    }

    /** @test */
    public function it_casts_preview_images_as_array()
    {
        $template = Template::factory()->create();
        
        $this->assertIsArray($template->preview_images);
        $this->assertCount(2, $template->preview_images);
    }

    /** @test */
    public function it_belongs_to_a_theme()
    {
        $theme = Theme::factory()->create();
        $template = Template::factory()->create(['theme_id' => $theme->id]);

        $this->assertInstanceOf(Theme::class, $template->theme);
        $this->assertEquals($theme->id, $template->theme->id);
    }

    /** @test */
    public function it_belongs_to_an_organization()
    {
        $organization = Organization::factory()->create();
        $template = Template::factory()->create(['organization_id' => $organization->id]);

        $this->assertInstanceOf(Organization::class, $template->organization);
        $this->assertEquals($organization->id, $template->organization->id);
    }

    /** @test */
    public function it_can_be_soft_deleted()
    {
        $template = Template::factory()->create();
        
        $template->delete();
        
        $this->assertSoftDeleted('templates', [
            'id' => $template->id,
        ]);
    }

    /** @test */
    public function it_can_scope_global_templates()
    {
        // Create a global template (no organization)
        $globalTemplate = Template::factory()->create(['organization_id' => null]);
        
        // Create an organization-specific template
        $organization = Organization::factory()->create();
        Template::factory()->create(['organization_id' => $organization->id]);
        
        // Get global templates
        $globalTemplates = Template::global()->get();
        
        // Assert only the global template is returned
        $this->assertCount(1, $globalTemplates);
        $this->assertEquals($globalTemplate->id, $globalTemplates->first()->id);
    }
} 