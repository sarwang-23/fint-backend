import { Controller, Post, Get, Query, Req, UseGuards } from '@nestjs/common';
import { ScoreService } from '../services/score.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { GetScoreHistoryDto } from '../dto/score.dto';

@UseGuards(JwtAuthGuard)
@Controller('score')
export class ScoreController {
  constructor(private readonly scoreService: ScoreService) {}

  // Recalculates the score from the user's current financial data and
  // stores a new ScoreHistory entry (this is what drives the monthly
  // tracking / trend line on the dashboard).
  @Post('calculate')
  calculate(@Req() req) {
    return this.scoreService.calculateAndSave(req.user.id);
  }

  // Most recently calculated score, without recalculating.
  @Get()
  getLatest(@Req() req) {
    return this.scoreService.getLatest(req.user.id);
  }

  @Get('history')
  getHistory(@Req() req, @Query() query: GetScoreHistoryDto) {
    return this.scoreService.getHistory(req.user.id, query.limit);
  }
}
