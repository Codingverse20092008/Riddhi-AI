import React, { useState, useEffect } from 'react';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import ChatBox from './components/ChatBox';
import MemoryForm from './components/MemoryForm';
import ModeToggle from './components/ModeToggle';
import Quiz from './components/Quiz';

const App = () => {
  const [mode, setMode] = useState('personal');
  const [showMemory, setShowMemory] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
    const { transcript, listening } = useSpeechRecognition();

  useEffect(() => {
    if (transcript && voiceEnabled) {
      // Handle voice input
      // You can pass this to ChatBox or handle it here
    }
  }, [transcript, voiceEnabled]);

  const toggleVoice = () => {
    if (listening) {
      SpeechRecognition.stopListening();
      setVoiceEnabled(false);
    } else {
      SpeechRecognition.startListening({ continuous: true });
      setVoiceEnabled(true);
    }
  };

  const handleModeChange = (newMode) => {
    setMode(newMode);
    setShowMemory(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 to-purple-100">
      <div className="container mx-auto p-4 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-pink-600 font-dancing">Riddhi AI</h1>
          <ModeToggle mode={mode} onToggle={handleModeChange} />
        </div>

        {/* Main Content */}
        <div className="grid gap-4">
          {/* Control Buttons */}
          <div className="flex justify-center gap-4 mb-4">
            {mode === 'personal' && (
              <button
                onClick={() => setShowMemory(!showMemory)}
                className="px-6 py-2 bg-pink-500 text-white rounded-full hover:bg-pink-600 transition-colors"
              >
                {showMemory ? 'Back to Chat' : 'Update Memory'}
              </button>
            )}
            <button
              onClick={toggleVoice}
              className={`px-6 py-2 rounded-full transition-colors ${voiceEnabled
                ? 'bg-red-500 text-white'
                : 'bg-gray-500 text-white'
                }`}
            >
              🎤 Voice {voiceEnabled ? 'On' : 'Off'}
            </button>
          </div>

          {/* Content Area */}
          {mode === 'personal' && showMemory ? (
            <MemoryForm userId="default-user" />
          ) : mode === 'academy' ? (
            <div className="space-y-4">
              <ChatBox 
                mode={mode} 
                userId="default-user"
                onSendMessage={async (message) => {
                  try {
                    const response = await fetch(`${process.env.REACT_APP_API_URL}/chat`, {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify({
                        message,
                        mode,
                        user_id: 'default-user'
                      }),
                    });
                    
                    if (!response.ok) {
                      throw new Error('Network response was not ok');
                    }
                    
                    const data = await response.json();
                    return data.response;
                  } catch (error) {
                    console.error('Error sending message:', error);
                    return 'Sorry, I encountered an error. Please try again.';
                  }
                }}
              />
              <Quiz />
            </div>
          ) : (
            <ChatBox 
              mode={mode} 
              userId="default-user"
              onSendMessage={async (message) => {
                try {
                  const response = await fetch(`${process.env.REACT_APP_API_URL}/chat`, {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                      message,
                      mode,
                      user_id: 'default-user'
                    }),
                  });
                  
                  if (!response.ok) {
                    throw new Error('Network response was not ok');
                  }
                  
                  const data = await response.json();
                  return data.response;
                } catch (error) {
                  console.error('Error sending message:', error);
                  return 'Sorry, I encountered an error. Please try again.';
                }
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default App;