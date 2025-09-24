// Netlify Function для проксирования API запросов
// Это обходит Mixed Content блокировку

const BACKEND_URL = 'http://87.242.103.146/api';

exports.handler = async (event, context) => {
  // Извлекаем путь из URL
  const path = event.path.replace('/.netlify/functions/api', '');
  const url = `${BACKEND_URL}${path}${event.rawQuery ? '?' + event.rawQuery : ''}`;

  // Настройки для fetch
  const options = {
    method: event.httpMethod,
    headers: {}
  };

  // Копируем заголовки (кроме системных)
  Object.keys(event.headers).forEach(key => {
    if (!key.toLowerCase().startsWith('x-') &&
        !key.toLowerCase().includes('netlify') &&
        key.toLowerCase() !== 'host') {
      options.headers[key] = event.headers[key];
    }
  });

  // Добавляем тело запроса для POST/PUT
  if (event.body) {
    options.body = event.body;
  }

  try {
    const response = await fetch(url, options);
    const data = await response.text();

    // Определяем Content-Type
    const contentType = response.headers.get('content-type') || 'application/json';

    return {
      statusCode: response.status,
      headers: {
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
      },
      body: data
    };
  } catch (error) {
    console.error('Proxy error:', error);

    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        error: 'Backend connection failed',
        message: error.message
      })
    };
  }
};