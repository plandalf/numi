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
    protected $signature = 'store-offers:generate-hosted-pages';

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
        $organizations = Organization::all();

        foreach ($organizations as $organization) {
            $organizationHostedPage = $organization->hostedPages->first();

            if (!$organizationHostedPage) {
                $this->error("No hosted page found for organization: {$organization->name}");
                continue;
            }

            foreach ($organization->offers as $offer) {
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
    }
} 
