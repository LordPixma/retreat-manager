// worker/utils/http.js

/**
 * Return a JSON response with given data and status code.
 * @param {any} data
 * @param {number} [status=200]
 */
export function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json'
    }
  });
}

/**
 * Return a 400 Bad Request with an error message.
 * @param {string} message
 * @param {number} [status=400]
 */
export function badRequest(message = 'Bad Request', status = 400) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: {
      'Content-Type': 'application/json'
    }
  });
}

/**
 * Return a 401 Unauthorized with an error message.
 * @param {string} [message='Unauthorized']
 */
export function unauthorized(message = 'Unauthorized') {
  return new Response(JSON.stringify({ error: message }), {
    status: 401,
    headers: {
      'Content-Type': 'application/json'
    }
  });
}

/**
 * Return a 404 Not Found response.
 * @param {string} [message='Not Found']
 */
export function notFound(message = 'Not Found') {
  return new Response(JSON.stringify({ error: message }), {
    status: 404,
    headers: {
      'Content-Type': 'application/json'
    }
  });
}

/**
 * Return a 405 Method Not Allowed response.
 * @param {string} [message='Method Not Allowed']
 */
export function methodNotAllowed(message = 'Method Not Allowed') {
  return new Response(JSON.stringify({ error: message }), {
    status: 405,
    headers: {
      'Content-Type': 'application/json'
    }
  });
}
