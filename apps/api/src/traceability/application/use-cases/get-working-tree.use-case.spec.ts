import { bootApp, TSHIRT, workingStep } from '../../../testing/app.js';
import { GetWorkingTreeUseCase } from './get-working-tree.use-case.js';

describe('GetWorkingTreeUseCase', () => {
  let getWorkingTree: GetWorkingTreeUseCase;

  beforeEach(async () => {
    getWorkingTree = (await bootApp()).get(GetWorkingTreeUseCase);
  });

  it('reads an untouched product as its declared tree', async () => {
    const { tree, dormantCorrections } = await getWorkingTree.execute(TSHIRT);

    expect(tree.product.reference).toBe('FM-TS-0142');
    expect(workingStep(tree, 'stp_b2')?.supplierId).toEqual({
      value: 'sup_3e91',
      provenance: 'DECLARED',
    });
    expect(dormantCorrections).toEqual([]);
  });

  it('rejects an unknown product', async () => {
    await expect(getWorkingTree.execute('nope')).rejects.toThrow(
      'Product nope does not exist.',
    );
  });
});
