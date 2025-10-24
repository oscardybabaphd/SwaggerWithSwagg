// SwaggerWithSwagg - Enhanced Swagger UI with Postman-like interface
(function() {
    'use strict';

    // Configuration (will be set by the page)
    let SWAGGER_ENDPOINT = '/swagger/v1/swagger.json';
    
    // Cache for swagger specification to avoid repeated fetches
    let swaggerSpecCache = null;
    let swaggerSpecPromise = null;

    // Utility: Fetch and cache swagger specification
    async function getSwaggerSpec(forceRefresh = false) {
        // Return cached spec if available and not forcing refresh
        if (swaggerSpecCache && !forceRefresh) {
            return swaggerSpecCache;
        }
        
        // If a fetch is already in progress, return that promise
        if (swaggerSpecPromise && !forceRefresh) {
            return swaggerSpecPromise;
        }
        
        // Fetch the swagger spec
        swaggerSpecPromise = fetch(SWAGGER_ENDPOINT)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(spec => {
                swaggerSpecCache = spec;
                swaggerSpecPromise = null;
                return spec;
            })
            .catch(error => {
                swaggerSpecPromise = null;
                throw error;
            });
        
        return swaggerSpecPromise;
    }

    // Clear cache (useful when switching versions)
    function clearSwaggerSpecCache() {
        swaggerSpecCache = null;
        swaggerSpecPromise = null;
    }

    // Expose getSwaggerSpec globally for use in HTML script tags
    window.getSwaggerSpec = getSwaggerSpec;

    // Utility: Syntax highlight JSON
    window.syntaxHighlightJSON = function(json) {
        if (typeof json !== 'string') {
            json = JSON.stringify(json, null, 2);
        }
        
        json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        
        return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
            let cls = 'number';
            if (/^"/.test(match)) {
                if (/:$/.test(match)) {
                    cls = 'key';
                    match = match.slice(0, -1); // Remove the colon
                    return '<span style="color: #9cdcfe;">' + match + '</span>:';
                } else {
                    cls = 'string';
                    return '<span style="color: #ce9178;">' + match + '</span>';
                }
            } else if (/true|false/.test(match)) {
                cls = 'boolean';
                return '<span style="color: #569cd6;">' + match + '</span>';
            } else if (/null/.test(match)) {
                cls = 'null';
                return '<span style="color: #569cd6;">' + match + '</span>';
            } else {
                return '<span style="color: #b5cea8;">' + match + '</span>';
            }
        });
    };

    // Initialize the application
    window.initSwaggerWithSwagg = function(config) {
        SWAGGER_ENDPOINT = config.swaggerEndpoint || SWAGGER_ENDPOINT;
        window.currentSwaggerEndpoint = SWAGGER_ENDPOINT; // Store for API info link
        
        // Clear cache when switching endpoints
        clearSwaggerSpecCache();
        
        // Load minimized tabs from localStorage
        loadMinimizedTabs();
        
        initializeSwaggerUI();
    };


    // Initialize Swagger UI
    function initializeSwaggerUI() {
        const ui = SwaggerUIBundle({
            url: SWAGGER_ENDPOINT,
            dom_id: '#swagger-ui',
            deepLinking: true,
            validatorUrl: null,
            docExpansion: 'none',
            defaultModelsExpandDepth: -1,
            defaultModelExpandDepth: -1,
            filter: false,
            tryItOutEnabled: true,
            displayRequestDuration: true,
            presets: [
                SwaggerUIBundle.presets.apis,
                SwaggerUIStandalonePreset
            ],
            plugins: [
                SwaggerUIBundle.plugins.DownloadUrl
            ],
            layout: 'StandaloneLayout',
            onComplete: () => {
                loadApiTree();
                // Hide all operations by default
                collapseAllOperations();
            }
        });

        window.swaggerUI = ui;
    }

    // Collapse all operations on load
    function collapseAllOperations() {
        // Collapse all tag sections
        const tagButtons = document.querySelectorAll('.opblock-tag-section button');
        tagButtons.forEach(button => {
            const section = button.closest('.opblock-tag-section');
            if (section && !section.classList.contains('is-open')) {
                // Already collapsed
            } else if (section) {
                button.click(); // Collapse it
            }
        });
    }

    // API Tree Management
    async function loadApiTree() {
        try {
            const spec = await getSwaggerSpec();
            renderApiInfo(spec);
            renderApiTree(spec);
        } catch (e) {
            console.error('Failed to load API tree:', e);
            document.getElementById('apiTree').innerHTML = `
                <li class="empty-state">
                    <p>Failed to load API endpoints</p>
                </li>
            `;
        }
    }

    // Render API information card
    function renderApiInfo(spec) {
        const info = spec.info || {};
        
        // Update title
        const titleEl = document.getElementById('apiInfoTitle');
        if (titleEl && info.title) {
            titleEl.textContent = info.title;
        }
        
        // Update version
        const versionEl = document.getElementById('apiInfoVersion');
        if (versionEl && info.version) {
            versionEl.textContent = info.version;
        }
        
        // Update description
        const descEl = document.getElementById('apiInfoDesc');
        const descRowEl = document.getElementById('apiInfoDescRow');
        if (descEl && info.description) {
            descEl.textContent = info.description;
            if (descRowEl) descRowEl.style.display = 'flex';
        }
        
        // Update contact
        const contactEl = document.getElementById('apiInfoContact');
        const contactRowEl = document.getElementById('apiInfoContactRow');
        if (contactEl && info.contact) {
            const contact = info.contact;
            let contactText = '';
            if (contact.name) contactText += contact.name;
            if (contact.email) contactText += (contactText ? ' - ' : '') + contact.email;
            if (contactText) {
                contactEl.textContent = contactText;
                if (contactRowEl) contactRowEl.style.display = 'flex';
            }
        }
        
        // Update swagger.json link
        const specLinkEl = document.getElementById('apiInfoSpecLink');
        const specRowEl = document.getElementById('apiInfoSpecRow');
        if (specLinkEl && window.currentSwaggerEndpoint) {
            specLinkEl.href = window.currentSwaggerEndpoint;
            if (specRowEl) specRowEl.style.display = 'flex';
        }
    }

    function renderApiTree(spec) {
        const apiTree = document.getElementById('apiTree');
        const paths = spec.paths || {};
        const securitySchemes = spec.components?.securitySchemes || {};
        const globalSecurity = spec.security || [];
        
        // Group endpoints by tags
        const groupedEndpoints = {};
        
        Object.keys(paths).forEach(path => {
            Object.keys(paths[path]).forEach(method => {
                const endpoint = paths[path][method];
                const tags = endpoint.tags || ['Default'];
                
                // Check if endpoint requires auth
                const operationSecurity = endpoint.security !== undefined ? endpoint.security : globalSecurity;
                const requiresAuth = operationSecurity.length > 0;
                
                tags.forEach(tag => {
                    if (!groupedEndpoints[tag]) {
                        groupedEndpoints[tag] = [];
                    }
                    groupedEndpoints[tag].push({
                        path: path,
                        method: method.toUpperCase(),
                        summary: endpoint.summary || endpoint.operationId || path,
                        operationId: endpoint.operationId,
                        requiresAuth: requiresAuth
                    });
                });
            });
        });

        // Render tree
        const html = Object.keys(groupedEndpoints).sort().map(tag => {
            const endpoints = groupedEndpoints[tag];
            const folderId = `folder-${tag.replace(/\s+/g, '-').toLowerCase()}`;
            
            const endpointsHtml = endpoints.map(ep => {
                const methodClass = `method-${ep.method.toLowerCase()}`;
                const lockIcon = ep.requiresAuth 
                    ? `<svg class="endpoint-lock locked" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" title="Requires authentication">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                        <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                       </svg>`
                    : `<svg class="endpoint-lock unlocked" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" title="Anonymous access">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                        <path d="M7 11V7a5 5 0 0 1 9.9-1"></path>
                       </svg>`;
                
                return `
                    <li class="endpoint-item ${ep.requiresAuth ? 'requires-auth' : 'anonymous'}" data-path="${escapeHtml(ep.path)}" data-method="${escapeHtml(ep.method)}" data-tag="${escapeHtml(tag)}" onclick="scrollToEndpoint('${escapeHtml(ep.operationId || ep.path)}', '${escapeHtml(ep.method)}', '${escapeHtml(ep.path)}')">
                        ${lockIcon}
                        <span class="endpoint-method ${methodClass}">${ep.method}</span>
                        <span class="endpoint-path">${escapeHtml(ep.path)}</span>
                    </li>
                `;
            }).join('');
            
            return `
                <li class="api-folder" data-tag="${escapeHtml(tag)}">
                    <div class="folder-header" onclick="toggleFolder('${folderId}')">
                        <span class="folder-icon">▶</span>
                        <span class="folder-name">📂 ${escapeHtml(tag)}</span>
                        <span class="folder-count">${endpoints.length}</span>
                    </div>
                    <ul class="folder-endpoints" id="${folderId}">
                        ${endpointsHtml}
                    </ul>
                </li>
            `;
        }).join('');

        apiTree.innerHTML = html || `
            <li class="empty-state">
                <p>No endpoints found</p>
            </li>
        `;
    }

    window.toggleFolder = function(folderId) {
        const folder = document.getElementById(folderId);
        const header = folder.previousElementSibling;
        
        folder.classList.toggle('expanded');
        header.classList.toggle('expanded');
    };

    // Show endpoint detail in the main area
    window.scrollToEndpoint = async function(operationId, method, path) {
        // Hide welcome message
        const welcomeMessage = document.getElementById('welcomeMessage');
        if (welcomeMessage) {
            welcomeMessage.style.display = 'none';
        }

        // Show endpoint detail
        const detailContainer = document.getElementById('endpointDetail');
        if (!detailContainer) return;

        detailContainer.classList.add('active');

        try {
            // Use cached OpenAPI spec to get endpoint details
            const spec = await getSwaggerSpec();

            // Find the endpoint in the spec
            const pathItem = spec.paths[path];
            if (!pathItem || !pathItem[method.toLowerCase()]) {
                console.error('Endpoint not found:', method, path);
                return;
            }

            const operation = pathItem[method.toLowerCase()];
            
            // Debug: Log the entire operation to see what we're getting
            console.log('Full operation object:', JSON.stringify(operation, null, 2));
            console.log('Summary:', operation.summary);
            console.log('Description:', operation.description);
            console.log('Tags:', operation.tags);
            
            // Build the detail view
            const html = buildEndpointDetailView(method, path, operation, spec);
            detailContainer.innerHTML = html;

            // Scroll to top
            detailContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });

        } catch (e) {
            console.error('Failed to load endpoint details:', e);
            detailContainer.innerHTML = `
                <div class="detail-section">
                    <h3>Error Loading Endpoint</h3>
                    <p style="color: var(--text-secondary);">Failed to load endpoint details. Please try again.</p>
                </div>
            `;
        }
    };

    // Build the endpoint detail view HTML
    function buildEndpointDetailView(method, path, operation, spec) {
        const methodClass = `method-${method.toLowerCase()}`;
        const summary = operation.summary || '';
        const description = operation.description || '';
        const operationId = operation.operationId || `${method.toLowerCase()}_${path.replace(/\//g, '_')}`;

        console.log('Operation details:', { method, path, summary, description, operation });

        // Check for security requirements
        const securitySchemes = spec.components?.securitySchemes || {};
        const operationSecurity = operation.security || spec.security || [];
        const requiresAuth = operationSecurity.length > 0;
        
        let securityBadges = '';
        if (requiresAuth) {
            operationSecurity.forEach(secReq => {
                Object.keys(secReq).forEach(schemeName => {
                    const scheme = securitySchemes[schemeName];
                    if (scheme) {
                        const schemeType = scheme.type === 'http' && scheme.scheme === 'bearer' ? 'Bearer' : 
                                         scheme.type === 'apiKey' ? 'API Key' : scheme.type;
                        securityBadges += `<span class="security-badge" title="${escapeHtml(scheme.description || '')}">${escapeHtml(schemeType)}</span>`;
                    }
                });
            });
        }

        let html = `
            <div class="detail-header">
                <div>
                    <span class="detail-method ${methodClass}">${method.toUpperCase()}</span>
                    <span class="detail-path">${path}</span>
                    ${securityBadges}
                </div>
                ${summary ? `<div class="detail-summary">${escapeHtml(summary)}</div>` : ''}
                ${description ? `<div class="detail-description">${escapeHtml(description)}</div>` : ''}
            </div>
        `;

        // Parameters
        if (operation.parameters && operation.parameters.length > 0) {
            html += `
                <div class="detail-section">
                    <h3>📋 Parameters</h3>
                    <table class="param-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Location</th>
                                <th>Type</th>
                                <th>Description</th>
                            </tr>
                        </thead>
                        <tbody>
            `;

            operation.parameters.forEach(param => {
                const required = param.required ? '<span class="param-required">REQUIRED</span>' : '';
                const paramSchema = param.schema || {};
                const paramType = paramSchema.type || param.type || 'string';
                const paramEnum = paramSchema.enum || param.enum;
                const paramDesc = param.description || '';
                
                // Determine display type and enum values
                let typeDisplay = paramType;
                let enumValuesDisplay = '';
                
                if (paramEnum && paramEnum.length > 0) {
                    typeDisplay = 'enum';
                    const enumValues = paramEnum.map(v => `<code style="background: var(--bg-tertiary); padding: 2px 6px; border-radius: 3px; font-size: 12px; margin: 2px;">${escapeHtml(String(v))}</code>`).join(' ');
                    enumValuesDisplay = `<div style="margin-top: 6px;"><small style="color: var(--text-secondary);">Possible values:</small><br/><div style="margin-top: 4px;">${enumValues}</div></div>`;
                }
                
                html += `
                    <tr>
                        <td><span class="param-name">${param.name}</span>${required}</td>
                        <td>${param.in}</td>
                        <td><span class="param-type">${typeDisplay}</span></td>
                        <td>${paramDesc}${enumValuesDisplay}</td>
                    </tr>
                `;
            });

            html += `
                        </tbody>
                    </table>
                </div>
            `;
        }

        // Request Body
        if (operation.requestBody) {
            const content = operation.requestBody.content;
            if (content) {
                const requestBodyDesc = operation.requestBody.description || '';
                const requestBodyId = `request-body-${Date.now()}-${Math.random()}`;
                html += `<div class="detail-section">
                    <h3 style="cursor: pointer; user-select: none;" onclick="toggleSchemaSection('${requestBodyId}')">
                        <span id="${requestBodyId}-icon" style="display: inline-block; transition: transform 0.2s; margin-right: 8px;">▶</span>
                        📤 Request Body
                    </h3>
                    <div id="${requestBodyId}" style="display: none;">
                    ${requestBodyDesc ? `<p style="color: var(--text-secondary); margin-bottom: 12px;">${requestBodyDesc}</p>` : ''}
                `;
                
                Object.keys(content).forEach(contentType => {
                    const schema = content[contentType].schema;
                    if (schema) {
                        html += `<h4>${contentType}</h4>`;
                        
                        // Show schema structure with descriptions
                        const schemaHtml = buildSchemaHtml(schema, spec);
                        html += `<div class="schema-block">${schemaHtml}</div>`;
                        
                        // Show example
                        const schemaExample = buildSchemaExample(schema, spec);
                        const exampleJson = JSON.stringify(schemaExample, null, 2);
                        const highlightedExample = syntaxHighlightJSON(exampleJson);
                        const exampleLines = exampleJson.split('\n');
                        const exampleLineNumbers = Array.from({length: exampleLines.length}, (_, i) => i + 1).join('\n');
                        
                        html += `
                            <div style="margin-top: 16px;">
                                <h4 style="color: var(--text-secondary); font-size: 12px; font-weight: 600; margin-bottom: 8px;">Example</h4>
                                <div class="schema-block" style="border: 1px solid var(--border-color); border-radius: 4px; overflow: hidden; max-height: 400px; overflow-y: auto;">
                                    <div style="display: flex; background: var(--darker-bg);">
                                        <pre style="padding: 12px 8px; margin: 0; background: var(--darker-bg); color: var(--text-secondary); font-family: 'Monaco', 'Consolas', monospace; font-size: 12px; line-height: 1.5; text-align: right; user-select: none; border-right: 1px solid var(--border-color); min-width: 36px;">${exampleLineNumbers}</pre>
                                        <pre style="flex: 1; padding: 12px; margin: 0; background: var(--dark-bg); color: var(--text-primary); font-family: 'Monaco', 'Consolas', monospace; font-size: 12px; line-height: 1.5; overflow-x: auto;">${highlightedExample}</pre>
                                    </div>
                                </div>
                            </div>
                        `;
                    }
                });
                
                html += `</div></div>`;
            }
        }

        // Responses
        if (operation.responses) {
            const responsesId = `responses-${Date.now()}-${Math.random()}`;
            html += `<div class="detail-section">
                <h3 style="cursor: pointer; user-select: none;" onclick="toggleSchemaSection('${responsesId}')">
                    <span id="${responsesId}-icon" style="display: inline-block; transition: transform 0.2s; margin-right: 8px;">▶</span>
                    📥 Responses
                </h3>
                <div id="${responsesId}" style="display: none;">
            `;
            
            // Use only the responses defined in the OpenAPI spec
            Object.keys(operation.responses).sort().forEach(statusCode => {
                const response = operation.responses[statusCode];
                const statusClass = statusCode.startsWith('2') ? 'status-success' : 'status-error';
                
                html += `
                    <h4>
                        <span class="status-badge ${statusClass}">${statusCode}</span>
                        ${response.description || ''}
                    </h4>
                `;

                if (response.content) {
                    Object.keys(response.content).forEach(contentType => {
                        const schema = response.content[contentType].schema;
                        if (schema) {
                            html += `
                                <div style="margin-top: 8px; color: var(--text-secondary); font-size: 12px;">
                                    Content-Type: ${contentType}
                                </div>
                            `;
                            
                            // Show schema structure with descriptions
                            const schemaHtml = buildSchemaHtml(schema, spec);
                            html += `<div class="schema-block" style="margin-top: 8px;">${schemaHtml}</div>`;
                            
                            // Show example
                            const schemaExample = buildSchemaExample(schema, spec);
                            const exampleJson = JSON.stringify(schemaExample, null, 2);
                            const highlightedExample = syntaxHighlightJSON(exampleJson);
                            const exampleLines = exampleJson.split('\n');
                            const exampleLineNumbers = Array.from({length: exampleLines.length}, (_, i) => i + 1).join('\n');
                            
                            html += `
                                <div style="margin-top: 12px; color: var(--text-secondary); font-size: 12px; font-weight: 600;">
                                    Example Response:
                                </div>
                                <div class="schema-block" style="margin-top: 8px; border: 1px solid var(--border-color); border-radius: 4px; overflow: hidden; max-height: 400px; overflow-y: auto;">
                                    <div style="display: flex; background: var(--darker-bg);">
                                        <pre style="padding: 12px 8px; margin: 0; background: var(--darker-bg); color: var(--text-secondary); font-family: 'Monaco', 'Consolas', monospace; font-size: 12px; line-height: 1.5; text-align: right; user-select: none; border-right: 1px solid var(--border-color); min-width: 36px;">${exampleLineNumbers}</pre>
                                        <pre style="flex: 1; padding: 12px; margin: 0; background: var(--dark-bg); color: var(--text-primary); font-family: 'Monaco', 'Consolas', monospace; font-size: 12px; line-height: 1.5; overflow-x: auto;">${highlightedExample}</pre>
                                    </div>
                                </div>
                            `;
                        }
                    });
                }
            });
            
            html += `</div></div>`;
        }

        // Try it button
        html += `
            <div class="detail-section">
                <button class="try-it-button" onclick="openTryItPanel('${method}', '${escapeHtml(path)}', '${operationId}')">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polygon points="5 3 19 12 5 21 5 3"></polygon>
                    </svg>
                    Try it out
                </button>
                <p style="color: var(--text-secondary); font-size: 12px; margin-top: 12px;">
                    Test this endpoint with custom parameters and request body
                </p>
            </div>
        `;

        // Store operation data for Try It panel
        window.currentOperation = {
            method: method,
            path: path,
            operation: operation,
            spec: spec
        };

        return html;
    }

    // Build HTML representation of schema structure with descriptions
    function buildSchemaHtml(schema, spec, level = 0, parentPath = '') {
        if (!schema) return '<span style="color: var(--text-secondary);">No schema</span>';

        const indent = '  '.repeat(level);
        let html = '';

        // Handle $ref
        if (schema.$ref) {
            const refPath = schema.$ref.replace('#/', '').split('/');
            let refSchema = spec;
            let refName = refPath[refPath.length - 1];
            refPath.forEach(part => {
                refSchema = refSchema[part];
            });
            
            const uniqueId = `schema-${parentPath}-${refName}-${Math.random().toString(36).substr(2, 9)}`;
            
            html += `<div style="margin-left: ${level * 20}px;">`;
            html += `<span style="color: #4EC9B0; font-weight: 600; cursor: pointer;" onclick="toggleSchemaSection('${uniqueId}')">`;
            html += `<span id="${uniqueId}-icon" style="display: inline-block; width: 12px; transition: transform 0.2s;">▶</span> `;
            html += `${refName}</span>`;
            if (refSchema.description) {
                html += ` <span style="color: var(--text-secondary); font-style: italic;">// ${escapeHtml(refSchema.description)}</span>`;
            }
            html += `<div id="${uniqueId}" style="display: none;">`;
            html += buildSchemaHtml(refSchema, spec, level, `${parentPath}-${refName}`);
            html += `</div>`;
            html += `</div>`;
            return html;
        }

        // Handle array
        if (schema.type === 'array' && schema.items) {
            html += `<div style="margin-left: ${level * 20}px;">`;
            html += `<span style="color: #569CD6;">array</span> [`;
            if (schema.description) {
                html += ` <span style="color: var(--text-secondary); font-style: italic;">// ${schema.description}</span>`;
            }
            html += buildSchemaHtml(schema.items, spec, level + 1);
            html += `<div style="margin-left: ${level * 20}px;">]</div>`;
            html += `</div>`;
            return html;
        }

        // Handle enum
        if (schema.enum) {
            html += `<div style="margin-left: ${level * 20}px;">`;
            html += `<span style="color: #569CD6;">enum</span>`;
            if (schema.description) {
                html += ` <span style="color: var(--text-secondary); font-style: italic;">// ${schema.description}</span>`;
            }
            html += `<div style="margin-left: ${(level + 1) * 20}px; color: #CE9178;">`;
            schema.enum.forEach((value, index) => {
                html += `"${value}"${index < schema.enum.length - 1 ? ', ' : ''}`;
            });
            html += `</div></div>`;
            return html;
        }

        // Handle object
        if (schema.type === 'object' || schema.properties) {
            html += `<div style="margin-left: ${level * 20}px; font-family: 'Monaco', 'Consolas', monospace; font-size: 13px; line-height: 1.8;">`;
            html += `<span style="color: #D4D4D4;">{</span>`;
            
            if (schema.properties) {
                const props = Object.keys(schema.properties);
                props.forEach((propName, index) => {
                    const prop = schema.properties[propName];
                    const isRequired = schema.required && schema.required.includes(propName);
                    
                    html += `<div style="margin-left: ${(level + 1) * 20}px;">`;
                    html += `<span style="color: #9CDCFE;">"${propName}"</span>: `;
                    
                    // Show type
                    const propType = prop.type || (prop.$ref ? 'object' : 'any');
                    const typeColor = propType === 'string' ? '#CE9178' : propType === 'number' || propType === 'integer' ? '#B5CEA8' : propType === 'boolean' ? '#569CD6' : '#4EC9B0';
                    
                    if (prop.$ref) {
                        // Handle expandable nested object
                        const refPath = prop.$ref.replace('#/', '').split('/');
                        let refSchema = spec;
                        const refName = refPath[refPath.length - 1];
                        refPath.forEach(part => {
                            refSchema = refSchema[part];
                        });
                        
                        const uniqueId = `schema-${parentPath}-${propName}-${Math.random().toString(36).substr(2, 9)}`;
                        
                        html += `<span style="color: #4EC9B0; font-weight: 600; cursor: pointer;" onclick="toggleSchemaSection('${uniqueId}')">`;
                        html += `<span id="${uniqueId}-icon" style="display: inline-block; width: 12px; transition: transform 0.2s;">▶</span> `;
                        html += `${refName}</span>`;
                        
                        // Show required badge
                        if (isRequired) {
                            html += ` <span style="color: #f93e3e; font-size: 10px; font-weight: 600; background: rgba(249, 62, 62, 0.1); padding: 2px 6px; border-radius: 3px;">REQUIRED</span>`;
                        }
                        
                        // Show description
                        if (prop.description) {
                            html += `<br/><span style="color: var(--text-secondary); font-style: italic; font-size: 12px; margin-left: ${(level + 1) * 20}px;">// ${escapeHtml(prop.description)}</span>`;
                        }
                        
                        // Show property attributes (nullable, read-only, etc.)
                        html += buildPropertyAttributes(prop, level);
                        
                        // Add expandable nested schema
                        html += `<div id="${uniqueId}" style="display: none; margin-top: 8px;">`;
                        html += buildSchemaHtml(refSchema, spec, level + 1, `${parentPath}-${propName}`);
                        html += `</div>`;
                        
                    } else if (prop.type === 'array') {
                        html += `<span style="color: #569CD6;">array</span>`;
                        if (prop.items) {
                            if (prop.items.$ref) {
                                // Handle array of complex types
                                const refPath = prop.items.$ref.replace('#/', '').split('/');
                                let refSchema = spec;
                                const refName = refPath[refPath.length - 1];
                                refPath.forEach(part => {
                                    refSchema = refSchema[part];
                                });
                                
                                const uniqueId = `schema-${parentPath}-${propName}-arr-${Math.random().toString(36).substr(2, 9)}`;
                                
                                html += `&lt;<span style="color: #4EC9B0; font-weight: 600; cursor: pointer;" onclick="toggleSchemaSection('${uniqueId}')">`;
                                html += `<span id="${uniqueId}-icon" style="display: inline-block; width: 12px; transition: transform 0.2s;">▶</span> `;
                                html += `${refName}</span>&gt;`;
                                
                                // Show required badge
                                if (isRequired) {
                                    html += ` <span style="color: #f93e3e; font-size: 10px; font-weight: 600; background: rgba(249, 62, 62, 0.1); padding: 2px 6px; border-radius: 3px;">REQUIRED</span>`;
                                }
                                
                                // Show description
                                if (prop.description) {
                                    html += `<br/><span style="color: var(--text-secondary); font-style: italic; font-size: 12px; margin-left: ${(level + 1) * 20}px;">// ${escapeHtml(prop.description)}</span>`;
                                }
                                
                                // Show property attributes
                                html += buildPropertyAttributes(prop, level);
                                
                                // Add expandable nested schema
                                html += `<div id="${uniqueId}" style="display: none; margin-top: 8px;">`;
                                html += buildSchemaHtml(refSchema, spec, level + 1, `${parentPath}-${propName}`);
                                html += `</div>`;
                            } else {
                                const itemType = prop.items.type || 'object';
                                html += `&lt;<span style="color: ${typeColor};">${itemType}</span>&gt;`;
                                
                                // Show required badge
                                if (isRequired) {
                                    html += ` <span style="color: #f93e3e; font-size: 10px; font-weight: 600; background: rgba(249, 62, 62, 0.1); padding: 2px 6px; border-radius: 3px;">REQUIRED</span>`;
                                }
                                
                                // Show description
                                if (prop.description) {
                                    html += `<br/><span style="color: var(--text-secondary); font-style: italic; font-size: 12px; margin-left: ${(level + 1) * 20}px;">// ${escapeHtml(prop.description)}</span>`;
                                }
                                
                                // Show property attributes
                                html += buildPropertyAttributes(prop, level);
                            }
                        }
                    } else if (prop.enum) {
                        html += `<span style="color: #569CD6;">enum</span>`;
                        
                        // Show required badge
                        if (isRequired) {
                            html += ` <span style="color: #f93e3e; font-size: 10px; font-weight: 600; background: rgba(249, 62, 62, 0.1); padding: 2px 6px; border-radius: 3px;">REQUIRED</span>`;
                        }
                        
                        // Show description
                        if (prop.description) {
                            html += `<br/><span style="color: var(--text-secondary); font-style: italic; font-size: 12px; margin-left: ${(level + 1) * 20}px;">// ${escapeHtml(prop.description)}</span>`;
                        }
                        
                        // Show enum values
                        html += `<div style="color: var(--text-secondary); font-size: 11px; margin-left: ${(level + 1) * 20}px;">`;
                        html += `Values: ${prop.enum.map(v => `"${v}"`).join(', ')}`;
                        html += `</div>`;
                        
                        // Show property attributes
                        html += buildPropertyAttributes(prop, level);
                    } else {
                        html += `<span style="color: ${typeColor};">${propType}</span>`;
                        if (prop.format) {
                            html += `<span style="color: var(--text-secondary); font-size: 11px;"> (${prop.format})</span>`;
                        }
                        
                        // Show required badge
                        if (isRequired) {
                            html += ` <span style="color: #f93e3e; font-size: 10px; font-weight: 600; background: rgba(249, 62, 62, 0.1); padding: 2px 6px; border-radius: 3px;">REQUIRED</span>`;
                        }
                        
                        // Show description
                        if (prop.description) {
                            html += `<br/><span style="color: var(--text-secondary); font-style: italic; font-size: 12px; margin-left: ${(level + 1) * 20}px;">// ${escapeHtml(prop.description)}</span>`;
                        }
                        
                        // Show property attributes (nullable, default, constraints, etc.)
                        html += buildPropertyAttributes(prop, level);
                    }
                    
                    html += `</div>`;
                });
            }
            
            html += `<div style="margin-left: ${level * 20}px;"><span style="color: #D4D4D4;">}</span></div>`;
            html += `</div>`;
            return html;
        }

        // Handle primitives
        const primitiveType = schema.type || 'any';
        const typeColor = primitiveType === 'string' ? '#CE9178' : primitiveType === 'number' || primitiveType === 'integer' ? '#B5CEA8' : primitiveType === 'boolean' ? '#569CD6' : '#D4D4D4';
        
        html += `<span style="color: ${typeColor};">${primitiveType}</span>`;
        if (schema.format) {
            html += `<span style="color: var(--text-secondary); font-size: 11px;"> (${schema.format})</span>`;
        }
        if (schema.description) {
            html += ` <span style="color: var(--text-secondary); font-style: italic;">// ${escapeHtml(schema.description)}</span>`;
        }
        
        return html;
    }

    // Build schema example from OpenAPI schema
    function buildSchemaExample(schema, spec) {
        if (!schema) return {};

        // Handle $ref
        if (schema.$ref) {
            const refPath = schema.$ref.replace('#/', '').split('/');
            let refSchema = spec;
            refPath.forEach(part => {
                refSchema = refSchema[part];
            });
            return buildSchemaExample(refSchema, spec);
        }

        // Handle array
        if (schema.type === 'array' && schema.items) {
            return [buildSchemaExample(schema.items, spec)];
        }

        // Handle object
        if (schema.type === 'object' || schema.properties) {
            const example = {};
            if (schema.properties) {
                Object.keys(schema.properties).forEach(propName => {
                    const prop = schema.properties[propName];
                    example[propName] = buildSchemaExample(prop, spec);
                });
            }
            return example;
        }

        // Handle primitives with examples
        if (schema.example !== undefined) {
            return schema.example;
        }

        // Default values by type
        switch (schema.type) {
            case 'string':
                return schema.format === 'date-time' ? '2024-01-01T00:00:00Z' : 'string';
            case 'integer':
            case 'number':
                return 0;
            case 'boolean':
                return true;
            default:
                return null;
        }
    }

    // Build file upload fields from schema
    function buildFileUploadFields(schema, spec) {
        if (!schema) return '<div style="color: var(--text-secondary);">No schema defined for file upload.</div>';

        // Handle $ref
        if (schema.$ref) {
            const refPath = schema.$ref.replace('#/', '').split('/');
            let refSchema = spec;
            refPath.forEach(part => {
                refSchema = refSchema[part];
            });
            return buildFileUploadFields(refSchema, spec);
        }

        let html = '';

        // Check if schema has properties (multipart fields)
        if (schema.properties) {
            Object.keys(schema.properties).forEach(propName => {
                const prop = schema.properties[propName];
                const isRequired = schema.required && schema.required.includes(propName);
                
                // Check if it's a file field (binary format) or an array of files
                const isFile = prop.type === 'string' && prop.format === 'binary';
                const isMultipleFiles = prop.type === 'array' && prop.items && prop.items.type === 'string' && prop.items.format === 'binary';
                
                html += `
                    <div style="margin-bottom: 16px;">
                        <label style="display: block; color: var(--text-primary); font-size: 13px; font-weight: 600; margin-bottom: 6px;">
                            ${escapeHtml(propName)}
                            ${isRequired ? '<span style="color: #f93e3e;">*</span>' : ''}
                            <span style="color: var(--text-secondary); font-weight: normal; font-size: 12px;">(${isFile ? 'file' : isMultipleFiles ? 'multiple files' : prop.type || 'string'})</span>
                        </label>
                        ${prop.description ? `<div style="color: var(--text-secondary); font-size: 12px; margin-bottom: 6px;">${escapeHtml(prop.description)}</div>` : ''}
                        ${isFile || isMultipleFiles ? `
                            <input 
                                type="file" 
                                id="file-${escapeHtml(propName)}" 
                                name="${escapeHtml(propName)}"
                                ${isMultipleFiles ? 'multiple' : ''}
                                ${isRequired ? 'required' : ''}
                                style="width: 100%; padding: 8px; background: var(--dark-bg); border: 1px solid var(--border-color); border-radius: 4px; color: var(--text-primary); font-family: inherit; font-size: 13px; cursor: pointer;"
                                onchange="handleFileSelect(this, '${escapeHtml(propName)}')"
                            />
                            <div id="file-info-${escapeHtml(propName)}" style="margin-top: 4px; font-size: 12px; color: var(--text-secondary);"></div>
                        ` : `
                            <input 
                                type="text" 
                                id="field-${escapeHtml(propName)}" 
                                name="${escapeHtml(propName)}"
                                placeholder="${prop.example || 'Enter ' + propName}"
                                ${isRequired ? 'required' : ''}
                                style="width: 100%; padding: 8px; background: var(--dark-bg); border: 1px solid var(--border-color); border-radius: 4px; color: var(--text-primary); font-family: 'Monaco', 'Consolas', monospace; font-size: 13px;"
                            />
                        `}
                    </div>
                `;
            });
        } else {
            // Single file upload
            html += `
                <div style="margin-bottom: 16px;">
                    <label style="display: block; color: var(--text-primary); font-size: 13px; font-weight: 600; margin-bottom: 6px;">
                        File
                        <span style="color: #f93e3e;">*</span>
                    </label>
                    <input 
                        type="file" 
                        id="file-upload" 
                        name="file"
                        required
                        style="width: 100%; padding: 8px; background: var(--dark-bg); border: 1px solid var(--border-color); border-radius: 4px; color: var(--text-primary); font-family: inherit; font-size: 13px; cursor: pointer;"
                        onchange="handleFileSelect(this, 'file')"
                    />
                    <div id="file-info-file" style="margin-top: 4px; font-size: 12px; color: var(--text-secondary);"></div>
                </div>
            `;
        }

        return html;
    }

    // Handle file selection
    window.handleFileSelect = function(input, fieldName) {
        const fileInfo = document.getElementById(`file-info-${fieldName}`);
        if (!fileInfo) return;

        if (input.files && input.files.length > 0) {
            if (input.files.length === 1) {
                // Single file
                const file = input.files[0];
                const sizeMB = (file.size / 1024 / 1024).toFixed(2);
                fileInfo.innerHTML = `📎 ${escapeHtml(file.name)} (${sizeMB} MB, ${file.type || 'unknown type'})`;
                fileInfo.style.color = 'var(--green)';
            } else {
                // Multiple files
                let filesHtml = `<div style="color: var(--green);">📎 ${input.files.length} files selected:</div>`;
                filesHtml += '<ul style="margin: 4px 0 0 0; padding-left: 20px; list-style: disc;">';
                Array.from(input.files).forEach(file => {
                    const sizeMB = (file.size / 1024 / 1024).toFixed(2);
                    filesHtml += `<li style="margin: 2px 0;">${escapeHtml(file.name)} (${sizeMB} MB, ${file.type || 'unknown type'})</li>`;
                });
                filesHtml += '</ul>';
                fileInfo.innerHTML = filesHtml;
                fileInfo.style.color = 'var(--green)';
            }
        } else {
            fileInfo.innerHTML = '';
        }
    };

    // Open Swagger UI for testing the endpoint
    window.openSwaggerUIForEndpoint = function(operationId, method, path) {
        // Hide welcome and detail view
        const welcomeMessage = document.getElementById('welcomeMessage');
        const detailContainer = document.getElementById('endpointDetail');
        
        if (welcomeMessage) welcomeMessage.style.display = 'none';
        if (detailContainer) detailContainer.classList.remove('active');

        // Show Swagger UI
        const swaggerUI = document.getElementById('swagger-ui');
        if (swaggerUI) {
            swaggerUI.style.display = 'block';
        }

        // Wait for UI to render, then expand and scroll to the operation
        setTimeout(() => {
            // Try to find by operation ID first
            let opblock = document.querySelector(`[id$="${operationId}"]`);
            
            // If not found, try by method and path
            if (!opblock) {
                const opblocks = document.querySelectorAll('.opblock');
                opblocks.forEach(block => {
                    const pathElem = block.querySelector('.opblock-summary-path');
                    const methodElem = block.querySelector('.opblock-summary-method');
                    if (pathElem && methodElem) {
                        const blockPath = pathElem.textContent.trim();
                        const blockMethod = methodElem.textContent.trim().toLowerCase();
                        if (blockPath === path && blockMethod === method.toLowerCase()) {
                            opblock = block;
                        }
                    }
                });
            }

            if (opblock) {
                // Expand the tag section if collapsed
                const tagSection = opblock.closest('.opblock-tag-section');
                if (tagSection && !tagSection.classList.contains('is-open')) {
                    const tagButton = tagSection.querySelector('.opblock-tag');
                    if (tagButton) tagButton.click();
                }

                // Wait for tag to expand, then expand the operation
                setTimeout(() => {
                    if (!opblock.classList.contains('is-open')) {
                        const summary = opblock.querySelector('.opblock-summary');
                        if (summary) {
                            summary.click();
                            
                            // Scroll to it after expansion
                            setTimeout(() => {
                                opblock.scrollIntoView({ 
                                    behavior: 'smooth', 
                                    block: 'start',
                                    inline: 'nearest'
                                });
                            }, 300);
                        }
                    } else {
                        // Already open, just scroll
                        opblock.scrollIntoView({ 
                            behavior: 'smooth', 
                            block: 'start',
                            inline: 'nearest'
                        });
                    }
                }, 200);
            }
        }, 100);
    };

    // Toggle schema section expand/collapse
    window.toggleSchemaSection = function(sectionId) {
        const section = document.getElementById(sectionId);
        const icon = document.getElementById(`${sectionId}-icon`);
        
        if (section && icon) {
            const isHidden = section.style.display === 'none' || section.style.display === '';
            section.style.display = isHidden ? 'block' : 'none';
            icon.style.transform = isHidden ? 'rotate(90deg)' : 'rotate(0deg)';
            icon.textContent = isHidden ? '▼' : '▶';
        }
    };

    // Build property attributes display (nullable, default, constraints, etc.)
    function buildPropertyAttributes(prop, level) {
        const attributes = [];
        
        // Nullable
        if (prop.nullable === true) {
            attributes.push({ label: 'nullable', value: 'true', color: '#569CD6' });
        }
        
        // Read-only / Write-only
        if (prop.readOnly === true) {
            attributes.push({ label: 'read-only', value: 'true', color: '#CE9178' });
        }
        if (prop.writeOnly === true) {
            attributes.push({ label: 'write-only', value: 'true', color: '#CE9178' });
        }
        
        // Default value
        if (prop.default !== undefined) {
            const defaultVal = typeof prop.default === 'string' ? `"${prop.default}"` : JSON.stringify(prop.default);
            attributes.push({ label: 'default', value: defaultVal, color: '#B5CEA8' });
        }
        
        // String constraints
        if (prop.minLength !== undefined) {
            attributes.push({ label: 'minLength', value: prop.minLength, color: '#B5CEA8' });
        }
        if (prop.maxLength !== undefined) {
            attributes.push({ label: 'maxLength', value: prop.maxLength, color: '#B5CEA8' });
        }
        if (prop.pattern) {
            attributes.push({ label: 'pattern', value: `"${prop.pattern}"`, color: '#CE9178' });
        }
        
        // Number constraints
        if (prop.minimum !== undefined) {
            attributes.push({ label: 'minimum', value: prop.minimum, color: '#B5CEA8' });
        }
        if (prop.maximum !== undefined) {
            attributes.push({ label: 'maximum', value: prop.maximum, color: '#B5CEA8' });
        }
        if (prop.exclusiveMinimum !== undefined) {
            attributes.push({ label: 'exclusiveMinimum', value: prop.exclusiveMinimum, color: '#B5CEA8' });
        }
        if (prop.exclusiveMaximum !== undefined) {
            attributes.push({ label: 'exclusiveMaximum', value: prop.exclusiveMaximum, color: '#B5CEA8' });
        }
        if (prop.multipleOf !== undefined) {
            attributes.push({ label: 'multipleOf', value: prop.multipleOf, color: '#B5CEA8' });
        }
        
        // Array constraints
        if (prop.minItems !== undefined) {
            attributes.push({ label: 'minItems', value: prop.minItems, color: '#B5CEA8' });
        }
        if (prop.maxItems !== undefined) {
            attributes.push({ label: 'maxItems', value: prop.maxItems, color: '#B5CEA8' });
        }
        if (prop.uniqueItems === true) {
            attributes.push({ label: 'uniqueItems', value: 'true', color: '#569CD6' });
        }
        
        // Example
        if (prop.example !== undefined && prop.example !== prop.default) {
            const exampleVal = typeof prop.example === 'string' ? `"${prop.example}"` : JSON.stringify(prop.example);
            attributes.push({ label: 'example', value: exampleVal, color: '#DCDCAA' });
        }
        
        // Deprecated
        if (prop.deprecated === true) {
            attributes.push({ label: 'deprecated', value: 'true', color: '#f93e3e' });
        }
        
        if (attributes.length === 0) {
            return '';
        }
        
        // Build HTML for attributes
        let html = `<div style="margin-left: ${(level + 1) * 20}px; margin-top: 4px; font-size: 11px;">`;
        attributes.forEach((attr, index) => {
            html += `<span style="color: var(--text-secondary);">${attr.label}: </span>`;
            html += `<span style="color: ${attr.color};">${attr.value}</span>`;
            if (index < attributes.length - 1) {
                html += `<span style="color: var(--text-secondary); margin: 0 8px;">|</span>`;
            }
        });
        html += `</div>`;
        
        return html;
    }

    // Search functionality
    window.searchCollections = function(searchTerm) {
        const term = searchTerm.toLowerCase().trim();
        const folders = document.querySelectorAll('.api-folder');
        
        if (!term) {
            // Show all folders and endpoints
            folders.forEach(folder => {
                folder.style.display = '';
                const endpoints = folder.querySelectorAll('.endpoint-item');
                endpoints.forEach(ep => ep.style.display = '');
            });
            return;
        }

        folders.forEach(folder => {
            const tag = folder.dataset.tag.toLowerCase();
            const endpoints = folder.querySelectorAll('.endpoint-item');
            let hasVisibleEndpoints = false;

            endpoints.forEach(ep => {
                const path = ep.dataset.path.toLowerCase();
                const method = ep.dataset.method.toLowerCase();
                
                if (path.includes(term) || method.includes(term) || tag.includes(term)) {
                    ep.style.display = '';
                    hasVisibleEndpoints = true;
                } else {
                    ep.style.display = 'none';
                }
            });

            // Show folder if it has visible endpoints or tag matches
            if (hasVisibleEndpoints || tag.includes(term)) {
                folder.style.display = '';
                // Auto-expand folder if it has matches
                if (hasVisibleEndpoints) {
                    const folderId = folder.querySelector('.folder-endpoints').id;
                    const folderElem = document.getElementById(folderId);
                    const header = folderElem.previousElementSibling;
                    if (!folderElem.classList.contains('expanded')) {
                        folderElem.classList.add('expanded');
                        header.classList.add('expanded');
                    }
                }
            } else {
                folder.style.display = 'none';
            }
        });
    };

    // Cache key generator for Try It Out
    function getTryItCacheKey(method, path) {
        return `tryit_${method.toUpperCase()}_${path}`;
    }

    // Save request/response to cache
    function saveTryItCache(method, path, data) {
        try {
            const key = getTryItCacheKey(method, path);
            localStorage.setItem(key, JSON.stringify(data));
        } catch (e) {
            console.error('Failed to save cache:', e);
        }
    }

    // Load request/response from cache
    function loadTryItCache(method, path) {
        try {
            const key = getTryItCacheKey(method, path);
            const cached = localStorage.getItem(key);
            return cached ? JSON.parse(cached) : null;
        } catch (e) {
            console.error('Failed to load cache:', e);
            return null;
        }
    }

    // Try It Out Panel Functions
    window.openTryItPanel = function(method, path, operationId) {
        const panel = document.getElementById('tryItPanel');
        const overlay = document.getElementById('tryItOverlay');
        
        if (!panel || !overlay) return;

        // Check if this endpoint is already minimized
        const tabKey = `${method}:${path}`;
        if (minimizedTabs.has(tabKey)) {
            // Restore the minimized tab instead of creating a new one
            restoreMinimizedTab(tabKey);
            return;
        }

        const op = window.currentOperation;
        if (!op) return;

        // Load cached data if available
        const cachedData = loadTryItCache(method, path);

        // Build header content
        let headerHtml = `
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <span class="detail-method method-${method.toLowerCase()}" style="display: inline-block; margin-right: 12px;">${method.toUpperCase()}</span>
                    <span style="color: var(--text-primary); font-family: 'Monaco', 'Consolas', monospace; font-size: 16px;">${path}</span>
                </div>
                <div style="display: flex; gap: 8px;">
                    <button onclick="minimizeTryItPanel('${method}', '${escapeHtml(path)}')" title="Minimize" style="background: transparent; border: none; color: var(--text-secondary); cursor: pointer; font-size: 18px; padding: 0; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; border-radius: 4px; transition: all 0.2s;" onmouseover="this.style.background='var(--hover-bg)'; this.style.color='var(--text-primary)'" onmouseout="this.style.background='transparent'; this.style.color='var(--text-secondary)'">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                        </svg>
                    </button>
                    <button onclick="togglePanelSize()" id="maximizeBtn" title="Maximize" style="background: transparent; border: none; color: var(--text-secondary); cursor: pointer; font-size: 20px; padding: 0; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; border-radius: 4px; transition: all 0.2s;" onmouseover="this.style.background='var(--hover-bg)'; this.style.color='var(--text-primary)'" onmouseout="this.style.background='transparent'; this.style.color='var(--text-secondary)'">
                        ⛶
                    </button>
                    <button onclick="closeTryItPanel()" style="background: transparent; border: none; color: var(--text-secondary); cursor: pointer; font-size: 24px; padding: 0; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; border-radius: 4px; transition: all 0.2s;" onmouseover="this.style.background='var(--hover-bg)'; this.style.color='var(--text-primary)'" onmouseout="this.style.background='transparent'; this.style.color='var(--text-secondary)'">
                        ×
                    </button>
                </div>
            </div>
        `;

        // Build request section content
        let requestHtml = `<h3 style="color: var(--text-primary); margin-bottom: 20px; font-size: 18px;">📤 Request</h3>`;

        // Parameters Section
        if (op.operation.parameters && op.operation.parameters.length > 0) {
            requestHtml += `<div style="margin-bottom: 20px;">
                <h4 style="color: var(--text-primary); margin-bottom: 12px; font-size: 14px;">Parameters</h4>`;
            
            op.operation.parameters.forEach((param, index) => {
                const required = param.required ? ' <span style="color: #f93e3e;">*</span>' : '';
                const paramType = param.schema?.type || param.type || 'string';
                const paramFormat = param.schema?.format || param.format || '';
                const paramDefault = param.schema?.default || param.default;
                const cachedValue = cachedData?.parameters?.[param.name] || (paramDefault !== undefined ? String(paramDefault) : '');
                const paramEnum = param.schema?.enum || param.enum;
                const minLength = param.schema?.minLength || param.minLength;
                const maxLength = param.schema?.maxLength || param.maxLength;
                const pattern = param.schema?.pattern || param.pattern;
                const minimum = param.schema?.minimum || param.minimum;
                const maximum = param.schema?.maximum || param.maximum;
                
                // Build input field based on type
                let inputHtml = '';
                
                if (paramEnum && paramEnum.length > 0) {
                    // Enum - use dropdown
                    inputHtml = `
                        <select 
                            id="param-${index}" 
                            data-param-name="${param.name}"
                            data-param-in="${param.in}"
                            data-param-type="${paramType}"
                            data-param-required="${param.required || false}"
                            style="width: 100%; padding: 8px 12px; background: var(--dark-bg); border: 1px solid var(--border-color); border-radius: 4px; color: var(--text-primary); font-family: 'Monaco', 'Consolas', monospace; font-size: 13px; cursor: pointer;"
                            onchange="validateParameter(${index})"
                        >
                            ${!param.required ? `<option value="">-- Select ${param.name} --</option>` : ''}
                            ${paramEnum.map(val => `<option value="${escapeHtml(String(val))}" ${cachedValue === String(val) ? 'selected' : ''}>${escapeHtml(String(val))}</option>`).join('')}
                        </select>
                    `;
                } else if (paramType === 'boolean') {
                    // Boolean - use dropdown
                    inputHtml = `
                        <select 
                            id="param-${index}" 
                            data-param-name="${param.name}"
                            data-param-in="${param.in}"
                            data-param-type="${paramType}"
                            data-param-required="${param.required || false}"
                            style="width: 100%; padding: 8px 12px; background: var(--dark-bg); border: 1px solid var(--border-color); border-radius: 4px; color: var(--text-primary); font-family: 'Monaco', 'Consolas', monospace; font-size: 13px; cursor: pointer;"
                            onchange="validateParameter(${index})"
                        >
                            <option value="">-- Select ${param.name} --</option>
                            <option value="true" ${cachedValue === 'true' ? 'selected' : ''}>true</option>
                            <option value="false" ${cachedValue === 'false' ? 'selected' : ''}>false</option>
                        </select>
                    `;
                } else if (paramType === 'integer' || paramType === 'number') {
                    // Number input
                    const step = paramType === 'integer' ? '1' : 'any';
                    const minAttr = minimum !== undefined ? `min="${minimum}"` : '';
                    const maxAttr = maximum !== undefined ? `max="${maximum}"` : '';
                    inputHtml = `
                        <input 
                            type="number" 
                            id="param-${index}" 
                            placeholder="${param.description || ''}"
                            value="${escapeHtml(cachedValue)}"
                            step="${step}"
                            ${minAttr}
                            ${maxAttr}
                            data-param-name="${param.name}"
                            data-param-in="${param.in}"
                            data-param-type="${paramType}"
                            data-param-required="${param.required || false}"
                            data-param-format="${paramFormat}"
                            ${minimum !== undefined ? `data-param-min="${minimum}"` : ''}
                            ${maximum !== undefined ? `data-param-max="${maximum}"` : ''}
                            style="width: 100%; padding: 8px 12px; background: var(--dark-bg); border: 1px solid var(--border-color); border-radius: 4px; color: var(--text-primary); font-family: 'Monaco', 'Consolas', monospace; font-size: 13px;"
                            oninput="validateParameter(${index})"
                        />
                    `;
                } else {
                    // Text input (string, date, etc.)
                    const minLengthAttr = minLength !== undefined ? `minlength="${minLength}"` : '';
                    const maxLengthAttr = maxLength !== undefined ? `maxlength="${maxLength}"` : '';
                    const patternAttr = pattern ? `pattern="${escapeHtml(pattern)}"` : '';
                    inputHtml = `
                        <input 
                            type="text" 
                            id="param-${index}" 
                            placeholder="${param.description || ''}"
                            value="${escapeHtml(cachedValue)}"
                            ${minLengthAttr}
                            ${maxLengthAttr}
                            ${patternAttr}
                            data-param-name="${param.name}"
                            data-param-in="${param.in}"
                            data-param-type="${paramType}"
                            data-param-required="${param.required || false}"
                            data-param-format="${paramFormat}"
                            ${minLength !== undefined ? `data-param-minlength="${minLength}"` : ''}
                            ${maxLength !== undefined ? `data-param-maxlength="${maxLength}"` : ''}
                            ${pattern ? `data-param-pattern="${escapeHtml(pattern)}"` : ''}
                            style="width: 100%; padding: 8px 12px; background: var(--dark-bg); border: 1px solid var(--border-color); border-radius: 4px; color: var(--text-primary); font-family: 'Monaco', 'Consolas', monospace; font-size: 13px;"
                            oninput="validateParameter(${index})"
                        />
                    `;
                }
                
                requestHtml += `
                    <div style="margin-bottom: 12px;">
                        <label style="display: block; color: var(--text-secondary); font-size: 12px; margin-bottom: 4px;">
                            ${param.name}${required} <span style="opacity: 0.7;">(${param.in} - ${paramType}${paramFormat ? `:${paramFormat}` : ''})</span>
                        </label>
                        ${inputHtml}
                        <div id="param-error-${index}" style="display: none; color: #f93e3e; font-size: 11px; margin-top: 4px;"></div>
                    </div>
                `;
            });
            
            requestHtml += `</div>`;
        }

        // Request Body Section
        if (op.operation.requestBody) {
            const content = op.operation.requestBody.content;
            if (content) {
                // Get all available content types, prioritize application/json
                const contentTypes = Object.keys(content);
                const defaultContentType = contentTypes.includes('application/json') ? 'application/json' : contentTypes[0];
                const cachedContentType = cachedData?.contentType || defaultContentType;
                
                // Check if this is a file upload (multipart/form-data)
                const isFileUpload = cachedContentType.includes('multipart/form-data');
                
                // Get schema for the selected content type
                const schema = content[cachedContentType]?.schema || content[defaultContentType]?.schema;
                
                if (isFileUpload) {
                    // File Upload UI
                    requestHtml += `
                        <div style="margin-bottom: 20px;">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                                <h4 style="color: var(--text-primary); margin: 0; font-size: 14px;">Request Body</h4>
                                <div style="display: flex; gap: 8px; align-items: center;">
                                    <select 
                                        id="contentTypeSelector" 
                                        onchange="changeContentType('${method}', '${escapeHtml(path)}')"
                                        style="padding: 6px 12px; background: var(--dark-bg); border: 1px solid var(--border-color); border-radius: 4px; color: var(--text-primary); font-size: 12px; font-family: 'Monaco', 'Consolas', monospace; cursor: pointer; min-width: 160px;"
                                    >
                                        ${contentTypes.map(ct => `<option value="${ct}" ${ct === cachedContentType ? 'selected' : ''}>${ct}</option>`).join('')}
                                    </select>
                                </div>
                            </div>
                            
                            <div id="fileUploadContainer" style="border: 1px solid var(--border-color); border-radius: 4px; padding: 20px; background: var(--darker-bg);">
                                ${buildFileUploadFields(schema, op.spec)}
                            </div>
                        </div>
                    `;
                } else {
                    // Regular JSON/Text Body UI
                    const exampleBody = buildSchemaExample(schema, op.spec);
                    const cachedRequestBody = cachedData?.requestBody || JSON.stringify(exampleBody, null, 2);
                    const bodyStr = cachedRequestBody;
                    const highlightedJson = syntaxHighlightJSON(bodyStr);
                    const lines = bodyStr.split('\n');
                    const lineNumbers = Array.from({length: lines.length}, (_, i) => i + 1).join('\n');
                    
                    requestHtml += `
                        <div style="margin-bottom: 20px;">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                                <h4 style="color: var(--text-primary); margin: 0; font-size: 14px;">Request Body</h4>
                                <div style="display: flex; gap: 8px; align-items: center;">
                                    <select 
                                        id="contentTypeSelector" 
                                        onchange="changeContentType('${method}', '${escapeHtml(path)}')"
                                        style="padding: 6px 12px; background: var(--dark-bg); border: 1px solid var(--border-color); border-radius: 4px; color: var(--text-primary); font-size: 12px; font-family: 'Monaco', 'Consolas', monospace; cursor: pointer; min-width: 160px;"
                                    >
                                        ${contentTypes.map(ct => `<option value="${ct}" ${ct === cachedContentType ? 'selected' : ''}>${ct}</option>`).join('')}
                                    </select>
                                    <button onclick="toggleRequestBodyEdit()" id="editBodyBtn" style="padding: 4px 12px; background: transparent; border: 1px solid var(--border-color); border-radius: 4px; color: var(--text-secondary); cursor: pointer; font-size: 12px; font-weight: 600;">
                                        ✏️ Edit
                                    </button>
                                </div>
                            </div>
                            
                            <!-- Display Mode -->
                            <div id="requestBodyDisplay" style="border: 1px solid var(--border-color); border-radius: 4px; overflow: hidden; max-height: 400px; overflow-y: auto;">
                                <div style="display: flex; background: var(--darker-bg);">
                                    <pre style="padding: 12px 8px; margin: 0; background: var(--darker-bg); color: var(--text-secondary); font-family: 'Monaco', 'Consolas', monospace; font-size: 13px; line-height: 1.5; text-align: right; user-select: none; border-right: 1px solid var(--border-color); min-width: 40px;">${lineNumbers}</pre>
                                    <pre style="flex: 1; padding: 12px; margin: 0; background: var(--dark-bg); color: var(--text-primary); font-family: 'Monaco', 'Consolas', monospace; font-size: 13px; line-height: 1.5; overflow-x: auto;">${highlightedJson}</pre>
                                </div>
                            </div>
                            
                            <!-- Edit Mode (Hidden by default) -->
                            <div id="requestBodyEdit" style="display: none;">
                                <textarea 
                                    id="requestBody" 
                                    rows="12"
                                    style="width: 100%; padding: 12px; background: var(--dark-bg); border: 1px solid var(--border-color); border-radius: 4px; color: var(--text-primary); font-family: 'Monaco', 'Consolas', monospace; font-size: 13px; line-height: 1.5; resize: vertical; outline: none; box-sizing: border-box;"
                                    oninput="saveCurrentPanelState()"
                                >${bodyStr}</textarea>
                            </div>
                            
                            <textarea id="requestBodyData" style="display: none;">${bodyStr}</textarea>
                        </div>
                    `;
                }
            }
        }

        // Custom Headers Section
        const cachedHeaders = cachedData?.customHeaders || [];
        requestHtml += `
            <div style="margin-bottom: 20px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                    <h4 style="color: var(--text-primary); margin: 0; font-size: 14px;">Custom Headers</h4>
                    <button onclick="addCustomHeader()" style="padding: 4px 12px; background: var(--orange); border: none; border-radius: 4px; color: white; cursor: pointer; font-size: 12px; font-weight: 600; display: flex; align-items: center; gap: 4px;">
                        <span style="font-size: 16px;">+</span> Add Header
                    </button>
                </div>
                <div id="customHeadersContainer" style="display: flex; flex-direction: column; gap: 8px;">
                    ${cachedHeaders.length === 0 ? `
                        <div style="padding: 12px; background: var(--darker-bg); border: 1px dashed var(--border-color); border-radius: 4px; color: var(--text-secondary); font-size: 13px; text-align: center;">
                            No custom headers. Click "Add Header" to add one.
                        </div>
                    ` : ''}
                </div>
            </div>
        `;

        // Build action buttons (will be placed in sticky section)
        const actionButtonsHtml = `
            <button onclick="executeTryIt('${method}', '${escapeHtml(path)}')" class="try-it-execute-button">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polygon points="5 3 19 12 5 21 5 3"></polygon>
                </svg>
                Execute
            </button>
            <button onclick="clearTryItResponse()" style="padding: 10px 20px; background: transparent; border: 1px solid var(--border-color); border-radius: 6px; color: var(--text-secondary); cursor: pointer; font-size: 14px; font-weight: 600;">
                Clear
            </button>
        `;

        // Build response section content
        let responseHtml = `
            <h3 style="color: var(--text-primary); margin-bottom: 20px; font-size: 18px;">📥 Response</h3>
            <div id="tryItResponseContent">`;
        
        // Show cached response if available
        if (cachedData?.response) {
            const cached = cachedData.response;
            const statusColor = cached.status >= 200 && cached.status < 300 ? '#49cc90' : 
                              cached.status >= 400 && cached.status < 500 ? '#ffa500' : '#f93e3e';
            
            responseHtml += `
                <div style="margin-bottom: 16px; display: flex; justify-content: space-between; align-items: center;">
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <span style="color: ${statusColor}; font-weight: 600; font-size: 16px;">
                            ${cached.status} ${cached.statusText}
                        </span>
                        <span style="color: var(--text-secondary); font-size: 13px;">
                            ⏱ ${cached.duration}ms
                        </span>
                        <span style="color: var(--text-secondary); font-size: 12px; opacity: 0.6;">
                            (cached)
                        </span>
                    </div>
                </div>
            `;
            
            // cURL Command (collapsed by default)
            responseHtml += `
                <div style="margin-bottom: 16px;">
                    <div onclick="toggleCurlSection()" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; cursor: pointer; padding: 8px; background: var(--darker-bg); border-radius: 4px; border: 1px solid var(--border-color);">
                        <h4 style="color: var(--text-primary); margin: 0; font-size: 14px; display: flex; align-items: center; gap: 8px;">
                            <span id="curlToggleIcon" style="transition: transform 0.2s;">▶</span>
                            cURL Command
                        </h4>
                        <button onclick="event.stopPropagation(); copyCurl()" title="Copy cURL" style="padding: 4px 10px; background: transparent; border: 1px solid var(--border-color); border-radius: 4px; color: var(--text-secondary); cursor: pointer; font-size: 11px; display: flex; align-items: center; gap: 4px;">
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                            </svg>
                            Copy
                        </button>
                    </div>
                    <div id="curlSection" style="display: none; background: var(--darker-bg); border: 1px solid var(--border-color); border-radius: 4px; padding: 12px; max-height: 200px; overflow-y: auto;">
                        <pre id="curlCommand" style="margin: 0; color: var(--text-primary); font-family: 'Monaco', 'Consolas', monospace; font-size: 12px; line-height: 1.6; white-space: pre-wrap; word-wrap: break-word;">${escapeHtml(cached.curl)}</pre>
                    </div>
                </div>
            `;
            
            // Response body
            if (cached.body) {
                let bodyStr = cached.body;
                let highlightedContent;
                
                // Try to parse and prettify if it's JSON
                try {
                    const parsed = JSON.parse(bodyStr);
                    bodyStr = JSON.stringify(parsed, null, 2);
                    highlightedContent = syntaxHighlightJSON(bodyStr);
                } catch (e) {
                    // Not JSON, use as-is
                    highlightedContent = escapeHtml(bodyStr);
                }
                
                const lines = bodyStr.split('\n');
                const lineNumbers = Array.from({length: lines.length}, (_, i) => i + 1).join('\n');
                
                responseHtml += `
                    <div style="margin-bottom: 16px;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                            <h4 style="color: var(--text-primary); margin: 0; font-size: 14px;">Body</h4>
                            <button onclick="copyResponse()" title="Copy Response" style="padding: 4px 10px; background: transparent; border: 1px solid var(--border-color); border-radius: 4px; color: var(--text-secondary); cursor: pointer; font-size: 11px; display: flex; align-items: center; gap: 4px;">
                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                                </svg>
                                Copy
                            </button>
                        </div>
                        <div style="border: 1px solid var(--border-color); border-radius: 4px; overflow: hidden; max-height: 500px; overflow-y: auto;">
                            <div style="display: flex; background: var(--darker-bg);">
                                <pre style="padding: 16px 8px; margin: 0; background: var(--darker-bg); color: var(--text-secondary); font-family: 'Monaco', 'Consolas', monospace; font-size: 13px; line-height: 1.5; text-align: right; user-select: none; border-right: 1px solid var(--border-color); min-width: 40px;">${lineNumbers}</pre>
                                <pre style="flex: 1; padding: 16px 12px; margin: 0; background: var(--dark-bg); color: var(--text-primary); font-family: 'Monaco', 'Consolas', monospace; font-size: 13px; line-height: 1.5; overflow-x: auto;">${highlightedContent}</pre>
                            </div>
                        </div>
                    </div>
                `;
            }
        } else {
            // No cached response - show default message
            responseHtml += `
                <div style="padding: 40px; text-align: center; color: var(--text-secondary); opacity: 0.5;">
                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-bottom: 12px; opacity: 0.3;">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                        <polyline points="14 2 14 8 20 8"></polyline>
                    </svg>
                    <p>No response yet. Execute a request to see the response here.</p>
                </div>
            `;
        }
        
        responseHtml += `</div>
        `;

        // Update the panel with structured content
        panel.innerHTML = `
            <div class="try-it-panel-header">
                ${headerHtml}
            </div>
            <div class="try-it-panel-body">
                <div class="try-it-request-section">
                    <div class="try-it-request-content">
                        ${requestHtml}
                    </div>
                    <div class="try-it-request-actions">
                        ${actionButtonsHtml}
                    </div>
                </div>
                <div class="try-it-response-section" id="tryItResponse">
                    ${responseHtml}
                </div>
            </div>
        `;

        panel.style.display = 'flex';
        overlay.style.display = 'block';
        
        // Trigger animation
        setTimeout(() => {
            panel.classList.add('open');
        }, 10);
        
        // Populate cached custom headers if any
        if (cachedHeaders.length > 0) {
            cachedHeaders.forEach(header => {
                addCustomHeaderRow(header.key, header.value);
            });
        }
    };

    window.toggleRequestBodyEdit = function() {
        const display = document.getElementById('requestBodyDisplay');
        const edit = document.getElementById('requestBodyEdit');
        const btn = document.getElementById('editBodyBtn');
        const textarea = document.getElementById('requestBody');
        const dataHolder = document.getElementById('requestBodyData');
        
        if (!display || !edit || !btn) return;
        
        if (edit.style.display === 'none') {
            // Switch to edit mode
            if (dataHolder) {
                textarea.value = dataHolder.value;
            }
            display.style.display = 'none';
            edit.style.display = 'block';
            btn.innerHTML = '👁️ Preview';
        } else {
            // Switch to display mode
            const bodyStr = textarea.value;
            try {
                // Validate and format JSON
                const parsed = JSON.parse(bodyStr);
                const formatted = JSON.stringify(parsed, null, 2);
                const highlightedJson = syntaxHighlightJSON(formatted);
                const lines = formatted.split('\n');
                const lineNumbers = Array.from({length: lines.length}, (_, i) => i + 1).join('\n');
                
                // Update display
                display.innerHTML = `
                    <div style="display: flex; background: var(--darker-bg);">
                        <pre style="padding: 12px 8px; margin: 0; background: var(--darker-bg); color: var(--text-secondary); font-family: 'Monaco', 'Consolas', monospace; font-size: 13px; line-height: 1.5; text-align: right; user-select: none; border-right: 1px solid var(--border-color); min-width: 40px;">${lineNumbers}</pre>
                        <pre style="flex: 1; padding: 12px; margin: 0; background: var(--dark-bg); color: var(--text-primary); font-family: 'Monaco', 'Consolas', monospace; font-size: 13px; line-height: 1.5; overflow-x: auto;">${highlightedJson}</pre>
                    </div>
                `;
                
                dataHolder.value = formatted;
                textarea.value = formatted;
                
                display.style.display = 'block';
                edit.style.display = 'none';
                btn.innerHTML = '✏️ Edit';
            } catch (e) {
                // Invalid JSON, show error but stay in edit mode
                alert('Invalid JSON: ' + e.message);
            }
        }
    };

    window.changeContentType = function(method, path) {
        const selector = document.getElementById('contentTypeSelector');
        if (!selector) return;
        
        const newContentType = selector.value;
        
        // Save the selected content type to cache
        const cachedData = loadTryItCache(method, path) || {};
        cachedData.contentType = newContentType;
        saveTryItCache(method, path, cachedData);
        
        // Reload the Try It panel to show the appropriate UI (file upload or JSON editor)
        const op = window.currentOperation;
        if (op) {
            showTryItPanel(op.method, op.path, op.operation, op.spec);
        }
    };

    // Custom Headers Management
    window.addCustomHeader = function() {
        addCustomHeaderRow('', '');
    };

    function addCustomHeaderRow(key = '', value = '') {
        const container = document.getElementById('customHeadersContainer');
        if (!container) return;

        // Remove "no headers" message if present
        const emptyMessage = container.querySelector('[style*="dashed"]');
        if (emptyMessage) {
            emptyMessage.remove();
        }

        const headerId = 'header-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
        
        const headerRow = document.createElement('div');
        headerRow.id = headerId;
        headerRow.style.cssText = 'display: flex; gap: 8px; align-items: center;';
        headerRow.innerHTML = `
            <input 
                type="text" 
                placeholder="Header Name (e.g., X-Custom-Header)"
                value="${escapeHtml(key)}"
                data-header-id="${headerId}"
                data-header-type="key"
                style="flex: 1; padding: 8px 12px; background: var(--dark-bg); border: 1px solid var(--border-color); border-radius: 4px; color: var(--text-primary); font-family: 'Monaco', 'Consolas', monospace; font-size: 13px;"
                oninput="saveCustomHeaders()"
            />
            <input 
                type="text" 
                placeholder="Header Value"
                value="${escapeHtml(value)}"
                data-header-id="${headerId}"
                data-header-type="value"
                style="flex: 2; padding: 8px 12px; background: var(--dark-bg); border: 1px solid var(--border-color); border-radius: 4px; color: var(--text-primary); font-family: 'Monaco', 'Consolas', monospace; font-size: 13px;"
                oninput="saveCustomHeaders()"
            />
            <button 
                onclick="removeCustomHeader('${headerId}')"
                title="Remove header"
                style="padding: 8px 12px; background: transparent; border: 1px solid var(--border-color); border-radius: 4px; color: #f93e3e; cursor: pointer; font-size: 14px; min-width: 40px;"
            >
                🗑️
            </button>
        `;
        
        container.appendChild(headerRow);
    }

    window.removeCustomHeader = function(headerId) {
        const headerRow = document.getElementById(headerId);
        if (headerRow) {
            headerRow.remove();
            saveCustomHeaders();
            
            // Show "no headers" message if container is empty
            const container = document.getElementById('customHeadersContainer');
            if (container && container.children.length === 0) {
                container.innerHTML = `
                    <div style="padding: 12px; background: var(--darker-bg); border: 1px dashed var(--border-color); border-radius: 4px; color: var(--text-secondary); font-size: 13px; text-align: center;">
                        No custom headers. Click "Add Header" to add one.
                    </div>
                `;
            }
        }
    };

    window.saveCustomHeaders = function() {
        const container = document.getElementById('customHeadersContainer');
        if (!container) return;

        const headers = [];
        const headerRows = container.querySelectorAll('[id^="header-"]');
        
        headerRows.forEach(row => {
            const keyInput = row.querySelector('[data-header-type="key"]');
            const valueInput = row.querySelector('[data-header-type="value"]');
            
            if (keyInput && valueInput && keyInput.value.trim()) {
                headers.push({
                    key: keyInput.value.trim(),
                    value: valueInput.value.trim()
                });
            }
        });

        // Save to cache
        const op = window.currentOperation;
        if (op) {
            const method = Object.keys(op.spec.paths[op.path])[0];
            const cachedData = loadTryItCache(method, op.path) || {};
            cachedData.customHeaders = headers;
            saveTryItCache(method, op.path, cachedData);
        }
    };

    window.getCustomHeaders = function() {
        const container = document.getElementById('customHeadersContainer');
        if (!container) return {};

        const headers = {};
        const headerRows = container.querySelectorAll('[id^="header-"]');
        
        headerRows.forEach(row => {
            const keyInput = row.querySelector('[data-header-type="key"]');
            const valueInput = row.querySelector('[data-header-type="value"]');
            
            if (keyInput && valueInput && keyInput.value.trim()) {
                headers[keyInput.value.trim()] = valueInput.value.trim();
            }
        });

        return headers;
    };

    window.validateParameter = function(index) {
        const input = document.getElementById(`param-${index}`);
        const errorDiv = document.getElementById(`param-error-${index}`);
        
        if (!input || !errorDiv) return true;
        
        const value = input.value.trim();
        const paramName = input.getAttribute('data-param-name');
        const paramType = input.getAttribute('data-param-type');
        const paramFormat = input.getAttribute('data-param-format');
        const required = input.getAttribute('data-param-required') === 'true';
        const minLength = input.getAttribute('data-param-minlength');
        const maxLength = input.getAttribute('data-param-maxlength');
        const pattern = input.getAttribute('data-param-pattern');
        const minimum = input.getAttribute('data-param-min');
        const maximum = input.getAttribute('data-param-max');
        
        let errorMessage = '';
        let isValid = true;
        
        // Check required
        if (required && !value) {
            errorMessage = `${paramName} is required`;
            isValid = false;
        }
        
        // If not required and empty, it's valid
        if (!required && !value) {
            errorDiv.style.display = 'none';
            input.style.borderColor = 'var(--border-color)';
            return true;
        }
        
        // Type validation
        if (value) {
            if (paramType === 'integer') {
                if (!/^-?\d+$/.test(value)) {
                    errorMessage = `${paramName} must be an integer`;
                    isValid = false;
                } else {
                    const numValue = parseInt(value);
                    if (minimum !== null && numValue < parseInt(minimum)) {
                        errorMessage = `${paramName} must be >= ${minimum}`;
                        isValid = false;
                    }
                    if (maximum !== null && numValue > parseInt(maximum)) {
                        errorMessage = `${paramName} must be <= ${maximum}`;
                        isValid = false;
                    }
                }
            } else if (paramType === 'number') {
                if (isNaN(value)) {
                    errorMessage = `${paramName} must be a number`;
                    isValid = false;
                } else {
                    const numValue = parseFloat(value);
                    if (minimum !== null && numValue < parseFloat(minimum)) {
                        errorMessage = `${paramName} must be >= ${minimum}`;
                        isValid = false;
                    }
                    if (maximum !== null && numValue > parseFloat(maximum)) {
                        errorMessage = `${paramName} must be <= ${maximum}`;
                        isValid = false;
                    }
                }
            } else if (paramType === 'boolean') {
                if (value !== 'true' && value !== 'false') {
                    errorMessage = `${paramName} must be true or false`;
                    isValid = false;
                }
            } else if (paramType === 'string') {
                // Format validation
                if (paramFormat === 'email' && value) {
                    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                    if (!emailRegex.test(value)) {
                        errorMessage = `${paramName} must be a valid email`;
                        isValid = false;
                    }
                } else if (paramFormat === 'uri' || paramFormat === 'url') {
                    try {
                        new URL(value);
                    } catch (e) {
                        errorMessage = `${paramName} must be a valid URL`;
                        isValid = false;
                    }
                } else if (paramFormat === 'uuid') {
                    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
                    if (!uuidRegex.test(value)) {
                        errorMessage = `${paramName} must be a valid UUID`;
                        isValid = false;
                    }
                } else if (paramFormat === 'date') {
                    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
                    if (!dateRegex.test(value)) {
                        errorMessage = `${paramName} must be in format YYYY-MM-DD`;
                        isValid = false;
                    }
                } else if (paramFormat === 'date-time') {
                    const dateTimeRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})?$/;
                    if (!dateTimeRegex.test(value)) {
                        errorMessage = `${paramName} must be in ISO 8601 format`;
                        isValid = false;
                    }
                }
                
                // Length validation
                if (minLength && value.length < parseInt(minLength)) {
                    errorMessage = `${paramName} must be at least ${minLength} characters`;
                    isValid = false;
                }
                if (maxLength && value.length > parseInt(maxLength)) {
                    errorMessage = `${paramName} must be at most ${maxLength} characters`;
                    isValid = false;
                }
                
                // Pattern validation
                if (pattern) {
                    try {
                        const regex = new RegExp(pattern);
                        if (!regex.test(value)) {
                            errorMessage = `${paramName} does not match required pattern`;
                            isValid = false;
                        }
                    } catch (e) {
                        console.error('Invalid pattern:', pattern, e);
                    }
                }
            }
        }
        
        // Display validation result
        if (isValid) {
            errorDiv.style.display = 'none';
            input.style.borderColor = 'var(--border-color)';
        } else {
            errorDiv.textContent = errorMessage;
            errorDiv.style.display = 'block';
            input.style.borderColor = '#f93e3e';
        }
        
        // Auto-save parameter value to cache
        saveCurrentPanelState();
        
        return isValid;
    };

    // Auto-save current panel state (parameters and request body)
    window.saveCurrentPanelState = function() {
        if (!window.currentOperation) return;
        
        const op = window.currentOperation;
        const method = op.method;
        const path = op.path;
        
        // Collect parameter values
        const parameters = {};
        if (op.operation.parameters) {
            op.operation.parameters.forEach((param, index) => {
                const input = document.getElementById(`param-${index}`);
                if (input && input.value) {
                    parameters[param.name] = input.value;
                }
            });
        }
        
        // Get request body if exists
        let requestBody = null;
        const requestBodyTextarea = document.getElementById('requestBody');
        if (requestBodyTextarea) {
            requestBody = requestBodyTextarea.value;
        }
        
        // Get content type
        const contentTypeSelector = document.getElementById('contentTypeSelector');
        const contentType = contentTypeSelector ? contentTypeSelector.value : 'application/json';
        
        // Get custom headers
        const customHeaders = getCustomHeaders();
        
        // Load existing cache to preserve response data
        const existingCache = loadTryItCache(method, path) || {};
        
        // Save to cache
        saveTryItCache(method, path, {
            ...existingCache,
            parameters: parameters,
            requestBody: requestBody,
            contentType: contentType,
            customHeaders: Object.keys(customHeaders).map(key => ({ key, value: customHeaders[key] }))
        });
    };

    window.validateAllParameters = function() {
        const op = window.currentOperation;
        if (!op || !op.operation.parameters) return true;
        
        let allValid = true;
        op.operation.parameters.forEach((param, index) => {
            const isValid = validateParameter(index);
            if (!isValid) {
                allValid = false;
            }
        });
        
        return allValid;
    };

    window.updateLineNumbers = function(textareaId, lineNumbersId) {
        const textarea = document.getElementById(textareaId);
        const lineNumbers = document.getElementById(lineNumbersId);
        
        if (!textarea || !lineNumbers) return;
        
        const lines = textarea.value.split('\n').length;
        const lineNumbersHtml = Array.from({length: lines}, (_, i) => i + 1).join('\n');
        lineNumbers.textContent = lineNumbersHtml;
    };

    window.closeTryItPanel = function() {
        const panel = document.getElementById('tryItPanel');
        const overlay = document.getElementById('tryItOverlay');
        
        panel.classList.remove('open');
        panel.classList.remove('maximized');
        
        setTimeout(() => {
            panel.style.display = 'none';
            overlay.style.display = 'none';
        }, 300);
    };

    window.togglePanelSize = function() {
        const panel = document.getElementById('tryItPanel');
        const btn = document.getElementById('maximizeBtn');
        
        if (!panel || !btn) return;
        
        if (panel.classList.contains('maximized')) {
            // Restore to normal size
            panel.classList.remove('maximized');
            btn.innerHTML = '⛶';
            btn.title = 'Maximize';
        } else {
            // Maximize
            panel.classList.add('maximized');
            btn.innerHTML = '◱';
            btn.title = 'Restore';
        }
    };

    window.toggleCurlSection = function() {
        const curlSection = document.getElementById('curlSection');
        const toggleIcon = document.getElementById('curlToggleIcon');
        
        if (!curlSection || !toggleIcon) return;
        
        if (curlSection.style.display === 'none') {
            curlSection.style.display = 'block';
            toggleIcon.style.transform = 'rotate(90deg)';
            toggleIcon.textContent = '▼';
        } else {
            curlSection.style.display = 'none';
            toggleIcon.style.transform = 'rotate(0deg)';
            toggleIcon.textContent = '▶';
        }
    };

    window.executeTryIt = async function(method, path) {
        const responseContent = document.getElementById('tryItResponseContent');
        
        if (!responseContent) return;

        // Validate all parameters before executing
        if (!validateAllParameters()) {
            responseContent.innerHTML = `
                <div style="padding: 20px; background: rgba(249, 62, 62, 0.1); border: 1px solid #f93e3e; border-radius: 4px;">
                    <div style="color: #f93e3e; font-weight: 600; margin-bottom: 8px; font-size: 16px;">❌ Validation Error</div>
                    <div style="color: var(--text-secondary); font-size: 13px;">Please fix the validation errors in the parameters above before executing the request.</div>
                </div>
            `;
            return;
        }

        // Show loading state
        responseContent.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: center; padding: 40px; color: var(--text-secondary);">
                <div class="spinner"></div>
                <span style="margin-left: 12px;">Executing request...</span>
            </div>
        `;

        try {
            const op = window.currentOperation;
            let url = path;
            console.log('Initial URL:', url);

            // Replace path parameters
            if (op.operation.parameters) {
                op.operation.parameters.forEach((param, index) => {
                    const input = document.getElementById(`param-${index}`);
                    if (input && input.value) {
                        console.log(`Parameter ${param.name} (${param.in}):`, input.value);
                        if (param.in === 'path') {
                            url = url.replace(`{${param.name}}`, encodeURIComponent(input.value));
                        } else if (param.in === 'query') {
                            const separator = url.includes('?') ? '&' : '?';
                            url += `${separator}${encodeURIComponent(param.name)}=${encodeURIComponent(input.value)}`;
                        }
                    }
                });
            }
            
            console.log('Final URL:', url);

            // Get the selected content type from dropdown, default to application/json
            const contentTypeSelector = document.getElementById('contentTypeSelector');
            const selectedContentType = contentTypeSelector ? contentTypeSelector.value : 'application/json';

            const options = {
                method: method.toUpperCase(),
                headers: {
                    'Content-Type': selectedContentType
                }
            };

            // Add custom headers
            const customHeaders = getCustomHeaders();
            Object.keys(customHeaders).forEach(key => {
                options.headers[key] = customHeaders[key];
            });

            // Check if this endpoint requires authorization (use cached spec)
            const spec = await getSwaggerSpec();
            const securitySchemes = spec.components?.securitySchemes || {};
            const operationSecurity = op.operation.security || spec.security || [];
            const requiresAuth = operationSecurity.length > 0;

            // Apply saved authorization ONLY if endpoint requires it
            if (requiresAuth) {
                const savedAuth = localStorage.getItem('swaggerWithSwagg_auth');
                if (savedAuth) {
                    try {
                        const auth = JSON.parse(savedAuth);
                        
                        // Apply auth for each security requirement
                        operationSecurity.forEach(secReq => {
                            Object.keys(secReq).forEach(schemeName => {
                                const authValue = auth[schemeName];
                                const scheme = securitySchemes[schemeName];
                                
                                if (authValue && scheme) {
                                    if (scheme.type === 'http' && scheme.scheme === 'bearer') {
                                        options.headers['Authorization'] = `Bearer ${authValue}`;
                                    } else if (scheme.type === 'apiKey') {
                                        if (scheme.in === 'header') {
                                            options.headers[scheme.name] = authValue;
                                        } else if (scheme.in === 'query') {
                                            const separator = url.includes('?') ? '&' : '?';
                                            url += `${separator}${encodeURIComponent(scheme.name)}=${encodeURIComponent(authValue)}`;
                                        }
                                    }
                                }
                            });
                        });
                    } catch (e) {
                        console.error('Failed to apply authorization:', e);
                    }
                }
            }

            // Add request body if applicable
            const fileUploadContainer = document.getElementById('fileUploadContainer');
            const bodyTextarea = document.getElementById('requestBody');
            const bodyData = document.getElementById('requestBodyData');
            
            if (fileUploadContainer && (method.toUpperCase() === 'POST' || method.toUpperCase() === 'PUT' || method.toUpperCase() === 'PATCH')) {
                // Handle file upload (multipart/form-data)
                const formData = new FormData();
                
                // Find all file inputs
                const fileInputs = fileUploadContainer.querySelectorAll('input[type="file"]');
                const textInputs = fileUploadContainer.querySelectorAll('input[type="text"]');
                
                // Add files to FormData
                fileInputs.forEach(input => {
                    if (input.files && input.files.length > 0) {
                        if (input.multiple) {
                            // For multiple file inputs, append each file separately
                            Array.from(input.files).forEach(file => {
                                formData.append(input.name, file);
                            });
                        } else {
                            // For single file inputs, append the first file
                            formData.append(input.name, input.files[0]);
                        }
                    }
                });
                
                // Add text fields to FormData
                textInputs.forEach(input => {
                    if (input.value) {
                        formData.append(input.name, input.value);
                    }
                });
                
                // Remove Content-Type header - browser will set it with boundary
                delete options.headers['Content-Type'];
                options.body = formData;
                
            } else if ((bodyTextarea || bodyData) && (method.toUpperCase() === 'POST' || method.toUpperCase() === 'PUT' || method.toUpperCase() === 'PATCH')) {
                // Handle regular JSON/text body
                try {
                    // Use textarea if in edit mode, otherwise use the data holder
                    const edit = document.getElementById('requestBodyEdit');
                    const bodyValue = (edit && edit.style.display !== 'none') ? bodyTextarea.value : (bodyData ? bodyData.value : '');
                    
                    if (bodyValue) {
                        options.body = bodyValue;
                    }
                } catch (e) {
                    responseContent.innerHTML = `
                        <div style="padding: 20px; background: rgba(249, 62, 62, 0.1); border: 1px solid #f93e3e; border-radius: 4px;">
                            <div style="color: #f93e3e; font-weight: 600; margin-bottom: 8px;">❌ Invalid JSON</div>
                            <div style="color: var(--text-secondary); font-size: 13px;">${escapeHtml(e.message)}</div>
                        </div>
                    `;
                    return;
                }
            }

            const startTime = Date.now();
            const response = await fetch(url, options);
            const duration = Date.now() - startTime;

            const contentType = response.headers.get('content-type');
            let responseData;
            let isJson = false;
            
            if (contentType && contentType.includes('application/json')) {
                try {
                    responseData = await response.json();
                    isJson = true;
                } catch (e) {
                    // If JSON parsing fails, fall back to text
                    responseData = await response.text();
                    isJson = false;
                }
            } else {
                responseData = await response.text();
                // Check if the text content is valid JSON
                if (typeof responseData === 'string' && responseData.trim().startsWith('{') || responseData.trim().startsWith('[')) {
                    try {
                        responseData = JSON.parse(responseData);
                        isJson = true;
                    } catch (e) {
                        // Keep as text if not valid JSON
                        isJson = false;
                    }
                }
            }

            const statusColor = response.ok ? '#49cc90' : 
                              response.status >= 400 && response.status < 500 ? '#ffa500' : '#f93e3e';
            
            // Get request body for cURL
            const bodyDataElem = document.getElementById('requestBodyData');
            const editElem = document.getElementById('requestBodyEdit');
            const bodyTextareaElem = document.getElementById('requestBody');
            const requestBodyForCurl = (editElem && editElem.style.display !== 'none') ? bodyTextareaElem?.value : (bodyDataElem ? bodyDataElem.value : null);
            
            let html = `
                <div style="margin-bottom: 16px; display: flex; justify-content: space-between; align-items: center;">
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <span style="color: ${statusColor}; font-weight: 600; font-size: 16px;">
                            ${response.status} ${response.statusText}
                        </span>
                        <span style="color: var(--text-secondary); font-size: 13px;">
                            ⏱ ${duration}ms
                        </span>
                    </div>
                </div>
            `;
            
            // cURL Command (collapsed by default)
            const curlCommand = generateCurl(method.toUpperCase(), url, requestBodyForCurl, options.headers);
            html += `
                <div style="margin-bottom: 16px;">
                    <div onclick="toggleCurlSection()" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; cursor: pointer; padding: 8px; background: var(--darker-bg); border-radius: 4px; border: 1px solid var(--border-color);">
                        <h4 style="color: var(--text-primary); margin: 0; font-size: 14px; display: flex; align-items: center; gap: 8px;">
                            <span id="curlToggleIcon" style="transition: transform 0.2s;">▶</span>
                            cURL Command
                        </h4>
                        <button onclick="event.stopPropagation(); copyCurl()" title="Copy cURL" style="padding: 4px 10px; background: transparent; border: 1px solid var(--border-color); border-radius: 4px; color: var(--text-secondary); cursor: pointer; font-size: 11px; display: flex; align-items: center; gap: 4px;">
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                            </svg>
                            Copy
                        </button>
                    </div>
                    <div id="curlSection" style="display: none; background: var(--darker-bg); border: 1px solid var(--border-color); border-radius: 4px; padding: 12px; max-height: 200px; overflow-y: auto;">
                        <pre id="curlCommand" style="margin: 0; color: var(--text-primary); font-family: 'Monaco', 'Consolas', monospace; font-size: 12px; line-height: 1.6; white-space: pre-wrap; word-wrap: break-word;">${escapeHtml(curlCommand)}</pre>
                    </div>
                </div>
            `;

            // Response body
            if (responseData) {
                let bodyStr;
                let highlightedContent;
                
                if (isJson || (typeof responseData === 'object' && responseData !== null)) {
                    // Prettify JSON with 2-space indentation
                    bodyStr = JSON.stringify(responseData, null, 2);
                    highlightedContent = syntaxHighlightJSON(bodyStr);
                } else {
                    // Plain text response
                    bodyStr = String(responseData);
                    // Check one more time if it's parseable JSON
                    try {
                        const parsed = JSON.parse(bodyStr);
                        bodyStr = JSON.stringify(parsed, null, 2);
                        highlightedContent = syntaxHighlightJSON(bodyStr);
                    } catch (e) {
                        // Not JSON, keep as plain text
                        highlightedContent = escapeHtml(bodyStr);
                    }
                }
                
                const lines = bodyStr.split('\n');
                const lineNumbers = Array.from({length: lines.length}, (_, i) => i + 1).join('\n');
                
                html += `
                    <div style="margin-bottom: 16px;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                            <h4 style="color: var(--text-primary); margin: 0; font-size: 14px;">Body</h4>
                            <button onclick="copyResponse()" title="Copy Response" style="padding: 4px 10px; background: transparent; border: 1px solid var(--border-color); border-radius: 4px; color: var(--text-secondary); cursor: pointer; font-size: 11px; display: flex; align-items: center; gap: 4px;">
                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                                </svg>
                                Copy
                            </button>
                        </div>
                        <div style="border: 1px solid var(--border-color); border-radius: 4px; overflow: hidden; max-height: 500px; overflow-y: auto;">
                            <div style="display: flex; background: var(--darker-bg);">
                                <pre style="padding: 16px 8px; margin: 0; background: var(--darker-bg); color: var(--text-secondary); font-family: 'Monaco', 'Consolas', monospace; font-size: 13px; line-height: 1.5; text-align: right; user-select: none; border-right: 1px solid var(--border-color); min-width: 40px;">${lineNumbers}</pre>
                                <pre id="responseBodyContent" style="flex: 1; padding: 16px 12px; margin: 0; background: var(--dark-bg); color: var(--text-primary); font-family: 'Monaco', 'Consolas', monospace; font-size: 13px; line-height: 1.5; overflow-x: auto;">${highlightedContent}</pre>
                            </div>
                        </div>
                    </div>
                `;
            }

            // Response headers
            const headers = [];
            response.headers.forEach((value, key) => {
                headers.push(`${key}: ${value}`);
            });
            
            if (headers.length > 0) {
                const headerText = headers.join('\n');
                const headerLines = headers.length;
                const headerLineNumbers = Array.from({length: headerLines}, (_, i) => i + 1).join('\n');
                
                html += `
                    <div>
                        <h4 style="color: var(--text-primary); margin-bottom: 8px; font-size: 14px;">Headers</h4>
                        <div style="border: 1px solid var(--border-color); border-radius: 4px; overflow: hidden; max-height: 300px; overflow-y: auto;">
                            <div style="display: flex; background: var(--darker-bg);">
                                <pre style="padding: 16px 8px; margin: 0; background: var(--darker-bg); color: var(--text-secondary); font-family: 'Monaco', 'Consolas', monospace; font-size: 12px; line-height: 1.5; text-align: right; user-select: none; border-right: 1px solid var(--border-color); min-width: 40px;">${headerLineNumbers}</pre>
                                <pre style="flex: 1; padding: 16px 12px; margin: 0; background: var(--dark-bg); color: var(--text-secondary); font-family: 'Monaco', 'Consolas', monospace; font-size: 12px; line-height: 1.5; overflow-x: auto;">${escapeHtml(headerText)}</pre>
                            </div>
                        </div>
                    </div>
                `;
            }

            responseContent.innerHTML = html;

            // Save to cache
            const parameters = {};
            if (op.operation.parameters) {
                op.operation.parameters.forEach((param, index) => {
                    const input = document.getElementById(`param-${index}`);
                    if (input && input.value) {
                        parameters[param.name] = input.value;
                    }
                });
            }

            const bodyStr = typeof responseData === 'string' ? responseData : JSON.stringify(responseData, null, 2);
            
            saveTryItCache(method, path, {
                parameters: parameters,
                requestBody: requestBodyForCurl,
                contentType: selectedContentType,
                customHeaders: Object.keys(customHeaders).map(key => ({ key, value: customHeaders[key] })),
                response: {
                    status: response.status,
                    statusText: response.statusText,
                    duration: duration,
                    body: bodyStr,
                    curl: curlCommand
                }
            });

        } catch (error) {
            responseContent.innerHTML = `
                <div style="padding: 20px; background: rgba(249, 62, 62, 0.1); border: 1px solid #f93e3e; border-radius: 4px;">
                    <div style="color: #f93e3e; font-weight: 600; margin-bottom: 8px; font-size: 16px;">❌ Request Failed</div>
                    <div style="color: var(--text-secondary); font-size: 13px; font-family: 'Monaco', 'Consolas', monospace;">${escapeHtml(error.message)}</div>
                </div>
            `;
        }
    };

    window.clearTryItResponse = function() {
        const responseContent = document.getElementById('tryItResponseContent');
        if (responseContent) {
            responseContent.innerHTML = `
                <div style="padding: 40px; text-align: center; color: var(--text-secondary); opacity: 0.5;">
                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-bottom: 12px; opacity: 0.3;">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                        <polyline points="14 2 14 8 20 8"></polyline>
                    </svg>
                    <p>No response yet. Execute a request to see the response here.</p>
                </div>
            `;
        }
    };

    window.copyResponse = function() {
        const responseContent = document.getElementById('tryItResponseContent');
        if (!responseContent) return;
        
        // Find the response body text
        const preElements = responseContent.querySelectorAll('pre');
        let responseText = '';
        
        for (let pre of preElements) {
            const text = pre.textContent || pre.innerText;
            // Skip if it's just line numbers (contains only numbers and newlines)
            if (!/^\d+(\n\d+)*$/.test(text.trim())) {
                responseText = text;
                break;
            }
        }
        
        if (responseText) {
            navigator.clipboard.writeText(responseText).then(() => {
                // Show success feedback
                const btn = event.target.closest('button');
                if (btn) {
                    const originalHTML = btn.innerHTML;
                    btn.innerHTML = `
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                        Copied!
                    `;
                    btn.style.color = '#49cc90';
                    setTimeout(() => {
                        btn.innerHTML = originalHTML;
                        btn.style.color = '';
                    }, 2000);
                }
            }).catch(err => {
                console.error('Failed to copy:', err);
                alert('Failed to copy response');
            });
        }
    };

    // Utility function to escape HTML
    function escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, m => map[m]);
    }

    // Generate cURL command
    function generateCurl(method, url, body, headers) {
        let curl = `curl -X ${method.toUpperCase()} '${url}'`;
        
        // Check if this is a multipart/form-data request
        const isMultipart = headers && headers['Content-Type'] && headers['Content-Type'].includes('multipart/form-data');
        
        if (headers) {
            for (const [key, value] of Object.entries(headers)) {
                // Skip Content-Type for multipart - curl sets it automatically with boundary
                if (isMultipart && key === 'Content-Type') continue;
                curl += ` \\\n  -H '${key}: ${value}'`;
            }
        }
        
        if (body && (method.toUpperCase() === 'POST' || method.toUpperCase() === 'PUT' || method.toUpperCase() === 'PATCH')) {
            if (isMultipart || body instanceof FormData) {
                // For multipart, extract field information from the form
                const fileInputs = document.querySelectorAll('input[type="file"]');
                const textInputs = document.querySelectorAll('input[type="text"][name]');
                
                // Add file fields
                fileInputs.forEach(input => {
                    if (input.files && input.files.length > 0) {
                        if (input.multiple) {
                            // Multiple files
                            Array.from(input.files).forEach(file => {
                                curl += ` \\\n  -F '${input.name}=@${file.name}'`;
                            });
                        } else {
                            // Single file
                            curl += ` \\\n  -F '${input.name}=@${input.files[0].name}'`;
                        }
                    }
                });
                
                // Add text fields
                textInputs.forEach(input => {
                    if (input.value) {
                        curl += ` \\\n  -F '${input.name}=${input.value.replace(/'/g, "'\\''")}'`;
                    }
                });
            } else {
                // Regular JSON/text body
                const bodyStr = typeof body === 'string' ? body : JSON.stringify(body);
                curl += ` \\\n  -d '${bodyStr.replace(/'/g, "'\\''")}'`;
            }
        }
        
        return curl;
    }

    window.copyCurl = function() {
        const curlElement = document.getElementById('curlCommand');
        if (!curlElement) return;
        
        const curlText = curlElement.textContent;
        navigator.clipboard.writeText(curlText).then(() => {
            const btn = event.target.closest('button');
            const originalText = btn.innerHTML;
            btn.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                Copied!
            `;
            setTimeout(() => {
                btn.innerHTML = originalText;
            }, 2000);
        }).catch(err => {
            console.error('Failed to copy:', err);
        });
    };

    // Minimized Tabs Management
    const minimizedTabs = new Map(); // Store minimized panel data
    const MINIMIZED_TABS_KEY = 'swaggerWithSwagg_minimizedTabs';

    // Load minimized tabs from localStorage on startup
    function loadMinimizedTabs() {
        try {
            const saved = localStorage.getItem(MINIMIZED_TABS_KEY);
            if (saved) {
                const tabsArray = JSON.parse(saved);
                tabsArray.forEach(tab => {
                    const tabKey = `${tab.method}:${tab.path}`;
                    minimizedTabs.set(tabKey, tab);
                });
                updateMinimizedTabsBar();
            }
        } catch (e) {
            console.error('Failed to load minimized tabs:', e);
        }
    }

    // Save minimized tabs to localStorage
    function saveMinimizedTabs() {
        try {
            const tabsArray = Array.from(minimizedTabs.values());
            localStorage.setItem(MINIMIZED_TABS_KEY, JSON.stringify(tabsArray));
        } catch (e) {
            console.error('Failed to save minimized tabs:', e);
        }
    }

    window.minimizeTryItPanel = function(method, path) {
        const panel = document.getElementById('tryItPanel');
        const overlay = document.getElementById('tryItOverlay');
        
        if (!panel || !overlay) return;

        // Save current state before minimizing
        saveCurrentPanelState();

        // Generate unique key for this tab
        const tabKey = `${method}:${path}`;
        
        // Store minimal panel state (don't store HTML or full operation to save space)
        minimizedTabs.set(tabKey, {
            method: method,
            path: path,
            operationId: window.currentOperation?.operation?.operationId,
            isMaximized: panel.classList.contains('maximized')
        });

        // Save to localStorage
        saveMinimizedTabs();

        // Hide the panel
        panel.classList.remove('open');
        panel.classList.add('minimized');
        overlay.style.display = 'none';

        // Update minimized tabs bar
        updateMinimizedTabsBar();
    };

    window.restoreMinimizedTab = async function(tabKey) {
        const panel = document.getElementById('tryItPanel');
        const overlay = document.getElementById('tryItOverlay');
        
        if (!panel || !overlay) return;

        const tabData = minimizedTabs.get(tabKey);
        if (!tabData) return;

        // Remove from minimized tabs before rebuilding
        minimizedTabs.delete(tabKey);

        // Save to localStorage
        saveMinimizedTabs();

        // Update minimized tabs bar
        updateMinimizedTabsBar();

        try {
            // Get the swagger spec to rebuild the operation
            const spec = await getSwaggerSpec();
            const pathItem = spec.paths[tabData.path];
            
            if (!pathItem || !pathItem[tabData.method.toLowerCase()]) {
                console.error('Endpoint not found:', tabData.method, tabData.path);
                return;
            }

            const operation = pathItem[tabData.method.toLowerCase()];
            
            // Set window.currentOperation before opening the panel
            window.currentOperation = {
                method: tabData.method,
                path: tabData.path,
                operation: operation,
                spec: spec
            };

            // Rebuild the panel with fresh content
            openTryItPanel(tabData.method, tabData.path, tabData.operationId);

            // Restore maximized state after panel is rebuilt
            setTimeout(() => {
                if (tabData.isMaximized) {
                    panel.classList.add('maximized');
                }
            }, 50);
        } catch (e) {
            console.error('Failed to restore minimized tab:', e);
        }
    };

    window.closeMinimizedTab = function(tabKey, event) {
        if (event) {
            event.stopPropagation();
        }

        // Remove from minimized tabs
        minimizedTabs.delete(tabKey);

        // Save to localStorage
        saveMinimizedTabs();

        // Update minimized tabs bar
        updateMinimizedTabsBar();
    };

    function updateMinimizedTabsBar() {
        const tabsBar = document.getElementById('minimizedTabsBar');
        if (!tabsBar) return;

        // Show/hide tabs bar based on whether there are minimized tabs
        if (minimizedTabs.size === 0) {
            tabsBar.classList.remove('visible');
            return;
        }

        tabsBar.classList.add('visible');

        // Build tabs HTML
        let tabsHtml = '';
        minimizedTabs.forEach((tabData, tabKey) => {
            const methodClass = `method-${tabData.method.toLowerCase()}`;
            const escapedPath = escapeHtml(tabData.path);
            
            tabsHtml += `
                <div class="minimized-tab" onclick="restoreMinimizedTab('${tabKey}')" title="Click to restore">
                    <span class="minimized-tab-method ${methodClass}">${tabData.method.toUpperCase()}</span>
                    <span class="minimized-tab-path">${escapedPath}</span>
                    <span class="minimized-tab-close" onclick="closeMinimizedTab('${tabKey}', event)" title="Close">×</span>
                </div>
            `;
        });

        tabsBar.innerHTML = tabsHtml;
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
})();
