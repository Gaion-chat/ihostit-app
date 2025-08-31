import http from 'node:http';
import url from 'node:url';
import cron from 'node-cron';
import ServerSyncService from './sync.js';
import DatabaseService from '../src/db/database.js';

const PORT = Number(process.env.PORT || 8787);
const syncService = new ServerSyncService();
const db = DatabaseService.getInstance();

function json(res: http.ServerResponse, code: number, body: unknown) {
  const data = JSON.stringify(body);
  res.writeHead(code, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  });
  res.end(data);
}

function notFound(res: http.ServerResponse) {
  json(res, 404, { error: 'Not found' });
}

const server = http.createServer(async (req, res) => {
  const { method } = req;
  if (!req.url || !method) return notFound(res);
  const parsed = new URL(req.url, `http://localhost:${PORT}`);
  const path = parsed.pathname;

  if (method === 'OPTIONS') {
    return json(res, 200, {});
  }

  try {
    if (method === 'GET' && path === '/api/status') {
      const stats = db.getStats();
      const lastSync = db.getLatestSyncMetadata();
      const initialized = stats.totalApps > 0 && stats.totalCategories > 0;
      return json(res, 200, { initialized, stats, lastSync });
    }

    if (method === 'POST' && path === '/api/sync') {
      const result = await syncService.syncFromGitHub();
      return json(res, 200, result);
    }

    if (method === 'GET' && path === '/api/data') {
      const categories = db.getAllCategories();
      const apps = db.getAllApps();
      const transformedCategories = categories.map((category) => {
        const categoryApps = apps.filter((a) => a.category_id === category.id);
        return {
          name: category.name,
          description: category.description || '',
          apps: categoryApps.map((app) => ({
            name: app.name,
            description: app.description || '',
            url: app.website || '',
            sourceCode: app.source_code || '',
            demo: app.demo || '',
            license: app.license || '',
            category: category.name,
            subcategory: app.subcategory || '',
          })),
        };
      });

      const flatApps = apps.map((app) => {
        const category = categories.find((c) => c.id === app.category_id);
        return {
          name: app.name,
          description: app.description || '',
          url: app.website || '',
          sourceCode: app.source_code || '',
          demo: app.demo || '',
          license: app.license || '',
          category: category?.name || 'Uncategorized',
          subcategory: app.subcategory || '',
        };
      });

      return json(res, 200, { categories: transformedCategories, apps: flatApps });
    }

    return notFound(res);
  } catch (err) {
    console.error('Server error:', err);
    return json(res, 500, { error: 'Internal server error' });
  }
});

// Daily sync at 2:00 AM UTC
cron.schedule('0 2 * * *', async () => {
  console.log('🕑 Running scheduled daily sync');
  try {
    const result = await syncService.syncFromGitHub();
    console.log('✅ Scheduled sync done:', result);
  } catch (e) {
    console.error('❌ Scheduled sync failed:', e);
  }
});

server.listen(PORT, () => {
  console.log(`API server listening on http://localhost:${PORT}`);
});

