import { Global, Module } from '@nestjs/common';
import { SeedDataService } from './seed-data.service.js';

/** Global so any module can load its seed files without re-importing this. */
@Global()
@Module({
  providers: [SeedDataService],
  exports: [SeedDataService],
})
export class SeedDataModule {}
