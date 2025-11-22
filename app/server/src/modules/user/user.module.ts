import { Module } from '@nestjs/common';
import { UserService } from './user.service';
// import { UserController } from './user.controller'; // Optional for now

@Module({
    providers: [UserService],
    exports: [UserService],
    // controllers: [UserController],
})
export class UserModule { }
