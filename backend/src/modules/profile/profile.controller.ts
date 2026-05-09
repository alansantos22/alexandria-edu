import { Controller, Get, Param } from '@nestjs/common';
import { ProfileService } from './profile.service';
import { ProfileResponseDto } from './dto/profile-response.dto';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { AuthenticatedUser } from '@/shared/interfaces/jwt-payload.interface';

@Controller('users')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  /**
   * GET /users/:username/profile
   * Retorna o perfil público de um usuário.
   * Requer autenticação (JwtAuthGuard global).
   * O campo `isOwnProfile` indica se o requester é o dono do perfil.
   */
  @Get(':username/profile')
  async getProfile(
    @Param('username') username: string,
    @CurrentUser() requester: AuthenticatedUser,
  ): Promise<ProfileResponseDto> {
    return this.profileService.getPublicProfile(username, requester.id);
  }
}
