import { loadRawMaterials, loadTshirtRefresh } from '../../testing/fixtures.js';
import {
  assertCountryCode,
  assertValidComposition,
  parseDeclaredTree,
} from './validation.js';

describe('assertValidComposition', () => {
  const materials = loadRawMaterials();
  const line = (rawMaterial: string, percentage: number) => ({
    rawMaterial,
    percentage,
    originCountryCode: null,
  });

  it('accepts a composition that adds up to 100', () => {
    expect(() =>
      assertValidComposition(
        [line('COTTON_ORGANIC', 92), line('ELASTANE', 8)],
        materials,
      ),
    ).not.toThrow();
  });

  it('absorbs floating-point noise', () => {
    expect(() =>
      assertValidComposition(
        [line('COTTON', 33.3), line('LINEN', 33.3), line('VISCOSE', 33.4)],
        materials,
      ),
    ).not.toThrow();
  });

  it('rejects a composition that does not add up to 100, saying by how much', () => {
    // The shape of the seeded denim jacket (98 %).
    expect(() =>
      assertValidComposition(
        [line('COTTON', 97), line('ELASTANE', 1)],
        materials,
      ),
    ).toThrow(
      'The composition adds up to 98 %, it must add up to exactly 100 %.',
    );
  });

  it.each([
    ['empty', [], 'at least one material'],
    ['zero percentage', [line('COTTON', 0), line('LINEN', 100)], 'above 0'],
    ['duplicate material', [line('COTTON', 50), line('COTTON', 50)], 'twice'],
    ['unknown material', [line('KEVLAR', 100)], 'not a known material'],
  ])('rejects %s', (_case, lines, message) => {
    expect(() => assertValidComposition(lines, materials)).toThrow(message);
  });
});

describe('assertCountryCode', () => {
  it('accepts an ISO-2 code or null', () => {
    expect(() => assertCountryCode('PT')).not.toThrow();
    expect(() => assertCountryCode(null)).not.toThrow();
  });

  it('rejects anything else', () => {
    expect(() => assertCountryCode('Portugal')).toThrow('not a country code');
  });
});

describe('parseDeclaredTree', () => {
  it('keeps the tree and drops the refresh envelope fields', () => {
    const tree = loadTshirtRefresh();
    expect(Object.keys(tree)).toEqual(['brand', 'product', 'rootItem']);
  });

  it('rejects a document that is not a tree', () => {
    expect(() => parseDeclaredTree({ hello: 'world' })).toThrow(
      'not a traceability tree',
    );
  });
});
