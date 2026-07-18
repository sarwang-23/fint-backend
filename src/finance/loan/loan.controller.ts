
import { Controller, Post, Get, Patch, Delete, Body, Param, Req, UseGuards } from '@nestjs/common';
import { LoanService } from './loan.service';
import { CreateLoanDto } from './loan.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('loan')
export class LoanController {
  constructor(private readonly loanService: LoanService) {}

  @Post()
  create(@Req() req, @Body() dto: CreateLoanDto) {
    return this.loanService.create(req.user.id, dto);
  }

  @Get()
  findAll(@Req() req) {
    return this.loanService.findAll(req.user.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.loanService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: Partial<CreateLoanDto>) {
    return this.loanService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.loanService.remove(id);
  }
}