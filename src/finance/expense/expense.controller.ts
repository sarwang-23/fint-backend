import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, Request } from '@nestjs/common';
import { ExpenseService } from './expense.service';
import { CreateExpenseDto, UpdateExpenseDto, ExpenseFilterDto } from './expense.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Finance - Expense')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('finance/expense')
export class ExpenseController {
  constructor(private readonly service: ExpenseService) {}

  @Post()
  @ApiOperation({ summary: 'Create new Expense' })
  create(@Request() req, @Body() dto: CreateExpenseDto) {
    return this.service.create(req.user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all Expense with pagination, filtering and sorting' })
  findAll(@Request() req, @Query() filter: ExpenseFilterDto) {
    return this.service.findAll(req.user.id, filter);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get Expense by ID' })
  findOne(@Request() req, @Param('id') id: string) {
    return this.service.findOne(id, req.user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update Expense' })
  update(@Request() req, @Param('id') id: string, @Body() dto: UpdateExpenseDto) {
    return this.service.update(id, req.user.id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete Expense' })
  remove(@Request() req, @Param('id') id: string) {
    return this.service.remove(id, req.user.id);
  }
}
