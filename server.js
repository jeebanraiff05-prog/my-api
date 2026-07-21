const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Basic request logging (useful on Render's log stream)
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

// Matches tiktok.com and vm.tiktok.com / vt.tiktok.com short links
const TIKTOK_URL_REGEX = /^https?:\/\/(www\.|vm\.|vt\.|m\.)?tiktok\.com\/.+/i;

/**
 * POST /download
 * Body: { "url": "<tiktok video url>" }
 * Response: { "success": true, "downloadUrl": "<direct mp4 url>" }
 */
app.post('/download', async (req, res) => {
  const { url } = req.body || {};

  if (!url || typeof url !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'A TikTok "url" field is required in the request body.',
    });
  }

  if (!TIKTOK_URL_REGEX.test(url.trim())) {
    return res.status(400).json({
      success: false,
      error: 'The provided URL does not look like a valid TikTok link.',
    });
  }

  try {
    const apiResponse = await axios.get('https://www.tikwm.com/api/', {
      params: { url: url.trim() },
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; TikTokDownloaderBackend/1.0)',
      },
    });

    const data = apiResponse.data;

    if (!data || data.code !== 0 || !data.data) {
      return res.status(502).json({
        success: false,
        error: 'Could not resolve a download link for this video. It may be private, deleted, or region-locked.',
      });
    }

    // "play" is the no-watermark direct mp4 URL; tikwm returns a relative
    // path sometimes, so normalize it to an absolute URL.
    const rawUrl = data.data.play || data.data.wmplay;

    if (!rawUrl) {
      return res.status(502).json({
        success: false,
        error: 'No downloadable video URL was found for this link.',
      });
    }

    const downloadUrl = rawUrl.startsWith('http')
      ? rawUrl
      : `https://www.tikwm.com${rawUrl}`;

    return res.status(200).json({
      success: true,
      downloadUrl,
    });
  } catch (err) {
    if (err.code === 'ECONNABORTED') {
      return res.status(504).json({
        success: false,
        error: 'The request to the TikTok resolver timed out. Please try again.',
      });
    }

    console.error('Download error:', err.message);
    return res.status(500).json({
      success: false,
      error: 'An unexpected error occurred while processing the video.',
    });
  }
});

// Health check endpoint (handy for Render's health checks / uptime pings)
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// 404 fallback
app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Route not found.' });
});

// Global error handler (catches sync errors in middleware/routes)
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ success: false, error: 'Internal server error.' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
