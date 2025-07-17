<?php

namespace App\Console\Commands;

use App\Models\HostedPage;
use App\Models\Organization;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

class GenerateHostedPage extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'store-offers:generate-hosted-pages 
                            {--organization= : The organization ID}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Generate hosted pages for all offers by using the default Organization hosted page';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $organizationId = $this->option('organization');

        // Validate input
        $validator = Validator::make([
            'organizationId' => $organizationId,
        ], [
            'organizationId' => ['nullable', 'string', 'max:255', Rule::exists('organizations', 'id')],
        ], [
            'organizationId.required' => 'The organization ID is required.',
            'organizationId.exists' => 'The organization ID does not exist.',
        ]);

        if ($validator->fails()) {
            foreach ($validator->errors()->all() as $error) {
                $this->error($error);
            }
            return 1;
        }

        try {
            $organizations = $organizationId ? Organization::where('id', $organizationId)->get() : Organization::all();

            foreach ($organizations as $organization) {

                $organizationHostedPage = $organization->hostedPages->first();

                if(!$organizationHostedPage) {
                    $this->error("No hosted page found for organization: {$organization->name}");
                    continue;
                }

                foreach($organization->offers as $offer) {

                    $offerHostedPage = new HostedPage([
                        'organization_id' => $organization->id,
                        'style' => $organizationHostedPage->style,
                        'appearance' => $organizationHostedPage->appearance,
                    ]);

                    $offerHostedPage->save();

                    $offer->hosted_page_id = $offerHostedPage->id;
                    $offer->save();
                }

                $this->info("Generating hosted pages for organization: {$organization->name}");
            }
            return 0;

        } catch (\Exception $e) {
            $this->error('Failed to generate hosted pages for organization: ' . $e->getMessage());
            return 1;
        }
    }
} 
