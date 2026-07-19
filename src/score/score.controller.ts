import { Controller, Get, Post, UseGuards, Request } from '@nestjs/common';
import { ScoreService } from './score.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('Score Engine')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('score')
export class ScoreController {
  constructor(private readonly scoreService: ScoreService) {}

  @Post('calculate')
  @ApiOperation({ summary: 'Calculate new financial score' })
  @ApiResponse({ status: 201, description: 'Calculates and saves the score.' })
  calculateScore(@Request() req: any) {
    return this.scoreService.calculateScore(req.user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get current financial score and recommendations' })
  @ApiResponse({ status: 200, description: 'Returns the latest score.' })
  getCurrentScore(@Request() req: any) {
    return this.scoreService.getCurrentScore(req.user.id);
  }

  @Get('history')
  @ApiOperation({ summary: 'Get history of financial scores' })
  @ApiResponse({ status: 200, description: 'Returns an array of previous scores.' })
  getScoreHistory(@Request() req: any) {
    return this.scoreService.getScoreHistory(req.user.id);
  }

  @Post('recalculate')
  @ApiOperation({ summary: 'Recalculate financial score' })
  @ApiResponse({ status: 201, description: 'Forces recalculation based on current data.' })
  recalculateScore(@Request() req: any) {
    return this.scoreService.recalculateScore(req.user.id);
  }
}
