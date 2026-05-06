import { Request, Response, NextFunction } from "express";
import { ProfileService } from "../../application/profile.service";
import { ProfileEntity } from "../../domain/entities/profile.entity";
import { GetProfileResponseDTO, UpdateProfileRequestDTO } from "../dtos/profile.dto";

export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  public getProfile = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const credentialId = Number(res.locals.credentialId);
      const profile = await this.profileService.getProfile(credentialId);
      res.status(200).json(this.toDTO(profile));
    } catch (error) {
      next(error);
    }
  };

  public updateProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const credentialId = Number(res.locals.credentialId);
      const body = req.body as UpdateProfileRequestDTO;
      const profile = await this.profileService.updateProfile(credentialId, {
        firstName: body.firstName,
        firstLastname: body.firstLastname,
        secondName: body.secondName,
        secondLastname: body.secondLastname,
        dateBirth: body.dateBirth,
      });
      res.status(200).json(this.toDTO(profile));
    } catch (error) {
      next(error);
    }
  };

  private toDTO(profile: ProfileEntity): GetProfileResponseDTO {
    return {
      profileCode: profile.getCode(),
      firstName: profile.getFirstName(),
      firstLastname: profile.getFirstLastname(),
      secondName: profile.getSecondName(),
      secondLastname: profile.getSecondLastname(),
      email: profile.getEmail(),
      dni: profile.getDni(),
      dateBirth: profile.getDateBirth().toISOString().split("T")[0],
      createdAt: profile.getCreatedAt().toISOString(),
      updatedAt: profile.getUpdatedAt().toISOString(),
    };
  }
}
