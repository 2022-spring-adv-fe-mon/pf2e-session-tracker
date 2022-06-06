import { Injectable } from '@angular/core';
import { StorageMap } from '@ngx-pwa/local-storage';
import { saveGameToCloud, loadGamesFromCloud } from './TcaCloudApi';

import { Observable, of, from, BehaviorSubject } from 'rxjs';
import { first } from 'rxjs/operators';
import { PROFILES, SESSIONS } from './sample-session-data';
import { APP_NAME, CombatData, getProfilesFromSessions, getTimestamp, RollData, SessionData } from './session-data';
import { calculateLongestSession, calculateMostRecentSession } from './session-stats';

@Injectable({
  providedIn: 'root'
})
export class AppService {

  // TODO add charts of statistics 
  // chart js, chart js plugin datalabels, ng2 chart

  // TODO save CURRENT SESSION DATA in local storage
  // save completed sessions in cloud
  // add auth?
  // amplify

  dataLoaded = false;
  loadingCallbacks: Function[] = [];

  profilesLoaded = false;
  profiles: string[] = [];
  profilesObservable: Observable<string[]> = of([]);

  sessionsLoaded = false;
  sessions: SessionData[] = [];
  sessionsObservable: Observable<SessionData[]> = of([]);

  activeSessionLoaded = false;
  activeSession: SessionData[] = [];
  activeSessionObservable: Observable<SessionData[]> = of([]);

  activeEmail = "testEmail@testTestTest.com";
  activeProfile: string = "";

  /**
   * Adds a given function to call when data has loaded 
   * from cloud and local storage
   * @param fn 
   */
  whenLoaded(fn: Function) {
    if (this.dataLoaded)
      fn();
    else
      this.loadingCallbacks.push(fn);
  }

  runLoadingCallbacks() {
    console.log("Sending callbacks: " + this.loadingCallbacks.length);
    this.loadingCallbacks.forEach((fn) => fn());
  }

  loadEmailFromStorage() {
    let emailPromise = this.storage.get('email').toPromise() as Promise<string>;
    return emailPromise.then((data) => {
      if (data) {
        this.activeEmail = data as string ?? "";
        console.log("Loaded email: " + this.activeEmail);
      } else {
        console.log("Email not found in local storage");
      }
    });
  }

  loadProfilesFromStorage() {
    let profilesPromise = this.storage.get('profiles').toPromise() as Promise<string[]>;
    return profilesPromise.then((data) => {
      if (data) {
        this.profiles = data as string[] ?? [];
        if (this.profiles.length > 0)
          this.activeProfile = this.profiles[0];
        console.log("Profiles loaded: " + this.profiles.length);
        console.log(this.profiles);
      } else {
        console.log("No profiles found in local storage.");
      }
    });
  }

  async loadSessionsFromCloud() {
    if (this.activeEmail == "")
      console.error("Cannot load sessions from cloud, no active email set.");
    else {
      const data = await loadGamesFromCloud(this.activeEmail, APP_NAME);
      this.sessions = data as SessionData[] ?? [];
      console.log("Loaded " + this.sessions.length + " sessions from cloud. Email : " + this.activeEmail);
    }
  }

  loadSessionsFromStorage() {
    let sessionsPromise = this.storage.get('sessions').toPromise() as Promise<SessionData[]>;
    return sessionsPromise.then((data) => {
      if (data) {
        this.sessions = data as SessionData[] ?? [];
        console.log("Sessions loaded: " + this.sessions.length);
        console.log(this.sessions);
      } else {
        console.log("No sessions found in local storage.");
      }
    });
  }

  loadActiveSessionFromStorage() {
    let activeSessionPromise = this.storage.get('active-session').toPromise() as Promise<SessionData>;
    return activeSessionPromise.then((data) => {
      if (data) {
        this.activeSession[0] = data as SessionData ?? [];
        console.log("Active session loaded.")
        console.log(this.activeSession[0]);
      } else {
        console.log("No active session found in storage.")
      }
    });
  }

  async loadDataFromStorage() {
    await this.loadActiveSessionFromStorage();
    await this.loadSessionsFromStorage();
    //await this.loadProfilesFromStorage();
    this.profiles = getProfilesFromSessions(this.sessions);
    console.log("Active profile: " + this.activeProfile);
    this.dataLoaded = true;
    this.runLoadingCallbacks();
  }

  async loadData() {
    await this.loadEmailFromStorage();
    console.log("Active email: " + this.activeEmail);
    await this.loadActiveSessionFromStorage();
    await this.loadSessionsFromCloud();
    this.profiles = getProfilesFromSessions(this.sessions);
    this.dataLoaded = true;
    this.runLoadingCallbacks();
  }

  saveProfilesToStorage(): void {
    this.storage.set('profiles', this.profiles).subscribe(() => {});
  }

  saveSessionsToStorage(callback?: Function) {
    let sub = this.storage.set('sessions', this.sessions).subscribe(() => {
      console.log("Saved sessions to local storage.");
      sub.unsubscribe();
      if (typeof callback === "function")
        callback();
    });
    
  }

  async saveNewSessionToCloud(session: SessionData) {
    if (this.activeEmail != "") {
      await saveGameToCloud(this.activeEmail, APP_NAME, session.endTime, session);
      console.log("Session saved to cloud, email: " + this.activeEmail);
    } else {
      console.error("Cannot save to cloud, no active email set.");
    }
  }

  saveActiveSessionToStorage() {
    let sub = this.storage.set('active-session', this.activeSession[0]).subscribe(() => {
      console.log("Saved active session progress.");
      sub.unsubscribe();
    });
  }

  async endActiveSession() {
    const afterSave = () => this.activeSession = [];

    this.activeSession[0].endTime = getTimestamp();
    this.sessions = [this.activeSession[0], ...this.sessions];

    // TODO change to cloud
    // if accepted, delete activeSession data
    this.saveSessionsToStorage(afterSave);
  }
  
  getProfiles(): string[] {
    return this.profiles;
  }

  getSessions(profileName?: string) {
    if (typeof profileName != 'undefined')
      return this.sessions.filter(session => session.character == profileName);
    else 
      return this.sessions;
  }

  getMostRecentSession(profileName: string) {
    //return calculateMostRecentSession(this.getSessions(profileName));
    return this.getSessions(profileName)[0];
  }

  getActiveSession() {
    return this.activeSession;
  }
  
  selectProfile(selected: string) {
    this.profiles = [selected, ...this.profiles.filter((profile) => profile !== selected)];
    this.activeProfile = selected;
    this.saveProfilesToStorage();
  }

  getSelectedProfile(): string {
    if (this.profiles.length > 0) 
      this.activeProfile = this.profiles[0];
    return this.activeProfile;
  }

  startNewSession(): void {
    let newSession = {
      character : this.activeProfile,
      startTime : getTimestamp(),
      endTime : "",
      rolls : [] as RollData[],
      combats : [] as CombatData[]
    };
    this.activeSession[0] = newSession;
    this.saveActiveSessionToStorage();
  }

  //TODO make a method to store active combat in storage?
  
  addCombat(combat: CombatData): void {
    this.activeSession[0].combats = [combat, ...this.activeSession[0].combats];
    this.saveActiveSessionToStorage();
  }

  addRoll(roll: RollData): void {
    console.log("Added roll: " + roll);
    console.log(this.activeSession[0]);
    this.activeSession[0].rolls = [roll, ...this.activeSession[0].rolls];
    this.saveActiveSessionToStorage();
  }

  constructor(private storage: StorageMap) { 
    this.loadDataFromStorage();
  }

}
