export interface ValidationResult {
  isValid: boolean;
  error?: string;
  fallbackData?: any;
}

export const validateApiResponse = (
  response: any,
  endpoint: string,
  fallbackData?: any
): ValidationResult => {
  try {
    // Check if response is null or undefined
    if (response === null || response === undefined) {
      return {
        isValid: false,
        error: 'Response is null or undefined',
        fallbackData
      };
    }

    // Check if response is an empty string
    if (typeof response === 'string' && response.trim() === '') {
      return {
        isValid: false,
        error: 'Response is empty string',
        fallbackData
      };
    }

    // Check if response is an empty object
    if (typeof response === 'object' && Object.keys(response).length === 0) {
      return {
        isValid: false,
        error: 'Response is empty object',
        fallbackData
      };
    }

    // Try to parse if it's a string
    if (typeof response === 'string') {
      try {
        // Check if string is empty or just whitespace
        if (response.trim() === '') {
          return {
            isValid: false,
            error: 'Response is empty string',
            fallbackData
          };
        }
        
        JSON.parse(response);
        return { isValid: true };
      } catch (parseError) {
        return {
          isValid: false,
          error: `Invalid JSON in response: ${(parseError as Error).message}. Response content: "${response.substring(0, 100)}${response.length > 100 ? '...' : ''}"`,
          fallbackData
        };
      }
    }

    // If it's already an object, assume it's valid
    return { isValid: true };
  } catch (error) {
    return {
      isValid: false,
      error: `Unexpected error validating response: ${(error as Error).message}`,
      fallbackData
    };
  }
};