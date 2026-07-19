import { Controller, Post, Get, Body, Param, Req, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { ReportsService } from './reports.service';
import { GenerateReportDto } from './reports.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Post('generate')
  generate(@Req() req, @Body() dto: GenerateReportDto) {
    return this.reportsService.generate(req.user.id, dto);
  }

  @Get()
  getAll(@Req() req) {
    return this.reportsService.getAll(req.user.id);
  }

  @Get(':id')
  getOne(@Req() req, @Param('id') id: string) {
    return this.reportsService.getOne(id, req.user.id);
  }

  // Plain-text download instead of JSON — plugs the "users must be able to
  // download a summary report" requirement without pulling in a PDF library
  // for the MVP. Swap the body for a PDF buffer later if needed; the route
  // shape and ownership check stay the same.
  @Get(':id/download')
  async download(@Req() req, @Param('id') id: string, @Res({ passthrough: true }) res: Response) {
    const text = await this.reportsService.renderAsText(id, req.user.id);
    res.set({
      'Content-Type': 'text/plain',
      'Content-Disposition': `attachment; filename="fint-report-${id}.txt"`,
    });
    return text;
  }
}
