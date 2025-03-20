
interface LLMResponse {
  response: string;
  error?: string;
}

export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

// Function to get current date and time formatted nicely
function getCurrentDateTime() {
  const now = new Date();
  
  const timeString = now.toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit',
    hour12: true 
  });
  
  const dateString = now.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  return { timeString, dateString };
}

// Function to get weather data
async function getWeatherData() {
  try {
    // First, get user's location based on IP
    const locationResponse = await fetch('https://ipapi.co/json/');
    const locationData = await locationResponse.json();
    
    // Then get weather for that location
    const weatherResponse = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=${locationData.city}&units=metric&appid=YOUR_OPENWEATHERMAP_API_KEY`
    );
    
    // If using this in production, replace YOUR_OPENWEATHERMAP_API_KEY with an actual API key
    // or set up a proxy server to hide the API key
    
    if (!weatherResponse.ok) {
      throw new Error('Weather API error');
    }
    
    const weatherData = await weatherResponse.json();
    
    return {
      city: locationData.city,
      country: locationData.country_name,
      temperature: Math.round(weatherData.main.temp),
      condition: weatherData.weather[0].description,
      success: true
    };
  } catch (error) {
    console.error('Error fetching weather:', error);
    return { 
      success: false, 
      errorMessage: 'I couldn\'t retrieve the weather information at the moment.'
    };
  }
}

export async function generateLLMResponse(messages: Message[]): Promise<LLMResponse> {
  try {
    // In a real implementation, you would call the Groq API here
    // For demo purposes, we'll simulate a response
    
    // Simulate API request delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Get the last user message
    const lastUserMessage = messages.filter(msg => msg.role === 'user').pop();
    
    if (!lastUserMessage) {
      return { 
        response: "I'm sorry, I couldn't understand your message. Could you try again?",
        error: "No user message found" 
      };
    }

    // Simple response generation based on keywords in the user's message
    const userMessage = lastUserMessage.content.toLowerCase();
    
    // Handle time requests
    if (userMessage.includes('time')) {
      const { timeString } = getCurrentDateTime();
      return { response: `The current time is ${timeString}.` };
    } 
    // Handle date requests
    else if (userMessage.includes('date') || userMessage.includes('day')) {
      const { dateString } = getCurrentDateTime();
      return { response: `Today is ${dateString}.` };
    } 
    // Handle weather requests
    else if (userMessage.includes('weather')) {
      try {
        const weatherData = await getWeatherData();
        
        if (weatherData.success) {
          return { 
            response: `The current weather in ${weatherData.city}, ${weatherData.country} is ${weatherData.temperature}°C with ${weatherData.condition}.` 
          };
        } else {
          return { response: weatherData.errorMessage };
        }
      } catch (error) {
        return { 
          response: "I'm having trouble getting the weather information at the moment. Please try again later." 
        };
      }
    }
    // Handle combined date, time, and weather requests
    else if (userMessage.includes('date and time') || 
             userMessage.includes('time and date') || 
             (userMessage.includes('time') && userMessage.includes('weather')) ||
             (userMessage.includes('date') && userMessage.includes('weather')) ||
             userMessage.includes('everything')) {
      
      const { timeString, dateString } = getCurrentDateTime();
      
      try {
        const weatherData = await getWeatherData();
        
        if (weatherData.success) {
          return { 
            response: `The current time is ${timeString}. Today is ${dateString}. The weather in ${weatherData.city} is ${weatherData.temperature}°C with ${weatherData.condition}.` 
          };
        } else {
          return { 
            response: `The current time is ${timeString}. Today is ${dateString}. ${weatherData.errorMessage}` 
          };
        }
      } catch (error) {
        return { 
          response: `The current time is ${timeString}. Today is ${dateString}. I'm having trouble getting the weather information at the moment.` 
        };
      }
    }
    
    // Handle other standard responses
    if (userMessage.includes('hello') || userMessage.includes('hi')) {
      return { response: "Hello! How can I assist you today?" };
    } else if (userMessage.includes('how are you')) {
      return { response: "I'm functioning well, thank you for asking! How can I help you?" };
    } else if (userMessage.includes('thank')) {
      return { response: "You're welcome! Is there anything else I can help you with?" };
    } else if (userMessage.includes('bye') || userMessage.includes('goodbye')) {
      return { response: "Goodbye! Feel free to return if you have more questions." };
    } else if (userMessage.includes('help')) {
      return { response: "I can answer questions, provide information, or just chat. I can also tell you the current time, date, and weather information. What would you like to know?" };
    } else if (userMessage.includes('name')) {
      return { response: "I'm an AI assistant created to help you with various tasks and questions." };
    } else {
      // In a real implementation, this would be the actual LLM response
      return { 
        response: "I understand you're asking about " + userMessage.split(' ').slice(0, 3).join(' ') + "... " +
                 "This is a placeholder response since we're not connected to the actual Groq API yet. " +
                 "In a complete implementation, I would provide a more helpful and contextually relevant answer."
      };
    }
  } catch (error) {
    console.error('Error generating LLM response:', error);
    return {
      response: "I'm sorry, I encountered an error while processing your request. Please try again later.",
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// To implement the actual Groq API call, you would replace the function above with:
/*
export async function generateLLMResponse(messages: Message[]): Promise<LLMResponse> {
  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${YOUR_GROQ_API_KEY}`
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
  } catch (error) {
    console.error('Error generating LLM response:', error);
    return {
      response: "I'm sorry, I encountered an error while processing your request. Please try again later.",
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
*/
