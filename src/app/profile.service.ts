import { Injectable } from '@angular/core';
import { PROFILES } from './sample-session-data';

@Injectable({
  providedIn: 'root'
})
export class ProfileService {

  //TODO combine into singular service, session service

  profiles: string[] = PROFILES;

  getProfiles(): string[] {
    return this.profiles;
  }

  selectProfile(selected: string) {
    this.profiles = [selected, ...this.profiles.filter((profile) => profile !== selected)];
  }

  constructor() { }
}
