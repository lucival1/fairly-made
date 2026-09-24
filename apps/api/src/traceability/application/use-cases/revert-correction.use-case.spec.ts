import { bootApp, TSHIRT, workingStep } from '../../../testing/app.js';
import { CorrectStepFieldUseCase } from './correct-step-field.use-case.js';
import { RevertCorrectionUseCase } from './revert-correction.use-case.js';

describe('RevertCorrectionUseCase', () => {
  let correctStepField: CorrectStepFieldUseCase;
  let revertCorrection: RevertCorrectionUseCase;

  beforeEach(async () => {
    const app = await bootApp();
    correctStepField = app.get(CorrectStepFieldUseCase);
    revertCorrection = app.get(RevertCorrectionUseCase);
  });

  it('falls back to the declared value', async () => {
    const corrected = await correctStepField.execute(
      TSHIRT,
      'stp_b2',
      'supplierId',
      'sup_7f60',
    );
    const correctionId = workingStep(corrected.tree, 'stp_b2')?.supplierId
      .correctionId as string;

    const { tree } = await revertCorrection.execute(TSHIRT, correctionId);

    expect(workingStep(tree, 'stp_b2')?.supplierId).toEqual({
      value: 'sup_3e91',
      provenance: 'DECLARED',
    });
  });

  it('rejects an unknown correction', async () => {
    await expect(revertCorrection.execute(TSHIRT, 'cor_nope')).rejects.toThrow(
      'Correction cor_nope does not exist.',
    );
  });
});
