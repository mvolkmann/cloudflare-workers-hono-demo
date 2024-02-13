import {Hono} from 'hono';
import {serveStatic} from 'hono/cloudflare-workers';
import dogRouter from './dog-router';
import manifest from '__STATIC_CONTENT_MANIFEST';

const app = new Hono();

// This serves static files from the
// [site] bucket directory specified in wrangler.toml.
app.get('/*', serveStatic({root: './', manifest}));

app.get('/', c => c.redirect('/dog'));

app.route('/dog', dogRouter);

export default app;
