import { Module } from '@nestjs/common';
import { ReferenceDataService } from '../reference/reference-data.service.js';
import { ReferenceModule } from '../reference/reference.module.js';
import { PRODUCT_REPOSITORY } from './application/ports/product.repository.js';
import { REFERENCE_CATALOG } from './application/ports/reference-catalog.js';
import { ProductRecords } from './application/shared/product-records.js';
import { AddStepUseCase } from './application/use-cases/add-step.use-case.js';
import { ApplyRefreshUseCase } from './application/use-cases/apply-refresh.use-case.js';
import { CorrectCompositionUseCase } from './application/use-cases/correct-composition.use-case.js';
import { CorrectStepFieldUseCase } from './application/use-cases/correct-step-field.use-case.js';
import { GetWorkingTreeUseCase } from './application/use-cases/get-working-tree.use-case.js';
import { ListProductsUseCase } from './application/use-cases/list-products.use-case.js';
import { RevertCorrectionUseCase } from './application/use-cases/revert-correction.use-case.js';
import { TraceabilityController } from './infrastructure/http/traceability.controller.js';
import { InMemoryProductRepository } from './infrastructure/persistence/in-memory-product.repository.js';
import { RefreshFixtures } from './infrastructure/seed/refresh-fixtures.js';
import { TraceabilitySeeder } from './infrastructure/seed/traceability.seeder.js';

@Module({
  imports: [ReferenceModule],
  controllers: [TraceabilityController],
  providers: [
    // Use cases
    ListProductsUseCase,
    GetWorkingTreeUseCase,
    CorrectStepFieldUseCase,
    CorrectCompositionUseCase,
    AddStepUseCase,
    RevertCorrectionUseCase,
    ApplyRefreshUseCase,
    ProductRecords,
    // Ports → adapters. Swapping storage is a change on this line only.
    { provide: PRODUCT_REPOSITORY, useClass: InMemoryProductRepository },
    { provide: REFERENCE_CATALOG, useExisting: ReferenceDataService },
    // Seeding and demo fixtures
    TraceabilitySeeder,
    RefreshFixtures,
  ],
  // The versions module reads the working tree to freeze it.
  exports: [GetWorkingTreeUseCase],
})
export class TraceabilityModule {}
