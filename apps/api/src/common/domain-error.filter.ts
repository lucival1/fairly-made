import {
  Catch,
  HttpStatus,
  type ArgumentsHost,
  type ExceptionFilter,
} from '@nestjs/common';
import type { Response } from 'express';
import { DomainError, NotFoundError } from '../traceability/domain/errors.js';

/**
 * Turns domain errors into HTTP answers, so the domain never imports Nest:
 * NotFoundError → 404, any other broken rule → 400 with its message.
 */
@Catch(DomainError)
export class DomainErrorFilter implements ExceptionFilter {
  catch(error: DomainError, host: ArgumentsHost): void {
    const status =
      error instanceof NotFoundError
        ? HttpStatus.NOT_FOUND
        : HttpStatus.BAD_REQUEST;
    host
      .switchToHttp()
      .getResponse<Response>()
      .status(status)
      .json({ statusCode: status, message: error.message });
  }
}
