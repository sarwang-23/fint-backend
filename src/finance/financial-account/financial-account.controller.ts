import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, Request } from '@nestjs/common';
import { FinancialAccountService } from './financial-account.service';
import { CreateFinancialAccountDto, UpdateFinancialAccountDto, FinancialAccountFilterDto } from './financial-account.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Finance - FinancialAccount')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('finance/financial-account')
export class FinancialAccountController {
  constructor(private readonly service: FinancialAccountService) {}

  @Post()
  @ApiOperation({ summary: 'Create new FinancialAccount' })
  create(@Request() req, @Body() dto: CreateFinancialAccountDto) {
    return this.service.create(req.user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all FinancialAccount with pagination, filtering and sorting' })
  findAll(@Request() req, @Query() filter: FinancialAccountFilterDto) {
    return this.service.findAll(req.user.id, filter);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get FinancialAccount by ID' })
  findOne(@Request() req, @Param('id') id: string) {
    return this.service.findOne(id, req.user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update FinancialAccount' })
  update(@Request() req, @Param('id') id: string, @Body() dto: UpdateFinancialAccountDto) {
    return this.service.update(id, req.user.id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete FinancialAccount' })
  remove(@Request() req, @Param('id') id: string) {
    return this.service.remove(id, req.user.id);
  }
}
