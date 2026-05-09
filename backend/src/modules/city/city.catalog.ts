export const VEHICLE_CATALOG = {
  skateboard: { cost: 0,    speed: 1,  label: 'Skate'         },
  bicycle:    { cost: 150,  speed: 2,  label: 'Bicicleta'     },
  car_basic:  { cost: 500,  speed: 4,  label: 'Carro Básico'  },
  car_sport:  { cost: 1500, speed: 7,  label: 'Carro Esporte' },
  car_luxury: { cost: 5000, speed: 10, label: 'Carro de Luxo' },
} as const;

export type VehicleType = keyof typeof VEHICLE_CATALOG;

export const VEHICLE_TYPES = Object.keys(VEHICLE_CATALOG) as VehicleType[];

export const CHUNK_SIZE = 16;
