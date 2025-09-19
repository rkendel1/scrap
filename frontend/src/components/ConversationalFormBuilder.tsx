import React, { useState, useEffect, useRef } from 'react';
import { FormData, GeneratedForm, SaaSForm, FormField, ExtractedDesignTokensData } from '../types/api';
import { ConnectorConfig } from './ConnectorConfig'; // Assuming ConnectorConfig is still useful for destination
import { Mail, Sheet, Slack, Link, Zap, Copy, Check, Edit } from 'lucide-react'; // Import Lucide icons, including Copy, Check, and Edit

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
    isGeneratingForm: boolean; // New: Indicate if form generation is in progress
  }) => void;
  onGetEmbedCodeClick: (form: SaaSForm) => void;
  onShowAuth: (mode: 'login' | 'register') => void; // New prop
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
  | 'FORM_GENERATED_OPTIONS' // New state for options after generation
  | 'ASK_DESTINATION_TYPE'
  | 'CONFIRM_DEFAULT_EMAIL' // New intermediate state
  | 'ASK_DESTINATION_CONFIG'
  | 'PROCESSING_DESTINATION' // New state
  | 'DESTINATION_CONFIGURED' // New state
  | 'ASK_GO_LIVE' // New state
  | 'PROCESSING_GO_LIVE' // New state
  | 'ASK_FORM_CHANGES' // New state for user to request changes
  | 'PROCESSING_FORM_CHANGES' // New state for AI to process changes
  | 'DONE';

