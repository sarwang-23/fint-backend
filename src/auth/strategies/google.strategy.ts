import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthRepository } from '../auth.repository';
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    private readonly configService: ConfigService,
    private readonly authRepository: AuthRepository,
  ) {
    super({
      clientID: configService.get<string>('GOOGLE_CLIENT_ID') || 'placeholder-id',
      clientSecret: configService.get<string>('GOOGLE_CLIENT_SECRET') || 'placeholder-secret',
      callbackURL: `${configService.get<string>('API_URL') || 'http://localhost:3000'}/api/v1/auth/google/callback`,
      scope: ['email', 'profile'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    try {
      const { name, emails, photos } = profile;
      const email = emails && emails.length > 0 ? emails[0].value : null;
      
      if (!email) {
        return done(new Error('No email found in Google profile'), false);
      }

      const givenName = name?.givenName || 'Google';
      const familyName = name?.familyName || 'User';
      const fullName = `${givenName} ${familyName}`.trim();
      
      // Check if user exists
      let user = await this.authRepository.findByEmail(email);
      
      if (!user) {
        // Create user if they don't exist
        // Since it's a social login, we generate a random password
        const randomPassword = crypto.randomBytes(20).toString('hex');
        const hashedPassword = await bcrypt.hash(randomPassword, 10);
        
        user = await this.authRepository.createUser(
          {
            email,
            fullName,
            password: hashedPassword,
          },
          'OTHER' // Default gender
        );
        
        // Mark as verified since Google already verified them
        await this.authRepository.updateUser(user.id, {
          isVerified: true,
          emailVerifiedAt: new Date(),
        });
      }

      done(null, user);
    } catch (error) {
      console.error('Google Strategy Validation Error:', error);
      done(error, false);
    }
  }
}
