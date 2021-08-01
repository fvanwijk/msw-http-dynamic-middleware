import path from 'path';
import express from 'express';

// Serve the ui dir, where the UI app is built to
export const middleware = express.static(path.join(__dirname, 'ui'));
