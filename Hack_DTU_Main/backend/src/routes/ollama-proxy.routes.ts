import express, { Request, Response } from 'express';
import axios from 'axios';

const router = express.Router();

const OLLAMA_BASE_URL = 'http://localhost:11434';

// Proxy all requests to local Ollama instance
const proxyHandler = async (req: Request, res: Response) => {
    try {
        // Build the target URL by stripping the /api/ollama-proxy prefix
        const targetPath = req.params[0] || '';
        const targetUrl = `${OLLAMA_BASE_URL}/${targetPath}`;

        const axiosConfig: any = {
            method: req.method,
            url: targetUrl,
            headers: {
                'Content-Type': req.headers['content-type'] || 'application/json',
            },
            timeout: 120000, // 2 minute timeout for LLM responses
        };

        // Forward request body for POST/PUT/PATCH
        if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
            axiosConfig.data = req.body;
        }

        // Check if the request expects a streaming response
        const isStreaming = req.body?.stream === true;

        if (isStreaming) {
            axiosConfig.responseType = 'stream';
            const response = await axios(axiosConfig);

            // Set headers for streaming
            res.setHeader('Content-Type', 'application/x-ndjson');
            res.setHeader('Transfer-Encoding', 'chunked');
            res.setHeader('Cache-Control', 'no-cache');

            // Pipe the stream directly
            response.data.pipe(res);

            response.data.on('error', (err: Error) => {
                console.error('Ollama stream error:', err);
                if (!res.headersSent) {
                    res.status(500).json({ error: 'Stream error from Ollama' });
                }
            });
        } else {
            const response = await axios(axiosConfig);
            res.status(response.status).json(response.data);
        }
    } catch (error: any) {
        console.error('Ollama Proxy Error:', error.message);

        if (error.code === 'ECONNREFUSED') {
            return res.status(503).json({
                success: false,
                message: 'Ollama is not running. Please start Ollama locally.',
            });
        }

        const status = error.response?.status || 500;
        const data = error.response?.data || { message: 'Failed to proxy request to Ollama' };
        res.status(status).json(data);
    }
};

router.all('/*', proxyHandler);

export default router;
