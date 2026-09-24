import { readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { Injectable } from '@nestjs/common';

/**
 * Read access to the JSON files in the repo's data/ folder: the seed trees,
 * the refresh fixtures, suppliers and processes. The only place that knows
 * where those files live.
 *
 * Defaults to <repo>/data, as npm workspace scripts run from apps/api.
 * Override with DATA_DIR.
 */
@Injectable()
export class SeedDataService {
  private readonly dir =
    process.env.DATA_DIR ?? resolve(process.cwd(), '../../data');

  readJson(relativePath: string): unknown {
    return JSON.parse(readFileSync(join(this.dir, relativePath), 'utf8'));
  }

  /** Every JSON document in a sub-folder, e.g. `trees`. */
  readAllJson(relativeDir: string): unknown[] {
    return readdirSync(join(this.dir, relativeDir))
      .filter((file) => file.endsWith('.json'))
      .sort()
      .map((file) => this.readJson(join(relativeDir, file)));
  }
}
