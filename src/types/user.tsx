export interface User {
  id: number | null;
  phone_number: string;
  last_login: string;
  first_name: string;
  last_name: string;
  is_staff: boolean;
  email: string;
  is_owner: boolean;
}
