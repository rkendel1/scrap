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
  type: 'prompt' | 'user' | 'loading' | 'error' | 'success';
  content: string | JSX.Element;
};

type ConversationStep =
  | 'ASK_URL'
  | 'PROCESSING_URL'
  | 'ASK_PURPOSE'
  | 'PROCESSING_PURPOSE'
  | 'ASK_DESTINATION_TYPE'
  | 'ASK_DESTINATION_CONFIG'
  | 'PROCESSING_DESTINATION'
  | 'DONE';

export const ConversationalFormBuilder: React.FC<ConversationalFormBuilderProps> = ({
  onFormGenerated,
  user,
  guestToken,
  onStateChange,
}) => {
  const [currentStep, setCurrentStep] = useState<ConversationStep>('ASK_URL');
  const [conversationHistory, setConversationHistory] = useState<ConversationEntry[]>([
    { type: 'prompt', content: "Hello! I'm your AI form builder. What is the URL of the website you want to create a form for?" }
  ]);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentContextSummary, setCurrentContextSummary] = useState<string>('');


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

  // Scroll to bottom of chat history
  useEffect(() => {
    if (chatHistoryRef.current) {
      chatHistoryRef.current.scrollTop = chatHistoryRef.current.scrollHeight;
    }
  }, [conversationHistory]);

  // Update parent component's state for LiveFormPreview
  useEffect(() => {
    onStateChange({
      formData,
      generatedForm,
      createdForm,
      extractedDesignTokens,
      extractedVoiceAnalysis,
    });
  }, [formData, generatedForm, createdForm, extractedDesignTokens, extractedVoiceAnalysis, onStateChange]);

  const addEntry = (entry: ConversationEntry) => {
    setConversationHistory((prev) => [...prev, entry]);
  };

  const addPrompt = (content: string | JSX.Element) => {
    addEntry({ type: 'prompt', content });
  };

  const addUserResponse = (content: string) => {
    addEntry({ type: 'user', content });
  };

  const addLoading = (content: string) => {
    addEntry({ type: 'loading', content: <span className="loading-dots">{content}</span> });
  };

  const addError = (content: string) => {
    addEntry({ type: 'error', content });
  };

  const addSuccess = (content: string) => {
    addEntry({ type: 'success', content });
  };

  const handleUserInput = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim() || isLoading) return;

    const input = userInput.trim();
    addUserResponse(input);
    setUserInput('');
    setError(null);
    setIsLoading(true);

    try {
      switch (currentStep) {
        case 'ASK_URL':
          await processUrlInput(input);
          break;
        case 'ASK_PURPOSE':
          await processPurposeInput(input);
          break;
        case 'ASK_DESTINATION_TYPE':
          await processDestinationTypeInput(input);
          break;
        case 'ASK_DESTINATION_CONFIG':
          await processDestinationConfigInput(input);
          break;
        default:
          break;
      }
    } catch (err: any) {
      console.error('Conversation error:', err);
      addError(err.message || 'An unexpected error occurred. Please try again.');
      setIsLoading(false);
    }
  };

  const handleQuickResponseClick = async (response: string) => {
    if (isLoading) return;

    // Add the selected quick response to history as if user typed it
    addUserResponse(response);
    setUserInput(''); // Clear input field immediately
    setError(null);
    setIsLoading(true);

    try {
      // Directly call the processing function for the current step
      // This assumes we are always in 'ASK_DESTINATION_TYPE' when these buttons are shown
      await processDestinationTypeInput(response);
    } catch (err: any) {
      console.error('Quick response processing error:', err);
      addError(err.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const processUrlInput = async (url: string) => {
    addLoading('Analyzing website...');
    try {
      new URL(url); // Basic URL validation
    } catch {
      addError('That doesn\'t look like a valid URL. Please enter a URL starting with http:// or https://');
      setIsLoading(false);
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
      setIsLoading(false);
      return;
    }

    const { id: recordId, designTokens, voiceAnalysis } = extractResult.data;
    setExtractedRecordId(recordId);
    setExtractedDesignTokens(designTokens);
    setExtractedVoiceAnalysis(voiceAnalysis);
    setFormData((prev) => ({ ...prev, url }));
    setCurrentContextSummary(`Current Form: ${url}`);


    addSuccess('Website analyzed! Now, tell me: What is the main purpose of this form? (e.g., "Collect leads for sales", "Get customer feedback")');
    setCurrentStep('ASK_PURPOSE');
    setIsLoading(false);
  };

  const processPurposeInput = async (purpose: string) => {
    addLoading('Generating form with AI...');
    if (!extractedRecordId) {
      addError('Something went wrong. I lost the website data. Please start over by providing the URL.');
      setCurrentStep('ASK_URL');
      setIsLoading(false);
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
      setIsLoading(false);
      return;
    }

    setGeneratedForm(generateResult.generatedForm);
    setCreatedForm(generateResult.form);
    setFormData((prev) => ({ ...prev, purpose }));
    setCurrentContextSummary(`Current Form: ${formData.url} | Purpose: ${purpose}`);


    addPrompt(
      <>
        Great! Your AI-generated form is ready. You can see a live preview on the right.
        <br />
        Next, where should I send the form submissions?
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '10px' }}>
          <button className="btn btn-secondary" onClick={() => handleQuickResponseClick('Email')}>Email</button>
          <button className="btn btn-secondary" onClick={() => handleQuickResponseClick('Google Sheets')}>Google Sheets</button>
          <button className="btn btn-secondary" onClick={() => handleQuickResponseClick('Slack')}>Slack</button>
          <button className="btn btn-secondary" onClick={() => handleQuickResponseClick('Webhook')}>Webhook</button>
        </div>
      </>
    );
    setCurrentStep('ASK_DESTINATION_TYPE');
    setIsLoading(false);
  };

  const processDestinationTypeInput = async (typeInput: string) => {
    const normalizedType = typeInput.toLowerCase().replace(/\s/g, '');
    const availableTypes = ['email', 'googlesheets', 'slack', 'webhook']; // Match backend connector types

    if (!availableTypes.includes(normalizedType)) {
      addError('I don\'t recognize that destination type. Please choose from Email, Google Sheets, Slack, or Webhook.');
      setIsLoading(false);
      return;
    }

    setSelectedDestinationType(normalizedType);
    setFormData((prev) => ({ ...prev, destinationType: normalizedType as any }));
    setCurrentContextSummary(`Current Form: ${formData.url} | Purpose: ${formData.purpose} | Destination: ${typeInput}`);


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
    setIsLoading(false);
  };

  const processDestinationConfigInput = async (configInput: string) => {
    addLoading('Saving destination configuration...');
    if (!createdForm?.id || !selectedDestinationType) {
      addError('Something went wrong. I lost the form or destination type. Please try again from the beginning.');
      setCurrentStep('ASK_URL');
      setIsLoading(false);
      return;
    }

    let newConfig: any = {};
    let validationError = null;
    let expectedInputPrompt = '';

    switch (selectedDestinationType) {
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
      setIsLoading(false);
      return;
    }

    setDestinationConfig(newConfig);
    setFormData((prev) => ({ ...prev, destinationConfig: newConfig }));

    const authHeaders: HeadersInit = { 'Content-Type': 'application/json' };
    if (localStorage.getItem('authToken')) {
      authHeaders['Authorization'] = `Bearer ${localStorage.getItem('authToken')}`;
    }

    const configureResponse = await fetch(`/api/forms/${createdForm.id}/configure-destination`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        destinationType: selectedDestinationType,
        destinationConfig: newConfig,
      }),
    });

    const configureResult = await configureResponse.json();

    if (!configureResult.success) {
      addError(configureResult.error || 'Failed to save destination configuration.');
      setIsLoading(false);
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
    setIsLoading(false);
    onFormGenerated(createdForm); // Notify parent that a form was created
  };

  const handleRestart = (e: React.FormEvent) => {
    e.preventDefault();
    if (userInput.toLowerCase() === 'yes') {
      setConversationHistory([
        { type: 'prompt', content: "Okay, let's create another form! What is the URL of the website you want to create a form for?" }
      ]);
      setUserInput('');
      setIsLoading(false);
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
    } else if (userInput.toLowerCase() === 'no') {
      addPrompt("Alright! Feel free to come back anytime. Goodbye!");
      setUserInput('');
      setIsLoading(false);
      // Maybe redirect to dashboard or something
    } else {
      addError('Please type "yes" or "no".');
      setIsLoading(false);
    }
  };


  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>AI Form Chatbot</h2>
      
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
          Current Conversation Context: {currentContextSummary}
        </div>
      )}

      <div
        ref={chatHistoryRef}
        style={{
          flexGrow: 0, 
          height: '400px', 
          border: '1px solid #e1e5e9',
          borderRadius: '8px',
          padding: '20px',
          overflowY: 'auto',
          marginBottom: '20px',
          backgroundColor: '#f8f9fa',
          display: 'flex',
          flexDirection: 'column',
          gap: '15px',
        }}
      >
        {conversationHistory.map((entry, index) => (
          <div key={index} style={{ display: 'flex', flexDirection: entry.type === 'user' ? 'row-reverse' : 'row' }}>
            <div
              style={{
                maxWidth: '80%',
                padding: '10px 15px',
                borderRadius: '18px',
                fontSize: '15px',
                lineHeight: '1.4',
                backgroundColor:
                  entry.type === 'user'
                    ? '#007bff'
                    : entry.type === 'prompt'
                    ? '#e9ecef'
                    : entry.type === 'loading'
                    ? '#e3f2fd'
                    : entry.type === 'error'
                    ? '#f8d7da'
                    : '#d4edda', // success
                color:
                  entry.type === 'user'
                    ? 'white'
                    : entry.type === 'error'
                    ? '#721c24'
                    : entry.type === 'success'
                    ? '#155724'
                    : '#333',
                alignSelf: entry.type === 'user' ? 'flex-end' : 'flex-start',
                borderBottomRightRadius: entry.type === 'user' ? '2px' : '18px',
                borderBottomLeftRadius: entry.type === 'user' ? '18px' : '2px',
              }}
            >
              {entry.content}
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={currentStep === 'DONE' ? handleRestart : handleUserInput} style={{ display: 'flex', gap: '10px' }}>
        <input
          type="text"
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          placeholder={isLoading ? 'Please wait...' : 'Type your response here...'}
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
          {isLoading ? 'Sending...' : 'Send'}
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