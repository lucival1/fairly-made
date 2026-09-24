import type { StepField } from '../../domain/types.js';
import { bootApp, TSHIRT, workingStep } from '../../../testing/app.js';
import { AddStepUseCase } from './add-step.use-case.js';
import { CorrectStepFieldUseCase } from './correct-step-field.use-case.js';
import { ListProductsUseCase } from './list-products.use-case.js';

describe('CorrectStepFieldUseCase', () => {
  let correctStepField: CorrectStepFieldUseCase;
  let addStep: AddStepUseCase;
  let listProducts: ListProductsUseCase;

  beforeEach(async () => {
    const app = await bootApp();
    correctStepField = app.get(CorrectStepFieldUseCase);
    addStep = app.get(AddStepUseCase);
    listProducts = app.get(ListProductsUseCase);
  });

  it('lands on the working tree straight away and bumps lastChangedAt', async () => {
    const { tree } = await correctStepField.execute(
      TSHIRT,
      'stp_b2',
      'countryCode',
      'FR',
    );

    expect(workingStep(tree, 'stp_b2')?.countryCode).toMatchObject({
      value: 'FR',
      provenance: 'CORRECTED',
      declaredValue: 'IT',
    });
    const product = (await listProducts.execute()).find((p) => p.id === TSHIRT);
    expect(product?.lastChangedAt).not.toBe('2026-06-14T09:12:00.000Z');
  });

  it('accepts null to mark a value as unknown', async () => {
    const { tree } = await correctStepField.execute(
      TSHIRT,
      'stp_b2',
      'supplierId',
      null,
    );

    expect(workingStep(tree, 'stp_b2')?.supplierId).toMatchObject({
      value: null,
      provenance: 'CORRECTED',
    });
  });

  it('correcting the same field twice updates the one correction', async () => {
    const first = await correctStepField.execute(
      TSHIRT,
      'stp_b2',
      'supplierId',
      'sup_7f60',
    );
    const second = await correctStepField.execute(
      TSHIRT,
      'stp_b2',
      'supplierId',
      'sup_1f3a',
    );

    const before = workingStep(first.tree, 'stp_b2')?.supplierId;
    const after = workingStep(second.tree, 'stp_b2')?.supplierId;
    expect(after).toMatchObject({
      value: 'sup_1f3a',
      declaredValue: 'sup_3e91',
    });
    expect(after?.correctionId).toBe(before?.correctionId);
  });

  it('edits a step the user added in place', async () => {
    const added = await addStep.execute(TSHIRT, 'itm_ts0142_m2', {
      process: 'FIBER_PRODUCTION',
      supplierId: null,
      countryCode: null,
    });
    const stepId = added.tree.rootItem.children[0].children[1].steps[0].id;

    const { tree, dormantCorrections } = await correctStepField.execute(
      TSHIRT,
      stepId,
      'countryCode',
      'CN',
    );

    expect(workingStep(tree, stepId)).toMatchObject({
      provenance: 'CORRECTED',
      countryCode: { value: 'CN' },
    });
    expect(dormantCorrections).toEqual([]);
  });

  it.each<[string, string, StepField, string, string]>([
    [
      'an unknown supplier',
      'stp_b2',
      'supplierId',
      'sup_nope',
      'not a supplier',
    ],
    ['a malformed country', 'stp_b2', 'countryCode', 'Italy', 'not a country'],
    ['an unknown step', 'stp_nope', 'countryCode', 'IT', 'not in this product'],
  ])('rejects %s', async (_case, stepId, field, value, message) => {
    await expect(
      correctStepField.execute(TSHIRT, stepId, field, value),
    ).rejects.toThrow(message);
  });
});
