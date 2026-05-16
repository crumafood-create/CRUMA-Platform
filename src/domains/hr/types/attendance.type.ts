export interface Attendance {

  id: string;

  employee_id: string;

  check_in: string;

  check_out: string | null;

  created_at: string;
}
