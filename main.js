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
