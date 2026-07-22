import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.getResponse()
        : 'Internal server error';

    const errStack = exception instanceof Error ? exception.stack : JSON.stringify(exception);
    this.logger.error(
      `[${request.method}] ${request.url} - Status: ${status}`,
      errStack,
    );

    // Write to file for debugging
    try {
      const logMsg = `\n--- ERROR AT ${new Date().toISOString()} ---\n` +
                     `URL: ${request.url}\n` +
                     `Status: ${status}\n` +
                     `Exception: ${errStack}\n` +
                     `Response: ${JSON.stringify(message)}\n`;
      fs.appendFileSync(path.join(process.cwd(), 'error.log'), logMsg);
    } catch (e) {}

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message: typeof message === 'string' ? message : (message as any).message || message,
    });
  }
}
