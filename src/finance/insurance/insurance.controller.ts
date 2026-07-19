import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, Request } from '@nestjs/common';
import { InsuranceService } from './insurance.service';
import { CreateInsuranceDto, UpdateInsuranceDto, InsuranceFilterDto } from './insurance.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Finance - Insurance')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('finance/insurance')
export class InsuranceController {
  constructor(private readonly service: InsuranceService) {}

  @Post()
  @ApiOperation({ summary: 'Create new Insurance' })
  create(@Request() req, @Body() dto: CreateInsuranceDto) {
    return this.service.create(req.user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all Insurance with pagination, filtering and sorting' })
  findAll(@Request() req, @Query() filter: InsuranceFilterDto) {
    return this.service.findAll(req.user.id, filter);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get Insurance by ID' })
  findOne(@Request() req, @Param('id') id: string) {
    return this.service.findOne(id, req.user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update Insurance' })
  update(@Request() req, @Param('id') id: string, @Body() dto: UpdateInsuranceDto) {
    return this.service.update(id, req.user.id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete Insurance' })
  remove(@Request() req, @Param('id') id: string) {
    return this.service.remove(id, req.user.id);
  }
}
