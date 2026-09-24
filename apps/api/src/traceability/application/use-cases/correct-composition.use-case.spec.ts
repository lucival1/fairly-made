import type { WorkingComponent } from '../../domain/types.js';
import { bootApp, TSHIRT, workingItem } from '../../../testing/app.js';
import { CorrectCompositionUseCase } from './correct-composition.use-case.js';

describe('CorrectCompositionUseCase', () => {
  let correctComposition: CorrectCompositionUseCase;

  beforeEach(async () => {
    correctComposition = (await bootApp()).get(CorrectCompositionUseCase);
  });

  it('replaces the composition as a whole, keeping declared line ids', async () => {
    const { tree } = await correctComposition.execute(TSHIRT, 'itm_ts0142_c1', [
      {
        rawMaterial: 'COTTON_ORGANIC',
        percentage: 90,
        originCountryCode: 'IN',
      },
      { rawMaterial: 'ELASTANE', percentage: 10, originCountryCode: 'CN' },
    ]);

    const jersey = workingItem(tree, 'itm_ts0142_c1') as WorkingComponent;
    expect(jersey.composition.provenance).toBe('CORRECTED');
    expect(jersey.composition.value.map((l) => [l.id, l.percentage])).toEqual([
      ['cmp_c1_1', 90],
      ['cmp_c1_2', 10],
    ]);
  });

  it('rejects a composition that does not add up to 100 with a clear message', async () => {
    await expect(
      correctComposition.execute(TSHIRT, 'itm_ts0142_c1', [
        {
          rawMaterial: 'COTTON_ORGANIC',
          percentage: 90,
          originCountryCode: 'IN',
        },
        { rawMaterial: 'ELASTANE', percentage: 8, originCountryCode: null },
      ]),
    ).rejects.toThrow('adds up to 98 %');
  });

  it('rejects an item that is not a component', async () => {
    await expect(
      correctComposition.execute(TSHIRT, 'itm_ts0142_m1', [
        { rawMaterial: 'COTTON', percentage: 100, originCountryCode: null },
      ]),
    ).rejects.toThrow('Only a component has a composition.');
  });
});
