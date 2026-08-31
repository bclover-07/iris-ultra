export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const withRetry = async (fn, options = {}) => {
  const { maxAttempts = 5, baseDelay = 100, maxDelay = 1600 } = options;
  
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await fn(attempt);
    } catch (error) {
      if (attempt === maxAttempts - 1) throw error;
      const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
      await sleep(delay);
    }
  }
};

export default { sleep, withRetry };
