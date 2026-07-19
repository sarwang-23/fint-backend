import { Controller, Get, UseGuards, Req, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AdvisoryService } from '../services/advisory.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { ThrottlerGuard } from '@nestjs/throttler';

@ApiTags('AI Advisory')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, ThrottlerGuard)
@Controller('ai/advisory')
export class AdvisoryController {
  private readonly logger = new Logger(AdvisoryController.name);

  constructor(private readonly advisoryService: AdvisoryService) {}

  @Get('budget')
  @ApiOperation({ summary: 'Get AI-powered budget suggestions based on spending patterns' })
  async getBudgetSuggestions(@Req() req: any) {
    this.logger.log(`GET /ai/advisory/budget - User: ${req.user?.id}`);
    const data = await this.advisoryService.getBudgetSuggestions(req.user.id);
    return { success: true, data, message: 'Budget Suggestions Generated', timestamp: new Date().toISOString() };
  }

  @Get('expense-analysis')
  @ApiOperation({ summary: 'Deep analysis of spending behavior and leakages' })
  async analyzeSpending(@Req() req: any) {
    this.logger.log(`GET /ai/advisory/expense-analysis - User: ${req.user?.id}`);
    const data = await this.advisoryService.analyzeSpending(req.user.id);
    return { success: true, data, message: 'Expense Analysis Complete', timestamp: new Date().toISOString() };
  }

  @Get('savings')
  @ApiOperation({ summary: 'Get personalized savings recommendations and strategy' })
  async getSavingsRecommendations(@Req() req: any) {
    this.logger.log(`GET /ai/advisory/savings - User: ${req.user?.id}`);
    const data = await this.advisoryService.getSavingsRecommendations(req.user.id);
    return { success: true, data, message: 'Savings Recommendations Ready', timestamp: new Date().toISOString() };
  }

  @Get('investments')
  @ApiOperation({ summary: 'Get AI investment portfolio suggestions tailored to risk profile' })
  async getInvestmentSuggestions(@Req() req: any) {
    this.logger.log(`GET /ai/advisory/investments - User: ${req.user?.id}`);
    const data = await this.advisoryService.getInvestmentSuggestions(req.user.id);
    return { success: true, data, message: 'Investment Suggestions Ready', timestamp: new Date().toISOString() };
  }

  @Get('loans')
  @ApiOperation({ summary: 'Get AI-powered loan repayment strategy and debt health analysis' })
  async getLoanAdvice(@Req() req: any) {
    this.logger.log(`GET /ai/advisory/loans - User: ${req.user?.id}`);
    const data = await this.advisoryService.getLoanAdvice(req.user.id);
    return { success: true, data, message: 'Loan Advice Ready', timestamp: new Date().toISOString() };
  }

  @Get('goals')
  @ApiOperation({ summary: 'Get AI goal planning with timeline and strategy for each active goal' })
  async planGoals(@Req() req: any) {
    this.logger.log(`GET /ai/advisory/goals - User: ${req.user?.id}`);
    const data = await this.advisoryService.planGoals(req.user.id);
    return { success: true, data, message: 'Goal Planning Complete', timestamp: new Date().toISOString() };
  }

  @Get('risk')
  @ApiOperation({ summary: 'Comprehensive financial risk analysis across all dimensions' })
  async analyzeRisk(@Req() req: any) {
    this.logger.log(`GET /ai/advisory/risk - User: ${req.user?.id}`);
    const data = await this.advisoryService.analyzeRisk(req.user.id);
    return { success: true, data, message: 'Risk Analysis Complete', timestamp: new Date().toISOString() };
  }
}
