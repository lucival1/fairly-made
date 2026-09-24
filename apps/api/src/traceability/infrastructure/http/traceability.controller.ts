import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import type { WorkingTreeView } from '../../application/shared/product-records.js';
import { AddStepUseCase } from '../../application/use-cases/add-step.use-case.js';
import { ApplyRefreshUseCase } from '../../application/use-cases/apply-refresh.use-case.js';
import { CorrectCompositionUseCase } from '../../application/use-cases/correct-composition.use-case.js';
import { CorrectStepFieldUseCase } from '../../application/use-cases/correct-step-field.use-case.js';
import { GetWorkingTreeUseCase } from '../../application/use-cases/get-working-tree.use-case.js';
import {
  ListProductsUseCase,
  type ProductSummary,
} from '../../application/use-cases/list-products.use-case.js';
import { RevertCorrectionUseCase } from '../../application/use-cases/revert-correction.use-case.js';
import { RefreshFixtures } from '../seed/refresh-fixtures.js';
import {
  isEmpty,
  parseAddStep,
  parseComposition,
  parseFieldValue,
  parseStepField,
  type RequestBody,
} from './request-parsers.js';

/**
 * HTTP adapter: parses the request, calls one use case. Every write answers
 * with the new working tree, so the UI re-renders from one response.
 */
@Controller('products')
export class TraceabilityController {
  constructor(
    private readonly listProducts: ListProductsUseCase,
    private readonly getWorkingTree: GetWorkingTreeUseCase,
    private readonly correctStepField: CorrectStepFieldUseCase,
    private readonly correctComposition: CorrectCompositionUseCase,
    private readonly addStep: AddStepUseCase,
    private readonly revertCorrection: RevertCorrectionUseCase,
    private readonly applyRefresh: ApplyRefreshUseCase,
    private readonly refreshFixtures: RefreshFixtures,
  ) {}

  @Get()
  list(): Promise<ProductSummary[]> {
    return this.listProducts.execute();
  }

  @Get(':productId/tree')
  tree(@Param('productId') productId: string): Promise<WorkingTreeView> {
    return this.getWorkingTree.execute(productId);
  }

  @Put(':productId/steps/:stepId/:field')
  putStepField(
    @Param('productId') productId: string,
    @Param('stepId') stepId: string,
    @Param('field') field: string,
    @Body() body: RequestBody,
  ): Promise<WorkingTreeView> {
    return this.correctStepField.execute(
      productId,
      stepId,
      parseStepField(field),
      parseFieldValue(body),
    );
  }

  @Put(':productId/items/:itemId/composition')
  putComposition(
    @Param('productId') productId: string,
    @Param('itemId') itemId: string,
    @Body() body: RequestBody,
  ): Promise<WorkingTreeView> {
    return this.correctComposition.execute(
      productId,
      itemId,
      parseComposition(body),
    );
  }

  @Post(':productId/items/:itemId/steps')
  postStep(
    @Param('productId') productId: string,
    @Param('itemId') itemId: string,
    @Body() body: RequestBody,
  ): Promise<WorkingTreeView> {
    return this.addStep.execute(productId, itemId, parseAddStep(body));
  }

  @Delete(':productId/corrections/:correctionId')
  deleteCorrection(
    @Param('productId') productId: string,
    @Param('correctionId') correctionId: string,
  ): Promise<WorkingTreeView> {
    return this.revertCorrection.execute(productId, correctionId);
  }

  /** Body: a full tree document. Empty body: replay the seeded fixture. */
  @Post(':productId/refresh')
  @HttpCode(200)
  postRefresh(
    @Param('productId') productId: string,
    @Body() body: RequestBody,
  ): Promise<WorkingTreeView> {
    const payload = isEmpty(body)
      ? this.refreshFixtures.forProduct(productId)
      : body;
    return this.applyRefresh.execute(productId, payload);
  }
}
