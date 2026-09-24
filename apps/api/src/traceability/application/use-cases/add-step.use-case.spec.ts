import { bootApp, TSHIRT, workingItem } from '../../../testing/app.js';
import { AddStepUseCase } from './add-step.use-case.js';

describe('AddStepUseCase', () => {
  let addStep: AddStepUseCase;

  beforeEach(async () => {
    addStep = (await bootApp()).get(AddStepUseCase);
  });

  it('appends a CORRECTED step with an id from our own id space', async () => {
    const { tree } = await addStep.execute(TSHIRT, 'itm_ts0142_m2', {
      process: 'SPINNING',
      supplierId: 'sup_6a15',
      countryCode: 'CN',
    });

    const [step] = workingItem(tree, 'itm_ts0142_m2')?.steps ?? [];
    expect(step.id).toMatch(/^cor_stp_/);
    expect(step).toMatchObject({
      process: 'SPINNING',
      provenance: 'CORRECTED',
      supplierId: { value: 'sup_6a15', provenance: 'CORRECTED' },
    });
  });

  it('rejects an unknown process', async () => {
    await expect(
      addStep.execute(TSHIRT, 'itm_ts0142_m2', {
        process: 'TELEPORTING',
        supplierId: null,
        countryCode: null,
      }),
    ).rejects.toThrow('not a known process');
  });

  it('rejects an unknown item', async () => {
    await expect(
      addStep.execute(TSHIRT, 'itm_nope', {
        process: 'DYEING',
        supplierId: null,
        countryCode: null,
      }),
    ).rejects.toThrow('Item itm_nope is not in this product');
  });
});
