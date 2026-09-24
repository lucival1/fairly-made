import { bootApp, TSHIRT, workingStep } from '../../../testing/app.js';
import { loadTshirtRefresh } from '../../../testing/fixtures.js';
import { ApplyRefreshUseCase } from './apply-refresh.use-case.js';
import { CorrectStepFieldUseCase } from './correct-step-field.use-case.js';
import { ListProductsUseCase } from './list-products.use-case.js';

// The domain specs prove the merge rules; these prove the use case stores
// the refresh and leaves the corrections alone.
describe('ApplyRefreshUseCase', () => {
  let applyRefresh: ApplyRefreshUseCase;
  let correctStepField: CorrectStepFieldUseCase;
  let listProducts: ListProductsUseCase;

  const lastChangedAt = async () =>
    (await listProducts.execute()).find((p) => p.id === TSHIRT)?.lastChangedAt;

  beforeEach(async () => {
    const app = await bootApp();
    applyRefresh = app.get(ApplyRefreshUseCase);
    correctStepField = app.get(CorrectStepFieldUseCase);
    listProducts = app.get(ListProductsUseCase);
  });

  it('keeps a correction standing, and replaying the refresh changes nothing', async () => {
    await correctStepField.execute(TSHIRT, 'stp_b2', 'supplierId', 'sup_3e91');

    const first = await applyRefresh.execute(TSHIRT, loadTshirtRefresh());
    const changedAt = await lastChangedAt();
    const second = await applyRefresh.execute(TSHIRT, loadTshirtRefresh());

    expect(workingStep(first.tree, 'stp_b2')?.supplierId).toMatchObject({
      value: 'sup_3e91',
      provenance: 'CORRECTED',
      declaredValue: 'sup_2b7c',
    });
    expect(second).toEqual(first);
    expect(await lastChangedAt()).toBe(changedAt);
  });

  it('lists a correction whose step the refresh removed as dormant', async () => {
    await correctStepField.execute(TSHIRT, 'stp_a3', 'supplierId', 'sup_1f3a');

    const { tree, dormantCorrections } = await applyRefresh.execute(
      TSHIRT,
      loadTshirtRefresh(),
    );

    expect(workingStep(tree, 'stp_a3')).toBeUndefined();
    expect(dormantCorrections).toMatchObject([
      { kind: 'FIELD_OVERRIDE', stepId: 'stp_a3' },
    ]);
  });

  it('rejects a refresh that belongs to another product', async () => {
    await expect(
      applyRefresh.execute('prd_ac0031', loadTshirtRefresh()),
    ).rejects.toThrow('This refresh is for product prd_ts0142');
  });

  it('rejects a document that is not a tree', async () => {
    await expect(
      applyRefresh.execute(TSHIRT, { hello: 'world' }),
    ).rejects.toThrow('not a traceability tree');
  });
});
