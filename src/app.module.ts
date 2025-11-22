import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { HotelsModule } from './hotels/hotels.module';
import { UsersModule } from './users/users.module';
import { HotelMembersModule } from './hotel-members/hotel-members.module';
import { RoomTypesModule } from './room-types/room-types.module';
import { HotelPoliciesModule } from './hotel-policies/hotel-policies.module';
import { HotelModulesModule } from './hotel-modules/hotel-modules.module';
import { HotelModuleSubscriptionsModule } from './hotel-module-subscriptions/hotel-module-subscriptions.module';
import { FilesModule } from './files/files.module';
import { AmenityMappingsModule } from './amenity-mappings/amenity-mappings.module';
import { InventoriesModule } from './inventories/inventories.module';
import { CancellationPoliciesModule } from './cancellation-policies/cancellation-policies.module';
import { CancellationPolicyRulesModule } from './cancellation-policy-rules/cancellation-policy-rules.module';
import { RatePlansModule } from './rate-plans/rate-plans.module';
import { PricesModule } from './prices/prices.module';
import { AmenityCategoryModule } from './amenity-category/amenity-category.module';
import { LocationsModule } from './locations/locations.module';
import { CronModule } from './cron/cron.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ScheduleModule.forRoot(),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.get<string>('DATABASE_HOST'),
        port: configService.get<number>('DB_PORT'),
        username: configService.get<string>('DATABASE_USER'),
        password: configService.get<string>('DATABASE_PASS'),
        database: configService.get<string>('DATABASE_NAME'),
        autoLoadEntities: true,
        synchronize: true,
      }),
      inject: [ConfigService],
    }),
    AuthModule,
    HotelsModule,
    UsersModule,
    HotelMembersModule,
    RoomTypesModule,
    HotelPoliciesModule,
    HotelModulesModule,
    HotelModuleSubscriptionsModule,
    FilesModule,
    AmenityMappingsModule,
    InventoriesModule,
    CancellationPoliciesModule,
    CancellationPolicyRulesModule,
    RatePlansModule,
    PricesModule,
    AmenityCategoryModule,
    LocationsModule,
    CronModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}
