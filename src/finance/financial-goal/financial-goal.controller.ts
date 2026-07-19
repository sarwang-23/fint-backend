import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, Request } from '@nestjs/common';
import { FinancialGoalService } from './financial-goal.service';
import { CreateFinancialGoalDto, UpdateFinancialGoalDto, FinancialGoalFilterDto } from './financial-goal.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Finance - FinancialGoal')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('finance/financial-goal')
export class FinancialGoalController {
  constructor(private readonly service: FinancialGoalService) {}

  @Post()
  @ApiOperation({ summary: 'Create new FinancialGoal' })
  create(@Request() req, @Body() dto: CreateFinancialGoalDto) {
    return this.service.create(req.user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all FinancialGoal with pagination, filtering and sorting' })
  findAll(@Request() req, @Query() filter: FinancialGoalFilterDto) {
    return this.service.findAll(req.user.id, filter);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get FinancialGoal by ID' })
  findOne(@Request() req, @Param('id') id: string) {
    return this.service.findOne(id, req.user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update FinancialGoal' })
  update(@Request() req, @Param('id') id: string, @Body() dto: UpdateFinancialGoalDto) {
    return this.service.update(id, req.user.id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete FinancialGoal' })
  remove(@Request() req, @Param('id') id: string) {
    return this.service.remove(id, req.user.id);
  }
}
