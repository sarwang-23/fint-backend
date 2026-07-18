
import { Controller, Post, Get, Patch, Delete, Body, Param, Req, UseGuards } from '@nestjs/common';
import { FinancialAccountService } from './financial-account.service';
import { CreateFinancialAccountDto } from './financial-account.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('financial-account')
export class FinancialAccountController {
  constructor(private readonly financialAccountService: FinancialAccountService) {}

  @Post()
  create(@Req() req, @Body() dto: CreateFinancialAccountDto) {
    return this.financialAccountService.create(req.user.id, dto);
  }

  @Get()
  findAll(@Req() req) {
    return this.financialAccountService.findAll(req.user.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.financialAccountService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: Partial<CreateFinancialAccountDto>) {
    return this.financialAccountService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.financialAccountService.remove(id);
  }
}