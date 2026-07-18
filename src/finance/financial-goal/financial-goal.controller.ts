
import { Controller, Post, Get, Patch, Delete, Body, Param, Req, UseGuards } from '@nestjs/common';
import { FinancialGoalService } from './financial-goal.service';
import { CreateFinancialGoalDto } from './financial-goal.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('financial-goal')
export class FinancialGoalController {
  constructor(private readonly financialGoalService: FinancialGoalService) {}

  @Post()
  create(@Req() req, @Body() dto: CreateFinancialGoalDto) {
    return this.financialGoalService.create(req.user.id, dto);
  }

  @Get()
  findAll(@Req() req) {
    return this.financialGoalService.findAll(req.user.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.financialGoalService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: Partial<CreateFinancialGoalDto>) {
    return this.financialGoalService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.financialGoalService.remove(id);
  }
}