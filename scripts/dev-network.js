const os = require('os');
const net = require('net');
const { spawn } = require('child_process');

const DEFAULT_PORT = Number(process.env.PORT || '3308');
const FALLBACK_HOST = '0.0.0.0';

function getLocalIp() {
  const interfaces = os.networkInterfaces();

  for (const network of Object.values(interfaces)) {
    if (!network) {
      continue;
    }

    for (const address of network) {
      if (address.family === 'IPv4' && !address.internal) {
        return address.address;
      }
    }
  }

  return null;
}

function isPortAvailable(port) {
  return new Promise((resolve) => {
    const server = net.createServer();

    server.once('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        resolve(false);
        return;
      }

      resolve(false);
    });

    server.once('listening', () => {
      server.close(() => resolve(true));
    });

    server.listen(port, FALLBACK_HOST);
  });
}

async function findAvailablePort(startPort) {
  let port = startPort;

  while (!(await isPortAvailable(port))) {
    port += 1;
  }

  return port;
}

async function main() {
  const port = await findAvailablePort(DEFAULT_PORT);
  const localIp = getLocalIp();
  const host = FALLBACK_HOST;

  if (port !== DEFAULT_PORT) {
    console.log(`\n> Porta ${DEFAULT_PORT} ocupada, usando ${port}.`);
  } else {
    console.log('');
  }

  console.log(`> Local:   http://localhost:${port}`);
  if (localIp) {
    console.log(`> Rede:    http://${localIp}:${port}\n`);
  } else {
    console.log('> Rede:    IP local nao encontrado automaticamente.\n');
  }

  const nextBinary = process.platform === 'win32'
    ? 'node_modules\\next\\dist\\bin\\next'
    : 'node_modules/next/dist/bin/next';

  const child = spawn(process.execPath, [nextBinary, 'dev', '-H', host, '-p', String(port)], {
    stdio: 'inherit',
    shell: false,
  });

  child.on('exit', (code, signal) => {
    if (signal) {
      process.kill(process.pid, signal);
      return;
    }

    process.exit(code ?? 0);
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
