import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, Request } from '@nestjs/common';
import { RetirementService } from './retirement.service';
import { CreateRetirementDto, UpdateRetirementDto, RetirementFilterDto } from './retirement.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Finance - Retirement')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('finance/retirement')
export class RetirementController {
  constructor(private readonly service: RetirementService) {}

  @Post()
  @ApiOperation({ summary: 'Create new Retirement' })
  create(@Request() req, @Body() dto: CreateRetirementDto) {
    return this.service.create(req.user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all Retirement with pagination, filtering and sorting' })
  findAll(@Request() req, @Query() filter: RetirementFilterDto) {
    return this.service.findAll(req.user.id, filter);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get Retirement by ID' })
  findOne(@Request() req, @Param('id') id: string) {
    return this.service.findOne(id, req.user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update Retirement' })
  update(@Request() req, @Param('id') id: string, @Body() dto: UpdateRetirementDto) {
    return this.service.update(id, req.user.id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete Retirement' })
  remove(@Request() req, @Param('id') id: string) {
    return this.service.remove(id, req.user.id);
  }
}
