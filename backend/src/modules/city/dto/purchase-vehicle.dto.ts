import { IsIn } from 'class-validator';
import { VEHICLE_TYPES, VehicleType } from '../city.catalog';

export class PurchaseVehicleDto {
  @IsIn(VEHICLE_TYPES, { message: `vehicleType must be one of: ${VEHICLE_TYPES.join(', ')}` })
  vehicleType: VehicleType;
}
