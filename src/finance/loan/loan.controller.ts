import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, Request } from '@nestjs/common';
import { LoanService } from './loan.service';
import { CreateLoanDto, UpdateLoanDto, LoanFilterDto } from './loan.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Finance - Loan')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('finance/loan')
export class LoanController {
  constructor(private readonly service: LoanService) {}

  @Post()
  @ApiOperation({ summary: 'Create new Loan' })
  create(@Request() req, @Body() dto: CreateLoanDto) {
    return this.service.create(req.user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all Loan with pagination, filtering and sorting' })
  findAll(@Request() req, @Query() filter: LoanFilterDto) {
    return this.service.findAll(req.user.id, filter);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get Loan by ID' })
  findOne(@Request() req, @Param('id') id: string) {
    return this.service.findOne(id, req.user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update Loan' })
  update(@Request() req, @Param('id') id: string, @Body() dto: UpdateLoanDto) {
    return this.service.update(id, req.user.id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete Loan' })
  remove(@Request() req, @Param('id') id: string) {
    return this.service.remove(id, req.user.id);
  }
}
