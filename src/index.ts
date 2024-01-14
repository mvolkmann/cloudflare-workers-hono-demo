import {Hono} from 'hono';
import {serveStatic} from 'hono/cloudflare-workers';
import dogRouter from './dog-router';

const app = new Hono();

// This serves static files from the
// [site] bucket directory specified in wrangler.toml.
app.get('/*', serveStatic({root: './'}));

app.get('/', c => c.redirect('/dog'));

app.route('/dog', dogRouter);

export default app;
