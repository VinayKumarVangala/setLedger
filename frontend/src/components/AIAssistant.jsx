import React, { useState } from 'react';
import { MessageCircle, Send, Bot, User, X } from 'lucide-react';

const AIAssistant = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'bot',
      content: 'Hello! I\'m your AI Financial Assistant. I can help you with business insights, financial analysis, and answer questions about your data. How can I assist you today?'
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');

  const quickActions = [
    'Show last month\'s revenue',
    'Top selling products',
    'Predict next month\'s sales',
    'GST filing reminders',
    'Low stock alerts'
  ];

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: inputMessage
    };

    setMessages([...messages, userMessage]);

    // Simulate AI response
    setTimeout(() => {
      const botResponse = {
        id: Date.now() + 1,
        type: 'bot',
        content: generateAIResponse(inputMessage)
      };
      setMessages(prev => [...prev, botResponse]);
    }, 1000);

    setInputMessage('');
  };

  const generateAIResponse = (query) => {
    const responses = {
      'revenue': 'Based on your data, last month\'s revenue was ₹1,25,000, which is 15% higher than the previous month. Your top revenue sources were Product Sales (60%) and Services (40%).',
      'products': 'Your top-selling products this month are:\n1. Sample Product - 150 units sold\n2. Another Item - 120 units sold\n3. Premium Service - 80 units sold',
      'predict': 'Based on current trends and historical data, I predict next month\'s sales will be approximately ₹1,40,000 - ₹1,50,000. This represents a potential 12-20% growth.',
      'gst': 'You have 2 pending GST returns:\n• GSTR-3B for January 2024 (Due: Feb 20)\n• GSTR-1 for February 2024 (Due: Mar 11)\n\nWould you like me to help generate these reports?',
      'stock': 'Current low stock alerts:\n• Sample Product: 5 units remaining (Reorder level: 10)\n• Premium Item: 3 units remaining (Reorder level: 15)\n\nI recommend placing orders soon to avoid stockouts.'
    };

    const lowerQuery = query.toLowerCase();
    
    if (lowerQuery.includes('revenue') || lowerQuery.includes('sales')) return responses.revenue;
    if (lowerQuery.includes('product') || lowerQuery.includes('selling')) return responses.products;
    if (lowerQuery.includes('predict') || lowerQuery.includes('forecast')) return responses.predict;
    if (lowerQuery.includes('gst') || lowerQuery.includes('tax')) return responses.gst;
    if (lowerQuery.includes('stock') || lowerQuery.includes('inventory')) return responses.stock;
    
    return 'I understand you\'re asking about "' + query + '". Based on your business data, I can provide insights on revenue, expenses, inventory, GST compliance, and sales forecasting. Could you be more specific about what you\'d like to know?';
  };

  const handleQuickAction = (action) => {
    setInputMessage(action);
    handleSendMessage();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-4 right-4 w-96 h-96 bg-white rounded-lg shadow-xl border z-50">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-blue-600 text-white rounded-t-lg">
        <div className="flex items-center space-x-2">
          <Bot size={20} />
          <span className="font-medium">AI Assistant</span>
        </div>
        <button 
          onClick={onClose}
          className="hover:bg-blue-700 p-1 rounded"
          title="Close AI Assistant"
        >
          <X size={16} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 p-4 h-64 overflow-y-auto space-y-3">
        {messages.map(message => (
          <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex items-start space-x-2 max-w-xs ${message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
              <div className={`p-2 rounded-full ${message.type === 'user' ? 'bg-blue-600' : 'bg-gray-200'}`}>
                {message.type === 'user' ? <User size={16} className="text-white" /> : <Bot size={16} />}
              </div>
              <div className={`p-3 rounded-lg ${
                message.type === 'user' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100'
              }`}>
                <p className="text-sm whitespace-pre-line">{message.content}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="px-4 py-2 border-t">
        <div className="flex flex-wrap gap-1 mb-2">
          {quickActions.map((action, index) => (
            <button
              key={index}
              onClick={() => handleQuickAction(action)}
              className="text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded"
              title={`Ask: ${action}`}
            >
              {action}
            </button>
          ))}
        </div>
      </div>

      {/* Input */}
      <div className="p-4 border-t">
        <div className="flex space-x-2">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Ask me anything about your business..."
            className="flex-1 px-3 py-2 border rounded-lg text-sm"
          />
          <button
            onClick={handleSendMessage}
            className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700"
            title="Send message"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIAssistant;