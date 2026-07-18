import { Controller, Post, Get, Body, UseGuards, Req, Logger, Version } from '@nestjs/common';
import { AiService } from '../services/ai.service';
import { RecommendationDto } from '../dto/recommendation.dto';
import { ForecastDto } from '../dto/forecast.dto';
import { SimulationDto } from '../dto/simulation.dto';
import { ChatDto } from '../dto/chat.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { ThrottlerGuard } from '@nestjs/throttler';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('AI Engine')
@Controller('ai')
export class AiController {
  private readonly logger = new Logger(AiController.name);

  constructor(private readonly aiService: AiService) {}

  @Version('1')
  @Post('recommendation')
  @UseGuards(JwtAuthGuard, ThrottlerGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Generate Financial Recommendation' })
  async generateRecommendation(@Req() req: any, @Body() body: RecommendationDto) {
    this.logger.log(`POST /api/v1/ai/recommendation - User: ${req.user?.id}`);
    // Prioritize ID from body, fallback to authenticated user ID
    const userId = body.userId || req.user?.id;
    return this.aiService.generateRecommendation(userId);
  }

  @Version('1')
  @Post('forecast')
  @UseGuards(JwtAuthGuard, ThrottlerGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Generate Financial Forecast' })
  async generateForecast(@Req() req: any, @Body() body: ForecastDto) {
    this.logger.log(`POST /api/v1/ai/forecast - User: ${req.user?.id}`);
    return this.aiService.generateForecast(req.user?.id, body.years);
  }

  @Version('1')
  @Post('simulation')
  @UseGuards(JwtAuthGuard, ThrottlerGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Run Financial Simulation (What-If Analysis)' })
  async generateSimulation(@Req() req: any, @Body() body: SimulationDto) {
    this.logger.log(`POST /api/v1/ai/simulation - User: ${req.user?.id}`);
    return this.aiService.generateSimulation(req.user?.id, body);
  }

  @Version('1')
  @Post('chat')
  @UseGuards(JwtAuthGuard, ThrottlerGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Ask AI Financial Advisor Chatbot' })
  async chat(@Req() req: any, @Body() body: ChatDto) {
    this.logger.log(`POST /api/v1/ai/chat - User: ${req.user?.id}`);
    return this.aiService.chat(req.user?.id, body.message);
  }

  @Version('1')
  @Get('history')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get AI Recommendations History' })
  async getHistory(@Req() req: any) {
    this.logger.log(`GET /api/v1/ai/history - User: ${req.user?.id}`);
    // Can be easily routed to a history function in AiService, returning empty list formatted correctly for now
    return {
      success: true,
      data: [],
      message: 'History fetched successfully',
      timestamp: new Date().toISOString()
    };
  }

  @Version('1')
  @Get('health')
  @ApiOperation({ summary: 'AI Engine Health Check' })
  async health() {
    this.logger.log(`GET /api/v1/ai/health - Health check executed`);
    return this.aiService.health();
  }
}
