import { Injectable } from '@nestjs/common';
import { SeedDataService } from '../seed-data/seed-data.service.js';

export interface Supplier {
  id: string;
  name: string;
  city: string;
  countryCode: string;
}

export interface Process {
  code: string;
  label: string;
  appliesTo: string[];
}

export interface ReferenceData {
  suppliers: Supplier[];
  processes: Process[];
  rawMaterials: string[];
  usageCategories: string[];
}

/**
 * The brand's supplier registry and the controlled vocabularies. Read-only.
 * Used to check what the user submits; declared data is never rejected
 * against it.
 */
@Injectable()
export class ReferenceDataService {
  readonly data: ReferenceData;

  constructor(seedData: SeedDataService) {
    const { suppliers } = seedData.readJson('suppliers.json') as {
      suppliers: Supplier[];
    };
    const { processes, rawMaterials, usageCategories } = seedData.readJson(
      'processes.json',
    ) as Omit<ReferenceData, 'suppliers'>;
    this.data = { suppliers, processes, rawMaterials, usageCategories };
  }

  get rawMaterials(): readonly string[] {
    return this.data.rawMaterials;
  }

  hasSupplier(id: string): boolean {
    return this.data.suppliers.some((supplier) => supplier.id === id);
  }

  hasProcess(code: string): boolean {
    return this.data.processes.some((process) => process.code === code);
  }
}
