
const fetch = require('node-fetch');

async function testFirebaseSetup() {
  const apiKey = 'AIzaSyCuhZaQLToLnyhYh3kL-IdeAb0aC0P86J8';
  const url = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`;
  
  const payload = {
    email: 'test@example.com',
    password: 'testpassword',
    returnSecureToken: true
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Referer': 'https://pebel-a-ijob.vercel.app/',
        'Origin': 'https://pebel-a-ijob.vercel.app'
      },
      body: JSON.stringify(payload)
    });
    
    const data = await response.json();
    console.log('Firebase Response Status:', response.status);
    console.log('Firebase Response Body:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Fetch error:', error);
  }
}

testFirebaseSetup();
