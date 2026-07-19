import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, Request } from '@nestjs/common';
import { IncomeService } from './income.service';
import { CreateIncomeDto, UpdateIncomeDto, IncomeFilterDto } from './income.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Finance - Income')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('finance/income')
export class IncomeController {
  constructor(private readonly service: IncomeService) {}

  @Post()
  @ApiOperation({ summary: 'Create new Income' })
  create(@Request() req, @Body() dto: CreateIncomeDto) {
    return this.service.create(req.user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all Income with pagination, filtering and sorting' })
  findAll(@Request() req, @Query() filter: IncomeFilterDto) {
    return this.service.findAll(req.user.id, filter);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get Income by ID' })
  findOne(@Request() req, @Param('id') id: string) {
    return this.service.findOne(id, req.user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update Income' })
  update(@Request() req, @Param('id') id: string, @Body() dto: UpdateIncomeDto) {
    return this.service.update(id, req.user.id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete Income' })
  remove(@Request() req, @Param('id') id: string) {
    return this.service.remove(id, req.user.id);
  }
}
