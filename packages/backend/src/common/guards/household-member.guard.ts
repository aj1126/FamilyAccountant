import { CanActivate, ExecutionContext, Injectable, ForbiddenException } from '@nestjs/common';

@Injectable()
export class HouseholdMemberGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    
    if (!user) {
      throw new ForbiddenException('User is not authenticated');
    }
    
    if (!user.householdId) {
      throw new ForbiddenException('You must join or create a household first');
    }
    
    return true;
  }
}
