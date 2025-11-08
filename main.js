import { Command } from 'commander';
import fs from 'fs/promises';
import http from 'http';
import superagent from 'superagent';
import path from 'path';

// --- Налаштування командного рядка ---
const program = new Command();
program
  .requiredOption('-h, --host <host>', 'Host address')
  .requiredOption('-p, --port <port>', 'Port number')
  .requiredOption('-c, --cache <path>', 'Cache directory path');

program.parse(process.argv);
const options = program.opts();

// --- Перевірка існування кеш-текі ---
const cacheDir = path.resolve(options.cache);
try {
  await fs.access(cacheDir);
} catch {
  await fs.mkdir(cacheDir, { recursive: true });
  console.log(`Cache directory created: ${cacheDir}`);
}

// --- Функція для отримання шляху до файлу ---
const getFilePath = (code) => path.join(cacheDir, `${code}.jpg`);

// --- Створення HTTP-сервера ---
const server = http.createServer(async (req, res) => {
  const urlParts = req.url.split('/');
  const code = urlParts[1]; // наприклад /200 → code = "200"

  // якщо не передано код
  if (!code) {
    res.writeHead(400, { 'Content-Type': 'text/plain' });
    res.end('Bad Request: Missing code');
    return;
  }

  const filePath = getFilePath(code);

  try {
    if (req.method === 'GET') {
      // --- GET: повертаємо картинку ---
      try {
        const fileData = await fs.readFile(filePath);
        res.writeHead(200, { 'Content-Type': 'image/jpeg' });
        res.end(fileData);
      } catch {
        // Якщо немає у кеші — завантажуємо з http.cat
        try {
          const response = await superagent.get(`https://http.cat/${code}`);
          await fs.writeFile(filePath, response.body);
          res.writeHead(200, { 'Content-Type': 'image/jpeg' });
          res.end(response.body);
          console.log(`Cached new image: ${code}`);
        } catch {
          res.writeHead(404, { 'Content-Type': 'text/plain' });
          res.end('Not Found');
        }
      }

    } else if (req.method === 'PUT') {
      // --- PUT: зберігаємо картинку у кеш ---
      const chunks = [];
      for await (const chunk of req) chunks.push(chunk);
      const body = Buffer.concat(chunks);
      await fs.writeFile(filePath, body);
      res.writeHead(201, { 'Content-Type': 'text/plain' });
      res.end('Created');

    } else if (req.method === 'DELETE') {
      // --- DELETE: видаляємо картинку ---
      await fs.unlink(filePath);
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end('Deleted');

    } else {
      // --- Якщо метод не підтримується ---
      res.writeHead(405, { 'Content-Type': 'text/plain' });
      res.end('Method Not Allowed');
    }
  } catch (err) {
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end('Server error: ' + err.message);
  }
});

// --- Запуск сервера ---
server.listen(options.port, options.host, () => {
  console.log(`Proxy server running at http://${options.host}:${options.port}/`);
});
