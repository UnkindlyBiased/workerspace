import { ConflictException, ForbiddenException, Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { hash, compare } from 'bcrypt'
import { plainToInstance } from "class-transformer";

import { UserRepository } from "../users/user.repository";
import { UserCreateDto } from "./dto/user-create.dto";
import { UserLoginDto } from "./dto/user-login.dto";
import { UserPayloadDto } from "./dto/user-payload.dto";
import { JwtPayloadDto } from "./dto/jwt-payload.dto";

@Injectable()
export class AuthService {
    constructor(
        private jwtService: JwtService,
        private configService: ConfigService,
        private userRepo: UserRepository,
    ) {}

    async registrate(input: UserCreateDto): Promise<void> {
        const exists = await this.userRepo.isUserExistingByCondition({ emailAddress: input.emailAddress })
        if (exists) {
            throw new ConflictException('The given email is already in usage')
        }

        const { password, ...rest } = input
        const hashedPassword = await hash(password, 3)

        this.userRepo.createUser({ ...rest, password: hashedPassword })
    }
    async login(input: UserLoginDto): Promise<UserPayloadDto> {
        const userData = await this.userRepo.getUserByCondition({ emailAddress: input.emailAddress })

        const isPasswordEqual = await compare(input.password, userData.password)
        if (!isPasswordEqual) {
            throw new ForbiddenException("Passwords aren't equal")
        }

        return plainToInstance(UserPayloadDto, userData, {
            excludeExtraneousValues: true
        })
    }
    async generatePayload(id: string): Promise<UserPayloadDto> {
        const userData = await this.userRepo.getUserByCondition({ id })

        return plainToInstance(UserPayloadDto, userData, {
            excludeExtraneousValues: true
        })
    }
    async generateTokens(userData: UserPayloadDto) {
        const payload: JwtPayloadDto = { sub: userData }

        const accessToken = await this.jwtService.signAsync(payload, {
            secret: this.configService.get('ACCESS_TOKEN_SECRET'),
            expiresIn: this.configService.get('ACCESS_TOKEN_EXPIRES_IN')
        })

        const refreshToken = await this.jwtService.signAsync(payload, {
            secret: this.configService.get('REFRESH_TOKEN_SECRET'),
            expiresIn: this.configService.get('REFRESH_TOKEN_EXPIRES_IN')
        });
        
        return { accessToken, refreshToken }
    }
}