export const ConversationalFormBuilder: React.FC<ConversationalFormBuilderProps> = ({
  onFormGenerated,
  user,
  guestToken,
  onStateChange,
  onGetEmbedCodeClick,
  onShowAuth, // Destructure new prop
}) => {
  const [currentStep, setCurrentStep] = useState<ConversationStep>('ASK_URL');
  const [conversationHistory, setConversationHistory] = useState<ConversationEntry[]>([
    { type: 'prompt', content: "Hi! I'm FormCraft AI. Let's create a native-looking form. First, where will this live? Please paste a URL.", timestamp: new Date() }
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
  const [isDestinationConfigured, setIsDestinationConfigured] = useState(false); // New state
  const [isGeneratingForm, setIsGeneratingForm] = useState(false); // New: Indicate if form generation is in progress
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied'>('idle'); // State for copy button feedback

  const chatHistoryRef = useRef<HTMLDivElement>(null);

  const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

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
  }, [conversationHistory]);

  useEffect(() => {
    onStateChange({
      formData,
      generatedForm,
      createdForm,
      extractedDesignTokens,
      extractedVoiceAnalysis,
      isDestinationConfigured,
      isGeneratingForm, // Pass new state
    });
    buildContextSummary();
  }, [formData, generatedForm, createdForm, extractedDesignTokens, extractedVoiceAnalysis, isDestinationConfigured, isGeneratingForm, onStateChange]);

  const addEntry = (entry: ConversationEntry) => {
    setConversationHistory((prev) => [...prev, { ...entry, timestamp: new Date() }]);
  };

  const addPrompt = (content: string | JSX.Element) => {
    addEntry({ type: 'prompt', content });
    setIsLoading(false);
  };

  const addUserResponse = (content: string) => {
    addEntry({ type: 'user', content });
    setIsLoading(false);
  };

  const addError = (content: string) => {
    addEntry({ type: 'error', content });
    setIsLoading(false);
  };

  const addSuccess = (content: string | JSX.Element) => {
    addEntry({ type: 'success', content });
    setIsLoading(false);
  };

  const parseUserInput = (input: string) => {
    const parsed: {
      url?: string;
      purpose?: string;
      destinationType?: string;
      command?: 'help' | 'start over' | 'yes' | 'no' | 'configure destination' | 'get embed code' | 'create account' | 'provide email' | 'im done' | 'make changes';
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
    if (lowerInput.includes('create account')) {
      parsed.command = 'create account';
      return parsed;
    }
    if (lowerInput.includes('provide email')) {
      parsed.command = 'provide email';
      return parsed;
    }
    if (lowerInput.includes('i\'m done') || lowerInput.includes('im done')) {
      parsed.command = 'im done';
      return parsed;
    }
    if (lowerInput.includes('make changes') || lowerInput.includes('change form')) {
      parsed.command = 'make changes';
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
    if (currentStep === 'FORM_GENERATED_OPTIONS' || currentStep === 'DESTINATION_CONFIGURED') {
      if (parsedInput.command === 'configure destination') {
        setCurrentStep('ASK_DESTINATION_TYPE');
        addPrompt(
          "Okay, where should I send the form submissions? You can choose from: Email, Google Sheets, Slack, Webhook, or Zapier."
        );
        return;
      }
      if (parsedInput.command === 'make changes') {
        setCurrentStep('ASK_FORM_CHANGES');
        addPrompt("What changes would you like to make to the form? Tell me what you want to modify (e.g., 'make the email field optional', 'change the button color to green', 'add a phone number field').");
        return;
      }
      if (parsedInput.command === 'im done') {
        handleDoneClick();
        return;
      }
      if (parsedInput.command === 'get embed code') {
        if (createdForm) {
          onGetEmbedCodeClick(createdForm);
          addPrompt("You can find your embed code in the 'My Forms' dashboard or by clicking the 'Get Embed Code' button in the preview. Would you like to create another form?");
          setCurrentStep('DONE');
        } else {
          addPrompt("No form has been generated yet. Please start by providing a URL.");
          setCurrentStep('ASK_URL');
        }
        return;
      }
    }
    if (parsedInput.command === 'create account') {
      onShowAuth('register');
      addPrompt("Please create an account in the modal. Once done, you can continue configuring your destination.");
      return;
    }


    try {
      switch (currentStep) {
        case 'ASK_URL':
          if (parsedInput.url) {
            await processUrlInput(parsedInput.url);
          } else if (parsedInput.purpose) {
            addPrompt("That sounds like a form's purpose! But first, I need the website URL where this form will live.");
          } else if (parsedInput.destinationType) {
            addPrompt("You're thinking ahead about destinations! Let's get the website URL first, then we can set up where to send the data.");
          } else {
            addPrompt('I\'m not sure how to interpret that. Please provide a valid URL starting with http:// or https://');
          }
          break;

        case 'ASK_PURPOSE':
          if (parsedInput.purpose) {
            await processPurposeInput(parsedInput.purpose);
          } else if (parsedInput.url) {
            addPrompt("Looks like you're providing a URL again. Let's re-analyze that website.");
            await processUrlInput(parsedInput.url);
          } else if (parsedInput.destinationType) {
            addPrompt("That's a great destination! But before we configure delivery, what is the main purpose of this form?");
          } else {
            addPrompt('I\'m not sure how to interpret that. Please tell me the main purpose of this form (e.g., "lead generation", "contact form", or even "tool rental form").');
          }
          break;

        case 'FORM_GENERATED_OPTIONS':
          // If user provides a destination type directly in this state
          if (parsedInput.destinationType) {
            await processDestinationTypeInput(parsedInput.destinationType, parsedInput.configInput);
          } else {
            addPrompt("I'm not sure how to interpret that. Would you like to 'Configure Destination' or 'Make Changes to Form'?");
          }
          break;

        case 'ASK_DESTINATION_TYPE':
          if (parsedInput.destinationType) {
            await processDestinationTypeInput(parsedInput.destinationType, parsedInput.configInput);
          } else if (parsedInput.configInput && selectedDestinationType) {
            // User provided config directly without explicitly selecting type again
            await processDestinationConfigInput(parsedInput.configInput);
          }
          else {
            addPrompt('I\'m sorry, I didn\'t understand that. Please choose a destination type like "Email", "Google Sheets", "Slack", "Webhook", or "Zapier".');
          }
          break;

        case 'CONFIRM_DEFAULT_EMAIL':
          if (parsedInput.command === 'yes') {
            if (user?.email) {
              await processDestinationConfigInput(user.email, 'email');
            } else {
              addPrompt("I couldn't find your email. Please provide it manually.");
              setCurrentStep('ASK_DESTINATION_CONFIG');
            }
          } else if (parsedInput.command === 'no') {
            addPrompt("Okay, please provide the recipient email address (e.g., \"sales@yourcompany.com\").");
            setCurrentStep('ASK_DESTINATION_CONFIG');
          } else {
            addPrompt("Please respond with 'Yes' or 'No'.");
          }
          break;

        case 'ASK_DESTINATION_CONFIG':
          if (parsedInput.configInput) {
            await processDestinationConfigInput(parsedInput.configInput);
          } else if (parsedInput.destinationType && parsedInput.destinationType !== selectedDestinationType) {
            addPrompt(`Okay, let's switch to ${parsedInput.destinationType}.`);
            await processDestinationTypeInput(parsedInput.destinationType, parsedInput.configInput);
          } else if (parsedInput.purpose) {
            addPrompt(`We've already determined the form's purpose. Now I need the configuration details for ${selectedDestinationType}.`);
          } else {
            let configPrompt = '';
            switch (selectedDestinationType) {
                case 'email': configPrompt = 'Please provide the recipient email address (e.g., "sales@yourcompany.com").'; break;
                case 'googlesheets': configPrompt = 'Please provide the Google Sheets Spreadsheet ID (from the URL, e.g., "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms").'; break;
                case 'slack': configPrompt = 'Please provide the Slack Webhook URL (e.g., "https://hooks.slack.com/services/...").'; break;
                case 'webhook': configPrompt = 'Please provide the Webhook URL (e.g., "https://api.yourdomain.com/webhook").'; break;
                case 'zapier': configPrompt = 'Please provide the Zapier Webhook URL (e.g., "https://hooks.zapier.com/hooks/catch/...").'; break;
                default: configPrompt = 'Please provide the configuration details for your selected destination, or type a new destination type (e.g., "Slack").'; break;
            }
            addPrompt(configPrompt);
          }
          break;

        case 'DESTINATION_CONFIGURED':
          addPrompt("Great! Your form's destination is configured. Would you like to make this form live now?");
          setCurrentStep('ASK_GO_LIVE');
          break;

        case 'ASK_GO_LIVE':
          if (parsedInput.command === 'yes') {
            await processGoLive();
          } else if (parsedInput.command === 'no') {
            addPrompt("Okay, your form will remain in draft mode. You can make it live later from your dashboard. Would you like to create another form?");
            setCurrentStep('DONE');
          } else {
            addPrompt("Please respond with 'Yes' or 'No'.");
          }
          break;

        case 'ASK_FORM_CHANGES':
          if (input) {
            await processFormChanges(input);
          } else {
            addPrompt("Please tell me what changes you'd like to make to the form.");
          }
          break;

        case 'DONE':
          addPrompt('I\'m done for now. Would you like to create another form? Type "yes" or "no".');
          break;

        default:
          addPrompt('I\'m not sure how to respond to that. Can you rephrase or type "help"?');
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
      addPrompt('That doesn\'t look like a valid URL. Please enter a URL starting with http:// or https://');
      setCurrentStep('ASK_URL'); // Stay on this step
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
      setCurrentStep('ASK_URL'); // Stay on this step
      return;
    }

    const { id: recordId, designTokens, voiceAnalysis } = extractResult.data;
    setExtractedRecordId(recordId);
    setExtractedDesignTokens(designTokens);
    setExtractedVoiceAnalysis(voiceAnalysis);
    setFormData((prev) => ({ ...prev, url }));

    addPrompt(`Perfect! I've analyzed ${url} and extracted the design tokens. The preview is updating live with their styles.`);
    addPrompt(`Now, what do you want to capture with this form?`);
    setCurrentStep('ASK_PURPOSE');
  };

  const handleCopyEmbedCode = (embedCode: string) => {
    const scriptEmbedCode = `<script src="${API_BASE}/embed.js" data-form="${embedCode}"></script>`;
    navigator.clipboard.writeText(scriptEmbedCode);
    setCopyStatus('copied');
    setTimeout(() => setCopyStatus('idle'), 2000); // Reset status after 2 seconds
  };

  const processPurposeInput = async (purpose: string) => {
    setCurrentStep('PROCESSING_PURPOSE');
    setIsGeneratingForm(true); // Set generating state to true
    if (!extractedRecordId) {
      addError('Something went wrong. I lost the website data. Please start over by providing the URL.');
      setCurrentStep('ASK_URL');
      setIsGeneratingForm(false); // Reset generating state
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
      setCurrentStep('ASK_PURPOSE'); // Stay on this step
      setIsGeneratingForm(false); // Reset generating state
      return;
    }

    const newForm = generateResult.form; // Get the newly created form
    setGeneratedForm(generateResult.generatedForm);
    setCreatedForm(newForm);
    setFormData((prev) => ({ ...prev, purpose }));

    const embedCode = newForm.embed_code;
    const isGuestForm = !user; // Check if it's a guest form

    setCurrentStep('FORM_GENERATED_OPTIONS'); // New state
    setIsGeneratingForm(false); // Reset generating state
    addPrompt(
      <>
        <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#333' }}>
          Excellent! I've instantly generated a form for "{purpose}". You can see it live on the right.
          {isGuestForm ? (
            " This form is currently temporary and will expire if not associated with an account."
          ) : (
            " This form is permanent as it's linked to your account."
          )}
        </p>
        <div className="chat-ad-buttons"> {/* New wrapper for ad buttons */}
          <button
            onClick={() => handleCopyEmbedCode(embedCode || '')}
            className="btn chat-ad-btn"
            disabled={!embedCode}
          >
            {copyStatus === 'copied' ? <Check size={16} className="mr-1" /> : <Copy size={16} className="mr-1" />}
            {copyStatus === 'copied' ? 'Copied!' : 'Copy Embed Code'}
          </button>
          <a
            href="/test-embed.html"
            target="_blank"
            rel="noopener noreferrer"
            className="btn chat-ad-btn"
          >
            🧪 Test Embed Page
          </a>
        </div>
        <p style={{ margin: '12px 0 0 0', fontSize: '14px', color: '#333' }}>
          What would you like to do next?
        </p>
      </>
    );
  };

  const processDestinationTypeInput = async (typeInput: string, configInput?: string) => {
    const normalizedType = typeInput.toLowerCase().replace(/\s/g, '');
    const availableTypes = ['email', 'googlesheets', 'slack', 'webhook', 'zapier'];

    if (!availableTypes.includes(normalizedType)) {
      addPrompt('I don\'t recognize that destination type. Please choose from Email, Google Sheets, Slack, Webhook, or Zapier.');
      setCurrentStep('ASK_DESTINATION_TYPE'); // Stay on this step
      return;
    }

    setSelectedDestinationType(normalizedType);
    setFormData((prev) => ({ ...prev, destinationType: normalizedType as any }));

    if (normalizedType === 'email') {
      if (user?.email) {
        addPrompt(
          <>
            Okay, I'll send submissions to your registered email: <strong>{user.email}</strong>. Is that correct?
          </>
        );
        setCurrentStep('CONFIRM_DEFAULT_EMAIL');
        return;
      } else {
        addPrompt(
          <>
            To use your email as the default, you need to create an account. Alternatively, you can provide a recipient email address now.
          </>
        );
        setCurrentStep('ASK_DESTINATION_CONFIG'); // Stay in this step to await input or command
        return;
      }
    }

    // For other destination types, proceed as before
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
      addPrompt(`${validationError} ${expectedInputPrompt}`);
      setCurrentStep('ASK_DESTINATION_CONFIG'); // Stay in this step
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
      setCurrentStep('ASK_DESTINATION_CONFIG'); // Stay in this step
      return;
    }

    setIsDestinationConfigured(true); // Set destination configured status
    addSuccess('Destination configured successfully! Your form is now fully set up.');
    addPrompt(
      "Your form is ready! Would you like to make this form live now?"
    );
    setCurrentStep('ASK_GO_LIVE'); // Transition to new step
    onFormGenerated(createdForm);
  };

  const processGoLive = async () => {
    setCurrentStep('PROCESSING_GO_LIVE');
    if (!createdForm?.id) {
      addError('Something went wrong. I lost the form. Please start over.');
      setCurrentStep('ASK_URL');
      return;
    }

    const authHeaders: HeadersInit = { 'Content-Type': 'application/json' };
    if (localStorage.getItem('authToken')) {
      authHeaders['Authorization'] = `Bearer ${localStorage.getItem('authToken')}`;
    } else {
      addPrompt("You need to be logged in to make a form live. Creating an account will also make your form permanent. Please create an account.");
      onShowAuth('register');
      setCurrentStep('ASK_GO_LIVE'); // Stay in this step
      return;
    }

    try {
      const response = await fetch(`/api/forms/${createdForm.id}/toggle-live`, {
        method: 'PATCH',
        headers: authHeaders,
        body: JSON.stringify({ isLive: true }) // Explicitly set to true
      });
      const result = await response.json();

      if (result.success) {
        setCreatedForm(prev => prev ? { ...prev, is_live: true } : null);
        addSuccess("Great! Your form is now live and ready to collect submissions.");
        addPrompt("Would you like to create another form?");
        setCurrentStep('DONE');
      } else {
        addError(result.message || "Failed to make the form live. Please try again or check your subscription status.");
        addPrompt("Would you like to create another form?");
        setCurrentStep('DONE');
      }
    } catch (err: any) {
      console.error('Go live error:', err);
      addError(err.message || 'An unexpected error occurred while trying to make the form live.');
      addPrompt("Would you like to create another form?");
      setCurrentStep('DONE');
    }
  };

  const processFormChanges = async (userChanges: string) => {
    setCurrentStep('PROCESSING_FORM_CHANGES');
    setIsGeneratingForm(true); // Indicate form generation is in progress

    if (!createdForm?.id || !generatedForm || !extractedDesignTokens || !extractedVoiceAnalysis) {
      addError('Something went wrong. I lost the form data or website analysis. Please start over.');
      setCurrentStep('ASK_URL');
      setIsGeneratingForm(false);
      return;
    }

    const authHeaders: HeadersInit = { 'Content-Type': 'application/json' };
    if (localStorage.getItem('authToken')) {
      authHeaders['Authorization'] = `Bearer ${localStorage.getItem('authToken')}`;
    } else {
      addPrompt("You need to be logged in to make changes to a form. Please create an account.");
      onShowAuth('register');
      setCurrentStep('ASK_FORM_CHANGES'); // Stay in this step
      setIsGeneratingForm(false);
      return;
    }

    try {
      const adaptPayload = {
        formId: createdForm.id,
        updatedConfig: generatedForm, // Pass the current generated form
        websiteData: {
          voiceAnalysis: extractedVoiceAnalysis,
          designTokens: extractedDesignTokens,
        },
        userChanges: userChanges,
      };

      const response = await fetch(`/api/forms/${createdForm.id}/adapt-form`, { // New endpoint for adaptation
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify(adaptPayload),
      });

      const result = await response.json();

      if (result.success) {
        const updatedGeneratedForm = result.data.generatedForm;
        const updatedSaaSForm = result.data.form;
        setGeneratedForm(updatedGeneratedForm);
        setCreatedForm(updatedSaaSForm);
        addSuccess("Great! I've applied your changes to the form. You can see the updated preview on the right.");
        addPrompt("What would you like to do next?");
        setCurrentStep('FORM_GENERATED_OPTIONS'); // Go back to options
      } else {
        addError(result.message || 'Failed to apply changes to the form. Please try again.');
        addPrompt("What changes would you like to make to the form? (e.g., 'make the email field optional', 'change the button color to green')");
        setCurrentStep('ASK_FORM_CHANGES'); // Stay in this step
      }
    } catch (err: any) {
      console.error('Form adaptation error:', err);
      addError(err.message || 'An unexpected error occurred while trying to modify the form.');
      addPrompt("What changes would you like to make to the form? (e.g., 'make the email field optional', 'change the button color to green')");
      setCurrentStep('ASK_FORM_CHANGES'); // Stay in this step
    } finally {
      setIsGeneratingForm(false); // Reset generating state
    }
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
      setIsGeneratingForm(false); // Reset
      setCurrentStep('ASK_URL');
      setCurrentContextSummary('');
    } else if (command === 'no') {
      addPrompt("Alright! Feel free to come back anytime. Goodbye!", null);
      setUserInput('');
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
    setIsGeneratingForm(false); // Reset
    setCurrentStep('ASK_URL');
    setCurrentContextSummary('');
  };

  const handleConfigureDestinationClick = () => {
    handleQuickResponseClick('configure destination');
  };

  const handleMakeChangesClick = () => {
    handleQuickResponseClick('make changes');
  };

  const handleDoneClick = () => {
    handleQuickResponseClick('im done');
  };

  const handleDestinationTypeClick = (type: string) => {
    handleQuickResponseClick(type);
  };

  const handleGoLiveClick = () => {
    handleQuickResponseClick('yes');
  };

  const handleNotLiveClick = () => {
    handleQuickResponseClick('no');
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
      case 'create account': return 'Create Account';
      case 'provide email': return 'Provide Email';
      default: return type;
    }
  };

  const renderQuickReplyButtons = () => {
    let buttons: { label: string; command: string; icon?: JSX.Element }[] = [];

    switch (currentStep) {
      case 'FORM_GENERATED_OPTIONS':
        buttons = [
          { label: 'Configure Destination', command: 'configure destination' },
          { label: 'Make Changes to Form', command: 'make changes', icon: <Edit size={16} /> },
          { label: "I'm Done", command: 'im done' },
        ];
        break;
      case 'ASK_DESTINATION_TYPE':
        buttons = [
          { label: 'Email', command: 'email', icon: <Mail size={16} /> },
          { label: 'Google Sheets', command: 'google sheets', icon: <Sheet size={16} /> },
          { label: 'Slack', command: 'slack', icon: <Slack size={16} /> },
          { label: 'Webhook', command: 'webhook', icon: <Link size={16} /> },
          { label: 'Zapier', command: 'zapier', icon: <Zap size={16} /> },
        ];
        break;
      case 'CONFIRM_DEFAULT_EMAIL':
      case 'ASK_GO_LIVE':
        buttons = [
          { label: 'Yes', command: 'yes' },
          { label: 'No', command: 'no' },
        ];
        break;
      case 'DONE':
        buttons = [
          { label: 'Yes, another form!', command: 'yes' },
          { label: 'No, I\'m good.', command: 'no' },
        ];
        break;
      default:
        return null;
    }

    return (
      <div className="quick-reply-buttons">
        {buttons.map((button, index) => (
          <button
            key={index}
            onClick={() => handleQuickResponseClick(button.command)}
            className="btn btn-secondary quick-reply-btn"
            disabled={isLoading}
          >
            {button.icon && <span className="mr-1">{button.icon}</span>}
            {button.label}
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="conversational-builder-card">
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

      {renderQuickReplyButtons()} {/* Render quick reply buttons here */}

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
            currentStep === 'PROCESSING_GO_LIVE' ? 'Going Live...' :
            currentStep === 'PROCESSING_FORM_CHANGES' ? 'Applying Changes...' : // New loading state
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