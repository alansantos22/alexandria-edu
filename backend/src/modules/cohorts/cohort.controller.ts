import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CohortService } from './cohort.service';

@Controller('cohorts')
export class CohortController {
  constructor(private readonly service: CohortService) {}

  @Get()
  list(@Query('productId') productId: string) {
    return this.service.listByProduct(productId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findById(id);
  }
}

@UseGuards(RolesGuard)
@Roles('admin')
@Controller('admin/cohorts')
export class AdminCohortController {
  constructor(private readonly service: CohortService) {}

  @Post()
  create(@Body() body: any) {
    return this.service.create(body);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: any) {
    return this.service.update(id, body);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.delete(id);
  }

  @Get()
  list(@Query('productId') productId: string) {
    return this.service.listByProduct(productId);
  }
}
