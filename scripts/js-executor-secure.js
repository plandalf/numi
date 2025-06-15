#!/usr/bin/env node

import { Worker, isMainThread, parentPort, workerData } from 'worker_threads';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);

// Security patterns to detect dangerous code
const DANGEROUS_PATTERNS = [
    /require\s*\(/,
    /import\s+.*\s+from/,
    /process\./,
    /global\./,
    /Buffer\./,
    /eval\s*\(/,
    /Function\s*\(/,
    /setTimeout\s*\(/,
    /setInterval\s*\(/,
    /setImmediate\s*\(/,
    /__dirname/,
    /__filename/,
    /fs\./,
    /child_process/,
    /cluster/,
    /crypto\.randomBytes/,
    /os\./,
    /path\./,
    /url\./,
    /querystring\./,
    /stream\./,
    /events\./,
    /util\./,
    /assert\./,
    /vm\./,
    /repl\./,
    /readline\./,
    /tty\./,
    /net\./,
    /http\./,
    /https\./,
    /dgram\./,
    /dns\./,
    /tls\./,
    /zlib\./,
    /worker_threads/,
    /constructor\s*\.\s*constructor/,
    /prototype\s*\.\s*constructor/,
    /\[\s*['"]constructor['"]\s*\]/,
    /this\s*\.\s*constructor/,
];

// Allowed domains for fetch operations
const ALLOWED_DOMAINS = [
    'jsonplaceholder.typicode.com',
    'api.stripe.com',
    'httpbin.org',
    'reqres.in',
    'postman-echo.com'
];

// Main process - handles input and spawns worker
if (isMainThread) {
    // Read input from stdin
    let inputData = '';
    
    process.stdin.setEncoding('utf8');
    process.stdin.on('readable', () => {
        let chunk;
        while (null !== (chunk = process.stdin.read())) {
            inputData += chunk;
        }
    });
    
    process.stdin.on('end', async () => {
        try {
            const input = JSON.parse(inputData);
            
            // Validate input
            if (!input.code || typeof input.code !== 'string') {
                throw new Error('Invalid input: code is required and must be a string');
            }

            if (input.code.length > 50000) {
                throw new Error('Code too large (max 50KB)');
            }

            // Security validation - check for dangerous patterns
            for (const pattern of DANGEROUS_PATTERNS) {
                if (pattern.test(input.code)) {
                    throw new Error(`Security violation: Dangerous pattern detected - ${pattern.source}`);
                }
            }

            // Create worker with resource limits
            const worker = new Worker(__filename, {
                workerData: input,
                resourceLimits: {
                    maxOldGenerationSizeMb: 64,
                    maxYoungGenerationSizeMb: 32,
                    codeRangeSizeMb: 16
                }
            });

            let timeoutId;
            let resolved = false;

            // Set execution timeout
            const timeout = new Promise((_, reject) => {
                timeoutId = setTimeout(() => {
                    if (!resolved) {
                        worker.terminate();
                        reject(new Error('Execution timeout (30 seconds)'));
                    }
                }, 30000);
            });

            // Wait for worker result
            const workerResult = new Promise((resolve, reject) => {
                worker.on('message', (result) => {
                    resolved = true;
                    clearTimeout(timeoutId);
                    resolve(result);
                });

                worker.on('error', (error) => {
                    resolved = true;
                    clearTimeout(timeoutId);
                    reject(error);
                });

                worker.on('exit', (code) => {
                    if (!resolved) {
                        resolved = true;
                        clearTimeout(timeoutId);
                        if (code !== 0) {
                            reject(new Error(`Worker stopped with exit code ${code}`));
                        }
                    }
                });
            });

            // Race between timeout and execution
            const result = await Promise.race([timeout, workerResult]);
            
            console.log(JSON.stringify(result));
            process.exit(0);

        } catch (error) {
            console.log(JSON.stringify({
                success: false,
                error: {
                    message: error.message,
                    stack: error.stack
                }
            }));
            process.exit(1);
        }
    });

} else {
    // Worker thread - executes the user code
    const { code, context = {} } = workerData;
    
    // Import dependencies at the top level before execution
    const { default: fetch } = await import('node-fetch');
    const Stripe = (await import('stripe')).default;
    
    try {
        // Create safe fetch function with domain restrictions
        const safeFetch = async (url, options = {}) => {
            try {
                const urlObj = new URL(url);
                if (!ALLOWED_DOMAINS.includes(urlObj.hostname)) {
                    throw new Error(`Domain not allowed: ${urlObj.hostname}. Allowed domains: ${ALLOWED_DOMAINS.join(', ')}`);
                }
                
                return await fetch(url, {
                    ...options,
                    timeout: 10000, // 10 second timeout for requests
                });
            } catch (error) {
                throw new Error(`Fetch error: ${error.message}`);
            }
        };

        // Create Stripe function
        const createStripe = (apiKey) => {
            if (!apiKey || typeof apiKey !== 'string') {
                throw new Error('Stripe API key is required');
            }
            return new Stripe(apiKey);
        };

        // JSON utilities
        const JSON_UTILS = {
            pretty: (obj) => JSON.stringify(obj, null, 2),
            minify: (obj) => JSON.stringify(obj),
            parse: (str) => JSON.parse(str),
            stringify: (obj) => JSON.stringify(obj)
        };

        // Limited console for logging
        const logs = [];
        const console = {
            log: (...args) => logs.push(args.map(arg => 
                typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
            ).join(' ')),
            error: (...args) => logs.push('ERROR: ' + args.map(arg => 
                typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
            ).join(' ')),
            warn: (...args) => logs.push('WARN: ' + args.map(arg => 
                typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
            ).join(' ')),
            info: (...args) => logs.push('INFO: ' + args.map(arg => 
                typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
            ).join(' '))
        };

        // Create execution context with limited globals
        const executionContext = {
            fetch: safeFetch,
            safeFetch,
            createStripe,
            JSON_UTILS,
            context,
            console,
            JSON,
            Math,
            Date,
            Array,
            Object,
            String,
            Number,
            Boolean,
            RegExp,
            Error,
            TypeError,
            ReferenceError,
            SyntaxError,
            Promise,
            // Explicitly undefined dangerous globals
            setTimeout: undefined,
            setInterval: undefined,
            setImmediate: undefined,
            clearTimeout: undefined,
            clearInterval: undefined,
            clearImmediate: undefined,
            process: undefined,
            global: undefined,
            globalThis: undefined,
            Buffer: undefined,
            require: undefined,
            module: undefined,
            exports: undefined,
            __dirname: undefined,
            __filename: undefined
        };

        // Execute user code in isolated context using Function constructor
        // This creates a completely new scope with only the provided globals
        const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;
        const userFunction = new AsyncFunction(
            ...Object.keys(executionContext),
            `
            "use strict";
            ${code}
            `
        );

        // Execute with timeout and context
        const startTime = Date.now();
        const result = await userFunction(...Object.values(executionContext));
        const executionTime = Date.now() - startTime;

        // Send result back to main thread
        parentPort.postMessage({
            success: true,
            result,
            logs: logs.length > 0 ? logs : undefined,
            executionTime
        });

    } catch (error) {
        // Send error back to main thread
        parentPort.postMessage({
            success: false,
            error: {
                message: error.message,
                stack: error.stack,
                name: error.name
            }
        });
    }
} 