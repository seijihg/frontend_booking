export interface User {
  id: number;
  phone_number: string;
  salons: number[];
  last_login: string | null;
  first_name: string;
  last_name: string;
  is_staff: boolean;
  is_active: boolean;
  date_joined: string;
  created: string;
  modified: string;
  email: string;
  is_owner: boolean;
  full_name: string;
  addresses: number[];
}
