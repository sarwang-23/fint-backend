import { Controller, Get, Query, Res, UseGuards, Req, Logger, BadRequestException } from '@nestjs/common';
import { ReportsService } from '../services/reports.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { Response } from 'express';

@ApiTags('Reports & Export')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('reports')
export class ReportsController {
  private readonly logger = new Logger(ReportsController.name);

  constructor(private readonly reportsService: ReportsService) {}

  @Get('download')
  @ApiOperation({ summary: 'Download financial reports' })
  @ApiQuery({ name: 'type', required: true, enum: ['monthly', 'annual', 'investment', 'loan', 'tax'] })
  @ApiQuery({ name: 'format', required: true, enum: ['PDF', 'EXCEL', 'CSV'] })
  async downloadReport(
    @Req() req: any,
    @Res() res: Response,
    @Query('type') type: string,
    @Query('format') format: 'PDF' | 'EXCEL' | 'CSV'
  ) {
    this.logger.log(`GET /api/v1/reports/download - User: ${req.user.id}, Type: ${type}, Format: ${format}`);
    
    if (!['monthly', 'annual', 'investment', 'loan', 'tax'].includes(type)) {
      throw new BadRequestException('Invalid report type');
    }
    if (!['PDF', 'EXCEL', 'CSV'].includes(format)) {
      throw new BadRequestException('Invalid export format');
    }

    try {
      const buffer = await this.reportsService.generateReport(req.user.id, type, format);
      
      let contentType = 'application/octet-stream';
      let extension = 'bin';

      if (format === 'PDF') {
        contentType = 'application/pdf';
        extension = 'pdf';
      } else if (format === 'EXCEL') {
        contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        extension = 'xlsx';
      } else if (format === 'CSV') {
        contentType = 'text/csv';
        extension = 'csv';
      }

      res.set({
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename=fint_${type}_report.${extension}`,
      });

      res.send(buffer);
    } catch (error: any) {
      this.logger.error(`Failed to generate report: ${error.message}`);
      res.status(500).json({ success: false, message: 'Failed to generate report' });
    }
  }
}
