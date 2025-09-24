// Netlify Function для проксирования API запросов
// Использует axios вместо fetch для лучшей совместимости

const axios = require('axios');

// Пробуем несколько вариантов backend URL
const BACKEND_URLS = [
  'http://87.242.103.146:3001/api',  // Прямое подключение к backend
  'http://87.242.103.146/api'        // Через nginx
];

const BACKEND_URL = BACKEND_URLS[0]; // Используем первый по умолчанию

exports.handler = async (event, context) => {
  // Обрабатываем CORS preflight запросы
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Max-Age': '86400'
      },
      body: ''
    };
  }

  try {
    // Извлекаем путь из URL
    const path = event.path.replace('/.netlify/functions/api', '');
    const url = `${BACKEND_URL}${path}`;

    console.log(`Proxying ${event.httpMethod} ${url}`);

    // Настройки для axios
    const config = {
      method: event.httpMethod.toLowerCase(),
      url: url,
      params: event.queryStringParameters || {},
      headers: {},
      timeout: 30000,
      validateStatus: () => true // Не выбрасывать ошибку для HTTP статусов
    };

    // Копируем важные заголовки
    if (event.headers.authorization) {
      config.headers.Authorization = event.headers.authorization;
    }
    if (event.headers['content-type']) {
      config.headers['Content-Type'] = event.headers['content-type'];
    }

    // Добавляем тело запроса для POST/PUT
    if (event.body && (event.httpMethod === 'POST' || event.httpMethod === 'PUT' || event.httpMethod === 'PATCH')) {
      if (event.isBase64Encoded) {
        config.data = Buffer.from(event.body, 'base64').toString();
      } else {
        config.data = event.body;
      }
    }

    const response = await axios(config);

    console.log(`Backend response: ${response.status}`);

    return {
      statusCode: response.status,
      headers: {
        'Content-Type': response.headers['content-type'] || 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
      },
      body: typeof response.data === 'string' ? response.data : JSON.stringify(response.data)
    };

  } catch (error) {
    console.error('Proxy error:', error.message);
    console.error('Error details:', error.response?.data || error);

    return {
      statusCode: 502,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        error: 'Backend connection failed',
        message: error.message,
        details: error.response?.data || null,
        url: `${BACKEND_URL}${event.path.replace('/.netlify/functions/api', '')}`
      })
    };
  }
};