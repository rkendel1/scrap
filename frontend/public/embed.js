(function() {
    'use strict';

    // Get the script tag that loaded this file
    const currentScript = document.currentScript || (function() {
        const scripts = document.getElementsByTagName('script');
        return scripts[scripts.length - 1];
    })();

    // Get the embed code from the data attribute
    const embedCode = currentScript.getAttribute('data-form');
    
    if (!embedCode) {
        console.error('FormCraft: No embed code provided. Add data-form attribute to the script tag.');
        return;
    }

    // Configuration
    const API_BASE = currentScript.getAttribute('data-api-base') || 
                    (window.location.hostname === 'localhost' ? 'http://localhost:3001' : 'https://formcraft.ai');
    const containerId = 'formcraft-embed-' + embedCode;
    const currentHostname = window.location.hostname;

    // Extract testMode from the script's own URL
    const scriptUrl = new URL(currentScript.src);
    const isTestMode = scriptUrl.searchParams.get('testMode') === 'true';

    // Create container element
    const container = document.createElement('div');
    container.id = containerId;
    container.style.cssText = 'margin: 0; padding: 0; font-family: system-ui, -apple-system, sans-serif;';
    
    // Insert container after the script tag
    currentScript.parentNode.insertBefore(container, currentScript.nextSibling);

    // Show loading state
    container.innerHTML = '<div style="padding: 20px; text-align: center; color: #666; border: 1px solid #e1e5e9; border-radius: 8px; background: #f8f9fa;">Loading form...</div>';

    // Construct API URL with hostname and testMode
    let apiUrl = `${API_BASE}/api/forms/embed-config/${embedCode}?hostname=${encodeURIComponent(currentHostname)}`;
    if (isTestMode) {
        apiUrl += '&testMode=true';
    }

    // Fetch form data from the new public endpoint
    fetch(apiUrl)
        .then(response => response.json())
        .then(data => {
            if (!data.success) {
                throw new Error(data.message || 'Failed to load form');
            }
            renderForm(data.data, container, isTestMode); // Pass isTestMode to renderForm
        })
        .catch(error => {
            console.error('FormCraft: Error loading form:', error);
            container.innerHTML = `
                <div style="padding: 20px; text-align: center; color: #dc3545; border: 1px solid #f5c6cb; border-radius: 8px; background: #f8d7da;">
                    <strong>Error loading form:</strong><br>
                    ${error.message}
                </div>
            `;
        });

    function renderForm(formData, container, isTestMode) { // Accept isTestMode
        const form = formData.generated_form;
        if (!form) {
            container.innerHTML = '<div style="padding: 20px; text-align: center; color: #dc3545;">Form configuration not found</div>';
            return;
        }

        const styling = formData.styling || {};
        
        const formHTML = `
            <div style="
                background-color: ${styling.backgroundColor || '#fff'};
                padding: 24px;
                border-radius: ${styling.borderRadius || '8px'};
                font-family: ${styling.fontFamily || 'system-ui'};
                border: 1px solid #e1e5e9;
                box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                max-width: ${styling.maxWidth || '350px'}; /* Use dynamic maxWidth or default to 350px */
                margin: 0 auto;
            ">
                <div style="margin-bottom: 24px;">
                    <h3 style="margin: 0 0 8px 0; color: #333; font-size: 20px;">
                        ${escapeHtml(form.title || formData.title)}
                    </h3>
                    ${form.description || formData.description ? `
                        <p style="margin: 0; color: #666; font-size: 14px;">
                            ${escapeHtml(form.description || formData.description)}
                        </p>
                    ` : ''}
                </div>

                <form id="formcraft-form-${embedCode}">
                    ${renderFields(form.fields || [])}
                    
                    <div id="form-message-${embedCode}" style="margin-bottom: 16px; display: none;"></div>
                    
                    <button type="submit" id="submit-btn-${embedCode}" style="
                        background-color: ${styling.primaryColor || '#007bff'};
                        color: white;
                        padding: 12px 24px;
                        border: none;
                        border-radius: ${styling.borderRadius || '4px'};
                        font-size: 16px;
                        font-weight: 500;
                        cursor: pointer;
                        width: 100%;
                        font-family: ${styling.fontFamily || 'inherit'};
                        transition: opacity 0.2s;
                    ">
                        ${escapeHtml(form.ctaText || 'Submit')}
                    </button>
                </form>

                <div id="thank-you-message-${embedCode}" style="display: none; text-align: center; padding: 20px;">
                    <div style="color: ${styling.primaryColor || '#28a745'}; font-size: 18px; font-weight: bold; margin-bottom: 8px;">
                        ✓ Thank You!
                    </div>
                    <p style="margin: 0; color: #666;">
                        ${escapeHtml(form.thankYouMessage || 'Thank you for your submission!')}
                    </p>
                </div>

                ${formData.showBranding ? `
                    <div style="
                        margin-top: 16px;
                        padding-top: 16px;
                        border-top: 1px solid #e1e5e9;
                        text-align: center;
                    ">
                        <a href="https://formcraft.ai" target="_blank" rel="noopener noreferrer" style="
                            font-size: 12px;
                            color: #666;
                            text-decoration: none;
                        ">
                            Powered by FormCraft AI
                        </a>
                    </div>
                ` : ''}
            </div>
        `;

        container.innerHTML = formHTML;

        // Add form submission handler
        const formElement = document.getElementById(`formcraft-form-${embedCode}`);
        if (formElement) {
            formElement.addEventListener('submit', function(e) {
                e.preventDefault();
                handleFormSubmission(formData, embedCode, isTestMode); // Pass isTestMode to submission handler
            });
        }
    }

    function renderFields(fields) {
        return fields.map(field => {
            const fieldId = `field-${field.name}-${embedCode}`;
            const baseStyles = `
                width: 100%;
                padding: 12px;
                border: 1px solid #ddd;
                border-radius: 4px;
                font-size: 16px;
                margin-bottom: 8px;
                font-family: inherit;
                box-sizing: border-box;
            `;

            let inputHTML = '';
            
            switch (field.type) {
                case 'textarea':
                    inputHTML = `
                        <textarea id="${fieldId}" name="${field.name}" 
                            placeholder="${escapeHtml(field.placeholder || '')}" 
                            ${field.required ? 'required' : ''}
                            style="${baseStyles} min-height: 100px; resize: vertical;"></textarea>
                    `;
                    break;
                
                case 'select':
                    const options = field.options ? field.options.map(option => 
                        `<option value="${escapeHtml(option)}">${escapeHtml(option)}</option>`
                    ).join('') : '';
                    inputHTML = `
                        <select id="${fieldId}" name="${field.name}" ${field.required ? 'required' : ''} style="${baseStyles}">
                            <option value="">${escapeHtml(field.placeholder || 'Select an option')}</option>
                            ${options}
                        </select>
                    `;
                    break;
                
                default:
                    inputHTML = `
                        <input id="${fieldId}" type="${field.type}" name="${field.name}" 
                            placeholder="${escapeHtml(field.placeholder || '')}" 
                            ${field.required ? 'required' : ''}
                            style="${baseStyles}">
                    `;
            }

            return `
                <div style="margin-bottom: 16px;">
                    <label for="${fieldId}" style="
                        display: block;
                        margin-bottom: 4px;
                        font-size: 14px;
                        font-weight: 500;
                        color: #333;
                    ">
                        ${escapeHtml(field.label)}
                        ${field.required ? '<span style="color: #dc3545; margin-left: 2px;">*</span>' : ''}
                    </label>
                    ${inputHTML}
                </div>
            `;
        }).join('');
    }

    function handleFormSubmission(formData, embedCode, isTestMode) { // Accept isTestMode
        const formElement = document.getElementById(`formcraft-form-${embedCode}`);
        const submitBtn = document.getElementById(`submit-btn-${embedCode}`);
        const messageDiv = document.getElementById(`form-message-${embedCode}`);
        
        if (!formElement || !submitBtn) return;
        
        // Disable form
        submitBtn.disabled = true;
        submitBtn.style.opacity = '0.6';
        submitBtn.textContent = 'Submitting...';

        // Collect form data
        const formDataObj = new FormData(formElement);
        const data = {};
        for (let [key, value] of formDataObj.entries()) {
            data[key] = value;
        }

        // Add isTestSubmission flag to the payload
        if (isTestMode) {
            data.isTestSubmission = true;
        }

        // Submit to the new public API endpoint
        fetch(`${API_BASE}/api/forms/submit-public/${embedCode}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        })
        .then(response => response.json())
        .then(result => {
            if (result.success) {
                // Show success message
                formElement.style.display = 'none';
                document.getElementById(`thank-you-message-${embedCode}`).style.display = 'block';
            } else {
                throw new Error(result.message || 'Submission failed');
            }
        })
        .catch(error => {
            console.error('FormCraft: Submission error:', error);
            
            // Show error message
            if (messageDiv) {
                messageDiv.innerHTML = `
                    <div style="
                        padding: 12px;
                        background-color: #f8d7da;
                        color: #721c24;
                        border-radius: 4px;
                        font-size: 14px;
                    ">
                        ${error.message}
                    </div>
                `;
                messageDiv.style.display = 'block';
            }
            
            // Re-enable form
            submitBtn.disabled = false;
            submitBtn.style.opacity = '1';
            submitBtn.textContent = formData.generated_form?.ctaText || 'Submit';
        });
    }

    function escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
})();