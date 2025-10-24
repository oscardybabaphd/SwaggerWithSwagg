/**
 * SwaggerWithSwagg - Natural Language Processing for API Requests
 * Converts natural language queries to API calls using OpenAI
 */

(function() {
    'use strict';

    // Configuration
    const NLP_CONFIG_KEY = 'swaggerWithSwagg_nlp_config';
    const NLP_HISTORY_KEY = 'swaggerWithSwagg_nlp_history';
    const MAX_HISTORY = 10;

    /**
     * NLP Manager - Handles natural language to API mapping
     */
    window.NLPManager = {
        config: null,
        isConfigured: false,
        searchHistory: [],

        /**
         * Initialize NLP features
         */
        init() {
            this.loadConfig();
            this.loadHistory();
            this.setupUI();
        },

        /**
         * Load saved configuration from localStorage
         */
        loadConfig() {
            try {
                const saved = localStorage.getItem(NLP_CONFIG_KEY);
                if (saved) {
                    this.config = JSON.parse(saved);
                    this.isConfigured = !!this.config.apiKey;
                }
            } catch (e) {
                console.error('Failed to load NLP config:', e);
            }
        },

        /**
         * Save configuration to localStorage
         */
        saveConfig(config) {
            try {
                this.config = config;
                this.isConfigured = !!config.apiKey;
                localStorage.setItem(NLP_CONFIG_KEY, JSON.stringify(config));
            } catch (e) {
                console.error('Failed to save NLP config:', e);
            }
        },

        /**
         * Load search history
         */
        loadHistory() {
            try {
                const saved = localStorage.getItem(NLP_HISTORY_KEY);
                if (saved) {
                    this.searchHistory = JSON.parse(saved);
                }
            } catch (e) {
                console.error('Failed to load NLP history:', e);
            }
        },

        /**
         * Save search to history
         */
        saveToHistory(query, result) {
            this.searchHistory.unshift({
                query,
                endpoint: result.endpoint,
                method: result.method,
                timestamp: Date.now()
            });

            // Keep only last MAX_HISTORY items
            this.searchHistory = this.searchHistory.slice(0, MAX_HISTORY);

            try {
                localStorage.setItem(NLP_HISTORY_KEY, JSON.stringify(this.searchHistory));
            } catch (e) {
                console.error('Failed to save NLP history:', e);
            }
        },

        /**
         * Setup NLP UI elements
         */
        setupUI() {
            // Add NLP search bar to the page
            this.injectSearchBar();
            // Add AI configuration button
            this.injectConfigButton();
        },

        /**
         * Inject NLP search bar into the UI
         */
        injectSearchBar() {
            const searchContainer = document.querySelector('.search-container');
            if (!searchContainer) return;

            const nlpSearchHtml = `
                <div id="nlpSearchContainer" style="margin-bottom: 16px;">
                    <div style="position: relative;">
                        <input 
                            type="text" 
                            id="nlpSearchInput"
                            placeholder="🤖 Ask AI: e.g., 'Get user with ID 123' or 'Create a new customer named John'"
                            style="width: 100%; padding: 12px 45px 12px 40px; background: var(--dark-bg); border: 2px solid var(--border-color); border-radius: 8px; color: var(--text-primary); font-size: 14px; transition: all 0.2s;"
                            onfocus="this.style.borderColor='#4CAF50'"
                            onblur="this.style.borderColor='var(--border-color)'"
                        />
                        <div style="position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: var(--text-secondary); font-size: 18px;">
                            🔍
                        </div>
                        <button 
                            id="nlpSearchBtn"
                            onclick="NLPManager.handleSearch()"
                            style="position: absolute; right: 8px; top: 50%; transform: translateY(-50%); background: linear-gradient(135deg, #4CAF50, #45a049); border: none; color: white; padding: 6px 16px; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 13px; transition: all 0.2s;"
                            onmouseover="this.style.transform='translateY(-50%) scale(1.05)'"
                            onmouseout="this.style.transform='translateY(-50%) scale(1)'"
                        >
                            Ask AI
                        </button>
                    </div>
                    <div id="nlpSuggestions" style="margin-top: 8px; display: none;"></div>
                    <div id="nlpResults" style="margin-top: 12px; display: none;"></div>
                </div>
            `;

            searchContainer.insertAdjacentHTML('afterbegin', nlpSearchHtml);

            // Add enter key handler
            document.getElementById('nlpSearchInput').addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.handleSearch();
                }
            });

            // Add input handler for suggestions
            document.getElementById('nlpSearchInput').addEventListener('input', (e) => {
                this.showSuggestions(e.target.value);
            });
        },

        /**
         * Inject AI configuration button
         */
        injectConfigButton() {
            const header = document.querySelector('.header-actions');
            if (!header) return;

            const configBtnHtml = `
                <button 
                    onclick="NLPManager.showConfigDialog()"
                    title="Configure AI Features"
                    style="background: ${this.isConfigured ? 'linear-gradient(135deg, #4CAF50, #45a049)' : 'var(--dark-bg)'}; border: 1px solid var(--border-color); color: var(--text-primary); padding: 8px 16px; border-radius: 6px; cursor: pointer; font-size: 13px; display: flex; align-items: center; gap: 6px; transition: all 0.2s;"
                    onmouseover="this.style.transform='scale(1.05)'"
                    onmouseout="this.style.transform='scale(1)'"
                >
                    <span style="font-size: 16px;">🤖</span>
                    <span>AI ${this.isConfigured ? 'Enabled' : 'Setup'}</span>
                </button>
            `;

            header.insertAdjacentHTML('beforeend', configBtnHtml);
        },

        /**
         * Show suggestions based on input
         */
        showSuggestions(query) {
            const suggestionsDiv = document.getElementById('nlpSuggestions');
            if (!query.trim()) {
                suggestionsDiv.style.display = 'none';
                return;
            }

            // Show recent history
            const suggestions = this.searchHistory
                .filter(h => h.query.toLowerCase().includes(query.toLowerCase()))
                .slice(0, 3);

            if (suggestions.length === 0) {
                suggestionsDiv.style.display = 'none';
                return;
            }

            const suggestionsHtml = `
                <div style="background: var(--darker-bg); border: 1px solid var(--border-color); border-radius: 6px; padding: 8px;">
                    <div style="color: var(--text-secondary); font-size: 11px; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px;">Recent Searches</div>
                    ${suggestions.map(s => `
                        <div 
                            onclick="NLPManager.selectSuggestion('${s.query.replace(/'/g, "\\'")}')"
                            style="padding: 8px; cursor: pointer; border-radius: 4px; display: flex; align-items: center; gap: 8px; transition: all 0.2s;"
                            onmouseover="this.style.background='var(--hover-bg)'"
                            onmouseout="this.style.background='transparent'"
                        >
                            <span class="detail-method method-${s.method.toLowerCase()}" style="font-size: 10px; padding: 3px 6px;">${s.method}</span>
                            <span style="color: var(--text-primary); font-family: 'Monaco', 'Consolas', monospace; font-size: 12px;">${s.endpoint}</span>
                        </div>
                    `).join('')}
                </div>
            `;

            suggestionsDiv.innerHTML = suggestionsHtml;
            suggestionsDiv.style.display = 'block';
        },

        /**
         * Select a suggestion
         */
        selectSuggestion(query) {
            document.getElementById('nlpSearchInput').value = query;
            document.getElementById('nlpSuggestions').style.display = 'none';
            this.handleSearch();
        },

        /**
         * Handle search button click
         */
        async handleSearch() {
            const input = document.getElementById('nlpSearchInput');
            const query = input.value.trim();

            if (!query) {
                this.showError('Please enter a query');
                return;
            }

            if (!this.isConfigured) {
                this.showConfigDialog();
                return;
            }

            const resultsDiv = document.getElementById('nlpResults');
            resultsDiv.style.display = 'block';
            resultsDiv.innerHTML = `
                <div style="background: var(--darker-bg); border: 1px solid var(--border-color); border-radius: 8px; padding: 20px; text-align: center;">
                    <div class="spinner" style="margin: 0 auto 12px;"></div>
                    <div style="color: var(--text-secondary);">AI is analyzing your request...</div>
                </div>
            `;

            try {
                const result = await this.analyzeQuery(query);
                this.displayResults(result);
                this.saveToHistory(query, result);
            } catch (error) {
                this.showError(error.message);
            }
        },

        /**
         * Analyze query using OpenAI
         */
        async analyzeQuery(query) {
            console.log('🤖 Starting AI analysis for query:', query);
            console.log('🔑 API Key configured:', this.config?.apiKey ? 'Yes (hidden)' : 'No');
            console.log('📦 Model:', this.config?.model || 'gpt-4o-mini');

            const spec = await getSwaggerSpec();
            
            // Build context about available endpoints
            const endpoints = [];
            for (const [path, methods] of Object.entries(spec.paths)) {
                for (const [method, operation] of Object.entries(methods)) {
                    if (['get', 'post', 'put', 'delete', 'patch'].includes(method)) {
                        endpoints.push({
                            method: method.toUpperCase(),
                            path: path,
                            summary: operation.summary || '',
                            description: operation.description || '',
                            operationId: operation.operationId || '',
                            parameters: operation.parameters || []
                        });
                    }
                }
            }

            console.log('📍 Found', endpoints.length, 'endpoints in API spec');

            // Create prompt for OpenAI
            const prompt = this.buildPrompt(query, endpoints);

            console.log('🚀 Calling OpenAI API...');

            // Call OpenAI API
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.config.apiKey}`
                },
                body: JSON.stringify({
                    model: this.config.model || 'gpt-4o-mini',
                    messages: [
                        {
                            role: 'system',
                            content: 'You are an API assistant that maps natural language queries to API endpoints. You must respond ONLY with valid JSON in the exact format specified, no additional text.'
                        },
                        {
                            role: 'user',
                            content: prompt
                        }
                    ],
                    temperature: 0.3,
                    max_tokens: 500
                })
            });

            console.log('📡 OpenAI response status:', response.status, response.statusText);

            if (!response.ok) {
                let errorMessage = 'Failed to analyze query';
                try {
                    const error = await response.json();
                    errorMessage = error.error?.message || errorMessage;
                    console.error('❌ OpenAI API Error:', error);
                } catch (e) {
                    console.error('❌ Failed to parse error response');
                }
                throw new Error(errorMessage);
            }

            const data = await response.json();
            console.log('✅ OpenAI response received:', data);
            console.log('📊 Response has choices:', !!data.choices);
            console.log('📊 Choices length:', data.choices?.length);
            
            if (!data.choices || data.choices.length === 0) {
                console.error('❌ No choices in OpenAI response');
                throw new Error('Invalid OpenAI response: no choices');
            }
            
            const content = data.choices[0].message.content.trim();
            console.log('📝 AI response content:', content);
            console.log('📝 Content length:', content.length);
            
            // Parse the JSON response
            let result;
            try {
                result = JSON.parse(content);
                console.log('✅ Parsed result:', result);
            } catch (e) {
                console.error('❌ Failed to parse AI response:', content);
                throw new Error('AI returned invalid response format');
            }

            console.log('🔎 Checking result structure...', { 
                hasEndpoint: !!result.endpoint, 
                hasMethod: !!result.method,
                endpoint: result.endpoint,
                method: result.method
            });

            if (!result.endpoint || !result.method) {
                console.error('❌ Invalid result structure:', result);
                throw new Error('AI could not map your query to an endpoint');
            }

            console.log('🔍 Validating endpoint exists in spec...');

            // Validate the endpoint exists
            const endpointExists = endpoints.some(e => 
                e.method === result.method && e.path === result.endpoint
            );

            console.log('✅ Endpoint validation result:', endpointExists);

            if (!endpointExists) {
                console.error('❌ Endpoint not found:', result.method, result.endpoint);
                throw new Error(`Endpoint ${result.method} ${result.endpoint} not found in API`);
            }

            // Check if user is asking to generate test data
            // Two ways to detect:
            // 1. Explicit: "generate test data", "create sample payload", "give me test data"
            // 2. Implicit with field values: "create customer with email X" (user wants to use specific values)
            const hasGenerateKeyword = /generate|create|make|random|sample|dummy|fake|give\s+me|show\s+me|add/i.test(query);
            const hasDataKeyword = /data|body|payload|json|example|test|sample|dummy|fake/i.test(query);
            const hasFieldValues = /with\s+\w+\s+|(?:\w+)\s*[:=]/i.test(query);
            
            // Generate data ONLY if:
            // - Explicit request (generate/create + data/test/sample keywords), OR
            // - User provides field values (wants to use those specific values)
            const isDataGenerationRequest = 
                (hasGenerateKeyword && hasDataKeyword) || 
                (hasFieldValues);

            console.log('🔍 Data generation check:', { 
                hasGenerateKeyword, 
                hasDataKeyword,
                hasFieldValues,
                isDataGenerationRequest,
                query 
            });

            // Only generate test data if user explicitly requests it
            if (isDataGenerationRequest) {
                console.log('🎲 User explicitly requested test data generation');
                
                // Get the request body schema for this endpoint
                const pathItem = spec.paths[result.endpoint];
                const operation = pathItem[result.method.toLowerCase()];
                
                if (operation.requestBody?.content?.['application/json']?.schema) {
                    let schema = operation.requestBody.content['application/json'].schema;
                    console.log('📋 Found request body schema:', schema);
                    
                    // Resolve $ref if present
                    if (schema.$ref) {
                        console.log('🔗 Resolving schema $ref:', schema.$ref);
                        schema = this.resolveSchemaRef(schema.$ref, spec);
                        console.log('✅ Resolved schema:', schema);
                    }
                    
                    // Extract user-provided values from query
                    const userProvidedValues = this.extractUserProvidedValues(query, schema);
                    console.log('📝 User-provided values:', userProvidedValues);
                    
                    try {
                        // Generate test data using the schema and user-provided values
                        const context = `${result.method} ${result.endpoint}: ${operation.summary || operation.description || ''}`;
                        const generatedData = await this.generateTestData(
                            schema, 
                            context,
                            userProvidedValues
                        );
                        
                        // Only add if it's not empty
                        if (generatedData && Object.keys(generatedData).length > 0) {
                            result.generatedData = generatedData;
                            result.hasGeneratedData = true;
                            console.log('✅ Test data generated and added to result');
                        } else {
                            console.warn('⚠️ Generated data is empty, skipping');
                        }
                    } catch (error) {
                        console.warn('⚠️ Failed to generate test data:', error.message);
                        console.error('Error details:', error);
                        // Continue without generated data
                    }
                } else {
                    console.log('ℹ️ No request body schema found for this endpoint');
                }
            } else {
                console.log('ℹ️ No explicit data generation request detected - user will fill data manually');
            }

            console.log('🎉 Successfully matched endpoint!');
            return result;
        },

        /**
         * Perform search - Alias for analyzeQuery to support UI integration
         * @param {string} query - Natural language query
         * @returns {Promise<object>} - Parsed API request details
         */
        async performSearch(query) {
            return await this.analyzeQuery(query);
        },

        /**
         * Extract user-provided values from the query
         * @param {string} query - Natural language query
         * @param {object} schema - OpenAPI schema object
         * @returns {object} - Extracted field values
         */
        extractUserProvidedValues(query, schema) {
            const userValues = {};
            
            if (!schema || !schema.properties) {
                return userValues;
            }
            
            // Common patterns for field assignments
            const patterns = [
                // Quoted values: email "oscar@gmail.com" or name "John Doe"
                /(?:with\s+)?(\w+)\s+"([^"]+)"/gi,
                // With separator: email: oscar@gmail.com, email = oscar@gmail.com, email is oscar@gmail.com
                /(?:with\s+)?(\w+)\s*(?::|=|is)\s*([^\s,]+)/gi,
                // Simple: with email oscar@gmail.com or email oscar@gmail.com
                /(?:with\s+)?(\w+)\s+([^\s,]+(?:\s+[^\s,]+)?)/gi  // Allow multi-word values
            ];
            
            const fieldNames = Object.keys(schema.properties);
            
            // Words to skip (common words that aren't field names)
            const skipWords = ['new', 'a', 'an', 'the', 'create', 'make', 'generate', 'add', 'update', 'delete', 'get', 'fetch', 'with', 'and', 'or', 'customer', 'user', 'order', 'product'];
            
            // Field name aliases for smart matching
            const fieldAliases = {
                'fullname': ['firstName', 'lastName', 'name'],
                'name': ['firstName', 'lastName', 'fullName'],
                'phone': ['phoneNumber'],
                'mobile': ['phoneNumber']
            };
            
            for (const pattern of patterns) {
                let match;
                const patternCopy = new RegExp(pattern.source, pattern.flags);
                while ((match = patternCopy.exec(query)) !== null) {
                    const [, fieldName, value] = match;
                    
                    // Skip common words
                    if (skipWords.includes(fieldName.toLowerCase())) {
                        continue;
                    }
                    
                    // Check if this field exists in the schema (case-insensitive)
                    let actualFieldName = fieldNames.find(f => 
                        f.toLowerCase() === fieldName.toLowerCase()
                    );
                    
                    // Try aliases if direct match not found
                    if (!actualFieldName && fieldAliases[fieldName.toLowerCase()]) {
                        const aliases = fieldAliases[fieldName.toLowerCase()];
                        for (const alias of aliases) {
                            actualFieldName = fieldNames.find(f => f.toLowerCase() === alias.toLowerCase());
                            if (actualFieldName) {
                                // Special handling for fullname → split into first/last
                                if (fieldName.toLowerCase() === 'fullname' || fieldName.toLowerCase() === 'name') {
                                    const nameParts = value.trim().split(/\s+/);
                                    if (nameParts.length >= 2) {
                                        const firstNameField = fieldNames.find(f => f.toLowerCase() === 'firstname');
                                        const lastNameField = fieldNames.find(f => f.toLowerCase() === 'lastname');
                                        
                                        if (firstNameField && lastNameField) {
                                            userValues[firstNameField] = nameParts[0];
                                            userValues[lastNameField] = nameParts.slice(1).join(' ');
                                            console.log(`📌 Extracted (split): ${firstNameField} = ${nameParts[0]}, ${lastNameField} = ${nameParts.slice(1).join(' ')}`);
                                            break;
                                        }
                                    }
                                }
                                break;
                            }
                        }
                    }
                    
                    if (actualFieldName && value && !userValues[actualFieldName]) {
                        const fieldSchema = schema.properties[actualFieldName];
                        
                        // Type conversion based on schema
                        if (fieldSchema.type === 'integer') {
                            const intValue = parseInt(value, 10);
                            if (!isNaN(intValue)) {
                                userValues[actualFieldName] = intValue;
                            }
                        } else if (fieldSchema.type === 'number') {
                            const numValue = parseFloat(value);
                            if (!isNaN(numValue)) {
                                userValues[actualFieldName] = numValue;
                            }
                        } else if (fieldSchema.type === 'boolean') {
                            userValues[actualFieldName] = value.toLowerCase() === 'true' || value === '1';
                        } else {
                            // String or other types
                            userValues[actualFieldName] = value.trim();
                        }
                        
                        console.log(`📌 Extracted: ${actualFieldName} = ${userValues[actualFieldName]}`);
                    }
                }
            }
            
            return userValues;
        },

        /**
         * Generate test data for a schema using AI
         * @param {object} schema - OpenAPI schema object
         * @param {string} context - Additional context (e.g., endpoint description)
         * @param {object} userProvidedValues - User-provided field values to preserve
         * @returns {Promise<object>} - Generated test data
         */
        async generateTestData(schema, context = '', userProvidedValues = {}) {
            console.log('🎲 Generating test data with AI...');
            console.log('📋 Schema:', schema);
            console.log('📝 Context:', context);
            console.log('👤 User-provided values:', userProvidedValues);

            if (!this.config?.apiKey) {
                const errorMsg = 'AI is not configured. Please configure your OpenAI API key first.';
                console.error('❌', errorMsg);
                console.log('Current config:', this.config);
                throw new Error(errorMsg);
            }

            console.log('✅ API key is configured');

            // Build prompt for test data generation
            const prompt = this.buildDataGenerationPrompt(schema, context, userProvidedValues);
            console.log('📝 Prompt built, length:', prompt.length);

            console.log('🚀 Calling OpenAI API for data generation...');

            // Call OpenAI API
            try {
                const response = await fetch('https://api.openai.com/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${this.config.apiKey}`
                    },
                    body: JSON.stringify({
                        model: this.config.model || 'gpt-4o-mini',
                        messages: [
                            {
                                role: 'system',
                                content: 'You are a precise test data generator for OpenAPI schemas. Your job is to generate JSON that EXACTLY matches the provided schema structure. Follow all constraints (required fields, data types, enums, formats, min/max values). Respond ONLY with raw JSON - no markdown, no explanations, no code blocks.'
                            },
                            {
                                role: 'user',
                                content: prompt
                            }
                        ],
                        temperature: 0.5, // Lower temperature for more consistent, schema-compliant output
                        max_tokens: 1000
                    })
                });

                console.log('📡 OpenAI response status:', response.status);

                if (!response.ok) {
                    let errorMessage = 'Failed to generate test data';
                    try {
                        const error = await response.json();
                        errorMessage = error.error?.message || errorMessage;
                        console.error('❌ OpenAI API Error:', error);
                    } catch (e) {
                        console.error('❌ Failed to parse error response');
                    }
                    throw new Error(errorMessage);
                }

                const data = await response.json();
                console.log('✅ OpenAI response received:', data);
                
                const content = data.choices[0].message.content.trim();
                console.log('📝 Generated data:', content);
                
                // Parse the JSON response
                let generatedData;
                try {
                    // Remove markdown code blocks if present
                    let cleanContent = content;
                    if (content.includes('```json')) {
                        cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '');
                    } else if (content.includes('```')) {
                        cleanContent = content.replace(/```\n?/g, '');
                    }
                    
                    generatedData = JSON.parse(cleanContent.trim());
                    console.log('✅ Parsed generated data:', generatedData);
                } catch (e) {
                    console.error('❌ Failed to parse generated data:', content);
                    throw new Error('AI returned invalid JSON format');
                }

                // Basic validation: Check if required fields are present
                if (schema.required && Array.isArray(schema.required)) {
                    const missingFields = schema.required.filter(field => !(field in generatedData));
                    if (missingFields.length > 0) {
                        console.warn('⚠️ Generated data is missing required fields:', missingFields);
                        console.warn('Attempting to add missing fields with default values...');
                        
                        // Add missing required fields with default values based on type
                        missingFields.forEach(field => {
                            const fieldSchema = schema.properties?.[field];
                            if (fieldSchema) {
                                generatedData[field] = this.getDefaultValue(fieldSchema);
                                console.log(`Added missing field: ${field} = ${generatedData[field]}`);
                            }
                        });
                    }
                }

                console.log('🎉 Successfully generated test data!');
                return generatedData;
            } catch (error) {
                console.error('❌ Error in generateTestData:', error);
                throw error;
            }
        },

        /**
         * Get default value for a schema field type
         */
        getDefaultValue(fieldSchema) {
            const type = fieldSchema.type;
            
            // Check for enum first
            if (fieldSchema.enum && fieldSchema.enum.length > 0) {
                return fieldSchema.enum[0];
            }
            
            // Check for default value
            if (fieldSchema.default !== undefined) {
                return fieldSchema.default;
            }
            
            // Generate based on type
            switch (type) {
                case 'string':
                    if (fieldSchema.format === 'email') return 'user@example.com';
                    if (fieldSchema.format === 'date-time') return new Date().toISOString();
                    if (fieldSchema.format === 'date') return new Date().toISOString().split('T')[0];
                    if (fieldSchema.format === 'uuid') return '00000000-0000-0000-0000-000000000000';
                    return 'string';
                case 'integer':
                    return fieldSchema.minimum || 0;
                case 'number':
                    return fieldSchema.minimum || 0.0;
                case 'boolean':
                    return false;
                case 'array':
                    return [];
                case 'object':
                    return {};
                default:
                    return null;
            }
        },

        /**
         * Build prompt for test data generation with explicit field-by-field instructions
         */
        buildDataGenerationPrompt(schema, context, userProvidedValues = {}) {
            // Resolve any $ref in schema
            const resolvedSchema = this.resolveSchemaRefs(schema);
            const schemaJson = JSON.stringify(resolvedSchema, null, 2);
            
            // Extract specific constraints
            const requiredFields = resolvedSchema.required || [];
            const properties = resolvedSchema.properties || {};
            
            // Build field-specific instructions
            let fieldInstructions = '';
            if (Object.keys(properties).length > 0) {
                fieldInstructions = '\n\nFIELD-SPECIFIC INSTRUCTIONS:\n';
                Object.keys(properties).forEach(fieldName => {
                    const prop = properties[fieldName];
                    const isRequired = requiredFields.includes(fieldName);
                    const type = prop.type || 'any';
                    const hasUserValue = fieldName in userProvidedValues;
                    
                    let instruction = `- "${fieldName}": ${isRequired ? '**REQUIRED**' : 'optional'}, type: ${type}`;
                    
                    // Mark if user provided a value
                    if (hasUserValue) {
                        instruction += ` **USER PROVIDED: ${JSON.stringify(userProvidedValues[fieldName])}** (USE THIS EXACT VALUE)`;
                    }
                    
                    if (prop.enum) {
                        instruction += `, must be one of: ${JSON.stringify(prop.enum)}`;
                    }
                    if (prop.format) {
                        instruction += `, format: ${prop.format}`;
                    }
                    if (prop.minimum !== undefined) {
                        instruction += `, minimum: ${prop.minimum}`;
                    }
                    if (prop.maximum !== undefined) {
                        instruction += `, maximum: ${prop.maximum}`;
                    }
                    if (prop.minLength !== undefined) {
                        instruction += `, minLength: ${prop.minLength}`;
                    }
                    if (prop.maxLength !== undefined) {
                        instruction += `, maxLength: ${prop.maxLength}`;
                    }
                    if (prop.pattern) {
                        instruction += `, pattern: ${prop.pattern}`;
                    }
                    if (prop.description) {
                        instruction += `, (${prop.description})`;
                    }
                    
                    fieldInstructions += instruction + '\n';
                });
            }
            
            // Build user-provided values section
            let userValuesSection = '';
            if (Object.keys(userProvidedValues).length > 0) {
                userValuesSection = `\n\nUSER-PROVIDED VALUES (MUST USE THESE EXACTLY):\n${JSON.stringify(userProvidedValues, null, 2)}\n`;
            }
            
            return `You are generating test data for an API. Generate a JSON object that EXACTLY matches this schema.

SCHEMA:
${schemaJson}
${fieldInstructions}
${userValuesSection}
${context ? `\nCONTEXT: ${context}` : ''}

CRITICAL RULES - READ CAREFULLY:
1. **User-Provided Values**: If values are marked as "USER PROVIDED", you MUST use those EXACT values - DO NOT change, modify, or regenerate them
2. **Generate All Other Fields**: For fields NOT marked as "USER PROVIDED", you MUST generate realistic, valid test data - NEVER use null or empty values for required fields
3. **Structure**: Your output must have the EXACT same structure as the schema
4. **Required Fields**: ALL fields in the "required" array MUST have valid values: ${JSON.stringify(requiredFields)}
5. **Data Types**: Match types EXACTLY:
   - "string" → use realistic string values (in quotes), NOT null or empty
   - "integer" → use whole numbers (no decimals), NOT null
   - "number" → use numbers (can have decimals), NOT null
   - "boolean" → use true or false (no quotes)
   - "array" → use [...] with items matching the items schema
   - "object" → use {...} with nested properties
6. **Enums**: If a field has "enum", you MUST use one of those exact values
7. **Formats**: Respect format hints:
   - "email" → valid email like "user@example.com"
   - "date-time" → ISO 8601 like "2024-10-24T10:30:00Z"
   - "date" → YYYY-MM-DD like "2024-10-24"
   - "uuid" → valid UUID like "550e8400-e29b-41d4-a716-446655440000"
   - "uri" → valid URL like "https://example.com"
8. **No Extra Fields**: Do NOT add fields that aren't in the schema
9. **Realistic Data**: Generate realistic, plausible test data (real names, valid phone numbers, etc.)

RESPONSE FORMAT:
Return ONLY the raw JSON object. 
NO markdown (no \`\`\`json), NO explanations, NO comments.
Just the JSON that can be parsed directly.

Example - if schema requires username (string) and age (integer >=18), with user providing username:
User provided: {"username": "oscar123"}
You generate: {"username":"oscar123","age":25}

DO NOT generate: {"username":"oscar123","age":null} ❌
DO generate: {"username":"oscar123","age":25} ✅`;
        },

        /**
         * Resolve $ref references in schema
         */
        resolveSchemaRef(ref, spec) {
            console.log('🔗 Resolving reference:', ref);
            
            // Parse the $ref path (e.g., "#/components/schemas/CreateCustomerRequest")
            if (!ref || !ref.startsWith('#/')) {
                console.warn('⚠️ Invalid or external $ref:', ref);
                return null;
            }
            
            // Split the path and navigate through the spec
            const parts = ref.substring(2).split('/'); // Remove '#/' and split
            let resolved = spec;
            
            for (const part of parts) {
                if (resolved && typeof resolved === 'object' && part in resolved) {
                    resolved = resolved[part];
                } else {
                    console.error('❌ Failed to resolve $ref at part:', part, 'in path:', ref);
                    return null;
                }
            }
            
            console.log('✅ Resolved schema:', resolved);
            
            // Recursively resolve any nested $refs
            if (resolved && typeof resolved === 'object') {
                resolved = this.deepResolveRefs(resolved, spec);
            }
            
            return resolved;
        },

        /**
         * Recursively resolve all $ref in a schema object
         */
        deepResolveRefs(obj, spec) {
            if (!obj || typeof obj !== 'object') {
                return obj;
            }
            
            // If this object has a $ref, resolve it
            if (obj.$ref) {
                return this.resolveSchemaRef(obj.$ref, spec);
            }
            
            // Recursively process all properties
            const result = Array.isArray(obj) ? [] : {};
            for (const key in obj) {
                if (obj.hasOwnProperty(key)) {
                    result[key] = this.deepResolveRefs(obj[key], spec);
                }
            }
            
            return result;
        },

        /**
         * Resolve $ref references in schema (deprecated - use resolveSchemaRef)
         */
        resolveSchemaRefs(schema) {
            // For backward compatibility
            if (!schema) return schema;
            
            // Handle $ref if present (basic handling)
            if (schema.$ref) {
                console.warn('Schema contains $ref:', schema.$ref, '- attempting to use as-is');
                // TODO: Resolve against spec.components.schemas if needed
                return schema;
            }
            
            return schema;
        },

        /**
         * Build prompt for OpenAI
         */
        buildPrompt(query, endpoints) {
            const endpointsJson = JSON.stringify(endpoints, null, 2);
            
            return `Given this API specification:

${endpointsJson}

User Query: "${query}"

Analyze the user's query and map it to the most appropriate API endpoint. Extract any parameter values mentioned in the query.

Respond with ONLY a JSON object in this exact format (no other text):
{
    "endpoint": "/api/path",
    "method": "GET|POST|PUT|DELETE|PATCH",
    "parameters": {
        "paramName": "value"
    },
    "confidence": 0-100,
    "reasoning": "brief explanation"
}

Example:
User Query: "Get user with ID 123"
Response:
{
    "endpoint": "/api/users/{id}",
    "method": "GET",
    "parameters": {
        "id": "123"
    },
    "confidence": 95,
    "reasoning": "Query explicitly requests retrieving a user by ID"
}

Now analyze the user's query and respond with JSON only.`;
        },

        /**
         * Display results
         */
        displayResults(result) {
            const resultsDiv = document.getElementById('nlpResults');
            
            const confidenceColor = result.confidence >= 80 ? '#4CAF50' : 
                                   result.confidence >= 60 ? '#FFA726' : '#f93e3e';

            const paramsHtml = Object.keys(result.parameters || {}).length > 0 ? `
                <div style="margin-top: 12px; padding: 12px; background: var(--dark-bg); border-radius: 6px;">
                    <div style="color: var(--text-secondary); font-size: 11px; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px;">Detected Parameters</div>
                    ${Object.entries(result.parameters).map(([key, value]) => `
                        <div style="display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid var(--border-color);">
                            <span style="color: var(--text-secondary); font-size: 12px;">${key}:</span>
                            <span style="color: var(--text-primary); font-family: 'Monaco', 'Consolas', monospace; font-size: 12px;">${value}</span>
                        </div>
                    `).join('')}
                </div>
            ` : '';

            resultsDiv.innerHTML = `
                <div style="background: linear-gradient(135deg, rgba(76, 175, 80, 0.1), rgba(69, 160, 73, 0.05)); border: 1px solid #4CAF50; border-radius: 8px; padding: 16px;">
                    <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 12px;">
                        <div>
                            <div style="color: var(--text-secondary); font-size: 11px; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px;">AI Suggestion</div>
                            <div style="display: flex; align-items: center; gap: 12px;">
                                <span class="detail-method method-${result.method.toLowerCase()}">${result.method}</span>
                                <span style="color: var(--text-primary); font-family: 'Monaco', 'Consolas', monospace; font-size: 14px;">${result.endpoint}</span>
                            </div>
                        </div>
                        <div style="text-align: right;">
                            <div style="color: var(--text-secondary); font-size: 11px; margin-bottom: 4px;">Confidence</div>
                            <div style="color: ${confidenceColor}; font-weight: 600; font-size: 16px;">${result.confidence}%</div>
                        </div>
                    </div>

                    ${result.reasoning ? `
                        <div style="color: var(--text-secondary); font-size: 12px; margin-bottom: 12px; font-style: italic;">
                            💡 ${result.reasoning}
                        </div>
                    ` : ''}

                    ${paramsHtml}

                    <div style="margin-top: 16px; display: flex; gap: 8px;">
                        <button 
                            onclick="NLPManager.openEndpoint('${result.method}', '${result.endpoint}', ${JSON.stringify(result.parameters || {}).replace(/"/g, '&quot;')})"
                            style="flex: 1; background: linear-gradient(135deg, #4CAF50, #45a049); border: none; color: white; padding: 10px 20px; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 13px; transition: all 0.2s;"
                            onmouseover="this.style.transform='scale(1.02)'"
                            onmouseout="this.style.transform='scale(1)'"
                        >
                            🚀 Open & Execute
                        </button>
                        <button 
                            onclick="NLPManager.dismissResults()"
                            style="background: var(--dark-bg); border: 1px solid var(--border-color); color: var(--text-secondary); padding: 10px 20px; border-radius: 6px; cursor: pointer; font-size: 13px; transition: all 0.2s;"
                            onmouseover="this.style.background='var(--hover-bg)'"
                            onmouseout="this.style.background='var(--dark-bg)'"
                        >
                            Dismiss
                        </button>
                    </div>
                </div>
            `;
        },

        /**
         * Open endpoint in Try It Out panel
         */
        async openEndpoint(method, path, parameters) {
            // Get the spec to find the operation
            const spec = await getSwaggerSpec();
            const pathItem = spec.paths[path];
            
            if (!pathItem || !pathItem[method.toLowerCase()]) {
                this.showError('Endpoint not found in API specification');
                return;
            }

            const operation = pathItem[method.toLowerCase()];
            const operationId = operation.operationId || `${method.toLowerCase()}_${path.replace(/\//g, '_')}`;

            // Set current operation
            window.currentOperation = {
                method: method,
                path: path,
                operation: operation,
                spec: spec
            };

            // Scroll to the endpoint in the detail view
            await scrollToEndpoint(operationId, method, path);

            // Open Try It Out panel
            setTimeout(() => {
                openTryItPanel(method, path, operationId);

                // Pre-fill parameters after panel opens
                setTimeout(() => {
                    this.fillParameters(parameters, operation.parameters || []);
                }, 300);
            }, 500);

            // Clear results
            this.dismissResults();
        },

        /**
         * Fill parameters in the Try It Out panel
         */
        fillParameters(parameters, operationParams) {
            Object.entries(parameters).forEach(([name, value]) => {
                // Find the parameter index
                const paramIndex = operationParams.findIndex(p => p.name === name);
                if (paramIndex !== -1) {
                    const input = document.getElementById(`param-${paramIndex}`);
                    if (input) {
                        input.value = value;
                        // Trigger validation
                        if (window.validateParameter) {
                            validateParameter(paramIndex);
                        }
                    }
                }
            });
        },

        /**
         * Dismiss results
         */
        dismissResults() {
            document.getElementById('nlpResults').style.display = 'none';
            document.getElementById('nlpSearchInput').value = '';
        },

        /**
         * Show error message
         */
        showError(message) {
            const resultsDiv = document.getElementById('nlpResults');
            resultsDiv.style.display = 'block';
            resultsDiv.innerHTML = `
                <div style="background: rgba(249, 62, 62, 0.1); border: 1px solid #f93e3e; border-radius: 8px; padding: 16px;">
                    <div style="color: #f93e3e; font-weight: 600; margin-bottom: 8px; font-size: 14px;">❌ Error</div>
                    <div style="color: var(--text-secondary); font-size: 13px;">${message}</div>
                    <button 
                        onclick="NLPManager.dismissResults()"
                        style="margin-top: 12px; background: var(--dark-bg); border: 1px solid var(--border-color); color: var(--text-secondary); padding: 8px 16px; border-radius: 6px; cursor: pointer; font-size: 12px;"
                    >
                        Dismiss
                    </button>
                </div>
            `;
        },

        /**
         * Show configuration dialog
         */
        showConfigDialog() {
            const currentApiKey = this.config?.apiKey || '';
            const currentModel = this.config?.model || 'gpt-3.5-turbo';

            const dialog = document.createElement('div');
            dialog.id = 'nlpConfigDialog';
            dialog.innerHTML = `
                <div style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0, 0, 0, 0.7); display: flex; align-items: center; justify-content: center; z-index: 10000;" onclick="if(event.target === this) this.remove()">
                    <div style="background: var(--sidebar-bg); border: 1px solid var(--border-color); border-radius: 12px; padding: 24px; max-width: 500px; width: 90%;" onclick="event.stopPropagation()">
                        <h2 style="color: var(--text-primary); margin: 0 0 8px 0; font-size: 20px; display: flex; align-items: center; gap: 8px;">
                            🤖 AI Configuration
                        </h2>
                        <p style="color: var(--text-secondary); font-size: 13px; margin: 0 0 24px 0;">
                            Configure OpenAI API to enable natural language queries for your API endpoints.
                        </p>

                        <div style="margin-bottom: 16px;">
                            <label style="color: var(--text-primary); font-size: 13px; font-weight: 600; display: block; margin-bottom: 6px;">
                                OpenAI API Key <span style="color: #f93e3e;">*</span>
                            </label>
                            <input 
                                type="password" 
                                id="nlpApiKeyInput"
                                value="${currentApiKey}"
                                placeholder="sk-..."
                                style="width: 100%; padding: 10px; background: var(--dark-bg); border: 1px solid var(--border-color); border-radius: 6px; color: var(--text-primary); font-family: 'Monaco', 'Consolas', monospace; font-size: 12px;"
                            />
                            <div style="color: var(--text-secondary); font-size: 11px; margin-top: 4px;">
                                Get your API key from <a href="https://platform.openai.com/api-keys" target="_blank" style="color: #4CAF50;">OpenAI Platform</a>
                            </div>
                        </div>

                        <div style="margin-bottom: 24px;">
                            <label style="color: var(--text-primary); font-size: 13px; font-weight: 600; display: block; margin-bottom: 6px;">
                                Model
                            </label>
                            <select 
                                id="nlpModelSelect"
                                style="width: 100%; padding: 10px; background: var(--dark-bg); border: 1px solid var(--border-color); border-radius: 6px; color: var(--text-primary); font-size: 13px; cursor: pointer;"
                            >
                                <option value="gpt-3.5-turbo" ${currentModel === 'gpt-3.5-turbo' ? 'selected' : ''}>GPT-3.5 Turbo (Fast & Cheap)</option>
                                <option value="gpt-4" ${currentModel === 'gpt-4' ? 'selected' : ''}>GPT-4 (More Accurate)</option>
                                <option value="gpt-4-turbo-preview" ${currentModel === 'gpt-4-turbo-preview' ? 'selected' : ''}>GPT-4 Turbo (Best)</option>
                            </select>
                        </div>

                        <div style="background: rgba(76, 175, 80, 0.1); border: 1px solid rgba(76, 175, 80, 0.3); border-radius: 6px; padding: 12px; margin-bottom: 24px;">
                            <div style="color: #4CAF50; font-size: 12px; font-weight: 600; margin-bottom: 4px;">ℹ️ Privacy Notice</div>
                            <div style="color: var(--text-secondary); font-size: 11px; line-height: 1.5;">
                                Your API key is stored locally in your browser and never sent to our servers. 
                                All AI requests go directly from your browser to OpenAI.
                            </div>
                        </div>

                        <div style="display: flex; gap: 8px; justify-content: flex-end;">
                            <button 
                                onclick="document.getElementById('nlpConfigDialog').remove()"
                                style="background: var(--dark-bg); border: 1px solid var(--border-color); color: var(--text-secondary); padding: 10px 20px; border-radius: 6px; cursor: pointer; font-size: 13px; transition: all 0.2s;"
                                onmouseover="this.style.background='var(--hover-bg)'"
                                onmouseout="this.style.background='var(--dark-bg)'"
                            >
                                Cancel
                            </button>
                            <button 
                                onclick="NLPManager.saveConfiguration()"
                                style="background: linear-gradient(135deg, #4CAF50, #45a049); border: none; color: white; padding: 10px 20px; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 13px; transition: all 0.2s;"
                                onmouseover="this.style.transform='scale(1.02)'"
                                onmouseout="this.style.transform='scale(1)'"
                            >
                                Save Configuration
                            </button>
                        </div>
                    </div>
                </div>
            `;

            document.body.appendChild(dialog);
        },

        /**
         * Save configuration from dialog
         */
        saveConfiguration() {
            const apiKey = document.getElementById('nlpApiKeyInput').value.trim();
            const model = document.getElementById('nlpModelSelect').value;

            if (!apiKey) {
                alert('Please enter your OpenAI API key');
                return;
            }

            this.saveConfig({
                apiKey: apiKey,
                model: model
            });

            // Close dialog
            document.getElementById('nlpConfigDialog').remove();

            // Update button state
            location.reload(); // Reload to update the UI button
        }
    };

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.NLPManager.init();
            initializeAIUI();
        });
    } else {
        window.NLPManager.init();
        initializeAIUI();
    }

    /**
     * Initialize AI UI elements and connect to modal
     */
    function initializeAIUI() {
        // Show/hide AI search container based on config
        updateAISearchVisibility();
    }

    /**
     * Update AI search visibility
     */
    function updateAISearchVisibility() {
        const askAIButton = document.getElementById('askAIButton');
        const aiSetupButton = document.getElementById('aiSetupButton');
        
        if (window.NLPManager && window.NLPManager.isConfigured) {
            // Show Ask AI button when configured
            if (askAIButton) {
                askAIButton.style.display = 'flex';
            }
            if (aiSetupButton) {
                aiSetupButton.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
                aiSetupButton.title = 'AI Setup (Active)';
            }
        } else {
            // Hide Ask AI button when not configured
            if (askAIButton) {
                askAIButton.style.display = 'none';
            }
            if (aiSetupButton) {
                aiSetupButton.style.background = '';
                aiSetupButton.title = 'AI Setup (Configure)';
            }
        }
    }

    /**
     * Open Ask AI Modal
     */
    window.openAskAIModal = function() {
        const modal = document.getElementById('askAIModal');
        const input = document.getElementById('askAIInput');
        const resultsDiv = document.getElementById('askAIResults');
        
        if (!modal) return;

        // Clear previous search
        if (input) input.value = '';
        if (resultsDiv) {
            resultsDiv.innerHTML = `
                <div style="text-align: center; padding: 40px 20px; color: var(--text-secondary);">
                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-bottom: 16px; opacity: 0.5;">
                        <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
                        <path d="M2 17l10 5 10-5"></path>
                        <path d="M2 12l10 5 10-5"></path>
                    </svg>
                    <p>Type your question above and press Enter or click the search button</p>
                    <p style="font-size: 12px; margin-top: 8px; opacity: 0.7;">AI will find the best matching endpoint for your query</p>
                </div>
            `;
        }

        modal.style.display = 'flex';
        
        // Focus on input
        setTimeout(() => {
            if (input) input.focus();
        }, 100);
    };

    /**
     * Close Ask AI Modal
     */
    window.closeAskAIModal = function() {
        const modal = document.getElementById('askAIModal');
        if (modal) modal.style.display = 'none';
    };

    /**
     * Open AI Setup Modal - Connected to UI button
     */
    window.openAISetupModal = function() {
        const modal = document.getElementById('aiSetupModal');
        const apiKeyInput = document.getElementById('aiApiKey');
        const modelSelect = document.getElementById('aiModel');
        const enabledCheckbox = document.getElementById('aiEnabled');
        const statusDiv = document.getElementById('aiStatus');
        
        if (!modal) return;

        // Load current config
        const config = window.NLPManager?.config || {};
        
        // Populate values
        if (apiKeyInput) apiKeyInput.value = config.apiKey || '';
        if (modelSelect) modelSelect.value = config.model || 'gpt-4o-mini';
        if (enabledCheckbox) enabledCheckbox.checked = window.NLPManager?.isConfigured || false;
        if (statusDiv) statusDiv.style.display = 'none';

        modal.style.display = 'flex';
    };

    /**
     * Close AI Setup Modal
     */
    window.closeAISetupModal = function() {
        const modal = document.getElementById('aiSetupModal');
        if (modal) modal.style.display = 'none';
    };

    /**
     * Save AI Configuration from modal
     */
    window.saveAIConfig = function() {
        const apiKeyInput = document.getElementById('aiApiKey');
        const modelSelect = document.getElementById('aiModel');
        const enabledCheckbox = document.getElementById('aiEnabled');
        const statusDiv = document.getElementById('aiStatus');

        const apiKey = apiKeyInput?.value?.trim() || '';
        const model = modelSelect?.value || 'gpt-4o-mini';
        const enabled = enabledCheckbox?.checked || false;

        // Validate - if enabled OR if API key is provided, validate the key
        if (apiKey && !apiKey.startsWith('sk-')) {
            showModalStatus('Invalid API key format. OpenAI keys start with "sk-"', 'error');
            return;
        }

        // If checkbox is enabled but no API key provided
        if (enabled && !apiKey) {
            showModalStatus('Please enter your OpenAI API key', 'error');
            return;
        }

        // Save the configuration - save whatever is in the input field
        window.NLPManager.saveConfig({
            apiKey: apiKey,
            model: model
        });

        updateAISearchVisibility();
        showModalStatus('✅ AI configuration saved successfully!', 'success');

        setTimeout(() => {
            window.closeAISetupModal();
        }, 1500);
    };

    /**
     * Clear AI Configuration
     */
    window.clearAIConfig = function() {
        if (confirm('Are you sure you want to clear the AI configuration?')) {
            // Clear the input fields first
            const apiKeyInput = document.getElementById('aiApiKey');
            const enabledCheckbox = document.getElementById('aiEnabled');
            
            if (apiKeyInput) apiKeyInput.value = '';
            if (enabledCheckbox) enabledCheckbox.checked = false;

            // Then save empty config
            window.NLPManager.saveConfig({
                apiKey: '',
                model: 'gpt-4o-mini'
            });

            updateAISearchVisibility();
            showModalStatus('AI configuration cleared', 'info');
        }
    };

    /**
     * Show status in modal
     */
    function showModalStatus(message, type = 'info') {
        const statusDiv = document.getElementById('aiStatus');
        if (!statusDiv) return;

        statusDiv.textContent = message;
        statusDiv.className = `ai-status-${type}`;
        statusDiv.style.display = 'block';
    }

    /**
     * Handle AI Search from Ask AI Modal
     */
    window.handleAskAISearch = async function() {
        const input = document.getElementById('askAIInput');
        const resultsDiv = document.getElementById('askAIResults');

        if (!input || !resultsDiv) return;

        const query = input.value.trim();
        if (!query) return;

        if (!window.NLPManager || !window.NLPManager.isConfigured) {
            resultsDiv.innerHTML = `
                <div class="ai-error">
                    ⚠️ AI is not configured. Please click the <strong>AI Setup</strong> button to configure your OpenAI API key first.
                </div>
            `;
            return;
        }

        // Show loading
        resultsDiv.innerHTML = `
            <div class="ai-loading">
                <div class="ai-loading-spinner"></div>
                <span style="color: var(--text-primary); font-size: 13px;">AI is analyzing your query...</span>
            </div>
        `;

        try {
            // Use NLPManager to handle the search
            const result = await window.NLPManager.performSearch(query);
            
            if (result && result.endpoint) {
                displayAskAIResult(result, resultsDiv, query);
            } else {
                resultsDiv.innerHTML = `
                    <div class="ai-error">
                        ❌ Could not find a matching endpoint for your query. Try rephrasing or use different keywords.
                    </div>
                `;
            }
        } catch (error) {
            console.error('AI Search Error:', error);
            resultsDiv.innerHTML = `
                <div class="ai-error">
                    ❌ Error: ${error.message || 'Failed to process AI query. Please check your API key and try again.'}
                </div>
            `;
        }
    };

    /**
     * Handle AI Search from UI (deprecated - keeping for backward compatibility)
     */
    window.handleAISearch = async function() {
        // Redirect to Ask AI modal
        window.openAskAIModal();
    };

    /**
     * Display Ask AI modal search result
     */
    function displayAskAIResult(result, container, query) {
        // Confidence is already 0-100 from AI, no need to multiply
        const confidence = Math.round(result.confidence || 90);
        const hasParams = result.parameters && Object.keys(result.parameters).length > 0;
        const hasGeneratedData = result.hasGeneratedData && result.generatedData;
        
        // Store result globally so executeAskAIResult can access it
        window._currentAIResult = result;
        
        container.innerHTML = `
            <div class="ai-result-item" style="cursor: default; border: 2px solid #10b981; background: var(--dark-bg);">
                <div class="ai-result-header">
                    <span class="method-badge method-${result.method.toLowerCase()}">${result.method}</span>
                    <span class="ai-result-confidence">${confidence}% match</span>
                    ${hasGeneratedData ? '<span style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; font-size: 10px; font-weight: 700; padding: 3px 8px; border-radius: 12px; margin-left: 8px;">✨ Data Generated</span>' : ''}
                </div>
                <div class="ai-result-path" style="font-size: 14px; margin: 8px 0;">${result.endpoint}</div>
                ${result.description ? `<div class="ai-result-description">${result.description}</div>` : ''}
                
                ${hasParams ? `
                    <div style="margin-top: 12px; padding: 12px; background: var(--darker-bg); border-radius: 6px; border-left: 3px solid #10b981;">
                        <div style="color: #10b981; font-weight: 600; font-size: 12px; margin-bottom: 8px;">
                            ✓ Detected Parameters
                        </div>
                        <pre style="margin: 0; color: var(--text-primary); font-size: 12px; overflow-x: auto;">${JSON.stringify(result.parameters, null, 2)}</pre>
                    </div>
                ` : ''}
                
                ${hasGeneratedData ? `
                    <div style="margin-top: 12px; padding: 12px; background: var(--darker-bg); border-radius: 6px; border-left: 3px solid #f59e0b;">
                        <div style="color: #f59e0b; font-weight: 600; font-size: 12px; margin-bottom: 8px; display: flex; align-items: center; gap: 6px;">
                            <span>✨</span>
                            <span>AI Generated Test Data</span>
                        </div>
                        <pre style="margin: 0; color: var(--text-primary); font-size: 12px; overflow-x: auto; max-height: 300px; overflow-y: auto;">${JSON.stringify(result.generatedData, null, 2)}</pre>
                        <div style="margin-top: 8px; font-size: 11px; color: var(--text-secondary); font-style: italic;">
                            This data will be automatically filled in the request body
                        </div>
                    </div>
                ` : ''}
                
                <div style="margin-top: 16px; display: flex; gap: 12px; justify-content: flex-end;">
                    <button 
                        onclick="closeAskAIModal()" 
                        style="background: var(--dark-bg); border: 1px solid var(--border-color); color: var(--text-primary); padding: 10px 20px; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 13px; transition: all 0.2s;"
                        onmouseover="this.style.background='var(--hover-bg)'"
                        onmouseout="this.style.background='var(--dark-bg)'"
                    >
                        Cancel
                    </button>
                    <button 
                        onclick="executeAskAIResult()" 
                        style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); border: none; color: white; padding: 10px 24px; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 13px; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3); transition: all 0.2s;"
                        onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 16px rgba(16, 185, 129, 0.4)'"
                        onmouseout="this.style.transform=''; this.style.boxShadow='0 4px 12px rgba(16, 185, 129, 0.3)'"
                    >
                        Execute Request →
                    </button>
                </div>
            </div>
        `;

        // Save to history
        if (window.NLPManager) {
            window.NLPManager.saveToHistory(query, result);
        }
    }

    /**
     * Execute Ask AI result - Opens Try It Out panel with parameters and generated data
     */
    window.executeAskAIResult = async function() {
        // Get the stored result
        const result = window._currentAIResult;
        if (!result) {
            console.error('❌ No AI result found');
            alert('Error: No AI result data found');
            return;
        }
        
        const method = result.method;
        const path = result.endpoint;
        const parameters = result.parameters || {};
        const generatedData = result.generatedData || null;
        
      //  console.log('🚀 Executing AI result...', { method, path, parameters, generatedData });
        
        // Close the Ask AI modal first
        window.closeAskAIModal();

        // Get the swagger spec
        const spec = await getSwaggerSpec();
        const pathItem = spec.paths[path];
        
        if (!pathItem || !pathItem[method.toLowerCase()]) {
            alert('Endpoint not found in API specification');
            return;
        }

        const operation = pathItem[method.toLowerCase()];
        
        // Set window.currentOperation
        window.currentOperation = {
            method: method,
            path: path,
            operation: operation,
            spec: spec
        };

        // Open the Try It Out panel
        if (typeof window.openTryItPanel === 'function') {
            window.openTryItPanel(method, path, operation.operationId);
            
            // Pre-fill parameters and generated data after a short delay to let panel render
            setTimeout(() => {
                prefillParameters(parameters, generatedData);
            }, 500); // Increased delay to ensure panel is fully rendered
        }
    };

    /**
     * Display AI search result (deprecated sidebar version)
     */
    function displayAIResult(result, container, query) {
        // Confidence is already 0-100 from AI, no need to multiply
        const confidence = Math.round(result.confidence || 90);
        
        container.innerHTML = `
            <div class="ai-result-item" onclick="executeAIResult('${result.method}', '${result.endpoint}', ${JSON.stringify(result.parameters || {}).replace(/"/g, '&quot;')})">
                <div class="ai-result-header">
                    <span class="method-badge method-${result.method.toLowerCase()}">${result.method}</span>
                    <span class="ai-result-confidence">${confidence}% match</span>
                </div>
                <div class="ai-result-path">${result.endpoint}</div>
                ${result.description ? `<div class="ai-result-description">${result.description}</div>` : ''}
                ${Object.keys(result.parameters || {}).length > 0 ? `
                    <div style="margin-top: 8px; padding: 8px; background: var(--darker-bg); border-radius: 4px; font-size: 11px;">
                        <strong style="color: var(--text-secondary);">Detected Parameters:</strong>
                        <pre style="margin: 4px 0 0 0; color: var(--text-primary);">${JSON.stringify(result.parameters, null, 2)}</pre>
                    </div>
                ` : ''}
                <div style="margin-top: 12px; text-align: right;">
                    <button style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border: none; color: white; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 12px;">
                        Click to Execute →
                    </button>
                </div>
            </div>
        `;

        // Save to history
        window.NLPManager.saveToHistory(query, result);
    }

    /**
     * Execute AI result - Opens Try It Out panel with parameters
     */
    window.executeAIResult = async function(method, path, parameters) {
        // Get the swagger spec
        const spec = await getSwaggerSpec();
        const pathItem = spec.paths[path];
        
        if (!pathItem || !pathItem[method.toLowerCase()]) {
            alert('Endpoint not found in API specification');
            return;
        }

        const operation = pathItem[method.toLowerCase()];
        
        // Set window.currentOperation
        window.currentOperation = {
            method: method,
            path: path,
            operation: operation,
            spec: spec
        };

        // Open the Try It Out panel
        if (typeof window.openTryItPanel === 'function') {
            window.openTryItPanel(method, path, operation.operationId);
            
            // Pre-fill parameters after a short delay to let panel render
            setTimeout(() => {
                prefillParameters(parameters);
            }, 300);
        }
    };

    /**
     * Pre-fill parameters in Try It Out panel
     */
    function prefillParameters(parameters, generatedData = null) {
      //  console.log('📝 Pre-filling parameters...', { parameters, generatedData });
        
        if (!parameters || Object.keys(parameters).length === 0) {
           // console.log('ℹ️ No parameters to fill');
        } else {
            // Fill path, query, and header parameters
            const inputs = document.querySelectorAll('.try-it-panel input[id^="param-"]');
           /// console.log(`Found ${inputs.length} parameter inputs`);
            inputs.forEach(input => {
                const paramName = input.getAttribute('data-param-name');
                if (paramName && parameters[paramName] !== undefined) {
                    input.value = parameters[paramName];
                   // console.log(`✓ Filled parameter: ${paramName} = ${parameters[paramName]}`);
                }
            });

            // Fill request body if present in parameters
            if (parameters.body || parameters.requestBody) {
                const bodyTextarea = document.getElementById('requestBody');
                const bodyDataTextarea = document.getElementById('requestBodyData');
                if (bodyTextarea) {
                    const bodyData = parameters.body || parameters.requestBody;
                    const jsonString = typeof bodyData === 'string' 
                        ? bodyData 
                        : JSON.stringify(bodyData, null, 2);
                    bodyTextarea.value = jsonString;
                    if (bodyDataTextarea) {
                        bodyDataTextarea.value = jsonString;
                    }
                   // console.log('✓ Filled request body from parameters');
                }
            }
        }

        // Fill request body with generated data (takes priority)
        if (generatedData) {
            // Check if generatedData is empty or just an empty object
            const isEmptyData = !generatedData || 
                               (typeof generatedData === 'object' && Object.keys(generatedData).length === 0);
            
            if (isEmptyData) {
              //  console.log('⚠️ Generated data is empty or {}, skipping injection');
                return;
            }
            
           // console.log('✨ Attempting to fill request body with AI-generated data...');
            //console.log('Data to inject:', generatedData);
            
            // Try multiple times in case the textarea isn't rendered yet
            let attempts = 0;
            const maxAttempts = 10;
            const interval = setInterval(() => {
                attempts++;
                const bodyTextarea = document.getElementById('requestBody');
                const bodyDataTextarea = document.getElementById('requestBodyData');
                const bodyEditDiv = document.getElementById('requestBodyEdit');
                const bodyDisplayDiv = document.getElementById('requestBodyDisplay');
                
                if (bodyTextarea) {
                    const jsonString = JSON.stringify(generatedData, null, 2);
                    
                    // Fill both textareas
                    bodyTextarea.value = jsonString;
                    if (bodyDataTextarea) {
                        bodyDataTextarea.value = jsonString;
                    }
                    
                    // Switch to edit mode so user can see the filled data
                    if (bodyEditDiv && bodyDisplayDiv) {
                        bodyDisplayDiv.style.display = 'none';
                        bodyEditDiv.style.display = 'block';
                        
                        // Update the edit button text if it exists
                        const editBtn = document.querySelector('[onclick*="toggleRequestBodyEdit"]');
                        if (editBtn) {
                            editBtn.textContent = '👁️ View';
                        }
                    }
                    
                    // Save the state
                    if (typeof saveCurrentPanelState === 'function') {
                        saveCurrentPanelState();
                    }
                    
                    // console.log('✅ Successfully filled request body with AI-generated data!');
                    // console.log('Generated data:', generatedData);
                    clearInterval(interval);
                } else {
                    console.log(`⏳ Attempt ${attempts}/${maxAttempts}: Request body textarea not found yet, retrying...`);
                    
                    if (attempts >= maxAttempts) {
                        // console.error('❌ Failed to find request body textarea after multiple attempts');
                        // console.error('Elements found:', {
                        //     bodyTextarea: !!bodyTextarea,
                        //     bodyDataTextarea: !!bodyDataTextarea,
                        //     bodyEditDiv: !!bodyEditDiv,
                        //     bodyDisplayDiv: !!bodyDisplayDiv
                        // });
                        clearInterval(interval);
                    }
                }
            }, 150); // Check every 150ms
        } else {
            console.log('ℹ️ No generated data to fill');
        }
    }

})();
