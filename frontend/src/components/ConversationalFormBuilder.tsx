import React, { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { FormData, GeneratedForm, SaaSForm, FormField, ExtractedDesignTokensData } from '../types/api';
import { ConnectorConfig } from './ConnectorConfig'; // Assuming ConnectorConfig is still useful for destination

interface ConversationalFormBuilderProps {
  onFormGenerated: (form: SaaSForm) => void;
  user?: any;
  guestToken?: string;
  onStateChange: (state: {
    formData: Partial<FormData>;
    generatedForm: GeneratedForm | null;
    createdForm: SaaSForm | null;
    extractedDesignTokens: any | null;
    extractedVoiceAnalysis: any | null;
  }) => void;
}

type ConversationEntry = {
  type: 'prompt' | 'user' | 'error' | 'success'; // Removed 'loading' type from history
  content: string | JSX.Element;
};

type ConversationStep =
  | 'ASK_URL'
  | 'PROCESSING_URL' // New step for URL analysis
  | 'ASK_PURPOSE'
  | 'PROCESSING_PURPOSE' // New step for form generation
  | 'ASK_DESTINATION_TYPE'
  | 'ASK_DESTINATION_CONFIG'
  | 'PROCESSING_DESTINATION' // New step for destination saving
  | 'DONE';

export const ConversationalFormBuilder: React.FC<ConversationalFormBuilderProps> = ({
  onFormGenerated,
  user,
  guestToken,
  onStateChange,
}) => {
  const [currentStep, setCurrentStep] = useState<ConversationStep>('ASK_URL');
  const [conversationHistory, setConversationHistory] = useState<ConversationEntry[]>([
    { type: 'prompt', content: "Hello! I'm your AI form builder. What's the URL of the website you want to create a form for?" }
  ]);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  // Removed currentLoadingMessage state
  const [error, setError] = useState<string | null>(null);
  const [currentContextSummary, setCurrentContextSummary] = useState<string>('');
  const [currentQuickResponses, setCurrentQuickResponses] = useState<JSX.Element | null>(null); // New state for quick response buttons


  // Data collected throughout the conversation
  const [formData, setFormData] = useState<Partial<FormData>>({});
  const [extractedDesignTokens, setExtractedDesignTokens] = useState<any | null>(null);
  const [extractedVoiceAnalysis, setExtractedVoiceAnalysis] = useState<any | null>(null);
  const [extractedRecordId, setExtractedRecordId] = useState<number | null>(null);
  const [generatedForm, setGeneratedForm] = useState<GeneratedForm | null>(null);
  const [createdForm, setCreatedForm] = useState<SaaSForm | null>(null);
  const [selectedDestinationType, setSelectedDestinationType] = useState<string | null>(null);
  const [destinationConfig, setDestinationConfig] = useState<any>({});

  const chatHistoryRef = useRef<HTMLDivElement>(null);

  const destinationIcons: Record<string, string> = {
    email: '📧',
    googlesheets: '📊',
    slack: '💬',
    webhook: '🔗',
  };

  // List of predefined form purposes for matching
  const formPurposes = [
    'Lead Generation',
    'Contact Form',
    'Newsletter Signup',
    'Survey/Feedback',
    'Event Registration',
    'Support Request',
    'Quote Request',
    'Demo Request',
    'Consultation Booking',
  ];

  // Helper to build the context summary string
  const buildContextSummary = () => {
    let summaryParts: string[] = [];
    if (formData.url) {
      summaryParts.push(`🌐 ${formData.url.length > 30 ? formData.url.substring(0, 27) + '...' : formData.url}`);
    }
    if (formData.purpose) {
      summaryParts.push(`🎯 ${formData.purpose}`);
    }
    if (formData.destinationType) {
      const icon = destinationIcons[formData.destinationType] || '';
      summaryParts.push(`${icon} ${formData.destinationType.charAt(0).toUpperCase() + formData.destinationType.slice(1)}`);
    }
    setCurrentContextSummary(summaryParts.join(' | '));
  };

  // Scroll to bottom of chat history
  useEffect(() => {
    if (chatHistoryRef.current) {
      chatHistoryRef.current.scrollTop = chatHistoryRef.current.scrollHeight;
    }
  }, [conversationHistory, currentQuickResponses]); // Also scroll when quick responses appear/disappear

  // Update parent component's state for LiveFormPreview
  useEffect(() => {
    onStateChange({
      formData,
      generatedForm,
      createdForm,
      extractedDesignTokens,
      extractedVoiceAnalysis,
    });
    buildContextSummary(); // Update summary whenever formData changes
  }, [formData, generatedForm, createdForm, extractedDesignTokens, extractedVoiceAnalysis, onStateChange]);

  const addEntry = (entry: ConversationEntry) => {
    setConversationHistory((prev) => [...prev, entry]);
  };

  const addPrompt = (content: string | JSX.Element, quickResponses: JSX.Element | null = null) => {
    addEntry({ type: 'prompt', content });
    setCurrentQuickResponses(quickResponses); // Set quick responses
    setIsLoading(false); // Ensure loading is off after a prompt
    // Removed setCurrentLoadingMessage
  };

  const addUserResponse = (content: string) => {
    addEntry({ type: 'user', content });
    setCurrentQuickResponses(null); // Clear quick responses after user input
    setIsLoading(false); // Ensure loading is off after user response
    // Removed setCurrentLoadingMessage
  };

  // Removed addLoading function

  const addError = (content: string) => {
    addEntry({ type: 'error', content });
    setCurrentQuickResponses(null); // Clear quick responses after an error
    setIsLoading(false); // Ensure loading is off after an error
    // Removed setCurrentLoadingMessage
  };

  const addSuccess = (content: string | JSX.Element) => {
    addEntry({ type: 'success', content });
    setCurrentQuickResponses(null); // Clear quick responses after success
    setIsLoading(false); // Ensure loading is off after success
    // Removed setCurrentLoadingMessage
  };

  // Helper to parse user input for various intents
  const parseUserInput = (input: string) => {
    const parsed: {
      url?: string;
      purpose?: string;
      destinationType?: string;
      command?: 'help' | 'start over' | 'yes' | 'no';
      configInput?: string; // For destination config
    } = {};

    const lowerInput = input.toLowerCase();

    // Check for commands
    if (lowerInput.includes('help')) {
      parsed.command = 'help';
      return parsed;
    }
    if (lowerInput.includes('start over') || lowerInput.includes('reset')) {
      parsed.command = 'start over';
      return parsed;
    }
    if (lowerInput === 'yes') {
      parsed.command = 'yes';
      return parsed;
    }
    if (lowerInput === 'no') {
      parsed.command = 'no';
      return parsed;
    }

    // Check for URL
    const urlMatch = input.match(/https?:\/\/[^\s]+/i);
    if (urlMatch) {
      parsed.url = urlMatch[0];
    }

    // Refined purpose parsing: only if currentStep is ASK_PURPOSE
    if (currentStep === 'ASK_PURPOSE') {
        let matchedPurpose: string | undefined;
        for (const purposeOption of formPurposes) {
            const lowerPurposeOption = purposeOption.toLowerCase();
            if (lowerInput.includes(lowerPurposeOption) || lowerPurposeOption.includes(lowerInput)) {
                matchedPurpose = purposeOption;
                break;
            }
            const wordsInPurpose = lowerPurposeOption.split(/\s*[\/\-]\s*|\s+/).filter(w => w.length > 2);
            if (wordsInPurpose.some(word => lowerInput.includes(word))) {
                matchedPurpose = purposeOption;
                break;
            }
        }
        if (matchedPurpose) {
            parsed.purpose = matchedPurpose;
        } else {
            // If no predefined purpose is matched, treat the user's input as a custom purpose
            parsed.purpose = input;
        }
    }


    // Check for destination type
    const destinationKeywords = ['email', 'google sheets', 'slack', 'webhook'];
    for (const keyword of destinationKeywords) {
      if (lowerInput.includes(keyword)) {
        parsed.destinationType = keyword.replace(/\s/g, ''); // Normalize to 'googlesheets'
        // If destination type is found, the rest of the input might be the config
        const configMatch = input.match(new RegExp(`${keyword}\\s*(.*)`, 'i'));
        if (configMatch && configMatch[1]) {
          parsed.configInput = configMatch[1].trim();
        }
        break;
      }
    }
    
    // If no specific destination type keyword, but it looks like an email or URL for config
    if (!parsed.destinationType) {
      if (lowerInput.includes('@') && lowerInput.includes('.')) {
        parsed.configInput = lowerInput.match(/\S+@\S+\.\S+/)?.[0];
        if (parsed.configInput) parsed.destinationType = 'email';
      } else if (lowerInput.includes('http') || lowerInput.includes('www')) {
        parsed.configInput = lowerInput.match(/https?:\/\/[^\s]+|www\.[^\s]+/)?.[0];
        if (parsed.configInput) parsed.destinationType = 'webhook'; // Default to webhook for generic URL
      }
    }


    return parsed;
  };

  const handleUserInput = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim() || isLoading) return;

    const input = userInput.trim();
    addUserResponse(input); // Add user's response to history
    setUserInput('');
    setError(null);
    // setIsLoading(true); // This is now handled by addLoading

    const parsedInput = parseUserInput(input);

    // Handle commands first
    if (parsedInput.command === 'help') {
      addPrompt("I can help you create a form by asking for a website URL, the form's purpose, and where to send submissions. You can also type 'start over' to reset the conversation.");
      // setIsLoading(false); // Handled by addPrompt
      return;
    }
    if (parsedInput.command === 'start over') {
      handleRestartConversation();
      // setIsLoading(false); // Handled by addPrompt in restart
      return;
    }
    if (currentStep === 'DONE' && (parsedInput.command === 'yes' || parsedInput.command === 'no')) {
      handleRestart(parsedInput.command);
      // setIsLoading(false); // Handled by addPrompt in restart
      return;
    }

    // Process based on current step and detected intents
    try {
      switch (currentStep) {
        case 'ASK_URL':
          if (parsedInput.url) {
            await processUrlInput(parsedInput.url);
          } else {
            addError('Please provide a valid URL starting with http:// or https://');
            // setIsLoading(false); // Handled by addError
          }
          break;

        case 'ASK_PURPOSE':
          if (parsedInput.purpose) {
            await processPurposeInput(parsedInput.purpose);
          } else if (parsedInput.url) { // User provided URL again, restart URL processing
            addPrompt("Looks like you're providing a URL again. Let's re-analyze that website.");
            await processUrlInput(parsedInput.url);
          } else {
            addError('Please tell me the main purpose of this form (e.g., "lead generation", "contact form", or even "tool rental form").');
            // setIsLoading(false); // Handled by addError
          }
          break;

        case 'ASK_DESTINATION_TYPE':
          if (parsedInput.destinationType) {
            await processDestinationTypeInput(parsedInput.destinationType, parsedInput.configInput);
          } else if (parsedInput.url) {
            addPrompt("Looks like you're providing a URL again. Let's re-analyze that website.");
            await processUrlInput(parsedInput.url);
          } else if (parsedInput.purpose) { // NEW: User entered a purpose when expecting destination
            addError(`"${parsedInput.purpose}" sounds like a form purpose. I'm currently asking for where to send submissions. Please choose a destination type like "Email", "Google Sheets", "Slack", or "Webhook".`);
          } else {
            addError('Please choose a destination type like "Email", "Google Sheets", "Slack", or "Webhook".');
          }
          break;

        case 'ASK_DESTINATION_CONFIG':
          if (parsedInput.configInput) {
            // User provided config input, process it
            await processDestinationConfigInput(parsedInput.configInput);
          } else if (parsedInput.destinationType) {
            // User provided a destination type.
            // If it's the same as the currently selected one, just re-prompt for config.
            if (parsedInput.destinationType === selectedDestinationType) {
                let configPrompt = '';
                switch (selectedDestinationType) {
                    case 'email':
                        configPrompt = 'Please provide the recipient email address (e.g., "sales@yourcompany.com").';
                        break;
                    case 'googlesheets':
                        configPrompt = 'Please provide the Google Sheets Spreadsheet ID (from the URL, e.g., "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms").';
                        break;
                    case 'slack':
                        configPrompt = 'Please provide the Slack Webhook URL (e.g., "https://hooks.slack.com/services/...").';
                        break;
                    case 'webhook':
                        configPrompt = 'Please provide the Webhook URL (e.g., "https://api.yourdomain.com/webhook").';
                        break;
                }
                addPrompt(configPrompt); // No quick responses here, just the prompt
            } else {
                // User provided a *different* destination type, switch to it
                await processDestinationTypeInput(parsedInput.destinationType, parsedInput.configInput);
            }
          } else if (parsedInput.purpose) { // NEW: User entered a purpose when expecting config
            addError(`"${parsedInput.purpose}" sounds like a form purpose. I'm currently asking for configuration details for ${selectedDestinationType}.`);
          } else {
            addError('Please provide the configuration details for your selected destination, or type a new destination type (e.g., "Slack").');
          }
          break;

        case 'DONE':
          // This case should be handled by the command check above for 'yes'/'no'
          // If we reach here, it means an unexpected input in DONE state
          addError('I\'m done for now. Would you like to create another form? Type "yes" or "no".');
          // setIsLoading(false); // Handled by addError
          break;

        default:
          addError('I\'m not sure how to respond to that. Can you rephrase or type "help"?');
          // setIsLoading(false); // Handled by addError
          break;
      }
    } catch (err: any) {
      console.error('Conversation error:', err);
      addError(err.message || 'An unexpected error occurred. Please try again.');
      // setIsLoading(false); // Handled by addError
    }
  };

  const handleQuickResponseClick = async (response: string) => {
    if (isLoading) return;

    // Add the selected quick response to history as if user typed it
    addUserResponse(response);
    setUserInput(''); // Clear input field immediately
    setError(null);
    // setIsLoading(true); // This is now handled by addLoading

    // Directly call handleUserInput with the quick response
    // This allows the full parsing and step logic to apply
    await handleUserInput({ preventDefault: () => {} } as React.FormEvent);
  };

  const processUrlInput = async (url: string) => {
    setIsLoading(true); // Set loading
    setCurrentStep('PROCESSING_URL'); // Update step for dynamic button text
    try {
      new URL(url); // Basic URL validation
    } catch {
      addError('That doesn\'t look like a valid URL. Please enter a URL starting with http:// or https://');
      setIsLoading(false); // Turn off loading on error
      return;
    }

    const authHeaders: HeadersInit = { 'Content-Type': 'application/json' };
    if (localStorage.getItem('authToken')) {
      authHeaders['Authorization'] = `Bearer ${localStorage.getItem('authToken')}`;
    }

    const extractResponse = await fetch('/api/forms/extract-design-tokens', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ url }),
    });

    const extractResult = await extractResponse.json();

    if (!extractResult.success) {
      addError(extractResult.error || 'Failed to analyze website. Please check the URL.');
      setIsLoading(false); // Turn off loading on error
      return;
    }

    const { id: recordId, designTokens, voiceAnalysis } = extractResult.data;
    setExtractedRecordId(recordId);
    setExtractedDesignTokens(designTokens);
    setExtractedVoiceAnalysis(voiceAnalysis);
    setFormData((prev) => ({ ...prev, url }));


    addSuccess('Website analyzed! Now, what is the main purpose of this form? (e.g., "Collect leads", "Customer feedback", or even "Tool rental form")');
    setCurrentStep('ASK_PURPOSE');
    // setIsLoading(false); // Handled by addSuccess
  };

  const processPurposeInput = async (purpose: string) => {
    setIsLoading(true); // Set loading
    setCurrentStep('PROCESSING_PURPOSE'); // Update step for dynamic button text
    if (!extractedRecordId) {
      addError('Something went wrong. I lost the website data. Please start over by providing the URL.');
      setCurrentStep('ASK_URL');
      setIsLoading(false); // Turn off loading on error
      return;
    }

    const authHeaders: HeadersInit = { 'Content-Type': 'application/json' };
    if (localStorage.getItem('authToken')) {
      authHeaders['Authorization'] = `Bearer ${localStorage.getItem('authToken')}`;
    }

    const generatePayload = {
      extractedRecordId,
      formPurpose: purpose,
      formName: formData.formName,
      formDescription: formData.formDescription,
      ...(guestToken && !user && { guestToken }),
    };

    const generateResponse = await fetch('/api/forms/generate', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify(generatePayload),
    });

    const generateResult = await generateResponse.json();

    if (!generateResult.success) {
      addError(generateResult.error || 'Failed to generate form. Please try a different purpose or URL.');
      if (generateResult.upgradeRequired) {
        addPrompt('It looks like you\'ve reached your form limit. Please upgrade to Pro for unlimited forms!');
      }
      setIsLoading(false); // Turn off loading on error
      return;
    }

    setGeneratedForm(generateResult.generatedForm);
    setCreatedForm(generateResult.form);
    setFormData((prev) => ({ ...prev, purpose }));


    // Set the step FIRST
    setCurrentStep('ASK_DESTINATION_TYPE'); 

    // Then add the prompt with quick response buttons
    addPrompt(
      "Your AI-generated form is ready! Next, where should I send the form submissions?",
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '10px' }}>
        <button className="btn btn-secondary" onClick={() => handleQuickResponseClick('Email')}>Email</button>
        <button className="btn btn-secondary" onClick={() => handleQuickResponseClick('Google Sheets')}>Google Sheets</button>
        <button className="btn btn-secondary" onClick={() => handleQuickResponseClick('Slack')}>Slack</button>
        <button className="btn btn-secondary" onClick={() => handleQuickResponseClick('Webhook')}>Webhook</button>
      </div>
    );
    // setIsLoading(false); // Handled by addPrompt
  };

  const processDestinationTypeInput = async (typeInput: string, configInput?: string) => {
    // No loading message here, as it's handled by the next step if configInput is present
    const normalizedType = typeInput.toLowerCase().replace(/\s/g, '');
    const availableTypes = ['email', 'googlesheets', 'slack', 'webhook']; // Match backend connector types

    if (!availableTypes.includes(normalizedType)) {
      addError('I don\'t recognize that destination type. Please choose from Email, Google Sheets, Slack, or Webhook.');
      // setIsLoading(false); // Handled by addError
      return;
    }

    setSelectedDestinationType(normalizedType);
    setFormData((prev) => ({ ...prev, destinationType: normalizedType as any }));

    if (configInput) {
      // If config was provided with type, process it immediately
      await processDestinationConfigInput(configInput, normalizedType);
    } else {
      // Prompt for config based on type
      let configPrompt = '';
      switch (normalizedType) {
        case 'email':
          configPrompt = 'Please provide the recipient email address (e.g., "sales@yourcompany.com").';
          break;
        case 'googlesheets':
          configPrompt = 'Please provide the Google Sheets Spreadsheet ID (from the URL, e.g., "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms").';
          break;
        case 'slack':
          configPrompt = 'Please provide the Slack Webhook URL (e.g., "https://hooks.slack.com/services/...").';
          break;
        case 'webhook':
          configPrompt = 'Please provide the Webhook URL (e.g., "https://api.yourdomain.com/webhook").';
          break;
      }
      addPrompt(configPrompt);
      setCurrentStep('ASK_DESTINATION_CONFIG');
      // setIsLoading(false); // Handled by addPrompt
    }
  };

  const processDestinationConfigInput = async (configInput: string, typeOverride?: string) => {
    setIsLoading(true); // Set loading
    setCurrentStep('PROCESSING_DESTINATION'); // Update step for dynamic button text
    const currentDestinationType = typeOverride || selectedDestinationType;

    if (!createdForm?.id || !currentDestinationType) {
      addError('Something went wrong. I lost the form or destination type. Please try again from the beginning.');
      setCurrentStep('ASK_URL');
      setIsLoading(false); // Turn off loading on error
      return;
    }

    let newConfig: any = {};
    let validationError = null;
    let expectedInputPrompt = '';

    switch (currentDestinationType) {
      case 'email':
        expectedInputPrompt = 'Please provide the recipient email address (e.g., "sales@yourcompany.com").';
        if (!/\S+@\S+\.\S+/.test(configInput)) {
          validationError = 'That doesn\'t look like a valid email address.';
        } else {
          newConfig = { to: configInput, subject: `New submission for ${createdForm.form_name}` };
        }
        break;
      case 'googlesheets':
        expectedInputPrompt = 'Please provide the Google Sheets Spreadsheet ID (from the URL, e.g., "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms").';
        // Basic validation for spreadsheet ID (can be more robust)
        if (!configInput.match(/^[a-zA-Z0-9_-]+$/)) {
          validationError = 'That doesn\'t look like a valid Google Sheets Spreadsheet ID.';
        } else {
          newConfig = { spreadsheetId: configInput, sheetName: 'Sheet1' };
        }
        break;
      case 'slack':
      case 'webhook':
        expectedInputPrompt = 'Please provide a valid URL for the webhook (e.g., "https://hooks.slack.com/services/...").';
        if (!/^https?:\/\/\S+/.test(configInput)) {
          validationError = 'That doesn\'t look like a valid URL.';
        } else {
          newConfig = { webhookUrl: configInput };
        }
        break;
    }

    if (validationError) {
      addError(`${validationError} ${expectedInputPrompt}`);
      setIsLoading(false); // Turn off loading on error
      return;
    }

    setDestinationConfig(newConfig);
    setFormData((prev) => ({ ...prev, destinationConfig: newConfig }));

    const authHeaders: HeadersInit = { 'Content-Type': 'application/json' };
    if (localStorage.getItem('authToken')) {
      authHeaders['Authorization'] = `Bearer ${localStorage.getItem('authToken')}`;
    }

    const configurePayload: any = {
      destinationType: currentDestinationType,
      destinationConfig: newConfig,
    };

    if (!user && guestToken) {
      configurePayload.guestToken = guestToken;
    }

    const configureResponse = await fetch(`/api/forms/${createdForm.id}/configure-destination`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify(configurePayload),
    });

    const configureResult = await configureResponse.json();

    if (!configureResult.success) {
      addError(configureResult.error || 'Failed to save destination configuration.');
      setIsLoading(false); // Turn off loading on error
      return;
    }

    addSuccess('Destination configured successfully! Your form is now fully set up.');
    addPrompt(
      <>
        You can find your form in the "My Forms" dashboard.
        <br />
        Would you like to create another form? Type "yes" or "no".
      </>
    );
    setCurrentStep('DONE'); // Transition to a final state where user can restart
    // setIsLoading(false); // Handled by addPrompt
    onFormGenerated(createdForm); // Notify parent that a form was created
  };

  const handleRestart = (command: 'yes' | 'no') => {
    if (command === 'yes') {
      setConversationHistory([
        { type: 'prompt', content: "Okay, let's create another form! What's the URL of the website you want to create a form for?" }
      ]);
      setUserInput('');
      // setIsLoading(false); // Handled by addPrompt
      setError(null);
      setFormData({});
      setExtractedDesignTokens(null);
      setExtractedVoiceAnalysis(null);
      setExtractedRecordId(null);
      setGeneratedForm(null);
      setCreatedForm(null);
      setSelectedDestinationType(null);
      setDestinationConfig({});
      setCurrentStep('ASK_URL');
      setCurrentContextSummary('');
      setCurrentQuickResponses(null); // Clear quick responses on restart
    } else if (command === 'no') {
      addPrompt("Alright! Feel free to come back anytime. Goodbye!");
      setUserInput('');
      // setIsLoading(false); // Handled by addPrompt
      // Maybe redirect to dashboard or something
    }
  };

  const handleRestartConversation = () => {
    setConversationHistory([
      { type: 'prompt', content: "Okay, let's start over! What's the URL of the website you want to create a form for?" }
    ]);
    setUserInput('');
    // setIsLoading(false); // Handled by addPrompt
    setError(null);
    setFormData({});
    setExtractedDesignTokens(null);
    setExtractedVoiceAnalysis(null);
    setExtractedRecordId(null);
    setGeneratedForm(null);
    setCreatedForm(null);
    setSelectedDestinationType(null);
    setDestinationConfig({});
    setCurrentStep('ASK_URL');
    setCurrentContextSummary('');
    setCurrentQuickResponses(null); // Clear quick responses on restart
  };


  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', height: '100%', paddingBottom: '16px' }}>
      {currentContextSummary && (
        <div style={{
          padding: '12px',
          backgroundColor: '#e3f2fd',
          border: '1px solid #bbdefb',
          borderRadius: '8px',
          marginBottom: '15px',
          fontSize: '14px',
          color: '#1565c0',
          fontWeight: '500'
        }}>
          Current Form: {currentContextSummary}
        </div>
      )}

      {/* Fixed height container for chat history and quick responses */}
      <div style={{ height: '60vh', display: 'flex', flexDirection: 'column', marginBottom: '12px' }}>
        <div
          ref={chatHistoryRef}
          style={{
            flex: 1, // This makes it take up all available vertical space
            overflowY: 'auto', // Enable vertical scrolling
            border: '1px solid #e1e5e9',
            borderRadius: '12px',
            padding: '20px',
            backgroundColor: '#f0f2f5',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.05)'
          }}
        >
          {conversationHistory.map((entry, index) => (
            <div key={index} style={{ display: 'flex', flexDirection: entry.type === 'user' ? 'row-reverse' : 'row' }}>
              <div
                style={{
                  maxWidth: '75%',
                  padding: '12px 18px',
                  borderRadius: '20px',
                  fontSize: '15px',
                  lineHeight: '1.4',
                  backgroundColor:
                    entry.type === 'user'
                      ? '#007bff'
                      : entry.type === 'error'
                      ? '#f8d7da'
                      : '#e3f2fd', // Unified AI response color (light blue)
                  color:
                    entry.type === 'user'
                      ? 'white'
                      : entry.type === 'error'
                      ? '#721c24'
                      : '#1565c0', // Unified AI response text color (dark blue)
                  alignSelf: entry.type === 'user' ? 'flex-end' : 'flex-start',
                  borderBottomRightRadius: entry.type === 'user' ? '4px' : '20px',
                  borderBottomLeftRadius: entry.type === 'user' ? '20px' : '4px',
                }}
              >
                {entry.content}
              </div>
            </div>
          ))}

          {/* Quick responses rendered inside the chat history */}
          {currentQuickResponses && (
            <div style={{ marginTop: '12px', display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'flex-start', flexShrink: 0 }}>
              {currentQuickResponses}
            </div>
          )}
        </div>
      </div>

      {/* Removed currentLoadingMessage */}

      <form onSubmit={handleUserInput} style={{ display: 'flex', gap: '10px', flexShrink: 0 }}>
        <input
          type="text"
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          placeholder={isLoading ? 'Please wait...' : 'Type your response here... (e.g., "help" or "start over")'}
          className="form-input"
          style={{ flexGrow: 1, padding: '12px', borderRadius: '8px', border: '1px solid #e1e5e9' }}
          disabled={isLoading}
        />
        <button
          type="submit"
          className="btn btn-primary"
          disabled={isLoading || !userInput.trim()}
          style={{ padding: '12px 20px', borderRadius: '8px' }}
        >
          {isLoading ? (
            currentStep === 'PROCESSING_URL' ? 'Analyzing...' :
            currentStep === 'PROCESSING_PURPOSE' ? 'Generating...' :
            currentStep === 'PROCESSING_DESTINATION' ? 'Saving...' :
            'Sending...'
          ) : 'Send'}
        </button>
      </form>

      {error && (
        <div className="error-message" style={{ marginTop: '15px', textAlign: 'center' }}>
          {error}
        </div>
      )}
    </div>
  );
};