export enum Role {
  ADMIN = 'ADMIN',
  CUSTOMER = 'CUSTOMER',
  HOTEL_OWNER = 'HOTEL_OWNER',
  HOTEL_STAFF = 'HOTEL_STAFF',
}

export interface IUser {
  id: string;
  email: string;
  role: Role;
  hotel_id?: string | null;
}
