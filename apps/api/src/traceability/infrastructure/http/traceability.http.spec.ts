import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '../../../app.module.js';

// The HTTP adapter end to end on a real port, with Node's fetch: routes,
// request parsing, the error filter's status codes, the fixture replay.
// Business rules are covered by the domain and use-case specs.
describe('traceability HTTP API', () => {
  let app: INestApplication;
  let base: string;

  const call = async (method: string, path: string, body?: unknown) => {
    const response = await fetch(`${base}${path}`, {
      method,
      headers: { 'content-type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    return { status: response.status, json: await response.json() };
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    await app.listen(0);
    base = `${await app.getUrl()}/api`;
  });

  afterAll(async () => {
    await app.close();
  });

  it('serves the product list and the reference data', async () => {
    const products = await call('GET', '/products');
    const reference = await call('GET', '/reference');

    expect(products.status).toBe(200);
    expect(products.json).toHaveLength(3);
    expect(reference.json.suppliers).toHaveLength(9);
  });

  it('corrects a field and answers with the new working tree', async () => {
    const { status, json } = await call(
      'PUT',
      '/products/prd_ts0142/steps/stp_b2/countryCode',
      { value: 'FR' },
    );

    expect(status).toBe(200);
    expect(json.tree.rootItem.children[0].steps[1].countryCode).toMatchObject({
      value: 'FR',
      provenance: 'CORRECTED',
    });
  });

  it('replays the seeded refresh when the body is empty', async () => {
    const { status, json } = await call('POST', '/products/prd_ts0142/refresh');

    expect(status).toBe(200);
    expect(json.tree.rootItem.children[0].label).toBe(
      'Jersey coton bio 185 g/m²',
    );
  });

  it.each([
    [
      'a broken business rule → 400 with its message',
      'PUT',
      '/products/prd_ts0142/items/itm_ts0142_c1/composition',
      { composition: [{ rawMaterial: 'COTTON', percentage: 98 }] },
      400,
      'The composition adds up to 98 %, it must add up to exactly 100 %.',
    ],
    [
      'a malformed body → 400',
      'PUT',
      '/products/prd_ts0142/steps/stp_b2/supplierId',
      { value: 42 },
      400,
      'Expected { "value": string | null } (null means unknown).',
    ],
    [
      'an unknown product → 404',
      'GET',
      '/products/nope/tree',
      undefined,
      404,
      'Product nope does not exist.',
    ],
  ])('maps %s', async (_case, method, path, body, status, message) => {
    const response = await call(method, path, body);

    expect(response).toEqual({
      status,
      json: { statusCode: status, message },
    });
  });
});
