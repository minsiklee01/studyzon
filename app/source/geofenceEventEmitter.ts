// source/geofenceEventEmitter.ts
import { EventEmitter } from "expo-modules-core";
import * as Location from "expo-location";

export type GeofenceEventData = {
  eventType: Location.GeofencingEventType;
  region: Location.LocationRegion;
};

export const geofenceEventEmitter = new EventEmitter<{
  geofenceEvent: (data: GeofenceEventData) => void;
}>();