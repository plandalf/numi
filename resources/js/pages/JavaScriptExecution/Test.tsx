import React, { useState } from 'react';
import { Head } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Play, Copy, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

interface Example {
    title: string;
    description: string;
    code: string;
}

interface ExecutionResult {
    success: boolean;
    result?: unknown;
    error?: {
        message: string;
        stack?: string;
        name?: string;
    };
    logs?: string[];
    executionTime?: number;
}

interface PageProps {
    environmentInfo?: {
        executor_path: string;
        timeout_seconds: number;
        ready: boolean;
        node_modules_exists: boolean;
        security_features: {
            worker_thread_isolation: boolean;
            pattern_detection: boolean;
            resource_limits: boolean;
            domain_allowlisting: boolean;
            memory_limit_mb: number;
            execution_timeout_seconds: number;
            network_timeout_seconds: number;
        };
    };
    allowedDomains?: string[];
    availableGlobals?: {
        [category: string]: string[];
    };
}

const EXAMPLES: Example[] = [
    {
        title: 'Basic Fetch Example',
        description: 'Make an HTTP request and process the response',
        code: `// Fetch example with JSONPlaceholder API
const response = await safeFetch('https://jsonplaceholder.typicode.com/posts/1');
const data = await response.json();

return {
    message: 'Successfully fetched post',  
    data: data,
    status: response.status
};`
    },
    {
        title: 'Stripe Customer Creation',
        description: 'Create a Stripe customer using the SDK',
        code: `// You need to pass your Stripe secret key in the context
const stripeApiKey = context.stripeApiKey || 'sk_test_...';
const stripe = createStripe(stripeApiKey);

try {
    const customer = await stripe.customers.create({
        email: 'customer@example.com',
        name: 'John Doe',
        description: 'Created via JavaScript function'
    });

    return {
        message: 'Customer created successfully',
        customerId: customer.id,
        email: customer.email
    };
} catch (error) {
    return {
        error: 'Failed to create customer: ' + error.message
    };
}`
    },
    {
        title: 'JSON Processing',
        description: 'Process and transform JSON data',
        code: `// Example of JSON processing
const sampleData = {
    users: [
        { name: 'Alice', age: 25, role: 'admin' },
        { name: 'Bob', age: 30, role: 'user' },
        { name: 'Charlie', age: 35, role: 'user' }
    ]
};

// Process the data
const processedData = sampleData.users
    .filter(user => user.age > 26)
    .map(user => ({
        ...user,
        isAdult: user.age >= 18,
        displayName: \`\${user.name} (\${user.role})\`
    }));

return {
    message: 'Data processed successfully',
    originalCount: sampleData.users.length,
    filteredCount: processedData.length,
    processed: processedData,
    prettyJson: JSON_UTILS.pretty(processedData)
};`
    },
    {
        title: 'Context Data Usage',
        description: 'Use context data passed from Laravel',
        code: `// Access context data passed from Laravel
const { userId, organizationId, customData } = context;

// Simulate some processing
const result = {
    message: 'Context data processed',
    receivedContext: {
        userId: userId || 'not provided',
        organizationId: organizationId || 'not provided',
        customData: customData || 'not provided'
    },
    timestamp: new Date().toISOString(),
    randomId: Math.random().toString(36).substr(2, 9)
};

return result;`
    },
    {
        title: 'Error Handling Example',
        description: 'Demonstrate proper error handling',
        code: `try {
    // This will intentionally cause an error
    const invalidJson = "{ invalid: json }";
    const parsed = JSON.parse(invalidJson);
    
    return { message: 'This should not execute' };
} catch (error) {
    // Handle the error gracefully
    return {
        message: 'Handled error successfully',
        errorType: error.name,
        errorMessage: error.message,
        recoveryAction: 'Used default values instead'
    };
}`
    }
];

