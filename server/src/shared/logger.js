const COLORS = {
  info: '\x1b[36m', // cyan
  warn: '\x1b[33m', // yellow
  error: '\x1b[31m', // red
  debug: '\x1b[90m', // gray
  reset: '\x1b[0m',
};

function format(level, ...args) {
  const timestamp = new Date().toISOString();
  const color = COLORS[level] || COLORS.reset;
  console.log(`${color}[${timestamp}] [${level.toUpperCase()}]${COLORS.reset}`, ...args);
}

export const logger = {
  info: (...args) => format('info', ...args),
  warn: (...args) => format('warn', ...args),
  error: (...args) => format('error', ...args),
  debug: (...args) => format('debug', ...args),
};
