import { bootApp } from '../../../testing/app.js';
import { ListProductsUseCase } from './list-products.use-case.js';

describe('ListProductsUseCase', () => {
  let listProducts: ListProductsUseCase;

  beforeEach(async () => {
    listProducts = (await bootApp()).get(ListProductsUseCase);
  });

  it('lists the three seeded products', async () => {
    const products = await listProducts.execute();

    expect(products.map((p) => p.reference).sort()).toEqual([
      'FM-AC-0031',
      'FM-JK-0207',
      'FM-TS-0142',
    ]);
  });

  it('starts each product from its declared last modification date', async () => {
    const products = await listProducts.execute();

    expect(products.find((p) => p.reference === 'FM-TS-0142')).toMatchObject({
      name: 'Marinière Manches Longues',
      lastChangedAt: '2026-06-14T09:12:00.000Z',
    });
  });
});
