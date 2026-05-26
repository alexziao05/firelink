/**
 * Privacy-safe dashboard types — no names, phone numbers, or street addresses.
 */

export interface CommunityStats {
  registeredHouseholds: number;
  pets: number;
  transportationNeeds: number;
  medicalPowerNeeds: number;
  markedSafe: number;
  requestedHelp: number;
  volunteers: number;
  averagePreparedness: number;
}

export interface AnonymousHousehold {
  anonymous_id: string;
  zip_code: string;
  has_pets: boolean;
  has_transport: boolean;
  medical_needs: boolean;
  can_volunteer: boolean;
  status: string;
  prep_score: number;
}

export interface NeedItem {
  label: string;
  count: number;
}

export interface ActivityItem {
  id: string;
  message: string;
  timestamp: string;
}

export interface ResourceItem {
  id: string;
  title: string;
  description: string;
  detail?: string;
}

export interface CommunityDashboardData {
  zip: string;
  stats: CommunityStats;
  households: AnonymousHousehold[];
  needs: NeedItem[];
  events: ActivityItem[];
  resources: ResourceItem[];
}
