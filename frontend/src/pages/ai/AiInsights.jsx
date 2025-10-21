/**
 * AiInsights Component
 * AI-powered expense analysis using OpenAI
 * Backend: POST /api/ai/query, GET /api/ai/suggestions
 */

import { useState, useEffect, useRef } from 'react';
import { toast } from 'react-hot-toast';
import {
  MdPsychology,
  MdSend,
  MdLightbulb,
  MdRefresh,
  MdHistory,
  MdTrendingUp,
  MdWarning,
} from 'react-icons/md';
import { aiAPI } from '../../services/api';

const AiInsights = () => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [conversation, setConversation] = useState([]);
  const [suggestions, setSuggestions] = useState(null);
  const [lastSuggestionTime, setLastSuggestionTime] = useState(null);
  const [aiAvailable, setAiAvailable] = useState(true);

  const conversationEndRef = useRef(null);

  // Quick query templates
  const quickQueries = [
    'What were my total expenses this week?',
    'How much did I spend on food this month?',
    'Show me my travel expenses yesterday',
    'What is my biggest spending category?',
    'How much did I spend on GPay today?',
    'Show my cash expenses this week',
    'What were my expenses yesterday?',
    'Compare my spending this month vs last month',
  ];

  // Fetch AI suggestions on component mount
  useEffect(() => {
    fetchSuggestions();
  }, []);

  useEffect(() => {
    // Scroll to latest message when conversation updates
    if (conversationEndRef.current) {
      conversationEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [conversation]);

  const fetchSuggestions = async () => {
    try {
      setSuggestionsLoading(true);
      const response = await aiAPI.getSuggestions();

      console.log('✅ Suggestions response:', response.data);

      const suggestionsData = response?.data?.suggestions;
      const isAiGenerated = response?.data?.is_ai_generated;
      
      let suggestionsText = '';

      // Better handling of different response formats
      if (typeof suggestionsData === 'string') {
        suggestionsText = suggestionsData;
      } else if (Array.isArray(suggestionsData)) {
        suggestionsText = suggestionsData.join('\n\n');
      } else {
        suggestionsText = '📊 Track your expenses regularly for better insights';
      }

      setSuggestions({
        text: suggestionsText,
        period: response?.data?.period || 'N/A',
        totalAnalyzed: response?.data?.total_analyzed || 0,
        isAiGenerated: isAiGenerated !== false,
        note: response?.data?.note || null,
      });
      
      setLastSuggestionTime(new Date().toISOString());
      
      // Check if AI is available
      if (response?.data?.note && response.data.note.includes('unavailable')) {
        setAiAvailable(false);
      } else {
        setAiAvailable(true);
      }
      
    } catch (error) {
      console.error('❌ Error fetching suggestions:', error);

      // Fallback suggestions
      setSuggestions({
        text: '📊 Track your daily expenses to identify spending patterns\n\n💰 Set a monthly budget for each category to stay on track\n\n🔍 Review your top spending categories regularly\n\n📈 Compare your spending month-over-month to spot trends',
        period: 'General Tips',
        totalAnalyzed: 0,
        isAiGenerated: false,
        note: 'AI temporarily unavailable',
      });
      
      setLastSuggestionTime(new Date().toISOString());
      setAiAvailable(false);
    } finally {
      setSuggestionsLoading(false);
    }
  };

  const handleQuerySubmit = async (e, queryToSubmit = null) => {
    if (e) e.preventDefault();

    const userQuery = (queryToSubmit || query).trim();

    if (!userQuery || loading) {
      if (!userQuery) {
        toast.error('Please enter a question');
      }
      return;
    }

    setQuery('');
    setLoading(true);

    // Add user message to conversation
    const userMessage = {
      type: 'user',
      text: userQuery,
      timestamp: new Date().toISOString(),
    };
    setConversation((prev) => [...prev, userMessage]);

    try {
      console.log('🤖 Sending query:', userQuery);
      const response = await aiAPI.query({ query: userQuery });
      console.log('✅ AI response:', response.data);

      const aiMessage = {
        type: 'ai',
        text: response?.data?.answer || 'No answer received.',
        timestamp: new Date().toISOString(),
        context: response?.data?.context,
      };

      setConversation((prev) => [...prev, aiMessage]);
      setAiAvailable(true);
      
    } catch (error) {
      console.error('❌ Error querying AI:', error);

      let errorMessage = 'Failed to get AI response. Please try again.';
      let errorDetails = null;

      // Better error handling based on status codes
      if (error.response?.status === 503) {
        errorMessage = error.response?.data?.error || 'AI service is not configured. Please contact the administrator.';
        errorDetails = error.response?.data?.help;
        setAiAvailable(false);
      } else if (error.response?.status === 500) {
        errorMessage = error.response?.data?.fallback || 'AI service is temporarily unavailable. Please try again later.';
        errorDetails = error.response?.data?.error;
      } else if (error.response?.status === 400) {
        errorMessage = error.response?.data?.error || 'Invalid query format. Please rephrase your question.';
      } else if (!error.response) {
        errorMessage = 'Cannot connect to server. Please check your internet connection.';
      }

      const errorAiMessage = {
        type: 'ai',
        text: errorMessage,
        timestamp: new Date().toISOString(),
        isError: true,
        errorDetails: errorDetails,
      };

      setConversation((prev) => [...prev, errorAiMessage]);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickQuery = (quickQuery) => {
    if (loading) return;
    setQuery(quickQuery);
    setTimeout(() => {
      handleQuerySubmit(null, quickQuery);
    }, 50);
  };

  const handleClearConversation = () => {
    setConversation([]);
    toast.success('Conversation cleared');
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
              <MdPsychology className="text-3xl text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">AI Insights</h1>
              <p className="text-sm text-gray-600">
                Ask questions about your expenses in natural language
              </p>
            </div>
          </div>
          
          {/* ✅ CHANGED: AI availability warning - updated text */}
          {!aiAvailable && (
            <div className="mt-4 bg-orange-50 border border-orange-200 rounded-lg p-4 flex items-start gap-3">
              <MdWarning className="text-orange-500 text-xl flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-orange-900">AI Features Limited</p>
                <p className="text-xs text-orange-700 mt-1">
                  OpenAI is not configured. You'll see general tips instead of personalized insights.
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Chat Section */}
          <div className="lg:col-span-2 space-y-6">
            {/* AI Suggestions Card */}
            <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <MdLightbulb className="text-3xl" />
                  <div>
                    <h2 className="text-xl font-bold">
                      {suggestions?.isAiGenerated ? 'AI Suggestions' : 'General Tips'}
                    </h2>
                    {suggestions?.note && (
                      <p className="text-xs text-blue-100 mt-1">{suggestions.note}</p>
                    )}
                  </div>
                </div>
                <button
                  onClick={fetchSuggestions}
                  disabled={suggestionsLoading}
                  className="p-2 bg-white bg-opacity-20 rounded-lg hover:bg-opacity-30 transition-colors disabled:opacity-50 flex items-center gap-2"
                  title="Refresh suggestions"
                >
                  <MdRefresh
                    className={`text-xl ${suggestionsLoading ? 'animate-spin' : ''}`}
                  />
                </button>
              </div>

              {suggestionsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                </div>
              ) : suggestions ? (
                <div>
                  <div className="bg-white bg-opacity-10 rounded-lg p-4 mb-3">
                    <div className="prose prose-sm prose-invert max-w-none">
                      {suggestions.text && typeof suggestions.text === 'string' ? (
                        suggestions.text.split('\n').map((line, index) => (
                          line.trim() && (
                            <p key={index} className="mb-2 last:mb-0">
                              {line}
                            </p>
                          )
                        ))
                      ) : (
                        <p>No suggestions available</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm text-blue-100">
                    <span>📅 Period: {suggestions.period}</span>
                    {suggestions.totalAnalyzed > 0 && (
                      <span>
                        💰 Analyzed: ₹{suggestions.totalAnalyzed.toFixed(2)}
                      </span>
                    )}
                  </div>
                  {lastSuggestionTime && (
                    <div className="text-xs mt-2 text-blue-200">
                      Last updated: {formatTimestamp(lastSuggestionTime)}
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-blue-100">No suggestions available</p>
              )}
            </div>

            {/* Chat Interface */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden flex flex-col h-[600px]">
              {/* Chat Header */}
              <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                    <MdPsychology className="text-xl text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white">AI Assistant</h3>
                    {/* ✅ CHANGED: Updated powered by text */}
                    <p className="text-xs text-purple-100">
                      {aiAvailable ? 'Powered by OpenAI' : 'Limited Mode'}
                    </p>
                  </div>
                </div>
                {conversation.length > 0 && (
                  <button
                    onClick={handleClearConversation}
                    className="px-3 py-1 bg-white bg-opacity-20 rounded-lg text-white text-sm hover:bg-opacity-30 transition-colors"
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* Conversation Area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                {conversation.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center px-4">
                    <MdPsychology className="text-6xl text-gray-300 mb-4" />
                    <h3 className="text-lg font-bold text-gray-900 mb-2">
                      Ask me anything about your expenses!
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Try questions like "How much did I spend on food this week?" or "Show my GPay expenses"
                    </p>
                    <p className="text-sm text-gray-500">
                      💡 Use the quick questions on the right to get started
                    </p>
                  </div>
                ) : (
                  conversation.map((message, index) => (
                    <div
                      key={index}
                      className={`flex ${
                        message.type === 'user' ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      <div
                        className={`max-w-[85%] rounded-xl p-4 ${
                          message.type === 'user'
                            ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                            : message.isError
                            ? 'bg-red-50 text-red-900 border-2 border-red-200'
                            : 'bg-white shadow-md text-gray-900'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          {message.type === 'ai' && (
                            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                              message.isError ? 'bg-red-500' : 'bg-gradient-to-br from-purple-500 to-pink-500'
                            }`}>
                              {message.isError ? (
                                <MdWarning className="text-white text-sm" />
                              ) : (
                                <MdPsychology className="text-white text-sm" />
                              )}
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="prose prose-sm max-w-none">
                              {message.text.split('\n').map((line, idx) => (
                                line.trim() && (
                                  <p key={idx} className="mb-2 last:mb-0">
                                    {line}
                                  </p>
                                )
                              ))}
                            </div>
                            
                            {message.errorDetails && (
                              <div className="mt-2 p-2 bg-red-100 rounded text-xs text-red-700">
                                <strong>Details:</strong> {message.errorDetails}
                              </div>
                            )}
                            
                            {message.context && (
                              <div
                                className={`mt-3 pt-3 border-t text-xs ${
                                  message.type === 'user'
                                    ? 'border-blue-400 text-blue-100'
                                    : 'border-gray-200 text-gray-500'
                                }`}
                              >
                                <span>
                                  📅 {message.context.period} • 
                                  🔢 {message.context.expense_count} transactions •
                                  💰 ₹{message.context.total_expenses?.toFixed(2)}
                                </span>
                              </div>
                            )}
                            <p
                              className={`text-xs mt-2 ${
                                message.type === 'user'
                                  ? 'text-blue-100'
                                  : message.isError
                                  ? 'text-red-500'
                                  : 'text-gray-400'
                              }`}
                            >
                              {formatTimestamp(message.timestamp)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}

                {/* Loading indicator */}
                {loading && (
                  <div className="flex justify-start">
                    <div className="bg-white shadow-md rounded-xl p-4 flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                        <MdPsychology className="text-white text-sm" />
                      </div>
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div
                          className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                          style={{ animationDelay: '0.1s' }}
                        ></div>
                        <div
                          className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                          style={{ animationDelay: '0.2s' }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-600">AI is thinking...</span>
                    </div>
                  </div>
                )}
                
                <div ref={conversationEndRef} />
              </div>

              {/* Input Area */}
              <form
                onSubmit={handleQuerySubmit}
                className="p-4 bg-white border-t border-gray-200"
              >
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Ask about your expenses..."
                    disabled={loading}
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                  <button
                    type="submit"
                    disabled={loading || !query.trim()}
                    className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-medium hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 shadow-lg"
                  >
                    <MdSend className="text-xl" />
                    {loading ? 'Sending...' : 'Send'}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Questions */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <MdHistory className="text-xl text-purple-600" />
                <h3 className="text-lg font-bold text-gray-900">
                  Quick Questions
                </h3>
              </div>

              <div className="space-y-2">
                {quickQueries.map((quickQuery, index) => (
                  <button
                    key={index}
                    onClick={() => handleQuickQuery(quickQuery)}
                    disabled={loading}
                    className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-purple-50 text-gray-700 hover:text-purple-700 rounded-lg transition-all text-sm border border-transparent hover:border-purple-200 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {quickQuery}
                  </button>
                ))}
              </div>
            </div>

            {/* How It Works */}
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl shadow-lg p-6 border border-purple-100">
              <div className="flex items-center gap-2 mb-4">
                <MdTrendingUp className="text-xl text-purple-600" />
                <h3 className="text-lg font-bold text-gray-900">How It Works</h3>
              </div>

              <div className="space-y-3 text-sm text-gray-700">
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                    1
                  </div>
                  <p>
                    Ask questions in natural language about your expenses
                  </p>
                </div>
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                    2
                  </div>
                  <p>AI analyzes your spending data based on your query</p>
                </div>
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                    3
                  </div>
                  <p>Get instant insights with specific numbers and trends</p>
                </div>
              </div>

              <div className="mt-4 p-3 bg-white rounded-lg border border-purple-200">
                <p className="text-xs text-gray-600">
                  <strong className="text-purple-600">💡 Pro Tip:</strong> Include
                  time periods (today, this week, this month) and categories
                  (food, travel) for more accurate results!
                </p>
              </div>
            </div>

            {/* Examples */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                Example Questions
              </h3>

              <div className="space-y-3 text-sm text-gray-700">
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="font-medium text-blue-900 mb-1">⏰ Time-based</p>
                  <p className="text-blue-700 text-xs">
                    "What did I spend yesterday?"
                  </p>
                </div>

                <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                  <p className="font-medium text-green-900 mb-1">📊 Category-based</p>
                  <p className="text-green-700 text-xs">
                    "Show my food expenses this month"
                  </p>
                </div>

                <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                  <p className="font-medium text-purple-900 mb-1">
                    💳 Payment-based
                  </p>
                  <p className="text-purple-700 text-xs">"How much did I pay via GPay?"</p>
                </div>

                <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                  <p className="font-medium text-orange-900 mb-1">📈 Analysis</p>
                  <p className="text-orange-700 text-xs">
                    "What's my biggest expense category?"
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AiInsights;
