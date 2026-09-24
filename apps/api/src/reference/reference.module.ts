import { Module } from '@nestjs/common';
import { ReferenceController } from './reference.controller.js';
import { ReferenceDataService } from './reference-data.service.js';

@Module({
  controllers: [ReferenceController],
  providers: [ReferenceDataService],
  exports: [ReferenceDataService],
})
export class ReferenceModule {}
