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