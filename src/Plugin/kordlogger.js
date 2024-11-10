const winston = require('winston');
const { format } = winston;

class AdvancedLogger {
    constructor(options = {}) {
        this.options = {
            logLevel: options.logLevel || 'info',
            colorize: options.colorize !== undefined ? options.colorize : true,
        };

        // Create a logger immediately
        this.initializeLogger();
    }

    async initializeLogger() {
        const chalk = await import('chalk');
        const logFormat = format.combine(
            format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:SSS' }),
            format.errors({ stack: true }),
            format.splat(),
            format.printf(({ level, message, timestamp, ...metadata }) => {
                let msg = `${this.options.colorize ? chalk.default.gray(timestamp) : timestamp} ${level}: ${message}`;
                if (Object.keys(metadata).length > 0) {
                    msg += '\n' + JSON.stringify(metadata, null, 2);
                }
                return msg;
            })
        );

        const consoleFormat = this.options.colorize
            ? format.combine(format.colorize(), logFormat)
            : logFormat;

        this.logger = winston.createLogger({
            level: this.options.logLevel,
            format: consoleFormat,
            transports: [new winston.transports.Console()],
            exceptionHandlers: [new winston.transports.Console()],
            rejectionHandlers: [new winston.transports.Console()],
        });
    }

    async ensureLogger() {
        if (!this.logger) {
            await this.initializeLogger();
        }
    }

    async log(level, message, metadata = {}) {
        await this.ensureLogger();
        this.logger.log(level, message, metadata);
    }

    async error(message, metadata = {}) {
        await this.ensureLogger();
        this.logger.error(message, metadata);
    }

    async warn(message, metadata = {}) {
        await this.ensureLogger();
        this.logger.warn(message, metadata);
    }

    async info(message, metadata = {}) {
        await this.ensureLogger();
        this.logger.info(message, metadata);
    }

    async debug(message, metadata = {}) {
        await this.ensureLogger();
        this.logger.debug(message, metadata);
    }

    startTimer() {
        return process.hrtime();
    }

    endTimer(start) {
        const end = process.hrtime(start);
        return (end[0] * 1000) + (end[1] / 1000000);
    }

    async logWithDuration(level, message, start, metadata = {}) {
        const duration = this.endTimer(start);
        await this.log(level, `${message} (Duration: ${duration.toFixed(3)}ms)`, { ...metadata, duration });
    }
}

// Create and export a singleton instance
const logger = new AdvancedLogger();

module.exports = logger;
