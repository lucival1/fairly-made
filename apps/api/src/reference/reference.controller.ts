import { Controller, Get } from '@nestjs/common';
import {
  ReferenceDataService,
  type ReferenceData,
} from './reference-data.service.js';

@Controller('reference')
export class ReferenceController {
  constructor(private readonly reference: ReferenceDataService) {}

  /** Suppliers and vocabularies, for the pickers in the UI. */
  @Get()
  get(): ReferenceData {
    return this.reference.data;
  }
}
