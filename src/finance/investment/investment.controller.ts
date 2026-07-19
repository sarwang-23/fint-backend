import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, Request } from '@nestjs/common';
import { InvestmentService } from './investment.service';
import { CreateInvestmentDto, UpdateInvestmentDto, InvestmentFilterDto } from './investment.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Finance - Investment')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('finance/investment')
export class InvestmentController {
  constructor(private readonly service: InvestmentService) {}

  @Post()
  @ApiOperation({ summary: 'Create new Investment' })
  create(@Request() req, @Body() dto: CreateInvestmentDto) {
    return this.service.create(req.user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all Investment with pagination, filtering and sorting' })
  findAll(@Request() req, @Query() filter: InvestmentFilterDto) {
    return this.service.findAll(req.user.id, filter);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get Investment by ID' })
  findOne(@Request() req, @Param('id') id: string) {
    return this.service.findOne(id, req.user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update Investment' })
  update(@Request() req, @Param('id') id: string, @Body() dto: UpdateInvestmentDto) {
    return this.service.update(id, req.user.id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete Investment' })
  remove(@Request() req, @Param('id') id: string) {
    return this.service.remove(id, req.user.id);
  }
}
