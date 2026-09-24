import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { DomainErrorFilter } from './common/domain-error.filter.js';
import { ReferenceModule } from './reference/reference.module.js';
import { SeedDataModule } from './seed-data/seed-data.module.js';
import { TraceabilityModule } from './traceability/traceability.module.js';

@Module({
  imports: [SeedDataModule, ReferenceModule, TraceabilityModule],
  providers: [{ provide: APP_FILTER, useClass: DomainErrorFilter }],
})
export class AppModule {}
