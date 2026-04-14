import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Simple in-memory cache for account resolution
  const resolutionCache = new Map<string, any>();
  let lastPaystackCall = 0;
  const GLOBAL_COOLDOWN = 1000; // Reduced to 1 second for better fallback performance
  let paystackQueue: Promise<any> = Promise.resolve();

  // API: Resolve Account Number via Paystack
  app.get('/api/resolve-account', async (req, res) => {
    const account_number = (req.query.account_number as string || '').trim();
    const bank_code = (req.query.bank_code as string || '').trim();
    const secretKey = (process.env.PAYSTACK_SECRET_KEY || '').trim();

    if (!account_number || !bank_code) {
      return res.status(400).json({ status: false, message: 'Missing account_number or bank_code' });
    }

    // Paystack requires exactly 10 digits for account number
    if (account_number.length !== 10 || !/^\d+$/.test(account_number)) {
      return res.status(422).json({ 
        status: false, 
        message: 'Account number must be exactly 10 digits',
        type: 'validation_error'
      });
    }

    // Bank code should be numeric and 3-6 digits
    if (!/^\d{3,6}$/.test(bank_code)) {
      return res.status(422).json({ 
        status: false, 
        message: 'Invalid bank code format',
        type: 'validation_error'
      });
    }

    const cacheKey = `${account_number}_${bank_code}`;
    const cached = resolutionCache.get(cacheKey);
    if (cached) {
      // If it's a negative cache (error), check if it's expired (e.g., 10 seconds)
      if (cached.isError && Date.now() - cached.timestamp < 10000) {
        console.log(`Serving negative cache for: ${cacheKey}`);
        return res.status(cached.status).json(cached.data);
      }
      if (!cached.isError) {
        console.log(`Serving from cache: ${cacheKey}`);
        return res.json(cached.data);
      }
    }

    if (!secretKey) {
      // Fallback for demo if key is not set
      console.warn('PAYSTACK_SECRET_KEY not set. Using mock resolution.');
      const mockNames = ['CHINEDU OKORO', 'FATIMA BELLO', 'ADEWALE JOHNSON', 'NGOZI EZE', 'IBRAHIM MUSA'];
      const randomName = mockNames[Math.floor(Math.random() * mockNames.length)];
      return res.json({ status: true, data: { account_name: randomName } });
    }

    // Use a serial queue to ensure Paystack calls are spaced out and avoid race conditions
    const executeWithCooldown = async () => {
      const now = Date.now();
      const timeSinceLastCall = now - lastPaystackCall;
      const waitTime = Math.max(0, GLOBAL_COOLDOWN - timeSinceLastCall);
      
      if (waitTime > 0) {
        console.log(`Global Paystack cooldown active. Waiting ${waitTime}ms...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
      
      lastPaystackCall = Date.now();
      
      console.log(`Resolving account: ${account_number} for bank: ${bank_code}`);
      
      let response;
      let retries = 0;
      const maxRetries = 5;
      const baseDelay = 3000;

      while (retries <= maxRetries) {
        try {
          response = await axios.get(`https://api.paystack.co/bank/resolve`, {
            params: { account_number, bank_code },
            headers: {
              Authorization: `Bearer ${secretKey}`,
            },
            timeout: 15000 // 15s timeout
          });
          return response.data;
        } catch (error: any) {
          const status = error.response?.status;
          const errorData = error.response?.data;
          const isRateLimit = status === 429;
          const isServerError = status >= 500 && status <= 504;
          const isApiError = errorData && errorData.type === 'api_error';
          const isTimeout = error.code === 'ECONNABORTED' || error.message.includes('timeout');

          if ((isRateLimit || isServerError || isApiError || isTimeout) && retries < maxRetries) {
            retries++;
            const delay = baseDelay * Math.pow(2, retries - 1);
            console.warn(`Paystack ${isRateLimit ? 'rate limit' : isTimeout ? 'timeout' : 'service error'} hit. Retrying in ${delay}ms... (Attempt ${retries}/${maxRetries})`);
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }
          throw error;
        }
      }
    };

    try {
      // Enqueue the request and wait for its turn
      const resultPromise = paystackQueue.then(() => executeWithCooldown());
      
      // Update the queue but don't let failures block it
      paystackQueue = resultPromise.catch(() => {});
      
      const data = await resultPromise;

      // Cache the successful response with metadata
      resolutionCache.set(cacheKey, {
        data: data,
        timestamp: Date.now(),
        isError: false
      });
      
      // Limit cache size to prevent memory issues (e.g., 100 entries)
      if (resolutionCache.size > 100) {
        const firstKey = resolutionCache.keys().next().value;
        if (firstKey) resolutionCache.delete(firstKey);
      }
      
      res.json(data);
    } catch (error: any) {
      let errorData;
      if (error.response && error.response.data) {
        errorData = error.response.data;
      } else {
        errorData = { message: error.message };
      }

      let status;
      if (error.response && error.response.status) {
        status = error.response.status;
      } else {
        status = 500;
      }
      
      // Negative cache for 429 errors (30 seconds)
      if (status === 429) {
        resolutionCache.set(cacheKey, {
          data: errorData,
          timestamp: Date.now(),
          isError: true,
          status: 429
        });
      }
      
      if (status === 422) {
        console.warn('Paystack Validation Error:', JSON.stringify(errorData, null, 2));
        return res.json({ 
          status: false, 
          message: errorData.message || 'Invalid account number or bank code',
          type: 'validation_error',
          errors: errorData.errors
        });
      }
      
      if (errorData && errorData.type === 'api_error') {
        const msg = errorData.message?.toLowerCase() || '';
        const isBankIssue = msg.includes('bank') || msg.includes('resolve') || msg.includes('timeout') || msg.includes('service');
        const isNotFound = msg.includes('could not resolve') || msg.includes('invalid') || msg.includes('not found');

        // Log as warning if it's a known resolution failure, error if it's a service issue
        if (isNotFound) {
          console.warn('Paystack Resolution Failed (Account Not Found):', errorData.message);
          return res.status(422).json({
            status: false,
            message: 'Account could not be resolved. Please check the number and bank.',
            type: 'not_found'
          });
        }

        console.error('Paystack Service Error:', JSON.stringify(errorData, null, 2));
        return res.status(502).json({ 
          status: false, 
          message: isBankIssue 
            ? `The bank's resolution service is currently slow or unavailable. Please try again shortly.` 
            : (errorData.message || 'Bank resolution service is currently unavailable.'),
          type: 'api_error',
          raw_message: errorData.message
        });
      }

      res.status(status).json(errorData);
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
