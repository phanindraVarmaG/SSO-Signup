import { Injectable, UnauthorizedException, Logger } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor(private configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: configService.get<string>("jwt.secret"),
      ignoreExpiration: false,
    });
    this.logger.log('JwtStrategy initialized');
  }

  async validate(payload: any) {
    if (!payload.sub || !payload.email) {
      this.logger.error('Invalid JWT payload: missing sub or email');
      throw new UnauthorizedException('Invalid token payload');
    }

    this.logger.debug(`JWT validated for user: ${payload.email}`);
    
    return {
      userId: payload.sub,
      email: payload.email,
      isAdmin: payload.isAdmin || false,
      // Include any additional fields from the JWT payload
      ...payload,
    };
  }
}
