import { Component, OnInit } from '@angular/core';
import { MatDialog, MatDialogConfig } from "@angular/material/dialog";

import { AppService } from '../app.service';
import { SelectProfileComponent } from '../select-profile/select-profile.component';
import { SessionData, getTimestamp, sinceDate } from '../session-data';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {

  profiles: string[] = [];

  currentProfile: string = "";
  sessionsByProfile: SessionData[] = [];
  sinceLastSession = "Never";
  changeProfileButtonText = "Change Profile";

  constructor(private profileDialog: MatDialog, private appService: AppService) { }

  updateSelectedProfile() {
    // TODO this is getting called before data is loaded from storage
    this.profiles = this.appService.getProfiles();
    if (this.profiles.length != 0) {
      this.currentProfile = this.profiles[0];
      this.sessionsByProfile = this.appService.getSessions(this.currentProfile);
      if (this.sessionsByProfile.length != 0) { 
        let lastSession = this.appService.getMostRecentSession(this.currentProfile);
        this.sinceLastSession = sinceDate(lastSession.endTime);
      }
      this.changeProfileButtonText = "Change Profile";
    } else {
      this.changeProfileButtonText = "Add Profile";
    }
  }

  openProfileSelect() {
    const dialogConfig = new MatDialogConfig();

    dialogConfig.disableClose = false;
    dialogConfig.autoFocus = false;

    const dialogRef = this.profileDialog.open(SelectProfileComponent, dialogConfig);

    dialogRef.afterClosed().subscribe(
      () => {
        this.updateSelectedProfile();
      }
    );  
  }

  async ngOnInit() {
    this.appService.profiles = await this.appService.loadProfilesFromStorage();
    this.appService.sessions = await this.appService.loadSessionsFromStorage();
    this.updateSelectedProfile();
  }

}
