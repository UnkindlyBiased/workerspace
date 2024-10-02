import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { UserController } from "./user.controller";
import { UserService } from "./user.service";
import { UserEntity } from "./user.entity";
import { UserRepository } from "./user.repository";

@Module({
    controllers: [UserController],
    providers: [UserService, UserRepository],
    imports: [TypeOrmModule.forFeature([UserEntity])],
    exports: [UserRepository]
})
export class UserModule {}