export default function Test({ environmentInfo, allowedDomains, availableGlobals }: PageProps) {
    const [code, setCode] = useState(EXAMPLES[0]?.code || '');
    const [context, setContext] = useState('{\n  "userId": 123,\n  "organizationId": 456,\n  "customData": "Hello World"\n}');
    const [result, setResult] = useState<ExecutionResult | null>(null);
    const [isExecuting, setIsExecuting] = useState(false);
    const [selectedExample, setSelectedExample] = useState(0);

    const executeCode = async () => {
        setIsExecuting(true);
        setResult(null);

        try {
            let parsedContext = {};
            try {
                parsedContext = JSON.parse(context);
            } catch {
                toast.error('Invalid JSON in context');
                setIsExecuting(false);
                return;
            }

            const response = await axios.post('/js-execute', {
                code,
                context: parsedContext
            });

            setResult(response.data);
            
            if (response.data.success) {
                toast.success('Code executed successfully!');
            } else {
                toast.error('Code execution failed');
            }
        } catch (error: unknown) {
            const errorData = (error as { response?: { data?: ExecutionResult } })?.response?.data || { 
                success: false, 
                error: { message: 'Network error occurred' } 
            };
            setResult(errorData);
            toast.error('Execution failed');
        } finally {
            setIsExecuting(false);
        }
    };

    const loadExample = (index: number) => {
        setSelectedExample(index);
        setCode(EXAMPLES[index].code);
        setResult(null);
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success('Copied to clipboard!');
    };

    return (
        <>
            <Head title="JavaScript Execution Test" />
            
            <div className="container mx-auto py-8 px-4 max-w-7xl">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold mb-2">JavaScript Execution Environment</h1>
                    <p className="text-muted-foreground">
                        Test your JavaScript functions in a secure, isolated environment with access to fetch, JSON utilities, and Stripe SDK.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Examples Sidebar */}
                    <div className="lg:col-span-1">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Examples</CardTitle>
                                <CardDescription>
                                    Click on any example to load it into the editor
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {EXAMPLES.map((example, index) => (
                                    <div
                                        key={index}
                                        className={`p-3 rounded-lg border cursor-pointer transition-colors hover:bg-accent ${
                                            selectedExample === index ? 'bg-accent border-primary' : ''
                                        }`}
                                        onClick={() => loadExample(index)}
                                    >
                                        <h4 className="font-medium text-sm mb-1">{example.title}</h4>
                                        <p className="text-xs text-muted-foreground">{example.description}</p>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>

                        {/* Context Data */}
                        <Card className="mt-6">
                            <CardHeader>
                                <CardTitle className="text-lg">Context Data</CardTitle>
                                <CardDescription>
                                    JSON data passed to your function as `context`
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Textarea
                                    value={context}
                                    onChange={(e) => setContext(e.target.value)}
                                    placeholder="Enter JSON context data..."
                                    className="min-h-32 font-mono text-sm"
                                />
                            </CardContent>
                        </Card>
                    </div>

                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Code Editor */}
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle className="text-lg">JavaScript Code</CardTitle>
                                    <CardDescription>
                                        Write your JavaScript function here. Use `return` to output results.
                                    </CardDescription>
                                </div>
                                <Button
                                    onClick={executeCode}
                                    disabled={isExecuting}
                                    className="gap-2"
                                >
                                    {isExecuting ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <Play className="h-4 w-4" />
                                    )}
                                    {isExecuting ? 'Executing...' : 'Execute'}
                                </Button>
                            </CardHeader>
                            <CardContent>
                                <Textarea
                                    value={code}
                                    onChange={(e) => setCode(e.target.value)}
                                    placeholder="Enter your JavaScript code here..."
                                    className="min-h-80 font-mono text-sm"
                                />
                                
                                {/* Available Globals */}
                                <div className="mt-4">
                                    <h4 className="text-sm font-medium mb-2">Available Globals:</h4>
                                    <div className="flex flex-wrap gap-1">
                                        <Badge variant="secondary">fetch / safeFetch</Badge>
                                        <Badge variant="secondary">createStripe()</Badge>
                                        <Badge variant="secondary">JSON_UTILS</Badge>
                                        <Badge variant="secondary">context</Badge>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Results */}
                        {result && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        {result.success ? (
                                            <CheckCircle className="h-5 w-5 text-green-500" />
                                        ) : (
                                            <AlertCircle className="h-5 w-5 text-red-500" />
                                        )}
                                        Execution Result
                                        {result.executionTime !== undefined && (
                                            <Badge variant="secondary" className="ml-2">
                                                {result.executionTime}ms
                                            </Badge>
                                        )}
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => copyToClipboard(JSON.stringify(result, null, 2))}
                                            className="ml-auto"
                                        >
                                            <Copy className="h-4 w-4" />
                                        </Button>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <Tabs defaultValue={result.success ? "result" : "error"} className="w-full">
                                        <TabsList>
                                            {result.success && <TabsTrigger value="result">Result</TabsTrigger>}
                                            {result.error && <TabsTrigger value="error">Error</TabsTrigger>}
                                            <TabsTrigger value="raw">Raw Output</TabsTrigger>
                                        </TabsList>
                                        
                                        {result.success && (
                                            <TabsContent value="result" className="mt-4">
                                                <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
                                                    {JSON.stringify(result.result, null, 2)}
                                                </pre>
                                            </TabsContent>
                                        )}
                                        
                                        {result.error && (
                                            <TabsContent value="error" className="mt-4">
                                                <Alert variant="destructive">
                                                    <AlertCircle className="h-4 w-4" />
                                                    <AlertDescription>
                                                        <strong>{result.error.message}</strong>
                                                        {result.error.stack && (
                                                            <pre className="mt-2 text-xs whitespace-pre-wrap">
                                                                {result.error.stack}
                                                            </pre>
                                                        )}
                                                    </AlertDescription>
                                                </Alert>
                                            </TabsContent>
                                        )}
                                        
                                        <TabsContent value="raw" className="mt-4">
                                            <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
                                                {JSON.stringify(result, null, 2)}
                                            </pre>
                                        </TabsContent>
                                    </Tabs>
                                </CardContent>
                            </Card>
                        )}

                        {/* Environment Info */}
                        {environmentInfo && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">Environment Information</CardTitle>
                                    <CardDescription>
                                        Security features and execution limits
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <strong>Status:</strong> {environmentInfo.ready ? '✅ Ready' : '❌ Not Ready'}
                                        </div>
                                        <div>
                                            <strong>Memory Limit:</strong> {environmentInfo.security_features.memory_limit_mb}MB
                                        </div>
                                        <div>
                                            <strong>Execution Timeout:</strong> {environmentInfo.security_features.execution_timeout_seconds}s
                                        </div>
                                        <div>
                                            <strong>Network Timeout:</strong> {environmentInfo.security_features.network_timeout_seconds}s
                                        </div>
                                    </div>
                                    
                                    {allowedDomains && (
                                        <div>
                                            <strong className="text-sm">Allowed Domains:</strong>
                                            <div className="flex flex-wrap gap-1 mt-1">
                                                {allowedDomains.map((domain) => (
                                                    <Badge key={domain} variant="outline" className="text-xs">
                                                        {domain}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {availableGlobals && (
                                        <div>
                                            <strong className="text-sm">Available APIs:</strong>
                                            <div className="mt-1 space-y-1">
                                                {Object.entries(availableGlobals).map(([category, globals]) => (
                                                    <div key={category} className="text-xs">
                                                        <span className="font-medium capitalize">{category}:</span>{' '}
                                                        {globals.join(', ')}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        )}

                        {/* Security Notice */}
                        <Alert>
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>
                                <strong>Security Notice:</strong> Your code runs in an isolated environment with limited access. 
                                Forbidden operations include file system access, system calls, and dangerous functions.
                            </AlertDescription>
                        </Alert>
                    </div>
                </div>
            </div>
        </>
    );
} 