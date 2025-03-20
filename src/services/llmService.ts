
import { getUserLocation, getWeatherData, getCurrentDateTime } from "@/utils/assistantUtils";

export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface LLMResponse {
  response: string;
  error?: string;
}

// Function to generate responses using the Groq API
export async function generateLLMResponse(messages: Message[]): Promise<LLMResponse> {
  try {
    // Get the last user message
    const lastUserMessage = messages.filter(msg => msg.role === 'user').pop();
    
    if (!lastUserMessage) {
      return { 
        response: "I'm sorry, I couldn't understand your message. Could you try again?",
        error: "No user message found" 
      };
    }

    const userMessage = lastUserMessage.content.toLowerCase();
    
    // Handle specific requests for time, date, weather first
    // This provides faster responses for these common requests without using the API
    if (shouldHandleLocally(userMessage)) {
      return await handleLocalResponse(userMessage);
    }
    
    // For all other queries, use the Groq API
    return await callGroqAPI(messages);
  } catch (error) {
    console.error('Error generating LLM response:', error);
    return {
      response: "I'm sorry, I encountered an error while processing your request. Please try again later.",
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Helper function to determine if we should handle the request locally
function shouldHandleLocally(userMessage: string): boolean {
  // Check if the message is explicitly asking for time, date, weather, or combinations
  return userMessage.includes('time') || 
         userMessage.includes('date') || 
         userMessage.includes('day') ||
         userMessage.includes('weather') ||
         userMessage.includes('temperature');
}

// Function to handle local responses for time, date, and weather queries
async function handleLocalResponse(userMessage: string): Promise<LLMResponse> {
  try {
    const { time, date } = getCurrentDateTime();
    
    // Handle time requests
    if (userMessage.includes('time') && !userMessage.includes('date') && !userMessage.includes('weather')) {
      return { response: `The current time is ${time}.` };
    } 
    // Handle date requests
    else if ((userMessage.includes('date') || userMessage.includes('day')) && 
              !userMessage.includes('time') && !userMessage.includes('weather')) {
      return { response: `Today is ${date}.` };
    } 
    // Handle weather requests
    else if (userMessage.includes('weather') && !userMessage.includes('time') && !userMessage.includes('date')) {
      const locationData = await getUserLocation();
      
      if (!locationData.success) {
        return { response: "I'm having trouble determining your location. Could you specify a city for the weather?" };
      }
      
      const weatherData = await getWeatherData(locationData.city);
      
      if (weatherData.success) {
        return { 
          response: `The current weather in ${weatherData.city} is ${weatherData.temperature}°C with ${weatherData.condition}. The humidity is ${weatherData.humidity}% and wind speed is ${weatherData.windSpeed} m/s.` 
        };
      } else {
        return { response: "I'm sorry, I couldn't retrieve the weather information right now." };
      }
    } 
    // Handle combined requests (time+date+weather)
    else if ((userMessage.includes('time') && userMessage.includes('date')) ||
             (userMessage.includes('time') && userMessage.includes('weather')) ||
             (userMessage.includes('date') && userMessage.includes('weather')) ||
             userMessage.includes('everything')) {
      
      let responseText = `The current time is ${time}. Today is ${date}.`;
      
      // Add weather if requested
      if (userMessage.includes('weather') || userMessage.includes('everything')) {
        const locationData = await getUserLocation();
        
        if (locationData.success) {
          const weatherData = await getWeatherData(locationData.city);
          
          if (weatherData.success) {
            responseText += ` The weather in ${weatherData.city} is ${weatherData.temperature}°C with ${weatherData.condition}.`;
          } else {
            responseText += " I couldn't retrieve the weather information right now.";
          }
        } else {
          responseText += " I'm having trouble determining your location for weather information.";
        }
      }
      
      return { response: responseText };
    }
    
    // If we got here, let the API handle it
    return callGroqAPI([{ role: 'user', content: userMessage }]);
  } catch (error) {
    console.error('Error handling local response:', error);
    return {
      response: "I'm sorry, I encountered an error while processing your request.",
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Function to call the Groq API
async function callGroqAPI(messages: Message[]): Promise<LLMResponse> {
  try {
    // Replace with your actual Groq API key
    const GROQ_API_KEY = 'YOUR_GROQ_API_KEY'; // Replace with a real API key or use environment variables
    
    // Add system message if not already present
    if (!messages.some(msg => msg.role === 'system')) {
      messages = [
        { 
          role: 'system', 
          content: 'You are a helpful, concise, and friendly assistant. Always provide brief, accurate answers.' 
        },
        ...messages
      ];
    }
    
    console.log('Calling Groq API with messages:', messages);
    
    // For demo purposes, simulate a response while waiting for API implementation
    // In a real implementation, this would be replaced with an actual API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Sample response for demonstration - Replace with actual API call in production
    /*
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: 'mistral-7b-instruct',
        messages: messages,
        temperature: 0.7,
        max_tokens: 1000
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return { response: data.choices[0].message.content };
    */
    
    // Simulated response for demonstration
    const userContent = messages.filter(msg => msg.role === 'user').pop()?.content.toLowerCase() || '';
    
    // Generate a response based on the user message
    let simulatedResponse = "I understand you're asking about " + userContent.split(' ').slice(0, 3).join(' ') + "... " +
      "This is a simulated response while we wait for the Groq API integration. " +
      "In a complete implementation, I would provide a more helpful and contextually relevant answer using the Mistral model.";
    
    return { response: simulatedResponse };
  } catch (error) {
    console.error('Error calling Groq API:', error);
    return {
      response: "I apologize, but I'm having trouble connecting to my knowledge base right now. Please try again later.",
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
