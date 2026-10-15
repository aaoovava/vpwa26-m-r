import type { UserStatus } from '@/types/user';

export interface StatusOption {
  value: UserStatus;
  label: string;
  icon: string;
  color: string;
}

export const statusOptions: StatusOption[] = [
  { value: 'online', label: 'Online', icon: 'circle', color: 'positive' },
  { value: 'dnd', label: 'DND', icon: 'do_not_disturb_on', color: 'negative' },
  { value: 'offline', label: 'Offline', icon: 'radio_button_unchecked', color: 'grey-5' },
];

// Fall back to "offline" when the status is missing or unknown
export function getStatusOption(status?: UserStatus): StatusOption {
  return statusOptions.find((option) => option.value === status) ?? statusOptions[2]!;
}