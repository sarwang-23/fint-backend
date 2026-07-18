
import { Controller, Post, Get, Delete, Body, Req, UseGuards } from '@nestjs/common';
import { RetirementService } from './retirement.service';
import { CreateRetirementDto } from './retirement.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('retirement')
export class RetirementController {
  constructor(private readonly retirementService: RetirementService) {}

  @Post()
  save(@Req() req, @Body() dto: CreateRetirementDto) {
    return this.retirementService.save(req.user.id, dto);
  }

  @Get()
  find(@Req() req) {
    return this.retirementService.find(req.user.id);
  }

  @Delete()
  remove(@Req() req) {
    return this.retirementService.remove(req.user.id);
  }
}