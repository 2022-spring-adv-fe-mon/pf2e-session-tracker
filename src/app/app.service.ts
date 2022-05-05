import { Injectable } from '@angular/core';
import { StorageMap } from '@ngx-pwa/local-storage';
import { Observable, of, from, BehaviorSubject } from 'rxjs';
import { first } from 'rxjs/operators';
import { PROFILES, SESSIONS } from './sample-session-data';
import { CombatData, getTimestamp, RollData, SessionData } from './session-data';
import { calculateLongestSession, calculateMostRecentSession } from './session-stats';

@Injectable({
  providedIn: 'root'
})
export class AppService {

  dataLoaded = false;
  loadingCallbacks: Function[] = [];

  profilesLoaded = false;
  profiles: string[] = [];
  profilesObservable: Observable<string[]> = of([]);

  sessionsLoaded = false;
  sessions: SessionData[] = SESSIONS;
  sessionsObservable: Observable<SessionData[]> = of([]);

  activeSessionLoaded = false;
  activeSession: SessionData[] = [];
  activeSessionObservable: Observable<SessionData[]> = of([]);

  activeProfile: string = "";

  whenLoaded(f: Function) {
    if (this.dataLoaded)
      f();
    else
      this.loadingCallbacks.push(f);
  }

  runLoadingCallbacks() {
    console.log("Sending callbacks: " + this.loadingCallbacks.length);
    this.loadingCallbacks.forEach((fn) => fn());
  }

  loadProfilesFromStorage() {
    let profilesPromise = this.storage.get('profiles').toPromise() as Promise<string[]>;
    return profilesPromise.then((data) => {
      this.profiles = data as string[] ?? [];
      if (this.profiles.length > 0)
        this.activeProfile = this.profiles[0];
      console.log("Profiles loaded: " + this.profiles.length);
      console.log(this.profiles);
    });
    // this.profilesObservable = this.storage.get('profiles') as Observable<string[]>;
    // this.profilesObservable.pipe(first()).subscribe((data) => {
    //   this.profiles = data as string[] ?? [];
    //   if (this.profiles.length > 0)
    //     this.activeProfile = this.profiles[0];
    //   console.log("Loaded " + this.profiles.length + " profiles from storage.");
    //   this.profilesLoaded = true;
    // });
  }

  loadSessionsFromStorage() {
    let sessionsPromise = this.storage.get('sessions').toPromise() as Promise<SessionData[]>;
    return sessionsPromise.then((data) => {
      this.sessions = data as SessionData[] ?? [];
      console.log("Sessions loaded: " + this.sessions.length);
      console.log(this.sessions);
    });
    // this.sessionsObservable = this.storage.get('sessions') as Observable<SessionData[]>;
    // this.sessionsObservable.subscribe((data) => {
    //   this.sessions = data as SessionData[] ?? [];
    //   console.log("Loaded " + this.sessions.length + " sessions from storage.");
    //   // Then it sorts it so most recent sessions are first
    //   this.sessions.sort((a, b) => Date.parse(b.startTime) - Date.parse(a.startTime));
    // });
    // return this.sessionsObservable;
  }

  loadActiveSessionFromStorage() {
    let activeSessionPromise = this.storage.get('active-session').toPromise() as Promise<SessionData>;
    return activeSessionPromise.then((data) => {
      this.activeSession[0] = data as SessionData ?? this.activeSession;
      console.log("Active session loaded.")
      console.log(this.activeSession[0]);
    });
  }

  handleError<T>(methodName: string, result? : T) {
    return (error: any): Observable<T> => {
      console.error(error);
      console.log(methodName + " encountered an error. " + error.message);

      return of(result as T);
    };
  }

  async loadDataFromStorage() {
    await this.loadActiveSessionFromStorage();
    await this.loadSessionsFromStorage();
    await this.loadProfilesFromStorage();
    this.dataLoaded = true;
    this.runLoadingCallbacks();
  }

  // loadDataFromStorage() {
  //   this.loadActiveSessionFromStorage().then(() => {
  //     let profilesPromise = this.storage.get('profiles').toPromise() as Promise<string[]>;
  //     profilesPromise.then((data) => {
  //       this.profiles = data as string[] ?? [];
  //       if (this.profiles.length > 0)
  //         this.activeProfile = this.profiles[0];
  //       console.log("Profiles loaded: " + this.profiles.length);
  //       console.log(this.profiles);
  //     }).then(() => {
  //       let sessionsPromise = this.storage.get('sessions').toPromise() as Promise<SessionData[]>;
  //       sessionsPromise.then((data) => {
  //         this.sessions = data as SessionData[] ?? [];
  //         console.log("Sessions loaded: " + this.sessions.length);
  //         console.log(this.sessions);
  //       }).then(() => {
  //         this.runLoadingCallbacks();
  //         this.dataLoaded = true;
  //       });
  //     })
  //   });
  // }

  saveProfilesToStorage(): void {
    this.storage.set('profiles', this.profiles).subscribe(() => {});
  }

  saveSessionsToStorage(): void {
    this.storage.set('sessions', this.sessions).subscribe(() => {});
  }

  saveActiveSessionToStorage() {
    let sub = this.storage.set('active-session', this.activeSession[0]).subscribe(() => {
      console.log("Saved active session progress.");
      sub.unsubscribe();
    })
  }

  endActiveSession() {
    this.activeSession[0].endTime = getTimestamp();
    this.sessions = [this.activeSession[0], ...this.sessions];
    let sub = this.storage.set('sessions', this.sessions).subscribe(() => {
      console.log("Saved new session to storage.");
      sub.unsubscribe();
    });

    this.activeSession = [];
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
    this.activeProfile = this.profiles[0];
    return this.profiles[0];
  }

  startNewSession(): void {
    let newSession = {
      character : this.activeProfile,
      startTime : getTimestamp(),
      endTime : "",
      rolls : [],
      combats : []
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
    console.log(roll);
    console.log(this.activeSession[0]);
    this.activeSession[0].rolls = [roll, ...this.activeSession[0].rolls];
    this.saveActiveSessionToStorage();
  }

  constructor(private storage: StorageMap) { 
    this.loadDataFromStorage();
  }

}
