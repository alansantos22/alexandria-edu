import { Body, Controller, Get, Param, Patch } from '@nestjs/common';
import { ProfileService } from './profile.service';
import { ProfileResponseDto } from './dto/profile-response.dto';
import { UpdateBioDto } from './dto/update-bio.dto';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { AuthenticatedUser } from '@/shared/interfaces/jwt-payload.interface';

@Controller('users')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  /**
   * GET /users/:username/profile
   * Retorna o perfil público de um usuário com customização aplicada.
   */
  @Get(':username/profile')
  async getProfile(
    @Param('username') username: string,
    @CurrentUser() requester: AuthenticatedUser,
  ): Promise<ProfileResponseDto> {
    return this.profileService.getPublicProfile(username, requester.id);
  }

  /**
   * PATCH /users/me/bio
   * Atualiza a bio do perfil do usuário autenticado.
   */
  @Patch('me/bio')
  async updateBio(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateBioDto,
  ) {
    return this.profileService.updateBio(user.id, dto.bio ?? null);
  }
}
