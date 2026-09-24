import { Inject, Injectable, type OnModuleInit } from '@nestjs/common';
import { SeedDataService } from '../../../seed-data/seed-data.service.js';
import {
  PRODUCT_REPOSITORY,
  type ProductRepository,
} from '../../application/ports/product.repository.js';
import { parseDeclaredTree } from '../../domain/validation.js';

/** Loads data/trees into an empty store at boot. The seed is our whole universe. */
@Injectable()
export class TraceabilitySeeder implements OnModuleInit {
  constructor(
    @Inject(PRODUCT_REPOSITORY) private readonly repository: ProductRepository,
    private readonly seedData: SeedDataService,
  ) {}

  async onModuleInit(): Promise<void> {
    if ((await this.repository.findAll()).length > 0) {
      return;
    }
    for (const document of this.seedData.readAllJson('trees')) {
      const declared = parseDeclaredTree(document);
      await this.repository.save({
        declared,
        corrections: [],
        lastChangedAt: declared.product.lastModifiedAt,
      });
    }
  }
}
