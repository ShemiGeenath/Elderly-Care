// ElderlyCareChatbot.jsx

import React, { useState, useRef, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Mic, Send, MicOff, Heart, Pill, Activity, AlertCircle, Calendar, Coffee, Brain } from 'lucide-react';

const ElderlyCareChatbot = () => {
  // Enhanced message structure with context tracking
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "👋 Hello! I'm your caring elderly care assistant. I'm here to help with medication reminders, health tips, daily activities, or just to chat. How can I assist you today?",
      sender: 'ai',
      category: 'greeting',
      context: {
        topic: 'greeting',
        stage: 'initial',
        entities: {},
        sentiment: 'positive',
        followUpNeeded: false
      },
      timestamp: new Date()
    }
  ]);
  
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(true);
  const [emergencyMode, setEmergencyMode] = useState(false);
  
  // Properly initialize conversation context with all required fields
  const [conversationContext, setConversationContext] = useState({
    currentTopic: null,
    topicStage: 'initial',
    userMood: 'neutral',
    mentionedSymptoms: [],
    medications: [],
    lastTopic: null,
    conversationHistory: [], // Initialize as empty array
    entities: {},
    followUpQuestions: [],
    userPreferences: {
      name: null,
      age: null,
      conditions: [],
      medications: []
    }
  });

  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);
  const recognitionRef = useRef(null);

  // Your API Key
  const API_KEY = "AIzaSyAOJu0IFdXvke01tJR8mfei2cHRWmjjUAg";

  // Initialize Web Speech API
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInputText(transcript);
        setIsListening(false);
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    } else {
      setVoiceSupported(false);
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  // Auto-scroll
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Check for emergencies with context - FIXED VERSION
  const checkForEmergency = (text, context) => {
    // Ensure context and conversationHistory exist with fallbacks
    const safeContext = context || { conversationHistory: [] };
    const conversationHistory = safeContext.conversationHistory || [];
    
    const emergencyKeywords = [
      'fall', 'fell', "can't move", 'cannot move', 'help me', 'emergency',
      'heart attack', 'chest pain', 'difficulty breathing', "can't breathe",
      'unconscious', 'bleeding', 'stroke', 'seizure', 'calling 911'
    ];
    
    const textLower = text.toLowerCase();
    const isEmergency = emergencyKeywords.some(keyword => textLower.includes(keyword));
    
    // Check if this follows previous emergency-related messages with safe array check
    const previousEmergency = conversationHistory.length > 0 && 
      conversationHistory.some(h => 
        h && h.message && emergencyKeywords.some(k => h.message.toLowerCase().includes(k))
      );

    if ((isEmergency || previousEmergency) && !emergencyMode) {
      setEmergencyMode(true);
      return true;
    }
    return false;
  };

  // Wrap checkForEmergency in useEffect with safe access
  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (lastMessage?.sender === 'user') {
      // Pass the current conversation context safely
      checkForEmergency(lastMessage.text, conversationContext);
    }
  }, [messages, conversationContext]); // Add conversationContext as dependency

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Advanced NLP Functions
  const extractEntities = (text) => {
    const entities = {
      medications: [],
      symptoms: [],
      timeframes: [],
      quantities: [],
      emotions: [],
      activities: [],
      bodyParts: []
    };

    const textLower = text.toLowerCase();

    // Common words to filter out
    const commonWords = [
      'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
      'with', 'by', 'from', 'up', 'about', 'into', 'through', 'during',
      'before', 'after', 'my', 'your', 'his', 'her', 'its', 'our', 'their'
    ];

    // Medication extraction
    const medicationPatterns = [
      /\b(?:take|took|taking)\s+(\w+)\b/gi,
      /\b(\w+)\s+(?:pill|tablet|medicine|medication)\b/gi,
      /\b(?:my)\s+(\w+)\s+(?:medication|medicine|pill)\b/gi
    ];
    
    medicationPatterns.forEach(pattern => {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        if (match[1] && !commonWords.includes(match[1].toLowerCase())) {
          entities.medications.push(match[1]);
        }
      }
    });

    // Symptom extraction
    const symptomKeywords = [
      'pain', 'ache', 'hurt', 'dizzy', 'nausea', 'fever', 'cough',
      'fatigue', 'weak', 'tired', 'headache', 'stomach', 'chest',
      'breathing', 'swelling', 'rash', 'itch', 'burn'
    ];

    symptomKeywords.forEach(symptom => {
      if (textLower.includes(symptom)) {
        entities.symptoms.push(symptom);
      }
    });

    // Timeframe extraction
    const timePatterns = [
      /\b(?:this\s+)?(morning|afternoon|evening|night)\b/gi,
      /\b(\d+)\s*(?:(hour|hr|minute|min|day)s?)\s+(?:ago|back)\b/gi,
      /\b(?:yesterday|today|tomorrow)\b/gi,
      /\b(\d+)\s*(?::\d+)?\s*(?:am|pm)\b/gi
    ];

    timePatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        entities.timeframes.push(...matches);
      }
    });

    // Emotion extraction
    const emotionKeywords = {
      happy: ['happy', 'good', 'great', 'wonderful', 'excellent'],
      sad: ['sad', 'down', 'depressed', 'unhappy', 'blue', 'lonely'],
      anxious: ['anxious', 'worried', 'nervous', 'scared', 'fear', 'panic'],
      angry: ['angry', 'frustrated', 'annoyed', 'upset'],
      tired: ['tired', 'exhausted', 'fatigued', 'sleepy'],
      lonely: ['lonely', 'alone', 'isolated', 'abandoned']
    };

    Object.entries(emotionKeywords).forEach(([emotion, keywords]) => {
      if (keywords.some(keyword => textLower.includes(keyword))) {
        entities.emotions.push(emotion);
      }
    });

    return entities;
  };

  // Analyze sentiment
  const analyzeSentiment = (text) => {
    const positiveWords = [
      'good', 'great', 'better', 'best', 'happy', 'glad', 'wonderful',
      'excellent', 'amazing', 'fine', 'okay', 'well', 'love', 'enjoy'
    ];
    
    const negativeWords = [
      'bad', 'worse', 'worst', 'sad', 'depressed', 'lonely', 'pain',
      'hurt', 'terrible', 'awful', 'difficult', 'hard', 'struggle'
    ];

    const textLower = text.toLowerCase();
    let score = 0;

    positiveWords.forEach(word => {
      if (textLower.includes(word)) score += 1;
    });

    negativeWords.forEach(word => {
      if (textLower.includes(word)) score -= 1;
    });

    if (score > 0) return 'positive';
    if (score < 0) return 'negative';
    return 'neutral';
  };

  // Analyze intent with context awareness
  const analyzeIntent = (text, previousContext) => {
    const textLower = text.toLowerCase();
    const entities = extractEntities(text);
    const sentiment = analyzeSentiment(text);

    // Check if this is a follow-up response
    const isFollowUp = previousContext.followUpQuestions?.length > 0 && 
                      text.length < 50; // Short responses are likely answers

    // Intent categories with patterns
    const intents = {
      medication: {
        patterns: [
          'medication', 'medicine', 'pill', 'tablet', 'prescription',
          'dosage', 'dose', 'take', 'took', 'refill'
        ],
        priority: 1
      },
      symptom: {
        patterns: [
          'pain', 'ache', 'hurt', 'feel', 'symptom', 'sick',
          'dizzy', 'nausea', 'fever', 'cough', 'fatigue'
        ],
        priority: 2
      },
      emotional: {
        patterns: [
          'lonely', 'sad', 'depressed', 'anxious', 'worry',
          'scared', 'alone', 'emotional', 'feel'
        ],
        priority: 3
      },
      activity: {
        patterns: [
          'exercise', 'walk', 'move', 'activity', 'stretch',
          'bend', 'sit', 'stand', 'mobile'
        ],
        priority: 4
      },
      nutrition: {
        patterns: [
          'eat', 'food', 'meal', 'hungry', 'thirsty', 'drink',
          'water', 'breakfast', 'lunch', 'dinner', 'snack'
        ],
        priority: 5
      },
      appointment: {
        patterns: [
          'appointment', 'doctor', 'clinic', 'hospital', 'visit',
          'checkup', 'see doctor', 'medical'
        ],
        priority: 6
      },
      emergency: {
        patterns: [
          'help', 'emergency', 'fall', 'fell', "can't move",
          'heart attack', 'chest pain', "can't breathe", 'bleeding'
        ],
        priority: 0 // Highest priority
      }
    };

    // Calculate intent scores
    const intentScores = {};
    Object.entries(intents).forEach(([intent, config]) => {
      let score = 0;
      config.patterns.forEach(pattern => {
        if (textLower.includes(pattern)) {
          score += 1;
          // Check for context continuity
          if (previousContext.currentTopic === intent) {
            score += 2; // Boost score if continuing same topic
          }
        }
      });
      
      // Check entities for additional context
      if (intent === 'medication' && entities.medications.length > 0) score += 2;
      if (intent === 'symptom' && entities.symptoms.length > 0) score += 2;
      if (intent === 'emotional' && entities.emotions.length > 0) score += 2;
      
      intentScores[intent] = score;
    });

    // Determine primary intent
    let primaryIntent = 'general';
    let highestScore = 0;

    Object.entries(intentScores).forEach(([intent, score]) => {
      if (score > highestScore) {
        highestScore = score;
        primaryIntent = intent;
      }
    });

    // Special handling for follow-ups
    if (isFollowUp && previousContext.currentTopic) {
      primaryIntent = previousContext.currentTopic;
    }

    return {
      intent: primaryIntent,
      confidence: highestScore > 0 ? Math.min(highestScore / 5, 1) : 0.3,
      entities,
      sentiment,
      isFollowUp,
      needsClarification: highestScore === 0 && text.length > 10
    };
  };

  // Generate follow-up questions based on context
  const generateFollowUpQuestions = (intent, entities, context) => {
    const questions = [];

    switch (intent) {
      case 'medication':
        if (!entities.medications.length) {
          questions.push("Which medication are you referring to?");
        }
        if (!entities.timeframes.length) {
          questions.push("When did you take this medication?");
        }
        break;

      case 'symptom':
        if (!entities.symptoms.length) {
          questions.push("Can you describe the symptom in more detail?");
        }
        if (!entities.timeframes.length) {
          questions.push("When did this symptom start?");
        }
        break;

      case 'emotional':
        if (entities.emotions.includes('lonely')) {
          questions.push("Would you like to talk about what's making you feel lonely?");
          questions.push("Have you been able to connect with family or friends recently?");
        } else if (entities.emotions.includes('anxious')) {
          questions.push("What specifically is making you feel anxious?");
          questions.push("Have you tried any relaxation techniques?");
        }
        break;

      case 'activity':
        questions.push("What kind of activities do you usually enjoy?");
        questions.push("Do you have any mobility limitations I should know about?");
        break;

      case 'nutrition':
        questions.push("What did you eat today?");
        questions.push("Are you having trouble preparing meals?");
        break;
    }

    return questions;
  };

  // Update conversation context
  const updateContext = (userMessage, intentAnalysis, aiResponse) => {
    setConversationContext(prev => {
      // Ensure prev has all required properties
      const safePrev = {
        currentTopic: prev?.currentTopic || null,
        topicStage: prev?.topicStage || 'initial',
        userMood: prev?.userMood || 'neutral',
        mentionedSymptoms: prev?.mentionedSymptoms || [],
        medications: prev?.medications || [],
        lastTopic: prev?.lastTopic || null,
        conversationHistory: prev?.conversationHistory || [],
        entities: prev?.entities || {},
        followUpQuestions: prev?.followUpQuestions || [],
        userPreferences: prev?.userPreferences || {
          name: null,
          age: null,
          conditions: [],
          medications: []
        }
      };

      // Extract new information
      const newEntities = intentAnalysis.entities || {};
      
      // Update user preferences if new info available
      const updatedPreferences = { ...safePrev.userPreferences };
      
      // Try to extract name
      const nameMatch = userMessage.text.match(/my name is (\w+)|i'm (\w+)|i am (\w+)/i);
      if (nameMatch) {
        updatedPreferences.name = nameMatch[1] || nameMatch[2] || nameMatch[3];
      }

      // Update medications list
      if (newEntities.medications && newEntities.medications.length > 0) {
        updatedPreferences.medications = [
          ...new Set([...safePrev.userPreferences.medications, ...newEntities.medications])
        ];
      }

      // Update conditions based on symptoms
      if (newEntities.symptoms && newEntities.symptoms.length > 0) {
        updatedPreferences.conditions = [
          ...new Set([...safePrev.userPreferences.conditions, ...newEntities.symptoms])
        ];
      }

      // Generate follow-up questions
      const followUps = generateFollowUpQuestions(
        intentAnalysis.intent, 
        newEntities, 
        safePrev
      );

      return {
        ...safePrev,
        currentTopic: intentAnalysis.intent,
        topicStage: intentAnalysis.isFollowUp ? 'follow-up' : 'initial',
        userMood: intentAnalysis.sentiment,
        mentionedSymptoms: [...new Set([...safePrev.mentionedSymptoms, ...(newEntities.symptoms || [])])],
        medications: [...new Set([...safePrev.medications, ...(newEntities.medications || [])])],
        lastTopic: safePrev.currentTopic,
        conversationHistory: [...safePrev.conversationHistory, {
          message: userMessage.text,
          intent: intentAnalysis.intent,
          timestamp: new Date()
        }],
        entities: { ...safePrev.entities, ...newEntities },
        followUpQuestions: followUps,
        userPreferences: updatedPreferences
      };
    });
  };

  // Enhanced system prompt with context
  const getSystemPrompt = (userMessage, intentAnalysis, context) => {
    const safeContext = {
      currentTopic: context?.currentTopic || 'New conversation',
      userMood: context?.userMood || 'neutral',
      medications: context?.medications || [],
      mentionedSymptoms: context?.mentionedSymptoms || [],
      userPreferences: context?.userPreferences || { name: null },
      conversationHistory: context?.conversationHistory || []
    };

    const recentHistory = safeContext.conversationHistory.slice(-3).map(h => 
      `- ${h.message} (${h.intent})`
    ).join('\n');

    return `You are a compassionate elderly care assistant with expertise in senior healthcare. 

CURRENT CONTEXT:
- Current Topic: ${safeContext.currentTopic}
- User Mood: ${safeContext.userMood}
- Known Medications: ${safeContext.medications.join(', ') || 'None mentioned'}
- Mentioned Symptoms: ${safeContext.mentionedSymptoms.join(', ') || 'None'}
- User Name: ${safeContext.userPreferences.name || 'Not provided'}
- Follow-up Needed: ${intentAnalysis.needsClarification ? 'Yes' : 'No'}

RECENT CONVERSATION HISTORY:
${recentHistory || 'No recent history'}

CURRENT USER MESSAGE INTENT: ${intentAnalysis.intent} (confidence: ${Math.round(intentAnalysis.confidence * 100)}%)
Entities detected: ${JSON.stringify(intentAnalysis.entities)}

RESPONSE GUIDELINES:
1. Maintain conversation continuity - reference previous messages
2. If this is a follow-up, acknowledge their previous message
3. Ask one relevant follow-up question at a time
4. Use their name if known (${safeContext.userPreferences.name ? `they are ${safeContext.userPreferences.name}` : 'ask for it naturally'})
5. Show empathy based on their mood (${safeContext.userMood})
6. Keep responses clear and simple
7. For medication discussions, reference their known medications
8. For symptoms, connect to previously mentioned issues

Remember: You're building a caring relationship, not just answering individual questions.`;
  };

  const sendMessage = async () => {
    if (!inputText.trim() || isLoading) return;

    // Analyze intent with context
    const intentAnalysis = analyzeIntent(inputText, conversationContext);
    
    // Create user message with context
    const userMessage = {
      id: Date.now(),
      text: inputText,
      sender: 'user',
      intent: intentAnalysis.intent,
      entities: intentAnalysis.entities,
      sentiment: intentAnalysis.sentiment,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = inputText;
    setInputText('');
    setIsLoading(true);

    try {
      const systemPrompt = getSystemPrompt(userMessage, intentAnalysis, conversationContext);

      // Build conversation history for API
      const conversationHistory = messages.slice(-6).map(m => 
        `${m.sender === 'user' ? 'User' : 'Assistant'}: ${m.text}`
      ).join('\n');

      const fullPrompt = `${systemPrompt}

CONVERSATION HISTORY (last few messages):
${conversationHistory}

Current user message: "${currentInput}"

Provide a caring, context-aware response that continues the conversation naturally. Include ONE follow-up question if appropriate.`;

      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`,
        {
          contents: [
            {
              parts: [
                { text: fullPrompt }
              ]
            }
          ]
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.candidates && response.data.candidates[0].content) {
        const aiText = response.data.candidates[0].content.parts[0].text;

        // Analyze if AI response contains a question
        const containsQuestion = aiText.includes('?');

        const aiResponse = {
          id: Date.now() + 1,
          text: aiText,
          sender: 'ai',
          intent: intentAnalysis.intent,
          category: intentAnalysis.intent,
          context: {
            topic: intentAnalysis.intent,
            stage: containsQuestion ? 'asking' : 'informing',
            entities: intentAnalysis.entities
          },
          timestamp: new Date()
        };

        setMessages(prev => [...prev, aiResponse]);
        
        // Update conversation context
        updateContext(userMessage, intentAnalysis, aiResponse);

        // Voice response for important messages
        if (intentAnalysis.intent === 'emergency' || 
            intentAnalysis.intent === 'medication' && 'speechSynthesis' in window) {
          const utterance = new SpeechSynthesisUtterance(aiText.slice(0, 150));
          utterance.rate = 0.9;
          utterance.pitch = 1.1;
          window.speechSynthesis.speak(utterance);
        }
      }

    } catch (error) {
      console.error('API Error:', error);
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        text: "I'm having trouble connecting. Please try again in a moment.",
        sender: 'ai',
        category: 'error',
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleListening = () => {
    if (!voiceSupported) {
      alert('Voice recognition is not supported in your browser.');
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current?.start();
        setIsListening(true);
      } catch (error) {
        console.error('Failed to start recognition:', error);
        setIsListening(false);
      }
    }
  };

  // Component for displaying context-aware suggestions
  const ContextSuggestions = ({ context }) => {
    if (!context.currentTopic || !context.followUpQuestions || context.followUpQuestions.length === 0) return null;

    return (
      <div className="bg-gray-800 p-3 border-t border-gray-700">
        <p className="text-sm text-gray-400 mb-2">Quick replies:</p>
        <div className="flex flex-wrap gap-2">
          {context.followUpQuestions.slice(0, 2).map((question, index) => (
            <button
              key={index}
              onClick={() => setInputText(question)}
              className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded-full text-sm text-gray-200"
            >
              {question}
            </button>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-screen max-w-4xl mx-auto bg-gray-900 text-gray-100">
      {/* Header with context awareness */}
      <div className="bg-gradient-to-r from-teal-700 to-blue-800 border-b border-gray-700 p-4">
        <div className="flex items-center space-x-3">
          <div className="bg-white p-2 rounded-lg">
            <Heart className="w-6 h-6 text-red-500" />
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-bold">Elderly Care Assistant</h1>
            <p className="text-sm text-gray-200">
              {conversationContext.userPreferences?.name 
                ? `Welcome back, ${conversationContext.userPreferences.name}! 👋` 
                : 'Compassionate support for seniors'}
            </p>
          </div>
          {/* Show current context indicator */}
          {conversationContext.currentTopic && (
            <div className="bg-teal-600 px-3 py-1 rounded-full text-xs">
              <Brain className="w-3 h-3 inline mr-1" />
              {conversationContext.currentTopic}
            </div>
          )}
        </div>
      </div>

      {/* Emergency Banner */}
      {emergencyMode && (
        <div className="bg-red-700 text-white p-3 flex items-center justify-between animate-pulse">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5" />
            <span className="font-bold">EMERGENCY MODE ACTIVE - Stay Calm</span>
          </div>
          <button 
            onClick={() => setEmergencyMode(false)}
            className="px-3 py-1 bg-red-800 hover:bg-red-900 rounded text-sm"
          >
            Clear
          </button>
        </div>
      )}

      {/* Context-Aware Quick Actions */}
      <div className="bg-gray-800 p-2 flex overflow-x-auto space-x-2 scrollbar-hide">
        <button 
          onClick={() => setInputText("I need help with my medications")}
          className="flex-shrink-0 px-3 py-2 bg-blue-900 hover:bg-blue-800 rounded-lg text-sm flex items-center"
        >
          <Pill className="w-4 h-4 mr-2" /> Medications
        </button>
        <button 
          onClick={() => setInputText(conversationContext.mentionedSymptoms?.length > 0 
            ? `Tell me more about my ${conversationContext.mentionedSymptoms[0]}` 
            : "I don't feel well")}
          className="flex-shrink-0 px-3 py-2 bg-red-900 hover:bg-red-800 rounded-lg text-sm flex items-center"
        >
          <Heart className="w-4 h-4 mr-2" /> 
          {conversationContext.mentionedSymptoms?.length > 0 ? 'My Symptoms' : 'Not feeling well'}
        </button>
        <button 
          onClick={() => setInputText("I'm feeling " + (conversationContext.userMood === 'negative' ? 'still sad' : 'lonely'))}
          className="flex-shrink-0 px-3 py-2 bg-purple-900 hover:bg-purple-800 rounded-lg text-sm flex items-center"
        >
          <Heart className="w-4 h-4 mr-2" /> Emotional Support
        </button>
      </div>

      {/* Chat Messages */}
      <div 
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4"
        style={{ maxHeight: 'calc(100vh - 280px)' }}
      >
        {messages.map((message, index) => (
          <div
            key={message.id}
            className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-lg p-4 ${
                message.sender === 'user'
                  ? 'bg-blue-600 text-white rounded-br-none'
                  : message.intent === 'emergency'
                  ? 'bg-red-800 text-white rounded-bl-none border-2 border-red-600'
                  : 'bg-gray-800 text-gray-100 rounded-bl-none'
              }`}
            >
              {/* Show context continuity indicator */}
              {message.sender === 'ai' && index > 0 && messages[index-1]?.intent === message.intent && (
                <div className="text-xs mb-2 opacity-70 flex items-center">
                  <Brain className="w-3 h-3 mr-1" />
                  Continuing about {message.intent}
                </div>
              )}
              
              <p className="whitespace-pre-wrap text-base leading-relaxed">{message.text}</p>
              
              {/* Show detected entities for user messages (subtle) */}
              {message.sender === 'user' && message.entities && (
                <div className="text-xs mt-2 opacity-50 flex flex-wrap gap-1">
                  {message.entities.medications?.map(med => (
                    <span key={med} className="bg-blue-700 px-1 rounded">💊 {med}</span>
                  ))}
                  {message.entities.symptoms?.map(sym => (
                    <span key={sym} className="bg-red-700 px-1 rounded">🏥 {sym}</span>
                  ))}
                </div>
              )}
              
              <p className="text-xs mt-2 opacity-70">
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}
        
        {/* Loading with context awareness */}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-800 rounded-lg p-4 rounded-bl-none">
              <div className="flex items-center space-x-3">
                <div className="flex space-x-1">
                  <div className="w-3 h-3 bg-teal-500 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                  <div className="w-3 h-3 bg-teal-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-3 h-3 bg-teal-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                </div>
                <span className="text-gray-400">
                  {conversationContext.currentTopic 
                    ? `Continuing about ${conversationContext.currentTopic}...` 
                    : 'Thinking...'}
                </span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Context-Aware Suggestions */}
      <ContextSuggestions context={conversationContext} />

      {/* Input Area */}
      <div className="bg-gray-800 border-t border-gray-700 p-4">
        <div className="flex items-end space-x-2">
          <div className="flex-1 relative">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
              placeholder={
                conversationContext.followUpQuestions?.length > 0
                  ? conversationContext.followUpQuestions[0]
                  : "Type your message here..."
              }
              className="w-full bg-gray-700 text-gray-100 rounded-lg pl-4 pr-12 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none text-base"
              rows="1"
              style={{ minHeight: '60px', maxHeight: '150px' }}
              disabled={isLoading}
            />
            
            <button
              onClick={toggleListening}
              disabled={isLoading}
              className={`absolute right-2 bottom-3 p-2 rounded-full transition-colors ${
                isListening 
                  ? 'bg-red-600 hover:bg-red-700 animate-pulse' 
                  : 'bg-gray-600 hover:bg-gray-500'
              }`}
            >
              {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>
          </div>

          <button
            onClick={sendMessage}
            disabled={!inputText.trim() || isLoading}
            className="bg-teal-600 hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed p-3 rounded-lg transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
        
        {isListening && (
          <div className="mt-2 text-sm text-teal-400 flex items-center">
            <span className="animate-pulse mr-2">🎤</span>
            Listening... (I'll remember our conversation)
          </div>
        )}

        {/* Context status */}
        <div className="flex justify-between items-center mt-2">
          <p className="text-xs text-gray-500">
            ⚕️ For emergencies, call 911 immediately
          </p>
          {conversationContext.userPreferences?.name && (
            <p className="text-xs text-teal-500">
              Talking with {conversationContext.userPreferences.name}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ElderlyCareChatbot;