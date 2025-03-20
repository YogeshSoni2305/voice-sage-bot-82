
// Weather and Location API utilities

// Function to get user's location from IP
export async function getUserLocation() {
  try {
    const response = await fetch('https://ipapi.co/json/');
    if (!response.ok) {
      throw new Error('Failed to fetch location data');
    }
    const data = await response.json();
    return {
      city: data.city,
      region: data.region,
      country: data.country_name,
      latitude: data.latitude,
      longitude: data.longitude,
      success: true
    };
  } catch (error) {
    console.error('Error getting user location:', error);
    return {
      success: false,
      error: 'Failed to determine your location'
    };
  }
}

// Function to get weather data for a location
export async function getWeatherData(city: string) {
  try {
    // Note: In production, use environment variables for API keys
    const apiKey = '3d824ce97b9201deaf062626bad59411'; // Replace with a real API key
    
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${apiKey}`
    );
    
    if (!response.ok) {
      throw new Error('Weather API error');
    }
    
    const data = await response.json();
    
    return {
      city: data.name,
      temperature: Math.round(data.main.temp),
      condition: data.weather[0].description,
      humidity: data.main.humidity,
      windSpeed: data.wind.speed,
      success: true
    };
  } catch (error) {
    console.error('Error fetching weather data:', error);
    return {
      success: false,
      error: 'Failed to retrieve weather information'
    };
  }
}

// Date and Time utilities
export function getCurrentDateTime() {
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
  
  return { 
    time: timeString, 
    date: dateString,
    day: now.toLocaleDateString('en-US', { weekday: 'long' }),
    fullDateTime: now
  };
}
