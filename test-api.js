// Simple test script to verify backend API is working
const API_BASE_URL = 'https://landhubproject.onrender.com';

async function testAPI() {
  if (process.env.NODE_ENV === 'development') console.log('Testing backend API connection...');
  
  try {
    // Test health endpoint
  if (process.env.NODE_ENV === 'development') console.log('1. Testing health endpoint...');
    const healthResponse = await fetch(`${API_BASE_URL}/health`);
  if (process.env.NODE_ENV === 'development') console.log('Health status:', healthResponse.status);
    const healthData = await healthResponse.json();
  if (process.env.NODE_ENV === 'development') console.log('Health data:', healthData);
    
    // Test plots endpoint
  if (process.env.NODE_ENV === 'development') console.log('2. Testing plots endpoint...');
    const plotsResponse = await fetch(`${API_BASE_URL}/api/plots`);
  if (process.env.NODE_ENV === 'development') console.log('Plots status:', plotsResponse.status);
    const plotsData = await plotsResponse.json();
  if (process.env.NODE_ENV === 'development') console.log('Plots data type:', plotsData.type);
  if (process.env.NODE_ENV === 'development') console.log('Number of features:', plotsData.features?.length || 0);
    
    if (plotsData.features && plotsData.features.length > 0) {
  if (process.env.NODE_ENV === 'development') console.log('Sample plot:', plotsData.features[0]);
    }
    
  if (process.env.NODE_ENV === 'development') console.log('✅ Backend API is working correctly!');
    
  } catch (error) {
  console.error('❌ Backend API test failed:', error);
  if (process.env.NODE_ENV === 'development') console.log('Make sure the backend is running on port 8000');
  }
}

// Run the test
testAPI();