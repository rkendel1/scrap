import React, { useState, useEffect, useRef } from 'react';
import { FormData, GeneratedForm, SaaSForm, FormField, ExtractedDesignTokensData } from '../types/api';
import { ConnectorConfig } from './ConnectorConfig'; // Assuming ConnectorConfig is still useful for destination
import { Mail, Sheet, Slack, Link, Zap } from 'lucide-react'; // Import Lucide icons

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
    isDestinationConfigured: boolean; // Added
  }) => void;
  onGetEmbedCodeClick: (form: SaaSForm) => void;
  className?: string; // Add className prop
}

type ConversationEntry = {
  type: 'prompt' | 'user' | 'error' | 'success';
  content: string | JSX.Element;
  timestamp?: Date;
};

type ConversationStep =
  | 'ASK_URL'
  | 'PROCESSING_URL'
  | 'ASK_PURPOSE'
  | 'PROCESSING_PURPOSE'
  | 'FORM_GENERATED_REVIEW' // New state
  | 'ASK_DESTINATION_TYPE'
  | 'ASK_DESTINATION_CONFIG'
  | 'DESTINATION_CONFIGURED' // New state
  | 'DONE';

export const ConversationalFormBuilder: React.FC<ConversationalFormBuilderProps> = ({
  onFormGenerated,
  user,
  guestToken,
  onStateChange,
  onGetEmbedCodeClick,
  className, // Destructure className
}) => {
  const [currentStep, setCurrentStep] = useState<ConversationStep>('ASK_URL');
  const [conversationHistory, setConversationHistory] = useState<ConversationEntry[]>([
    { type: 'prompt', content: "Hi! I'm FormCraft AI. Let's create a native-looking form. First, where will this live? Please paste a URL.", timestamp: new Date() }
  ]);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentContextSummary, setCurrentContextSummary] = useState<string>('');
  const [currentQuickResponses, setCurrentQuickResponses] = useState<string[] | null>(null);

  // Data collected throughout the conversation
  const [formData, setFormData] = useState<Partial<FormData>>({});
  const [extractedDesignTokens, setExtractedDesignTokens] = useState<any | null>(null);
  const [extractedVoiceAnalysis, setExtractedVoiceAnalysis] = useState<any | null>(null);
  const [extractedRecordId, setExtractedRecordId] = useState<number | null>(null);
  const [generatedForm, setGeneratedForm] = useState<GeneratedForm | null>(null);
  const [createdForm, setCreatedForm] = useState<SaaSForm | null>(null);
  const [selectedDestinationType, setSelectedDestinationType] = useState<string | null>(null);
  const [destinationConfig, setDestinationConfig] = useState<any>({});
  const [isDestinationConfigured, setIsDestinationConfigured] = useState(false); // New state

  const chatHistoryRef = useRef<HTMLDivElement>(null);

  const destinationIcons: Record<string, JSX.Element> = {
    email: <Mail size={16} />,
    googlesheets: <Sheet size={16} />,
    slack: <Slack size={16} />,
    webhook: <Link size={16} />,
    zapier: <Zap size={16} />,
  };

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

  const buildContextSummary = () => {
    let summaryParts: string[] = [];
    if (formData.url) {
      summaryParts.push(`🌐 ${formData.url.length > 30 ? formData.url.substring(0, 27) + '...' : formData.url}`);
    }
    if (formData.purpose) {
      summaryParts.push(`🎯 ${formData.purpose}`);
    }
    if (formData.destinationType) {
      const icon = destinationIcons[formData.destinationType] ? ' ' : '';
      summaryParts.push(`${icon} ${formData.destinationType.charAt(0).toUpperCase() + formData.destinationType.slice(1)}`);
    }
    setCurrentContextSummary(summaryParts.join(' | '));
  };

  useEffect(() => {
    if (chatHistoryRef.current) {
      chatHistoryRef.current.scrollTop = chatHistoryRef.current.scrollHeight;
    }
  }, [conversationHistory, currentQuickResponses]);

  useEffect(() => {
    onStateChange({
      formData,
      generatedForm,
      createdForm,
      extractedDesignTokens,
      extractedVoiceAnalysis,
      isDestinationConfigured, // Pass new state
    });
    buildContextSummary();
  }, [formData, generatedForm, createdForm, extractedDesignTokens, extractedVoiceAnalysis, isDestinationConfigured, onStateChange]);

  const addEntry = (entry: ConversationEntry) => {
    setConversationHistory((prev) => [...prev, { ...entry, timestamp: new Date() }]);
  };

  const addPrompt = (content: string | JSX.Element, quickResponses: string[] | null = null) => {
    addEntry({ type: 'prompt', content });
    setCurrentQuickResponses(quickResponses);
    setIsLoading(false);
  };

  const addUserResponse = (content: string) => {
    addEntry({ type: 'user', content });
    setCurrentQuickResponses(null);
    setIsLoading(false);
  };

  const addError = (content: string) => {
    addEntry({ type: 'error', content });
    setCurrentQuickResponses(null);
    setIsLoading(false);
  };

  const addSuccess = (content: string | JSX.Element) => {
    addEntry({ type: 'success', content });
    setCurrentQuickResponses(null);
    setIsLoading(false);
  };

  const parseUserInput = (input: string) => {
    const parsed: {
      url?: string;
      purpose?: string;
      destinationType?: string;
      command?: 'help' | 'start over' | 'yes' | 'no' | 'configure destination' | 'get embed code'; // Added commands
      configInput?: string;
    } = {};

    const lowerInput = input.toLowerCase();

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
    if (lowerInput.includes('configure destination') || lowerInput.includes('set destination')) {
      parsed.command = 'configure destination';
      return parsed;
    }
    if (lowerInput.includes('get embed code') || lowerInput.includes('embed code')) {
      parsed.command = 'get embed code';
      return parsed;
    }

    const urlMatch = input.match(/https?:\/\/[^\s]+/i);
    if (urlMatch) {
      parsed.url = urlMatch[0];
    }

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
            parsed.purpose = input;
        }
    }

    const destinationKeywords = ['email', 'google sheets', 'slack', 'webhook', 'zapier'];
    for (const keyword of destinationKeywords) {
      if (lowerInput.includes(keyword)) {
        parsed.destinationType = keyword.replace(/\s/g, '');
        const configMatch = input.match(new RegExp(`${keyword}\\s*(.*)`, 'i'));
        if (configMatch && configMatch[1]) {
          parsed.configInput = configMatch[1].trim();
        }
        break;
      }
    }
    
    if (!parsed.destinationType) {
      if (lowerInput.includes('@') && lowerInput.includes('.')) {
        parsed.configInput = lowerInput.match(/\S+@\S+\.\S+/)?.[0];
        if (parsed.configInput) parsed.destinationType = 'email';
      } else if (lowerInput.includes('http') || lowerInput.includes('www')) {
        parsed.configInput = lowerInput.match(/https?:\/\/[^\s]+|www\.[^\s]+/)?.[0];
        if (parsed.configInput) parsed.destinationType = 'webhook';
      }
    }

    return parsed;
  };

  const handleUserInput = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim() || isLoading) return;

    const input = userInput.trim();
    addUserResponse(input);
    setUserInput('');
    setError(null);
    setIsLoading(true);

    const parsedInput = parseUserInput(input);

    if (parsedInput.command === 'help') {
      addPrompt("I can help you create a form by asking for a website URL, the form's purpose, and where to send submissions. You can also type 'start over' to reset the conversation.");
      return;
    }
    if (parsedInput.command === 'start over') {
      handleRestartConversation();
      return;
    }
    if (currentStep === 'DONE' && (parsedInput.command === 'yes' || parsedInput.command === 'no')) {
      handleRestart(parsedInput.command);
      return;
    }
    if (currentStep === 'FORM_GENERATED_REVIEW' || currentStep === 'DESTINATION_CONFIGURED') {
      if (parsedInput.command === 'configure destination') {
        setCurrentStep('ASK_DESTINATION_TYPE');
        addPrompt(
          "Okay, where should I send the form submissions?",
          ['Email', 'Google Sheets', 'Slack', 'Webhook', 'Zapier']
        );
        return;
      }
      if (parsedInput.command === 'get embed code') {
        if (createdForm) {
          onGetEmbedCodeClick(createdForm);
          addPrompt("Great! You can find your embed code in the 'My Forms' dashboard or by clicking the 'Get Embed Code' button in the preview. Would you like to create another form?", ['Yes', 'No']);
          setCurrentStep('DONE');
        } else {
          addError("No form has been generated yet. Please start by providing a URL.");
          setCurrentStep('ASK_URL');
        }
        return;
      }
    }


    try {
      switch (currentStep) {
        case 'ASK_URL':
          if (parsedInput.url) {
            await processUrlInput(parsedInput.url);
          } else {
            addError('Please provide a valid URL starting with http:// or https://');
          }
          break;

        case 'ASK_PURPOSE':
          if (parsedInput.purpose) {
            await processPurposeInput(parsedInput.purpose);
          } else if (parsedInput.url) {
            addPrompt("Looks like you're providing a URL again. Let's re-analyze that website.");
            await processUrlInput(parsedInput.url);
          } else {
            addError('Please tell me the main purpose of this form (e.g., "lead generation", "contact form", or even "tool rental form").');
          }
          break;

        case 'FORM_GENERATED_REVIEW':
          // If user provides a destination type directly in this state
          if (parsedInput.destinationType) {
            await processDestinationTypeInput(parsedInput.destinationType, parsedInput.configInput);
          } else {
            addError("I'm not sure how to interpret that. Would you like to 'Configure Destination' or 'Get Embed Code'?");
            addPrompt("What would you like to do next?", ['Get Embed Code', 'Configure Destination']); // Changed order
          }
          break;

        case 'ASK_DESTINATION_TYPE':
          if (parsedInput.destinationType) {
            await processDestinationTypeInput(parsedInput.destinationType, parsedInput.configInput);
          } else {
            addError('I\'m sorry, I didn\'t understand that. Please choose a destination type like "Email", "Google Sheets", "Slack", "Webhook", or "Zapier".');
            addPrompt(
              "Where should I send the form submissions?",
              ['Email', 'Google Sheets', 'Slack', 'Webhook', 'Zapier']
            );
          }
          break;

        case 'ASK_DESTINATION_CONFIG':
          if (parsedInput.configInput) {
            await processDestinationConfigInput(parsedInput.configInput);
          } else if (parsedInput.destinationType) {
            if (parsedInput.destinationType === selectedDestinationType) {
                let configPrompt = '';
                switch (selectedDestinationType) {
                    case 'email': configPrompt = 'Please provide the recipient email address (e.g., "sales@yourcompany.com").'; break;
                    case 'googlesheets': configPrompt = 'Please provide the Google Sheets Spreadsheet ID (from the URL, e.g., "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms").'; break;
                    case 'slack': configPrompt = 'Please provide the Slack Webhook URL (e.g., "https://hooks.slack.com/services/...").'; break;
                    case 'webhook': configPrompt = 'Please provide the Webhook URL (e.g., "https://api.yourdomain.com/webhook").'; break;
                    case 'zapier': configPrompt = 'Please provide the Zapier Webhook URL (e.g., "https://hooks.zapier.com/hooks/catch/...").'; break;
                }
                addPrompt(configPrompt);
            } else {
                await processDestinationTypeInput(parsedInput.destinationType, parsedInput.configInput);
            }
          } else if (parsedInput.purpose) {
            addError(`"${parsedInput.purpose}" sounds like a form purpose. I'm currently asking for configuration details for ${selectedDestinationType}.`);
          } else {
            addError('Please provide the configuration details for your selected destination, or type a new destination type (e.g., "Slack").');
          }
          break;

        case 'DESTINATION_CONFIGURED':
          // If user provides a destination type directly in this state
          if (parsedInput.destinationType) {
            await processDestinationTypeInput(parsedInput.destinationType, parsedInput.configInput);
          } else {
            addError("I'm not sure how to interpret that. Would you like to 'Configure Destination' or 'Get Embed Code'?");
            addPrompt("What would you like to do next?", ['Get Embed Code', 'Configure Destination']); // Changed order
          }
          break;

        case 'DONE':
          addError('I\'m done for now. Would you like to create another form? Type "yes" or "no".');
          break;

        default:
          addError('I\'m not sure how to respond to that. Can you rephrase or type "help"?');
          break;
      }
    } catch (err: any) {
      console.error('Conversation error:', err);
      addError(err.message || 'An unexpected error occurred. Please try again.');
    }
  };

  const handleQuickResponseClick = async (response: string) => {
    if (isLoading) return;
    setUserInput(response);
    setError(null);
    await handleUserInput({ preventDefault: () => {} } as React.FormEvent);
  };

  const processUrlInput = async (url: string) => {
    setCurrentStep('PROCESSING_URL');
    try {
      new URL(url);
    } catch {
      addError('That doesn\'t look like a valid URL. Please enter a URL starting with http:// or https://');
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
      return;
    }

    const { id: recordId, designTokens, voiceAnalysis } = extractResult.data;
    setExtractedRecordId(recordId);
    setExtractedDesignTokens(designTokens);
    setExtractedVoiceAnalysis(voiceAnalysis);
    setFormData((prev) => ({ ...prev, url }));

    addPrompt(
      `Perfect! I've analyzed ${url} and extracted the design tokens. The preview is updating live with their styles. Now, what do you want to capture with this form?`,
      formPurposes.slice(0, 3)
    );
    setCurrentStep('ASK_PURPOSE');
  };

  const processPurposeInput = async (purpose: string) => {
    setCurrentStep('PROCESSING_PURPOSE');
    if (!extractedRecordId) {
      addError('Something went wrong. I lost the website data. Please start over by providing the URL.');
      setCurrentStep('ASK_URL');
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
      return;
    }

    setGeneratedForm(generateResult.generatedForm);
    setCreatedForm(generateResult.form);
    setFormData((prev) => ({ ...prev, purpose }));
    // isDestinationConfigured remains as is, it doesn't block embed code anymore

    setCurrentStep('FORM_GENERATED_REVIEW'); // New state
    addPrompt(
      <>
        Excellent! I've instantly generated a form for "{purpose}". You can see it live on the right.
        <div style={{ marginTop: '12px', fontSize: '13px', color: '#666' }}>What would you like to do next?</div>
      </>,
      ['Get Embed Code', 'Configure Destination']
    );
  };

  const processDestinationTypeInput = async (typeInput: string, configInput?: string) => {
    const normalizedType = typeInput.toLowerCase().replace(/\s/g, '');
    const availableTypes = ['email', 'googlesheets', 'slack', 'webhook', 'zapier'];

    if (!availableTypes.includes(normalizedType)) {
      addError('I don\'t recognize that destination type. Please choose from Email, Google Sheets, Slack, Webhook, or Zapier.');
      addPrompt(
        <>
          Where should I send the form submissions?
          <div style={{ marginTop: '12px', fontSize: '13px', color: '#666' }}>Choose a destination:</div>
        </>,
        ['Email', 'Google Sheets', 'Slack', 'Webhook', 'Zapier']
      );
      return;
    }

    setSelectedDestinationType(normalizedType);
    setFormData((prev) => ({ ...prev, destinationType: normalizedType as any }));

    if (configInput) {
      await processDestinationConfigInput(configInput, normalizedType);
    } else {
      let configPrompt = '';
      switch (normalizedType) {
        case 'email': configPrompt = 'Please provide the recipient email address (e.g., "sales@yourcompany.com").'; break;
        case 'googlesheets': configPrompt = 'Please provide the Google Sheets Spreadsheet ID (from the URL, e.g., "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms").'; break;
        case 'slack': configPrompt = 'Please provide the Slack Webhook URL (e.g., "https://hooks.slack.com/services/...").'; break;
        case 'webhook': configPrompt = 'Please provide the Webhook URL (e.g., "https://api.yourdomain.com/webhook").'; break;
        case 'zapier': configPrompt = 'Please provide the Zapier Webhook URL (e.g., "https://hooks.zapier.com/hooks/catch/...").'; break;
      }
      addPrompt(configPrompt);
      setCurrentStep('ASK_DESTINATION_CONFIG');
    }
  };

  const processDestinationConfigInput = async (configInput: string, typeOverride?: string) => {
    setCurrentStep('PROCESSING_DESTINATION');
    const currentDestinationType = typeOverride || selectedDestinationType;

    if (!createdForm?.id || !currentDestinationType) {
      addError('Something went wrong. I lost the form or destination type. Please try again from the beginning.');
      setCurrentStep('ASK_URL');
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
        if (!configInput.match(/^[a-zA-Z0-9_-]+$/)) {
          validationError = 'That doesn\'t look like a valid Google Sheets Spreadsheet ID.';
        } else {
          newConfig = { spreadsheetId: configInput, sheetName: 'Sheet1' };
        }
        break;
      case 'slack':
      case 'webhook':
      case 'zapier':
        expectedInputPrompt = 'Please provide a valid URL for the webhook (e.g., "https://hooks.slack.com/services/..." or "https://hooks.zapier.com/hooks/catch/...").';
        if (!/^https?:\/\/\S+/.test(configInput)) {
          validationError = 'That doesn\'t look like a valid URL.';
        } else {
          newConfig = { webhookUrl: configInput };
        }
        break;
    }

    if (validationError) {
      addError(`${validationError} ${expectedInputPrompt}`);
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
      return;
    }

    setIsDestinationConfigured(true); // Set destination configured status
    addSuccess('Destination configured successfully! Your form is now fully set up.');
    addPrompt(
      "Your form is ready! You can now get the embed code. Would you like to create another form?",
      ['Yes', 'No']
    );
    setCurrentStep('DESTINATION_CONFIGURED'); // New state
    onFormGenerated(createdForm);
  };

  const handleRestart = (command: 'yes' | 'no') => {
    if (command === 'yes') {
      setConversationHistory([
        { type: 'prompt', content: "Okay, let's create another form! What's the URL of the website you want to create a form for?", timestamp: new Date() }
      ]);
      setUserInput('');
      setError(null);
      setFormData({});
      setExtractedDesignTokens(null);
      setExtractedVoiceAnalysis(null);
      setExtractedRecordId(null);
      setGeneratedForm(null);
      setCreatedForm(null);
      setSelectedDestinationType(null);
      setDestinationConfig({});
      setIsDestinationConfigured(false); // Reset
      setCurrentStep('ASK_URL');
      setCurrentContextSummary('');
      setCurrentQuickResponses(null);
    } else if (command === 'no') {
      addPrompt("Alright! Feel free to come back anytime. Goodbye!", null);
      setUserInput('');
      setCurrentQuickResponses(null);
    }
  };

  const handleRestartConversation = () => {
    setConversationHistory([
      { type: 'prompt', content: "Okay, let's start over! What's the URL of the website you want to create a form for?", timestamp: new Date() }
    ]);
    setUserInput('');
    setError(null);
    setFormData({});
    setExtractedDesignTokens(null);
    setExtractedVoiceAnalysis(null);
    setExtractedRecordId(null);
    setGeneratedForm(null);
    setCreatedForm(null);
    setSelectedDestinationType(null);
    setDestinationConfig({});
    setIsDestinationConfigured(false); // Reset
    setCurrentStep('ASK_URL');
    setCurrentContextSummary('');
    setCurrentQuickResponses(null);
  };

  const formatTimestamp = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getDestinationLabel = (type: string) => {
    switch (type) {
      case 'email': return 'Email';
      case 'googlesheets': return 'Google Sheets';
      case 'slack': return 'Slack';
      case 'webhook': return 'Webhook';
      case 'zapier': return 'Zapier';
      default: return type;
    }
  };

  return (
    <div className={`conversational-builder-card ${className || ''}`}> {/* Apply className here */}
      {currentContextSummary && (
        <div className="context-summary">
          Current Form: {currentContextSummary}
        </div>
      )}

      <div className="chat-history-container">
        <div
          ref={chatHistoryRef}
          className="chat-history-scroll"
        >
          {conversationHistory.map((entry, index) => (
            <div key={index} style={{ display: 'flex', flexDirection: entry.type === 'user' ? 'row-reverse' : 'row' }}>
              <div
                className={`chat-bubble ${entry.type}`}
              >
                {entry.content}
                {entry.timestamp && (
                  <span className="chat-timestamp">
                    {formatTimestamp(entry.timestamp)}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {currentQuickResponses && (
        <div style={{ width: '100%', marginTop: '12px' }}>
          {(currentStep === 'ASK_DESTINATION_TYPE' || currentStep === 'FORM_GENERATED_REVIEW' || currentStep === 'DESTINATION_CONFIGURED') && (
            <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>
              Use the buttons above to select your option
            </div>
          )}
          <div className="quick-reply-container">
            {currentQuickResponses.map((response, idx) => (
              <button key={idx} className="quick-reply-btn" onClick={() => handleQuickResponseClick(response)}>
                {destinationIcons[response.toLowerCase().replace(/\s/g, '')] || null}
                {getDestinationLabel(response.toLowerCase().replace(/\s/g, ''))}
              </button>
            ))}
          </div>
        </div>
      )}

      <form onSubmit={handleUserInput} className="form-input-container">
        <input
          type="text"
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          placeholder={isLoading ? 'Please wait...' : 'Type your response here... (e.g., "help" or "start over")'}
          className="form-input"
          disabled={isLoading}
        />
        <button
          type="submit"
          className="btn btn-primary"
          disabled={isLoading || !userInput.trim()}
        >
          {isLoading ? (
            currentStep === 'PROCESSING_URL' ? 'Analyzing...' :
            currentStep === 'PROCESSING_PURPOSE' ? 'Generating...' :
            currentStep === 'PROCESSING_DESTINATION' ? 'Saving...' :
            'Sending...'
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"></line>
              <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
            </svg>
          )}
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