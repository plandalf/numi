<?php

namespace App\Workflows;

use Workflow\Activity;

class MyActivity extends Activity
{
    public function execute($arg1)
    {
        logger()->info('MyActivity::execute', ['arg1' => $arg1]);

        return 'cool '.$arg1;
    }
}
