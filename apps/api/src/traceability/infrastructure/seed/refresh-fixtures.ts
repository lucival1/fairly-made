import { Injectable } from '@nestjs/common';
import { SeedDataService } from '../../../seed-data/seed-data.service.js';
import { NotFoundError } from '../../domain/errors.js';

/**
 * Demo convenience: the refresh documents shipped in data/refreshes, so the
 * UI can "simulate a refresh" without pasting a whole tree. Stands in for the
 * collection system; the use case itself only ever sees a payload.
 */
@Injectable()
export class RefreshFixtures {
  constructor(private readonly seedData: SeedDataService) {}

  forProduct(productId: string): unknown {
    const fixture = this.seedData
      .readAllJson('refreshes')
      .find(
        (doc) =>
          (doc as { product?: { id?: string } }).product?.id === productId,
      );
    if (!fixture) {
      throw new NotFoundError(
        `No refresh fixture for product ${productId}. Send a full tree as the request body instead.`,
      );
    }
    return fixture;
  }
}
