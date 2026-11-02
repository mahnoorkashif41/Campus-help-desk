import type { StatusValue } from "@/lib/constants";

export type TrackingTimelineEntry = {
  id: string;
  fromStatus: StatusValue | null;
  toStatus: StatusValue;
  note: string | null;
  createdAt: string;
};

// Exactly what the tracking API returns. There is no name, email, or internal ID here.
export type TrackingData = {
  complaint: {
    ticketId: string;
    title: string;
    description: string;
    category: string;
    building: string;
    roomNumber: string | null;
    status: StatusValue;
    resolutionNote: string | null;
    createdAt: string;
    updatedAt: string;
  };
  timeline: TrackingTimelineEntry[];
  photos: { url: string }[];
  photoCount: number;
};